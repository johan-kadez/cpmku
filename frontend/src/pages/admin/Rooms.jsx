import {
  useEffect,
  useState
} from 'react';

import {
  api
} from '../../services/api';

function Modal({
  children,
  onClose
}) {
  return (
    <div
      className="cpmku-room-modal-bg"
      onMouseDown={
        onClose
      }
    >
      <div
        className="cpmku-room-modal"
        onMouseDown={event =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="cpmku-room-close"
          onClick={
            onClose
          }
        >
          ×
        </button>

        {children}
      </div>
    </div>
  );
}

function label(
  status
) {
  const values = {
    in_transaction:
      'Dalam Transaksi',
    completed:
      'Selesai',
    cancelled:
      'Dibatalkan'
  };

  return (
    values[status] ||
    status ||
    '-'
  );
}

export default function Rooms() {
  const [
    rooms,
    setRooms
  ] = useState([]);

  const [
    users,
    setUsers
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    error,
    setError
  ] = useState('');

  const [
    selected,
    setSelected
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

        const [
          roomResponse,
          userResponse
        ] = await Promise.all([
          api(
            '/admin/list/rooms'
          ),
          api(
            '/admin/users'
          )
        ]);

        setRooms(
          Array.isArray(
            roomResponse?.items
          )
            ? roomResponse.items
            : []
        );

        setUsers(
          Array.isArray(
            userResponse?.items
          )
            ? userResponse.items
            : []
        );
      } catch (
        requestError
      ) {
        setError(
          requestError?.message ||
          'Gagal memuat room.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    load();
  }, []);

  const findUser =
    uid =>
      users.find(
        user =>
          String(
            user.uid ||
            user.id
          ) ===
          String(
            uid || ''
          )
      );

  const deleteRoom =
    async room => {
      try {
        setLoading(
          true
        );

        setConfirm(
          null
        );

        await api(
          `/admin/rooms/${encodeURIComponent(room.id)}`,
          {
            method:
              'DELETE'
          }
        );

        setSelected(
          null
        );

        await load();
      } catch (
        requestError
      ) {
        setError(
          requestError?.message ||
          'Gagal menghapus room.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  return (
    <section>
      <style>
        {`
          .cpmku-room-list {
            display: grid;
            gap: 14px;
          }

          .cpmku-room-card {
            width: 100%;
            box-sizing: border-box;
            padding: 22px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 22px;
            background: rgba(20,20,20,.72);
          }

          .cpmku-room-grid {
            display: grid;
            grid-template-columns: repeat(3,minmax(0,1fr));
            gap: 14px;
          }

          .cpmku-room-grid span {
            display: block;
            color: #729eff;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .cpmku-room-grid strong {
            display: block;
            margin-top: 5px;
            color: #fff;
            word-break: break-word;
          }

          .cpmku-room-status {
            margin-top: 13px;
            color: #9aa6ba;
          }

          .cpmku-room-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 16px;
          }

          .cpmku-room-button {
            min-height: 42px;
            padding: 10px 17px;
            border: 1px solid rgba(55,119,255,.5);
            border-radius: 13px;
            background: linear-gradient(180deg,#172d59,#10224a);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }

          .cpmku-room-danger {
            border-color: rgba(255,75,95,.5);
            background: linear-gradient(180deg,#642433,#411723);
          }

          .cpmku-room-modal-bg {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.74);
            backdrop-filter: blur(12px);
          }

          .cpmku-room-modal {
            position: relative;
            width: min(520px,100%);
            max-height: 88vh;
            overflow-y: auto;
            padding: 26px;
            border: 1px solid rgba(50,115,255,.4);
            border-radius: 24px;
            background: rgba(11,16,27,.98);
            color: #fff;
          }

          .cpmku-room-close {
            position: absolute;
            top: 14px;
            right: 14px;
            width: 42px;
            height: 42px;
            border: 1px solid rgba(70,125,255,.45);
            border-radius: 14px;
            background: rgba(23,43,78,.8);
            color: #fff;
            font-size: 28px;
          }

          .cpmku-room-detail {
            display: grid;
            gap: 13px;
            margin-top: 45px;
          }

          .cpmku-room-detail div {
            display: grid;
            gap: 4px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,.07);
          }

          .cpmku-room-detail span {
            color: #8e9ab0;
            font-size: 13px;
          }

          @media(max-width:650px) {
            .cpmku-room-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="section-head">
        <div>
          <span className="admin-card-label">
            Admin
          </span>

          <h2>
            Room
          </h2>
        </div>

        <button
          type="button"
          className="cpmku-room-button"
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

      <div className="cpmku-room-list">
        {rooms.map(
          room => {
            const buyer =
              findUser(
                room.buyerUid
              );

            const seller =
              findUser(
                room.sellerUid
              );

            return (
              <article
                key={
                  room.id
                }
                className="cpmku-room-card"
              >
                <div className="cpmku-room-grid">
                  <div>
                    <span>
                      Buyer
                    </span>
                    <strong>
                      {room.buyerName ||
                        buyer?.name ||
                        room.buyerUid ||
                        '-'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Produk
                    </span>
                    <strong>
                      {room.productName ||
                        room.productTitle ||
                        room.productId ||
                        '-'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Seller
                    </span>
                    <strong>
                      {room.sellerName ||
                        seller?.name ||
                        room.sellerUid ||
                        '-'}
                    </strong>
                  </div>
                </div>

                <div className="cpmku-room-status">
                  Status:{" "}
                  {label(
                    room.status
                  )}
                </div>

                <div className="cpmku-room-actions">
                  <button
                    type="button"
                    className="cpmku-room-button"
                    onClick={() =>
                      setSelected(
                        room
                      )
                    }
                  >
                    Detail
                  </button>

                  <button
                    type="button"
                    className="cpmku-room-button cpmku-room-danger"
                    onClick={() =>
                      setConfirm(
                        room
                      )
                    }
                    disabled={
                      loading
                    }
                  >
                    Hapus Room
                  </button>
                </div>
              </article>
            );
          }
        )}

        {!rooms.length &&
          !error && (
            <div className="state">
              Tidak ada room.
            </div>
          )}
      </div>

      {selected && (
        <Modal
          onClose={() =>
            setSelected(
              null
            )
          }
        >
          <h3>
            Detail Room
          </h3>

          <div className="cpmku-room-detail">
            <div>
              <span>
                Buyer
              </span>
              <strong>
                {selected.buyerName ||
                  findUser(
                    selected.buyerUid
                  )?.name ||
                  selected.buyerUid ||
                  '-'}
              </strong>
            </div>

            <div>
              <span>
                Produk
              </span>
              <strong>
                {selected.productName ||
                  selected.productTitle ||
                  selected.productId ||
                  '-'}
              </strong>
            </div>

            <div>
              <span>
                Seller
              </span>
              <strong>
                {selected.sellerName ||
                  findUser(
                    selected.sellerUid
                  )?.name ||
                  selected.sellerUid ||
                  '-'}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>
              <strong>
                {label(
                  selected.status
                )}
              </strong>
            </div>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal
          onClose={() =>
            setConfirm(
              null
            )
          }
        >
          <h3>
            Hapus Room?
          </h3>

          <p>
            Room akan dihapus.
            Riwayat transaksi
            buyer/seller tidak
            ikut dihapus.
          </p>

          <div className="cpmku-room-actions">
            <button
              type="button"
              className="cpmku-room-button"
              onClick={() =>
                setConfirm(
                  null
                )
              }
            >
              Batal
            </button>

            <button
              type="button"
              className="cpmku-room-button cpmku-room-danger"
              onClick={() =>
                deleteRoom(
                  confirm
                )
              }
              disabled={
                loading
              }
            >
              {loading
                ? 'Memproses...'
                : 'Hapus Room'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
