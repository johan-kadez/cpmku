import {
useEffect,
useState
} from 'react';

import {
api
} from '../../services/api';

const STATUS_LABELS = {
in_transaction: 'Dalam transaksi',
completed: 'Selesai',
cancelled: 'Dibatalkan'
};

function getStatusLabel(status) {
return (
STATUS_LABELS[status] ||
status ||
'-'
);
}

function formatAmount(amount) {
const value = Number(amount);

if (!Number.isFinite(value)) {
return '-';
}

return new Intl.NumberFormat(
'id-ID',
{
style: 'currency',
currency: 'IDR',
maximumFractionDigits: 0
}
).format(value);
}

function formatDate(value) {
if (!value) {
return '-';
}

let date;

if (
typeof value === 'object' &&
value !== null &&
typeof value.seconds === 'number'
) {
date = new Date(
value.seconds * 1000
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

return date.toLocaleString(
'id-ID',
{
dateStyle: 'medium',
timeStyle: 'short'
}
);
}

function getUserName(user) {
return (
user?.name ||
user?.displayName ||
user?.email ||
user?.uid ||
user?.id ||
'-'
);
}

function getUserEmail(user) {
return (
user?.email ||
'-'
);
}

function getUserUid(user) {
return (
user?.uid ||
user?.id ||
'-'
);
}

function DetailRow({
label,
children
}) {
return (
<div
style={{
display: 'grid',
gridTemplateColumns:
'minmax(110px, 180px) 1fr',
gap: '14px',
padding: '12px 0',
borderBottom:
'1px solid rgba(255,255,255,0.08)'
}}
>
<span
style={{
color:
'rgba(255,255,255,0.58)',
fontSize: '13px'
}}
>
{label}
</span>

  <strong
    style={{
      minWidth: 0,
      overflowWrap:
        'anywhere',
      color: '#fff',
      fontSize: '14px'
    }}
  >
    {children}
  </strong>
</div>

);
}

export default function Orders() {
const [
rows,
setRows
] = useState([]);

const [
users,
setUsers
] = useState([]);

const [
loading,
setLoading
] = useState(true);

const [
error,
setError
] = useState('');

const [
selectedOrder,
setSelectedOrder
] = useState(null);

const [
actionLoading,
setActionLoading
] = useState('');

const [
confirmOpen,
setConfirmOpen
] = useState(false);

const load = async () => {
try {
setLoading(true);
setError('');

  const [
    ordersResponse,
    usersResponse
  ] = await Promise.all([
    api('/admin/list/orders'),
    api('/admin/users')
  ]);

  setRows(
    Array.isArray(
      ordersResponse?.items
    )
      ? ordersResponse.items
      : []
  );

  setUsers(
    Array.isArray(
      usersResponse?.items
    )
      ? usersResponse.items
      : []
  );
} catch (err) {
  setError(
    err?.message ||
    'Gagal memuat order.'
  );
} finally {
  setLoading(false);
}

};

useEffect(() => {
load();
}, []);

const findUser = uid => {
if (!uid) {
return null;
}

return (
  users.find(
    user =>
      String(
        user?.uid ||
        user?.id ||
        ''
      ) === String(uid)
  ) ||
  null
);

};

const cancelOrder = async () => {
if (
!selectedOrder ||
actionLoading
) {
return;
}

try {
  setActionLoading(
    selectedOrder.id
  );

  setError('');

  await api(
    `/admin/status/orders/${encodeURIComponent(
      selectedOrder.id
    )}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'cancelled'
      })
    }
  );

  setConfirmOpen(false);
  setSelectedOrder(null);

  await load();
} catch (err) {
  setError(
    err?.message ||
    'Gagal membatalkan order.'
  );
} finally {
  setActionLoading('');
}

};

if (loading) {
return (
<section className="admin-manage-page">
<div className="notice">
Memuat order...
</div>
</section>
);
}

return (
<section
className="admin-manage-page"
style={{
width: '100%'
}}
>
<div
className="section-head admin-section-head"
>
<div>
<span className="admin-card-label">
Admin
</span>

      <h2>
        Order
      </h2>
    </div>

    <button
      type="button"
      onClick={load}
      disabled={Boolean(
        actionLoading
      )}
    >
      Refresh
    </button>
  </div>

  {error && (
    <div className="notice error">
      {error}
    </div>
  )}

  {!rows.length && !error && (
    <div className="notice">
      Belum ada order.
    </div>
  )}

  <div
    style={{
      display: 'grid',
      gridTemplateColumns:
        'minmax(0, 1fr)',
      gap: '16px',
      width: '100%'
    }}
  >
    {rows.map(order => {
      const buyer =
        findUser(
          order.buyerUid
        );

      const seller =
        findUser(
          order.sellerUid
        );

      const isActive =
        order.status ===
        'in_transaction';

      const isCancelling =
        actionLoading ===
        order.id;

      return (
        <article
          key={order.id}
          className="admin-manage-card"
          style={{
            width: '100%',
            minWidth: 0
          }}
        >
          <div
            className="admin-card-heading"
          >
            <div
              style={{
                minWidth: 0
              }}
            >
              <span className="admin-card-label">
                Order
              </span>

              <h3
                style={{
                  overflowWrap:
                    'anywhere'
                }}
              >
                {order.id}
              </h3>

              <p>
                {formatDate(
                  order.createdAt
                )}
              </p>
            </div>

            <span
              className={
                `admin-status admin-status-${
                  order.status || ''
                }`
              }
            >
              {getStatusLabel(
                order.status
              )}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap: '12px',
              marginTop: '16px'
            }}
          >
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background:
                  'rgba(255,255,255,0.04)',
                minWidth: 0
              }}
            >
              <span
                className="admin-card-label"
              >
                Buyer
              </span>

              <strong
                style={{
                  display: 'block',
                  marginTop: '6px',
                  overflowWrap:
                    'anywhere'
                }}
              >
                {getUserName(
                  buyer
                )}
              </strong>

              <small
                style={{
                  display: 'block',
                  marginTop: '5px',
                  color:
                    'rgba(255,255,255,0.55)',
                  overflowWrap:
                    'anywhere'
                }}
              >
                {getUserEmail(
                  buyer
                )}
              </small>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background:
                  'rgba(255,255,255,0.04)',
                minWidth: 0
              }}
            >
              <span
                className="admin-card-label"
              >
                Produk
              </span>

              <strong
                style={{
                  display: 'block',
                  marginTop: '6px',
                  overflowWrap:
                    'anywhere'
                }}
              >
                {order.productName ||
                  order.productId ||
                  '-'}
              </strong>

              <small
                style={{
                  display: 'block',
                  marginTop: '5px',
                  color:
                    'rgba(255,255,255,0.55)',
                  overflowWrap:
                    'anywhere'
                }}
              >
                ID: {
                  order.productId ||
                  '-'
                }
              </small>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background:
                  'rgba(255,255,255,0.04)',
                minWidth: 0
              }}
            >
              <span
                className="admin-card-label"
              >
                Seller
              </span>

              <strong
                style={{
                  display: 'block',
                  marginTop: '6px',
                  overflowWrap:
                    'anywhere'
                }}
              >
                {getUserName(
                  seller
                )}
              </strong>

              <small
                style={{
                  display: 'block',
                  marginTop: '5px',
                  color:
                    'rgba(255,255,255,0.55)',
                  overflowWrap:
                    'anywhere'
                }}
              >
                {getUserEmail(
                  seller
                )}
              </small>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding:
                '4px 16px',
              borderRadius: '14px',
              background:
                'rgba(255,255,255,0.025)'
            }}
          >
            <DetailRow
              label="Nominal"
            >
              {formatAmount(
                order.amount
              )}
            </DetailRow>

            <DetailRow
              label="Status order"
            >
              {getStatusLabel(
                order.status
              )}
            </DetailRow>

            <DetailRow
              label="Status pembayaran"
            >
              {order.paymentStatus ||
                '-'}
            </DetailRow>

            <DetailRow
              label="Buyer UID"
            >
              {order.buyerUid ||
                '-'}
            </DetailRow>

            <DetailRow
              label="Seller UID"
            >
              {order.sellerUid ||
                '-'}
            </DetailRow>

            <DetailRow
              label="Room ID"
            >
              {order.roomId ||
                '-'}
            </DetailRow>
          </div>

          <div
            className="admin-card-actions"
            style={{
              marginTop: '16px'
            }}
          >
            <button
              type="button"
              className="admin-detail-button"
              onClick={() => {
                setSelectedOrder(
                  order
                );
              }}
            >
              Detail Order
            </button>

            {isActive && (
              <button
                type="button"
                className="admin-danger-button"
                onClick={() => {
                  setSelectedOrder(
                    order
                  );

                  setConfirmOpen(
                    true
                  );
                }}
                disabled={
                  isCancelling
                }
              >
                {isCancelling
                  ? 'Memproses...'
                  : 'Batalkan'}
              </button>
            )}
          </div>
        </article>
      );
    })}
  </div>

  {selectedOrder &&
    !confirmOpen && (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background:
            'rgba(0,0,0,0.72)'
        }}
        onMouseDown={() => {
          setSelectedOrder(
            null
          );
        }}
      >
        <div
          style={{
            width: 'min(620px, 100%)',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '22px',
            borderRadius: '20px',
            background:
              'rgba(20,24,32,0.96)',
            border:
              '1px solid rgba(255,255,255,0.10)',
            backdropFilter:
              'blur(18px)',
            boxShadow:
              '0 24px 80px rgba(0,0,0,0.45)'
          }}
          onMouseDown={event => {
            event.stopPropagation();
          }}
        >
          <div
            className="admin-card-heading"
          >
            <div>
              <span className="admin-card-label">
                Detail Order
              </span>

              <h3>
                {selectedOrder.id}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedOrder(
                  null
                );
              }}
            >
              Tutup
            </button>
          </div>

          <DetailRow
            label="Buyer"
          >
            {
              getUserName(
                findUser(
                  selectedOrder.buyerUid
                )
              )
            }
          </DetailRow>

          <DetailRow
            label="Buyer email"
          >
            {
              getUserEmail(
                findUser(
                  selectedOrder.buyerUid
                )
              )
            }
          </DetailRow>

          <DetailRow
            label="Buyer UID"
          >
            {
              selectedOrder.buyerUid ||
              '-'
            }
          </DetailRow>

          <DetailRow
            label="Produk"
          >
            {
              selectedOrder.productName ||
              selectedOrder.productId ||
              '-'
            }
          </DetailRow>

          <DetailRow
            label="Product ID"
          >
            {
              selectedOrder.productId ||
              '-'
            }
          </DetailRow>

          <DetailRow
            label="Seller"
          >
            {
              getUserName(
                findUser(
                  selectedOrder.sellerUid
                )
              )
            }
          </DetailRow>

          <DetailRow
            label="Seller email"
          >
            {
              getUserEmail(
                findUser(
                  selectedOrder.sellerUid
                )
              )
            }
          </DetailRow>

          <DetailRow
            label="Seller UID"
          >
            {
              selectedOrder.sellerUid ||
              '-'
            }
          </DetailRow>

          <DetailRow
            label="Nominal"
          >
            {
              formatAmount(
                selectedOrder.amount
              )
            }
          </DetailRow>

          <DetailRow
            label="Status"
          >
            {
              getStatusLabel(
                selectedOrder.status
              )
            }
          </DetailRow>

          <DetailRow
            label="Pembayaran"
          >
            {
              selectedOrder.paymentStatus ||
              '-'
            }
          </DetailRow>

          <DetailRow
            label="Dibuat"
          >
            {
              formatDate(
                selectedOrder.createdAt
              )
            }
          </DetailRow>

          <div
            className="admin-card-actions"
            style={{
              marginTop: '18px'
            }}
          >
            {selectedOrder.status ===
              'in_transaction' && (
              <button
                type="button"
                className="admin-danger-button"
                onClick={() => {
                  setConfirmOpen(
                    true
                  );
                }}
              >
                Batalkan Order
              </button>
            )}
          </div>
        </div>
      </div>
    )}

  {confirmOpen &&
    selectedOrder && (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background:
            'rgba(0,0,0,0.78)'
        }}
      >
        <div
          style={{
            width: 'min(440px, 100%)',
            padding: '24px',
            borderRadius: '20px',
            background:
              'rgba(20,24,32,0.98)',
            border:
              '1px solid rgba(255,255,255,0.10)',
            backdropFilter:
              'blur(18px)',
            boxShadow:
              '0 24px 80px rgba(0,0,0,0.5)'
          }}
        >
          <span className="admin-card-label">
            Konfirmasi
          </span>

          <h3
            style={{
              marginTop: '6px'
            }}
          >
            Batalkan order?
          </h3>

          <p
            style={{
              color:
                'rgba(255,255,255,0.68)',
              lineHeight: 1.6,
              marginTop: '10px'
            }}
          >
            Order ini akan dibatalkan
            melalui sistem backend CPMKU.
            Produk, room, dan pembayaran
            akan mengikuti proses pembatalan
            yang sudah ada.
          </p>

          <div
            style={{
              marginTop: '16px',
              padding: '14px',
              borderRadius: '14px',
              background:
                'rgba(255,255,255,0.04)'
            }}
          >
            <strong
              style={{
                display: 'block',
                overflowWrap:
                  'anywhere'
              }}
            >
              {selectedOrder.productName ||
                selectedOrder.productId ||
                '-'}
            </strong>

            <span
              style={{
                display: 'block',
                marginTop: '5px',
                color:
                  'rgba(255,255,255,0.55)'
              }}
            >
              {
                selectedOrder.id
              }
            </span>
          </div>

          <div
            className="admin-card-actions"
            style={{
              marginTop: '20px',
              justifyContent:
                'flex-end'
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (
                  actionLoading
                ) {
                  return;
                }

                setConfirmOpen(
                  false
                );
              }}
              disabled={Boolean(
                actionLoading
              )}
            >
              Kembali
            </button>

            <button
              type="button"
              className="admin-danger-button"
              onClick={
                cancelOrder
              }
              disabled={Boolean(
                actionLoading
              )}
            >
              {actionLoading
                ? 'Membatalkan...'
                : 'Ya, Batalkan'}
            </button>
          </div>
        </div>
      </div>
    )}
</section>

);
}
