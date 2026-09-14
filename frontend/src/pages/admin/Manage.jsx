import {
  useEffect,
  useState
} from 'react';

import {
  api
} from '../../services/api';

const ACTIONS = {
  sellers: [
    [
      'approved',
      'Approve'
    ],
    [
      'rejected',
      'Reject'
    ]
  ],

  products: [
    [
      'approved',
      'Approve'
    ],
    [
      'rejected',
      'Reject'
    ]
  ],

  orders: [
    [
      'cancelled',
      'Batalkan'
    ]
  ],

  payments: [
    [
      'verified',
      'Verifikasi'
    ],
    [
      'rejected',
      'Tolak'
    ]
  ]
};

function getSellerPhoto(row) {
  return (
    row.photoUrl ||
    row.photoURL ||
    row.photo ||
    ''
  );
}

function getSellerUid(row) {
  return (
    row.uid ||
    row.userId ||
    row.id ||
    ''
  );
}

function getSellerStatus(row) {
  if (row.banned === true) {
    return 'banned';
  }

  return row.status || 'pending';
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Menunggu',
    approved: 'Aktif',
    rejected: 'Ditolak',
    banned: 'Diblokir',
    revoked: 'Dicabut',
    available: 'Tersedia',
    in_transaction: 'Dalam transaksi',
    cancelled: 'Dibatalkan',
    verified: 'Terverifikasi'
  };

  return (
    labels[status] ||
    status ||
    '-'
  );
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '-';
  }

  return new Intl.NumberFormat(
    'id-ID',
    {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }
  ).format(amount);
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  let date;

  if (
    typeof value === 'object' &&
    typeof value.toDate === 'function'
  ) {
    date = value.toDate();
  } else if (
    typeof value === 'object' &&
    typeof value._seconds === 'number'
  ) {
    date = new Date(
      value._seconds * 1000
    );
  } else {
    date = new Date(value);
  }

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  ).format(date);
}

export default function Manage({
  type,
  title
}) {
  const [
    rows,
    setRows
  ] = useState([]);

  const [
    error,
    setError
  ] = useState('');

  const [
    expandedId,
    setExpandedId
  ] = useState(null);

  const [
    confirmState,
    setConfirmState
  ] = useState(null);

  const [
    loadingAction,
    setLoadingAction
  ] = useState('');

  const load = async () => {
    try {
      setError('');

      const response = await api(
        `/admin/list/${type}`
      );

      setRows(
        response?.items || []
      );
    } catch (error) {
      setRows([]);

      setError(
        error?.message ||
        'Gagal memuat data.'
      );
    }
  };

  useEffect(() => {
    load();
  }, [type]);

  const action = async (
    id,
    status
  ) => {
    if (
      type === 'orders'
    ) {
      setConfirmState({
        id,
        status,
        kind: 'status'
      });

      return;
    }

    if (
      type === 'sellers' &&
      status === 'rejected'
    ) {
      setConfirmState({
        id,
        status,
        kind: 'status'
      });

      return;
    }

    if (
      type === 'payments'
    ) {
      setConfirmState({
        id,
        status,
        kind: 'payment'
      });

      return;
    }

    await executeAction(
      id,
      status
    );
  };

  const executeAction = async (
    id,
    status
  ) => {
    try {
      setLoadingAction(
        `${id}:${status}`
      );

      setError('');

      await api(
        `/admin/status/${type}/${id}`,
        {
          method: 'PATCH',

          body: JSON.stringify({
            status
          })
        }
      );

      setExpandedId(null);

      await load();
    } catch (error) {
      setError(
        error?.message ||
        'Gagal memperbarui status.'
      );
    } finally {
      setLoadingAction('');
    }
  };

  const banSeller = async (
    row
  ) => {
    const uid =
      getSellerUid(row);

    if (!uid) {
      setError(
        'UID seller tidak ditemukan.'
      );

      return;
    }

    setConfirmState({
      id: uid,
      row,
      kind: 'ban'
    });
  };

  const executeBan = async (
    uid
  ) => {
    try {
      setLoadingAction(
        `${uid}:ban`
      );

      setError('');

      await api(
        `/admin/users/${uid}`,
        {
          method: 'PATCH',

          body: JSON.stringify({
            banned: true
          })
        }
      );

      setExpandedId(null);

      await load();
    } catch (error) {
      setError(
        error?.message ||
        'Gagal memblokir seller.'
      );
    } finally {
      setLoadingAction('');
    }
  };

  const closeConfirm = () => {
    if (
      loadingAction
    ) {
      return;
    }

    setConfirmState(null);
  };

  const confirmAction = async () => {
    if (
      !confirmState
    ) {
      return;
    }

    const current =
      confirmState;

    setConfirmState(null);

    if (
      current.kind === 'ban'
    ) {
      await executeBan(
        current.id
      );

      return;
    }

    await executeAction(
      current.id,
      current.status
    );
  };

  const toggleExpand = (
    id
  ) => {
    setExpandedId(
      currentId => {
        if (
          currentId === id
        ) {
          return null;
        }

        return id;
      }
    );
  };

  const getTitle = row => {
    if (
      type === 'sellers'
    ) {
      return (
        row.name ||
        row.email ||
        row.uid ||
        row.id
      );
    }

    return (
      row.name ||
      row.title ||
      row.productName ||
      row.productId ||
      row.orderId ||
      row.id
    );
  };

  const renderSeller = row => {
    const status =
      getSellerStatus(row);

    const photo =
      getSellerPhoto(row);

    const uid =
      getSellerUid(row);

    const isExpanded =
      expandedId === row.id;

    const isPending =
      status === 'pending';

    const isBanned =
      status === 'banned' ||
      row.banned === true;

    const isBanLoading =
      loadingAction ===
      `${uid}:ban`;

    return (
      <article
        key={row.id}
        className="admin-manage-card admin-seller-card"
      >
        <div className="admin-seller-photo-wrap">
          {photo ? (
            <img
              src={photo}
              alt={
                row.name ||
                'Foto seller'
              }
              className="admin-seller-photo"
            />
          ) : (
            <div className="admin-seller-photo-placeholder">
              ◎
            </div>
          )}
        </div>

        <div className="admin-seller-main">
          <div className="admin-card-heading">
            <div>
              <span className="admin-card-label">
                Seller
              </span>

              <h3>
                {
                  row.name ||
                  'Tanpa nama'
                }
              </h3>

              <p>
                {
                  row.email ||
                  '-'
                }
              </p>
            </div>

            <span
              className={
                `admin-status admin-status-${status}`
              }
            >
              {
                getStatusLabel(
                  status
                )
              }
            </span>
          </div>

          <div className="admin-seller-summary">
            <div>
              <span>
                WhatsApp
              </span>

              <strong>
                {
                  row.phone ||
                  '-'
                }
              </strong>
            </div>

            <div>
              <span>
                UID
              </span>

              <strong>
                {
                  uid ||
                  '-'
                }
              </strong>
            </div>
          </div>

          {isExpanded && (
            <div className="admin-detail-panel">
              <div className="admin-detail-row">
                <span>
                  Nama
                </span>

                <strong>
                  {
                    row.name ||
                    '-'
                  }
                </strong>
              </div>

              <div className="admin-detail-row">
                <span>
                  Email
                </span>

                <strong>
                  {
                    row.email ||
                    '-'
                  }
                </strong>
              </div>

              <div className="admin-detail-row">
                <span>
                  Nomor WhatsApp
                </span>

                <strong>
                  {
                    row.phone ||
                    '-'
                  }
                </strong>
              </div>

              <div className="admin-detail-row">
                <span>
                  Tujuan menjadi Seller
                </span>

                <strong>
                  {
                    row.reason ||
                    row.description ||
                    '-'
                  }
                </strong>
              </div>

              <div className="admin-detail-row">
                <span>
                  Status
                </span>

                <strong>
                  {
                    getStatusLabel(
                      status
                    )
                  }
                </strong>
              </div>

              <div className="admin-detail-row">
                <span>
                  UID
                </span>

                <strong>
                  {
                    uid ||
                    '-'
                  }
                </strong>
              </div>
            </div>
          )}

          <div className="admin-card-actions">
            <button
              type="button"
              className="admin-detail-button"
              onClick={() => {
                toggleExpand(
                  row.id
                );
              }}
            >
              {
                isExpanded
                  ? 'Sembunyikan'
                  : 'Detail'
              }
            </button>

            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    action(
                      row.id,
                      'approved'
                    );
                  }}
                  disabled={
                    loadingAction ===
                    `${row.id}:approved`
                  }
                >
                  {
                    loadingAction ===
                    `${row.id}:approved`
                      ? 'Memproses...'
                      : 'Approve'
                  }
                </button>

                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={() => {
                    action(
                      row.id,
                      'rejected'
                    );
                  }}
                  disabled={
                    loadingAction ===
                    `${row.id}:rejected`
                  }
                >
                  {
                    loadingAction ===
                    `${row.id}:rejected`
                      ? 'Memproses...'
                      : 'Reject'
                  }
                </button>
              </>
            )}

            {!isPending &&
              !isBanned && (
                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={() => {
                    banSeller(row);
                  }}
                  disabled={
                    isBanLoading
                  }
                >
                  {
                    isBanLoading
                      ? 'Memproses...'
                      : 'Ban Seller'
                  }
                </button>
              )}
          </div>
        </div>
      </article>
    );
  };

  const renderPayment = row => {
    const status =
      row.status || 'pending';

    const isExpanded =
      expandedId === row.id;

    const isPending =
      status === 'pending';

    const verifyLoading =
      loadingAction ===
      `${row.id}:verified`;

    const rejectLoading =
      loadingAction ===
      `${row.id}:rejected`;

    const buyer =
      row.buyerName ||
      row.buyerEmail ||
      row.buyerUid ||
      '-';

    const seller =
      row.sellerName ||
      row.sellerEmail ||
      row.sellerUid ||
      '-';

    const product =
      row.productName ||
      row.productTitle ||
      row.productId ||
      '-';

    const orderId =
      row.orderId ||
      row.id ||
      '-';

    return (
      <article
        key={row.id}
        className="admin-manage-card"
        style={{
          width: '100%'
        }}
      >
        <div className="admin-card-heading">
          <div>
            <span className="admin-card-label">
              Pembayaran
            </span>

            <h3>
              {
                formatAmount(
                  row.amount
                )
              }
            </h3>

            <p>
              Order #{orderId}
            </p>
          </div>

          <span
            className={
              `admin-status admin-status-${status}`
            }
          >
            {
              getStatusLabel(
                status
              )
            }
          </span>
        </div>

        <div
          className="admin-generic-details"
          style={{
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))'
          }}
        >
          <div>
            <span>
              Buyer
            </span>

            <strong>
              {buyer}
            </strong>
          </div>

          <div>
            <span>
              Seller
            </span>

            <strong>
              {seller}
            </strong>
          </div>

          <div>
            <span>
              Produk
            </span>

            <strong>
              {product}
            </strong>
          </div>

          <div>
            <span>
              Nominal
            </span>

            <strong>
              {
                formatAmount(
                  row.amount
                )
              }
            </strong>
          </div>

          <div>
            <span>
              Metode Pembayaran
            </span>

            <strong>
              {
                String(
                  row.paymentMethod ||
                  row.method ||
                  '-'
                ).toUpperCase()
              }
            </strong>
          </div>

          <div>
            <span>
              Status Pembayaran
            </span>

            <strong>
              {
                getStatusLabel(
                  status
                )
              }
            </strong>
          </div>

          <div>
            <span>
              Status Order
            </span>

            <strong>
              {
                getStatusLabel(
                  row.orderStatus ||
                  row.order?.status ||
                  '-'
                )
              }
            </strong>
          </div>

          <div>
            <span>
              Waktu
            </span>

            <strong>
              {
                formatDate(
                  row.createdAt
                )
              }
            </strong>
          </div>
        </div>

        {isExpanded && (
          <div className="admin-detail-panel">
            <div className="admin-detail-row">
              <span>
                Payment ID
              </span>

              <strong>
                {
                  row.id ||
                  '-'
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Order ID
              </span>

              <strong>
                {
                  row.orderId ||
                  '-'
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Buyer UID
              </span>

              <strong>
                {
                  row.buyerUid ||
                  '-'
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Seller UID
              </span>

              <strong>
                {
                  row.sellerUid ||
                  '-'
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Product ID
              </span>

              <strong>
                {
                  row.productId ||
                  '-'
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Nominal
              </span>

              <strong>
                {
                  formatAmount(
                    row.amount
                  )
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Metode Pembayaran
              </span>

              <strong>
                {
                  row.paymentMethod ||
                  row.method ||
                  '-'
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Status Pembayaran
              </span>

              <strong>
                {
                  getStatusLabel(
                    status
                  )
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Status Order
              </span>

              <strong>
                {
                  getStatusLabel(
                    row.orderStatus ||
                    row.order?.status ||
                    '-'
                  )
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Dibuat
              </span>

              <strong>
                {
                  formatDate(
                    row.createdAt
                  )
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                Diperbarui
              </span>

              <strong>
                {
                  formatDate(
                    row.updatedAt
                  )
                }
              </strong>
            </div>
          </div>
        )}

        <div className="admin-card-actions">
          <button
            type="button"
            className="admin-detail-button"
            onClick={() => {
              toggleExpand(
                row.id
              );
            }}
          >
            {
              isExpanded
                ? 'Sembunyikan'
                : 'Detail Pembayaran'
            }
          </button>

          {isPending && (
            <>
              <button
                type="button"
                onClick={() => {
                  action(
                    row.id,
                    'verified'
                  );
                }}
                disabled={
                  verifyLoading ||
                  rejectLoading
                }
              >
                {
                  verifyLoading
                    ? 'Memproses...'
                    : 'Verifikasi'
                }
              </button>

              <button
                type="button"
                className="admin-danger-button"
                onClick={() => {
                  action(
                    row.id,
                    'rejected'
                  );
                }}
                disabled={
                  verifyLoading ||
                  rejectLoading
                }
              >
                {
                  rejectLoading
                    ? 'Memproses...'
                    : 'Tolak'
                }
              </button>
            </>
          )}
        </div>
      </article>
    );
  };

  const renderGeneric = row => {
    const status =
      row.status || '';

    return (
      <article
        key={row.id}
        className="admin-manage-card"
      >
        <div className="admin-card-heading">
          <div>
            <span className="admin-card-label">
              {title}
            </span>

            <h3>
              {
                getTitle(row)
              }
            </h3>
          </div>

          <span
            className={
              `admin-status admin-status-${status}`
            }
          >
            {
              getStatusLabel(
                status
              )
            }
          </span>
        </div>

        <div className="admin-generic-details">
          {type === 'products' && (
            <>
              <div>
                <span>
                  Produk
                </span>

                <strong>
                  {
                    row.name ||
                    row.title ||
                    '-'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Seller
                </span>

                <strong>
                  {
                    row.sellerName ||
                    row.sellerUid ||
                    '-'
                  }
                </strong>
              </div>
            </>
          )}

          {type === 'orders' && (
            <>
              <div>
                <span>
                  Order
                </span>

                <strong>
                  {
                    row.id ||
                    '-'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Produk
                </span>

                <strong>
                  {
                    row.productName ||
                    row.productId ||
                    '-'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Buyer
                </span>

                <strong>
                  {
                    row.buyerName ||
                    row.buyerUid ||
                    '-'
                  }
                </strong>
              </div>
            </>
          )}
        </div>

        <div className="admin-card-actions">
          {(
            ACTIONS[type] ||
            []
          ).map(
            ([
              actionStatus,
              label
            ]) => (
              <button
                type="button"
                key={actionStatus}
                className={
                  actionStatus ===
                  'rejected' ||
                  actionStatus ===
                  'cancelled'
                    ? 'admin-danger-button'
                    : ''
                }
                onClick={() => {
                  action(
                    row.id,
                    actionStatus
                  );
                }}
                disabled={
                  loadingAction ===
                  `${row.id}:${actionStatus}`
                }
              >
                {
                  loadingAction ===
                  `${row.id}:${actionStatus}`
                    ? 'Memproses...'
                    : label
                }
              </button>
            )
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="admin-manage-page">
      <div className="section-head admin-section-head">
        <div>
          <span className="admin-card-label">
            Admin
          </span>

          <h2>
            {title}
          </h2>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={
            Boolean(
              loadingAction
            )
          }
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      {confirmState && (
        <div
          className="admin-confirm-overlay"
          role="presentation"
          onClick={
            closeConfirm
          }
        >
          <div
            className="admin-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-confirm-title"
            onClick={event => {
              event.stopPropagation();
            }}
          >
            <span className="admin-card-label">
              Konfirmasi
            </span>

            <h3 id="manage-confirm-title">
              {confirmState.kind ===
              'ban'
                ? 'Ban Seller?'
                : confirmState.kind ===
                  'payment'
                  ? confirmState.status ===
                    'verified'
                    ? 'Verifikasi pembayaran?'
                    : 'Tolak pembayaran?'
                  : confirmState.status ===
                    'rejected'
                    ? 'Tolak pengajuan seller?'
                    : 'Batalkan transaksi?'}
            </h3>

            <p>
              {confirmState.kind ===
              'ban'
                ? 'Seller ini akan diblokir dan status bannya akan tersimpan di akun seller.'
                : confirmState.kind ===
                  'payment'
                  ? confirmState.status ===
                    'verified'
                    ? 'Pembayaran akan ditandai terverifikasi dan status pembayaran pada order akan ikut diperbarui.'
                    : 'Pembayaran akan ditolak dan status pembayaran pada order akan ikut diperbarui.'
                  : confirmState.status ===
                    'rejected'
                    ? 'Pengajuan seller ini akan ditolak.'
                    : 'Order akan dibatalkan sesuai alur transaksi yang sudah tersedia.'}
            </p>

            <div className="admin-confirm-actions">
              <button
                type="button"
                onClick={
                  closeConfirm
                }
                disabled={
                  Boolean(
                    loadingAction
                  )
                }
              >
                Batal
              </button>

              <button
                type="button"
                className={
                  confirmState.status ===
                    'verified'
                    ? ''
                    : 'admin-danger-button'
                }
                onClick={
                  confirmAction
                }
                disabled={
                  Boolean(
                    loadingAction
                  )
                }
              >
                {
                  confirmState.status ===
                  'verified'
                    ? 'Ya, verifikasi'
                    : 'Ya, lanjutkan'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-manage-list">
        {rows.map(
          row => {
            if (
              type === 'sellers'
            ) {
              return renderSeller(
                row
              );
            }

            if (
              type === 'payments'
            ) {
              return renderPayment(
                row
              );
            }

            return renderGeneric(
              row
            );
          }
        )}

        {!rows.length &&
          !error && (
            <div className="state">
              Tidak ada data.
            </div>
          )}
      </div>
    </section>
  );
}
