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
    if (type === 'orders') {
      setConfirmState({ id, status });
      return;
    }

    await executeAction(id, status);
  };

  const executeAction = async (
    id,
    status
  ) => {
    try {
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

      await load();
    } catch (error) {
      setError(
        error?.message ||
        'Gagal memperbarui status.'
      );
    }
  };

  const closeConfirm = () => {
    setConfirmState(null);
  };

  const confirmAction = async () => {
    if (!confirmState) {
      return;
    }

    const { id, status } = confirmState;
    setConfirmState(null);
    await executeAction(id, status);
  };

  const toggleExpand = (
    id
  ) => {
    setExpandedId(
      (currentId) => {
        if (
          currentId === id
        ) {
          return null;
        }

        return id;
      }
    );
  };

  const shouldShowActions = (
    row
  ) => {
    if (
      type === 'sellers'
    ) {
      return (
        row.status ===
        'pending'
      );
    }

    return true;
  };

  return (
    <section>
      <div className="section-head">
        <h2>
          {title}
        </h2>

        <button
          type="button"
          onClick={load}
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
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(0,0,0,0.68)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={closeConfirm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-confirm-title"
            style={{
              width: 'min(100%, 420px)',
              boxSizing: 'border-box',
              padding: 22,
              borderRadius: 18,
              background: 'rgba(20,24,32,0.96)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)'
            }}
            onClick={event => event.stopPropagation()}
          >
            <h3 id="manage-confirm-title" style={{ margin: '0 0 8px' }}>
              Konfirmasi
            </h3>
            <p style={{ margin: '0 0 20px', opacity: 0.72 }}>
              Batalkan transaksi ini?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={closeConfirm}>
                Batal
              </button>
              <button type="button" onClick={confirmAction}>
                Ya, batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table">
        {rows.map(
          (row) => (
            <article
              key={row.id}
            >
              <div>
                <b>
                  {
                    row.name ||
                    row.title ||
                    row.productId ||
                    row.orderId ||
                    row.id
                  }
                </b>

                {type ===
                  'sellers' && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleExpand(
                        row.id
                      );
                    }}
                    style={{
                      marginLeft: 8
                    }}
                  >
                    {
                      expandedId ===
                      row.id
                        ? 'Sembunyikan'
                        : 'Lihat Detail'
                    }
                  </button>
                )}

                {type ===
                  'sellers' &&
                  expandedId ===
                    row.id && (
                    <div
                      className="detail-box"
                      style={{
                        marginTop: 10,
                        display: 'grid',
                        gap: 6
                      }}
                    >
                      {row.photoUrl && (
                        <img
                          src={
                            row.photoUrl
                          }
                          alt="Foto profil"
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius:
                              '50%',
                            objectFit:
                              'cover'
                          }}
                        />
                      )}

                      <p>
                        <b>
                          Nama:
                        </b>{' '}
                        {
                          row.name ||
                          '-'
                        }
                      </p>

                      <p>
                        <b>
                          Email:
                        </b>{' '}
                        {
                          row.email ||
                          '-'
                        }
                      </p>

                      <p>
                        <b>
                          Nomor WhatsApp:
                        </b>{' '}
                        {
                          row.phone ||
                          '-'
                        }
                      </p>

                      <p>
                        <b>
                          Tujuan menjadi Seller:
                        </b>{' '}
                        {
                          row.reason ||
                          '-'
                        }
                      </p>
                    </div>
                  )}
              </div>

              <span>
                {
                  row.status ||
                  '-'
                }
              </span>

              <div>
                {shouldShowActions(
                  row
                ) &&
                  (
                    ACTIONS[type] ||
                    []
                  ).map(
                    ([
                      status,
                      label
                    ]) => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => {
                          action(
                            row.id,
                            status
                          );
                        }}
                      >
                        {label}
                      </button>
                    )
                  )}
              </div>
            </article>
          )
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
