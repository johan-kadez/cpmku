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

          {type === 'payments' && (
            <>
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
                : confirmState.status ===
                  'rejected'
                  ? 'Tolak pengajuan seller?'
                  : 'Batalkan transaksi?'}
            </h3>

            <p>
              {confirmState.kind ===
              'ban'
                ? 'Seller ini akan diblokir dan status bannya akan tersimpan di akun seller.'
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
                className="admin-danger-button"
                onClick={
                  confirmAction
                }
                disabled={
                  Boolean(
                    loadingAction
                  )
                }
              >
                Ya, lanjutkan
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
