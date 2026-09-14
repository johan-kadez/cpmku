import {
  useEffect,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  api
} from '../../services/api';

function getStatusLabel(status) {
  const labels = {
    in_transaction: 'Dalam transaksi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    pending: 'Menunggu',
    verified: 'Terverifikasi',
    rejected: 'Ditolak'
  };

  return (
    labels[status] ||
    status ||
    '-'
  );
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

export default function Rooms() {
  const [
    rooms,
    setRooms
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
    loadingRoom,
    setLoadingRoom
  ] = useState('');

  const [
    notice,
    setNotice
  ] = useState(null);

  const navigate =
    useNavigate();

  const load = async () => {
    try {
      setError('');

      const response =
        await api(
          '/admin/rooms'
        );

      setRooms(
        response?.items || []
      );
    } catch (error) {
      setRooms([]);

      setError(
        error?.message ||
        'Gagal memuat room transaksi.'
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const callSeller = async (
    room
  ) => {
    if (
      !room?.id
    ) {
      return;
    }

    setLoadingRoom(
      room.id
    );

    setError('');

    try {
      await api(
        `/rooms/${room.id}/call-seller`,
        {
          method: 'POST'
        }
      );

      setNotice({
        type: 'success',
        title: 'Seller dipanggil',
        message:
          'Seller sudah diberi notifikasi dan dapat bergabung ke room transaksi.'
      });

      await load();
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Gagal memanggil seller',
        message:
          error?.message ||
          'Terjadi kesalahan saat memanggil seller.'
      });
    } finally {
      setLoadingRoom('');
    }
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

  return (
    <section className="admin-manage-page">
      <div className="section-head admin-section-head">
        <div>
          <span className="admin-card-label">
            Admin
          </span>

          <h2>
            Room Transaksi
          </h2>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={
            Boolean(
              loadingRoom
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

      {notice && (
        <div
          className={
            notice.type === 'success'
              ? 'notice'
              : 'notice error'
          }
        >
          <strong>
            {notice.title}
          </strong>

          <div>
            {notice.message}
          </div>

          <button
            type="button"
            onClick={() => {
              setNotice(null);
            }}
          >
            Tutup
          </button>
        </div>
      )}

      <div className="admin-manage-list">
        {rooms.map(room => {
          const isExpanded =
            expandedId === room.id;

          const isCalling =
            loadingRoom === room.id;

          const isActive =
            room.status ===
            'in_transaction';

          return (
            <article
              key={room.id}
              className="admin-manage-card"
              style={{
                width: '100%'
              }}
            >
              <div className="admin-card-heading">
                <div>
                  <span className="admin-card-label">
                    Room Transaksi
                  </span>

                  <h3>
                    {
                      room.productName ||
                      room.productTitle ||
                      room.productId ||
                      'Produk tidak diketahui'
                    }
                  </h3>

                  <p>
                    Room #{room.id}
                  </p>
                </div>

                <span
                  className={
                    `admin-status admin-status-${room.status || ''}`
                  }
                >
                  {
                    getStatusLabel(
                      room.status
                    )
                  }
                </span>
              </div>

              <div className="admin-generic-details">
                <div>
                  <span>
                    Produk
                  </span>

                  <strong>
                    {
                      room.productName ||
                      room.productTitle ||
                      room.productId ||
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
                      room.buyerName ||
                      room.buyerEmail ||
                      room.buyerUid ||
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
                      room.sellerName ||
                      room.sellerEmail ||
                      room.sellerUid ||
                      '-'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Status Room
                  </span>

                  <strong>
                    {
                      getStatusLabel(
                        room.status
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Seller
                  </span>

                  <strong>
                    {
                      room.sellerCalled
                        ? 'Sudah dipanggil'
                        : 'Belum dipanggil'
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Dibuat
                  </span>

                  <strong>
                    {
                      formatDate(
                        room.createdAt
                      )
                    }
                  </strong>
                </div>
              </div>

              {isExpanded && (
                <div className="admin-detail-panel">
                  <div className="admin-detail-row">
                    <span>
                      Room ID
                    </span>

                    <strong>
                      {
                        room.id ||
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
                        room.orderId ||
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
                        room.productId ||
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
                        room.buyerUid ||
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
                        room.sellerUid ||
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
                          room.status
                        )
                      }
                    </strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>
                      Seller Dipanggil
                    </span>

                    <strong>
                      {
                        room.sellerCalled
                          ? 'Ya'
                          : 'Belum'
                      }
                    </strong>
                  </div>

                  <div className="admin-detail-row">
                    <span>
                      Waktu Seller Dipanggil
                    </span>

                    <strong>
                      {
                        formatDate(
                          room.sellerCalledAt
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
                          room.createdAt
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
                          room.updatedAt
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
                      room.id
                    );
                  }}
                >
                  {
                    isExpanded
                      ? 'Sembunyikan'
                      : 'Detail Room'
                  }
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate(
                      `/chat/${room.id}`
                    );
                  }}
                >
                  Buka Chat
                </button>

                {isActive && (
                  <button
                    type="button"
                    onClick={() => {
                      callSeller(
                        room
                      );
                    }}
                    disabled={
                      isCalling
                    }
                  >
                    {
                      isCalling
                        ? 'Memproses...'
                        : room.sellerCalled
                          ? 'Panggil Lagi'
                          : 'Panggil Seller'
                    }
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {!rooms.length &&
          !error && (
            <div className="state">
              Tidak ada room transaksi.
            </div>
          )}
      </div>
    </section>
  );
}
