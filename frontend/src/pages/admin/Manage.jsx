import {
  useEffect,
  useState
} from 'react';

import {
  api
} from '../../services/api';

const STATUS_LABELS = {
  pending:
    'Menunggu',

  pending_admin:
    'Menunggu Persetujuan',

  approved:
    'Aktif',

  available:
    'Tersedia',

  in_transaction:
    'Dalam Transaksi',

  completed:
    'Selesai',

  cancelled:
    'Dibatalkan',

  rejected:
    'Ditolak',

  banned:
    'Banned',

  verified:
    'Terverifikasi',

  waiting_admin:
    'Menunggu Admin'
};

function statusLabel(
  value
) {
  return (
    STATUS_LABELS[value] ||
    value ||
    '-'
  );
}

function getId(
  row
) {
  return (
    row?.uid ||
    row?.id ||
    row?.productId ||
    row?.orderId ||
    ''
  );
}

function getPhoto(
  row
) {
  return (
    row?.photoUrl ||
    row?.photoURL ||
    row?.photo ||
    ''
  );
}

function amount(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return '-';
  }

  return new Intl.NumberFormat(
    'id-ID',
    {
      style:
        'currency',
      currency:
        'IDR',
      maximumFractionDigits:
        0
    }
  ).format(
    number
  );
}

function dateText(
  value
) {
  if (!value) {
    return '-';
  }

  let date;

  if (
    typeof value ===
      'object' &&
    typeof value.toDate ===
      'function'
  ) {
    date =
      value.toDate();
  } else if (
    typeof value ===
      'object' &&
    typeof value._seconds ===
      'number'
  ) {
    date = new Date(
      value._seconds *
        1000
    );
  } else if (
    typeof value ===
      'object' &&
    typeof value.seconds ===
      'number'
  ) {
    date = new Date(
      value.seconds *
        1000
    );
  } else {
    date =
      new Date(value);
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
      dateStyle:
        'medium',
      timeStyle:
        'short'
    }
  ).format(
    date
  );
}

function AdminModal({
  title,
  children,
  actions,
  onClose
}) {
  return (
    <div
      className="cpmku-admin-modal-backdrop"
      onMouseDown={
        onClose
      }
    >
      <div
        className="cpmku-admin-modal"
        onMouseDown={event =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="cpmku-admin-modal-close"
          onClick={
            onClose
          }
        >
          ×
        </button>

        <h3>
          {title}
        </h3>

        <div className="cpmku-admin-modal-content">
          {children}
        </div>

        {actions && (
          <div className="cpmku-admin-modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminStyles() {
  return (
    <style>
      {`
        .cpmku-admin-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(12px);
        }

        .cpmku-admin-modal {
          position: relative;
          width: min(560px, 100%);
          max-height: 88vh;
          overflow-y: auto;
          padding: 26px;
          border: 1px solid rgba(48,112,255,.35);
          border-radius: 24px;
          background: rgba(12,17,29,.97);
          box-shadow: 0 25px 80px rgba(0,0,0,.55);
          color: #f4f7ff;
        }

        .cpmku-admin-modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(80,135,255,.4);
          border-radius: 14px;
          background: rgba(24,42,76,.75);
          color: #fff;
          font-size: 28px;
          cursor: pointer;
        }

        .cpmku-admin-modal h3 {
          margin: 8px 52px 24px 0;
          font-size: 24px;
        }

        .cpmku-admin-list {
          display: grid;
          gap: 14px;
        }

        .cpmku-admin-card {
          width: 100%;
          box-sizing: border-box;
          padding: 22px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 22px;
          background: rgba(20,20,20,.72);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
        }

        .cpmku-admin-card-title {
          text-align: center;
          font-size: 21px;
          font-weight: 700;
          color: #fff;
        }

        .cpmku-admin-card-subtitle {
          margin-top: 7px;
          text-align: center;
          color: #8e9ab0;
          font-size: 14px;
          word-break: break-all;
        }

        .cpmku-admin-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 16px;
        }

        .cpmku-admin-button {
          min-height: 42px;
          padding: 10px 17px;
          border: 1px solid rgba(55,119,255,.48);
          border-radius: 13px;
          background: linear-gradient(180deg,#172d59,#10224a);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .cpmku-admin-button:hover {
          border-color: rgba(80,145,255,.8);
        }

        .cpmku-admin-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .cpmku-admin-success {
          border-color: rgba(47,210,124,.5);
          background: linear-gradient(180deg,#145b42,#0e3c2e);
        }

        .cpmku-admin-danger {
          border-color: rgba(255,75,95,.5);
          background: linear-gradient(180deg,#642433,#411723);
        }

        .cpmku-admin-muted {
          color: #94a0b4;
        }

        .cpmku-admin-detail-grid {
          display: grid;
          gap: 13px;
        }

        .cpmku-admin-detail-row {
          display: grid;
          gap: 4px;
          padding-bottom: 11px;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .cpmku-admin-detail-row span {
          color: #8d99ae;
          font-size: 13px;
        }

        .cpmku-admin-detail-row strong {
          color: #fff;
          line-height: 1.45;
          word-break: break-word;
        }

        .cpmku-admin-profile {
          display: grid;
          justify-items: center;
          gap: 18px;
        }

        .cpmku-admin-profile img {
          width: 130px;
          height: 130px;
          object-fit: cover;
          border-radius: 28px;
          border: 1px solid rgba(70,125,255,.45);
        }

        .cpmku-admin-profile-placeholder {
          width: 130px;
          height: 130px;
          display: grid;
          place-items: center;
          border-radius: 28px;
          background: rgba(24,35,57,.8);
          color: #4c8cff;
          font-size: 45px;
        }

        .cpmku-admin-product-image {
          width: 100%;
          max-height: 330px;
          object-fit: contain;
          border-radius: 18px;
          background: #080b11;
        }

        .cpmku-admin-order-top,
        .cpmku-admin-payment-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .cpmku-admin-order-top div,
        .cpmku-admin-payment-top div {
          min-width: 0;
        }

        .cpmku-admin-label {
          display: block;
          margin-bottom: 5px;
          color: #729eff;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .cpmku-admin-value {
          color: #fff;
          font-weight: 650;
          word-break: break-word;
        }

        @media (max-width: 620px) {
          .cpmku-admin-order-top,
          .cpmku-admin-payment-top {
            grid-template-columns: 1fr;
          }

          .cpmku-admin-modal {
            padding: 21px;
            border-radius: 20px;
          }
        }
      `}
    </style>
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
    users,
    setUsers
  ] = useState([]);

  const [
    products,
    setProducts
  ] = useState([]);

  const [
    error,
    setError
  ] = useState('');

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    detail,
    setDetail
  ] = useState(null);

  const [
    confirm,
    setConfirm
  ] = useState(null);

  const load =
    async () => {
      try {
        setLoading(
          true
        );

        setError('');

        const requests = [
          api(
            `/admin/list/${type}`
          )
        ];

        if (
          [
            'sellers',
            'orders',
            'payments'
          ].includes(
            type
          )
        ) {
          requests.push(
            api(
              '/admin/users'
            )
          );
        }

        if (
          type ===
          'payments'
        ) {
          requests.push(
            api(
              '/admin/list/products'
            )
          );
        }

        const result =
          await Promise.all(
            requests
          );

        setRows(
          Array.isArray(
            result[0]?.items
          )
            ? result[0].items
            : []
        );

        if (
          result[1]
        ) {
          setUsers(
            Array.isArray(
              result[1]?.items
            )
              ? result[1].items
              : []
          );
        }

        if (
          result[2]
        ) {
          setProducts(
            Array.isArray(
              result[2]?.items
            )
              ? result[2].items
              : []
          );
        }
      } catch (
        requestError
      ) {
        setError(
          requestError?.message ||
          'Gagal memuat data.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    load();
  }, [type]);

  const findUser =
    uid =>
      users.find(
        user =>
          String(
            user?.uid ||
            user?.id ||
            ''
          ) ===
          String(
            uid || ''
          )
      );

  const runAction =
    async (
      row,
      status
    ) => {
      const id =
        getId(row);

      if (!id) {
        setError(
          'ID data tidak ditemukan.'
        );
        return;
      }

      try {
        setLoading(
          true
        );

        setConfirm(
          null
        );

        setError('');

        await api(
          `/admin/status/${type}/${encodeURIComponent(id)}`,
          {
            method:
              'PATCH',

            body:
              JSON.stringify({
                status
              })
          }
        );

        setDetail(
          null
        );

        await load();
      } catch (
        actionError
      ) {
        setError(
          actionError?.message ||
          'Aksi gagal.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  const sellerApplications =
    type === 'sellers'
      ? rows.filter(
          row =>
            (
              row.status ||
              'pending'
            ) ===
            'pending'
        )
      : [];

  const activeSellers =
    type === 'sellers'
      ? users.filter(
          user =>
            user.role ===
            'seller'
        )
      : [];

  const sellerDetail =
    row => (
      <div className="cpmku-admin-profile">
        {getPhoto(row) ? (
          <img
            src={getPhoto(row)}
            alt="Foto seller"
          />
        ) : (
          <div className="cpmku-admin-profile-placeholder">
            ◈
          </div>
        )}

        <div className="cpmku-admin-detail-grid">
          <div className="cpmku-admin-detail-row">
            <span>
              Nama
            </span>
            <strong>
              {row.name ||
                '-'}
            </strong>
          </div>

          <div className="cpmku-admin-detail-row">
            <span>
              Role
            </span>
            <strong>
              {row.status ===
              'pending'
                ? 'Buyer To Seller'
                : 'Seller'}
            </strong>
          </div>

          <div className="cpmku-admin-detail-row">
            <span>
              Email
            </span>
            <strong>
              {row.email ||
                '-'}
            </strong>
          </div>

          <div className="cpmku-admin-detail-row">
            <span>
              Nomor
            </span>
            <strong>
              {row.phone ||
                row.phoneNumber ||
                '-'}
            </strong>
          </div>

          {row.status ===
            'pending' && (
            <div className="cpmku-admin-detail-row">
              <span>
                Alasan
              </span>
              <strong>
                {row.reason ||
                  row.description ||
                  '-'}
              </strong>
            </div>
          )}

          <div className="cpmku-admin-detail-row">
            <span>
              Status
            </span>
            <strong>
              {statusLabel(
                row.banned
                  ? 'banned'
                  : row.status
              )}
            </strong>
          </div>
        </div>
      </div>
    );

  const productDetail =
    row => (
      <div className="cpmku-admin-detail-grid">
        {row.images?.length ? (
          <div>
            {row.images.map(
              (
                image,
                index
              ) => (
                <img
                  key={
                    image.publicId ||
                    index
                  }
                  src={
                    image.url
                  }
                  alt={
                    row.title ||
                    'Produk'
                  }
                  className="cpmku-admin-product-image"
                  style={{
                    marginBottom:
                      10
                  }}
                />
              )
            )}
          </div>
        ) : row.imageUrl ? (
          <img
            src={
              row.imageUrl
            }
            alt={
              row.title ||
              'Produk'
            }
            className="cpmku-admin-product-image"
          />
        ) : (
          <div className="cpmku-admin-muted">
            Foto produk tidak tersedia.
          </div>
        )}

        <div className="cpmku-admin-detail-row">
          <span>
            Nama Produk
          </span>
          <strong>
            {row.title ||
              row.name ||
              '-'}
          </strong>
        </div>

        <div className="cpmku-admin-detail-row">
          <span>
            ID Produk
          </span>
          <strong>
            {row.productId ||
              row.id ||
              '-'}
          </strong>
        </div>

        <div className="cpmku-admin-detail-row">
          <span>
            Harga
          </span>
          <strong>
            {amount(
              row.price
            )}
          </strong>
        </div>

        <div className="cpmku-admin-detail-row">
          <span>
            Deskripsi
          </span>
          <strong>
            {row.description ||
              '-'}
          </strong>
        </div>

        <div className="cpmku-admin-detail-row">
          <span>
            Nama Seller
          </span>
          <strong>
            {row.sellerName ||
              findUser(
                row.sellerUid
              )?.name ||
              '-'}
          </strong>
        </div>

        <div className="cpmku-admin-detail-row">
          <span>
            Kategori
          </span>
          <strong>
            {row.category ||
              '-'}
          </strong>
        </div>

        <div className="cpmku-admin-detail-row">
          <span>
            Status
          </span>
          <strong>
            {statusLabel(
              row.status
            )}
          </strong>
        </div>
      </div>
    );

  const renderSeller =
    row => (
      <article
        key={
          row.id
        }
        className="cpmku-admin-card"
      >
        <div className="cpmku-admin-card-title">
          {row.name ||
            'Tanpa Nama'}
        </div>

        <div className="cpmku-admin-actions">
          <button
            type="button"
            className="cpmku-admin-button"
            onClick={() =>
              setDetail({
                title:
                  row.status ===
                  'pending'
                    ? 'Detail Seller Application'
                    : 'Detail Seller',
                content:
                  sellerDetail(
                    row
                  ),
                row
              })
            }
          >
            Detail
          </button>

          {row.status ===
            'pending' && (
            <>
              <button
                type="button"
                className="cpmku-admin-button cpmku-admin-success"
                onClick={() =>
                  setConfirm({
                    row,
                    status:
                      'approved',
                    text:
                      'Setujui pengajuan seller ini?'
                  })
                }
                disabled={
                  loading
                }
              >
                Approve
              </button>

              <button
                type="button"
                className="cpmku-admin-button cpmku-admin-danger"
                onClick={() =>
                  setConfirm({
                    row,
                    status:
                      'rejected',
                    text:
                      'Reject pengajuan seller ini?'
                  })
                }
                disabled={
                  loading
                }
              >
                Reject
              </button>
            </>
          )}
        </div>
      </article>
    );

  const renderProduct =
    row => (
      <article
        key={
          row.id
        }
        className="cpmku-admin-card"
      >
        <div className="cpmku-admin-card-title">
          {row.title ||
            row.name ||
            'Produk'}
        </div>

        <div className="cpmku-admin-card-subtitle">
          {row.productId ||
            row.id ||
            '-'}
        </div>

        <div className="cpmku-admin-actions">
          <button
            type="button"
            className="cpmku-admin-button"
            onClick={() =>
              setDetail({
                title:
                  'Detail Produk',
                content:
                  productDetail(
                    row
                  ),
                row
              })
            }
          >
            Detail
          </button>
        </div>
      </article>
    );

  const renderOrder =
    row => {
      const buyer =
        findUser(
          row.buyerUid
        );

      const seller =
        findUser(
          row.sellerUid
        );

      const pending =
        [
          'pending_admin',
          'pending'
        ].includes(
          row.status
        );

      return (
        <article
          key={
            row.id
          }
          className="cpmku-admin-card"
        >
          <div className="cpmku-admin-order-top">
            <div>
              <span className="cpmku-admin-label">
                Buyer
              </span>
              <div className="cpmku-admin-value">
                {buyer?.name ||
                  row.buyerName ||
                  row.buyerUid ||
                  '-'}
              </div>
            </div>

            <div>
              <span className="cpmku-admin-label">
                Produk
              </span>
              <div className="cpmku-admin-value">
                {row.productName ||
                  row.productId ||
                  '-'}
              </div>
            </div>

            <div>
              <span className="cpmku-admin-label">
                Seller
              </span>
              <div className="cpmku-admin-value">
                {seller?.name ||
                  row.sellerName ||
                  row.sellerUid ||
                  '-'}
              </div>
            </div>

            <div>
              <span className="cpmku-admin-label">
                Status
              </span>
              <div className="cpmku-admin-value">
                {statusLabel(
                  row.status
                )}
              </div>
            </div>
          </div>

          <div className="cpmku-admin-actions">
            <button
              type="button"
              className="cpmku-admin-button"
              onClick={() =>
                setDetail({
                  title:
                    'Detail Order',
                  content: (
                    <div className="cpmku-admin-detail-grid">
                      <div className="cpmku-admin-detail-row">
                        <span>
                          Buyer
                        </span>
                        <strong>
                          {buyer?.name ||
                            row.buyerUid ||
                            '-'}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Produk
                        </span>
                        <strong>
                          {row.productName ||
                            row.productId ||
                            '-'}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Seller
                        </span>
                        <strong>
                          {seller?.name ||
                            row.sellerUid ||
                            '-'}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Nominal
                        </span>
                        <strong>
                          {amount(
                            row.amount
                          )}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Status Order
                        </span>
                        <strong>
                          {statusLabel(
                            row.status
                          )}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Status Pembayaran
                        </span>
                        <strong>
                          {statusLabel(
                            row.paymentStatus
                          )}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Dibuat
                        </span>
                        <strong>
                          {dateText(
                            row.createdAt
                          )}
                        </strong>
                      </div>
                    </div>
                  ),
                  row
                })
              }
            >
              Detail
            </button>

            {pending && (
              <>
                <button
                  type="button"
                  className="cpmku-admin-button cpmku-admin-success"
                  onClick={() =>
                    setConfirm({
                      row,
                      status:
                        'approved',
                      text:
                        'Setujui order ini? Produk akan masuk ke transaksi dan room akan dibuat.'
                    })
                  }
                  disabled={
                    loading
                  }
                >
                  Setujui
                </button>

                <button
                  type="button"
                  className="cpmku-admin-button cpmku-admin-danger"
                  onClick={() =>
                    setConfirm({
                      row,
                      status:
                        'rejected',
                      text:
                        'Reject order ini? Order akan dihapus dan produk kembali tersedia.'
                    })
                  }
                  disabled={
                    loading
                  }
                >
                  Reject
                </button>
              </>
            )}

            {row.status ===
              'in_transaction' && (
              <button
                type="button"
                className="cpmku-admin-button cpmku-admin-danger"
                onClick={() =>
                  setConfirm({
                    row,
                    status:
                      'cancelled',
                    text:
                      'Batalkan order ini? Order, room dan payment pending akan dihapus dan produk kembali tersedia.'
                  })
                }
                disabled={
                  loading
                }
              >
                Batalkan
              </button>
            )}
          </div>
        </article>
      );
    };

  const renderPayment =
    row => {
      const buyer =
        findUser(
          row.buyerUid
        );

      const product =
        products.find(
          item =>
            String(
              item?.productId ||
              item?.id ||
              ''
            ) ===
            String(
              row.productId ||
              ''
            )
        );

      return (
        <article
          key={
            row.id
          }
          className="cpmku-admin-card"
        >
          <div className="cpmku-admin-payment-top">
            <div>
              <span className="cpmku-admin-label">
                Buyer
              </span>

              <div className="cpmku-admin-value">
                {buyer?.name ||
                  row.buyerName ||
                  row.buyerUid ||
                  '-'}
              </div>
            </div>

            <div>
              <span className="cpmku-admin-label">
                Produk
              </span>

              <div className="cpmku-admin-value">
                {row.productName ||
                  product?.title ||
                  row.productId ||
                  '-'}
              </div>
            </div>
          </div>

          <div className="cpmku-admin-actions">
            <button
              type="button"
              className="cpmku-admin-button"
              onClick={() =>
                setDetail({
                  title:
                    'Detail Pembayaran',
                  content: (
                    <div className="cpmku-admin-detail-grid">
                      <div className="cpmku-admin-detail-row">
                        <span>
                          Buyer
                        </span>
                        <strong>
                          {buyer?.name ||
                            row.buyerUid ||
                            '-'}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Produk
                        </span>
                        <strong>
                          {row.productName ||
                            product?.title ||
                            row.productId ||
                            '-'}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Nominal
                        </span>
                        <strong>
                          {amount(
                            row.amount
                          )}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Status
                        </span>
                        <strong>
                          {statusLabel(
                            row.status
                          )}
                        </strong>
                      </div>

                      <div className="cpmku-admin-detail-row">
                        <span>
                          Order ID
                        </span>
                        <strong>
                          {row.orderId ||
                            '-'}
                        </strong>
                      </div>
                    </div>
                  ),
                  row
                })
              }
            >
              Detail
            </button>

            {row.status ===
              'pending' && (
              <>
                <button
                  type="button"
                  className="cpmku-admin-button cpmku-admin-success"
                  onClick={() =>
                    setConfirm({
                      row,
                      status:
                        'verified',
                      text:
                        'Verifikasi pembayaran ini?'
                    })
                  }
                  disabled={
                    loading
                  }
                >
                  Verifikasi
                </button>

                <button
                  type="button"
                  className="cpmku-admin-button cpmku-admin-danger"
                  onClick={() =>
                    setConfirm({
                      row,
                      status:
                        'rejected',
                      text:
                        'Tolak pembayaran ini?'
                    })
                  }
                  disabled={
                    loading
                  }
                >
                  Tolak
                </button>
              </>
            )}
          </div>
        </article>
      );
    };

  return (
    <section>
      <AdminStyles />

      <div className="section-head">
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
          className="cpmku-admin-button"
          onClick={
            load
          }
          disabled={
            loading
          }
        >
          {loading
            ? 'Memuat...'
            : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      {type ===
        'sellers' ? (
        <>
          <h3>
            Seller Application
          </h3>

          <div className="cpmku-admin-list">
            {sellerApplications.map(
              renderSeller
            )}

            {!sellerApplications.length && (
              <div className="state">
                Tidak ada seller application.
              </div>
            )}
          </div>

          <h3
            style={{
              marginTop:
                28
            }}
          >
            Active Seller
          </h3>

          <div className="cpmku-admin-list">
            {activeSellers.map(
              renderSeller
            )}

            {!activeSellers.length && (
              <div className="state">
                Tidak ada active seller.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="cpmku-admin-list">
          {rows.map(
            row => {
              if (
                type ===
                'products'
              ) {
                return renderProduct(
                  row
                );
              }

              if (
                type ===
                'orders'
              ) {
                return renderOrder(
                  row
                );
              }

              return renderPayment(
                row
              );
            }
          )}

          {!rows.length && (
            <div className="state">
              Tidak ada data.
            </div>
          )}
        </div>
      )}

      {detail && (
        <AdminModal
          title={
            detail.title
          }
          onClose={() =>
            setDetail(
              null
            )
          }
        >
          {detail.content}
        </AdminModal>
      )}

      {confirm && (
        <AdminModal
          title="Konfirmasi"
          onClose={() => {
            if (
              !loading
            ) {
              setConfirm(
                null
              );
            }
          }}
          actions={
            <>
              <button
                type="button"
                className="cpmku-admin-button"
                onClick={() =>
                  setConfirm(
                    null
                  )
                }
                disabled={
                  loading
                }
              >
                Batal
              </button>

              <button
                type="button"
                className={`cpmku-admin-button ${
                  confirm.status ===
                  'approved'
                    ? 'cpmku-admin-success'
                    : 'cpmku-admin-danger'
                }`}
                onClick={() =>
                  runAction(
                    confirm.row,
                    confirm.status
                  )
                }
                disabled={
                  loading
                }
              >
                {loading
                  ? 'Memproses...'
                  : 'Lanjutkan'}
              </button>
            </>
          }
        >
          <p>
            {confirm.text}
          </p>
        </AdminModal>
      )}
    </section>
  );
}
