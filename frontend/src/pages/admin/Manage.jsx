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
      const confirmed =
        window.confirm(
          'Batalkan transaksi ini?'
        );

      if (!confirmed) {
        return;
      }
    }

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
      alert(
        error?.message ||
        'Gagal memperbarui status.'
      );
    }
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
