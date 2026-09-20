import {
  useEffect,
  useState
} from 'react';

import {
  api
} from '../../services/api';

import ChatRoom from '../../components/chat/ChatRoom';

function Modal({
  children,
  onClose,
  className = ''
}) {
  return (
    <div
      className={`cpmku-room-modal-bg ${className}`}
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
          aria-label="Tutup"
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

function shortText(
  value
) {
  const text =
    String(
      value || '-'
    );

  return text;
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
    selectedChat,
    setSelectedChat
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

  const prepareRoom =
    room => {
      const buyer =
        findUser(
          room.buyerUid
        );

      const seller =
        findUser(
          room.sellerUid
        );

      const buyerName =
        room.buyerName ||
        buyer?.name ||
        room.buyerUid ||
        '-';

      const productName =
        room.productName ||
        room.productTitle ||
        room.productId ||
        '-';

      const sellerName =
        room.sellerName ||
        seller?.name ||
        room.sellerUid ||
        '-';

      return {
        ...room,
        _buyerName:
          buyerName,
        _productName:
          productName,
        _sellerName:
          sellerName
      };
    };

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

        setSelectedChat(
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
            grid-template-columns: repeat(
              auto-fit,
              minmax(250px, 1fr)
            );
            gap: 18px;
          }

          .cpmku-room-card {
            width: 100%;
            min-width: 0;
            aspect-ratio: 1 / 1;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            padding: 22px;
            border: 1px solid rgba(55,119,255,.24);
            border-radius: 24px;
            background: rgba(15,20,32,.82);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.03),
              0 14px 40px rgba(0,0,0,.18);
          }

          .cpmku-room-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
            min-width: 0;
          }

          .cpmku-room-grid > div {
            min-width: 0;
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
            min-width: 0;
            margin-top: 6px;
            overflow: hidden;
            color: #fff;
            font-size: 17px;
            line-height: 1.35;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .cpmku-room-status {
            margin-top: auto;
            padding-top: 16px;
            color: #9aa6ba;
          }

          .cpmku-room-actions {
            display: grid;
            grid-template-columns: 1fr;
            gap: 9px;
            margin-top: 16px;
          }

          .cpmku-room-actions-top {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }

          .cpmku-room-button {
            width: 100%;
            min-height: 42px;
            padding: 10px 14px;
            border: 1px solid rgba(55,119,255,.5);
            border-radius: 13px;
            background:
              linear-gradient(
                180deg,
                #172d59,
                #10224a
              );
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }

          .cpmku-room-button:disabled {
            opacity: .55;
            cursor: not-allowed;
          }

          .cpmku-room-detail-button {
            width: 100%;
            display: block;
            box-sizing: border-box;
            text-align: center;
          }

          .cpmku-room-chat-button {
            border-color:
              rgba(80,145,255,.6);
            background:
              linear-gradient(
                180deg,
                #1c3b78,
                #142c5a
              );
          }

          .cpmku-room-danger {
            border-color: rgba(255,75,95,.5);
            background:
              linear-gradient(
                180deg,
                #642433,
                #411723
              );
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

          .cpmku-room-chat-modal-bg {
            padding: 12px;
          }

          .cpmku-room-chat-modal {
            width:
              min(
                760px,
                100%
              );

            height:
              min(
                88vh,
                760px
              );

            max-height:
              88vh;

            padding: 0;

            overflow: hidden;
          }

          .cpmku-room-chat-modal .chat-room {
            width: 100%;
            height: 100%;
            min-height: 0;

            border-radius: 24px;

            overflow: hidden;
          }

          .cpmku-room-chat-modal .chat-room > header {
            padding-right: 62px;
          }

          .cpmku-room-chat-modal .messages {
            min-height: 0;
            overflow-y: auto;
          }

          .cpmku-room-chat-modal .chat-composer {
            flex-shrink: 0;
          }

          .cpmku-room-close {
            position: absolute;
            top: 14px;
            right: 14px;
            z-index: 20;
            width: 42px;
            height: 42px;
            border: 1px solid rgba(70,125,255,.45);
            border-radius: 14px;
            background: rgba(23,43,78,.8);
            color: #fff;
            font-size: 28px;
            cursor: pointer;
          }

          .cpmku-room-modal h3 {
            margin: 8px 52px 24px 0;
            font-size: 24px;
          }

          .cpmku-room-detail {
            display: grid;
            gap: 13px;
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

          .cpmku-room-detail strong {
            color: #fff;
            line-height: 1.45;
            word-break: break-word;
          }

          @media(max-width:650px) {
            .cpmku-room-list {
              grid-template-columns: 1fr;
            }

            .cpmku-room-card {
              aspect-ratio: 1 / 1;
              min-height: 0;
            }

            .cpmku-room-actions-top {
              grid-template-columns: 1fr 1fr;
            }

            .cpmku-room-chat-modal-bg {
              padding: 8px;
            }

            .cpmku-room-chat-modal {
              width: 100%;
              height: 92vh;
              max-height: 92vh;
              border-radius: 20px;
            }

            .cpmku-room-chat-modal .chat-room {
              border-radius: 20px;
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
            const preparedRoom =
              prepareRoom(
                room
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

                    <strong
                      title={
                        shortText(
                          preparedRoom._buyerName
                        )
                      }
                    >
                      {shortText(
                        preparedRoom._buyerName
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Produk
                    </span>

                    <strong
                      title={
                        shortText(
                          preparedRoom._productName
                        )
                      }
                    >
                      {shortText(
                        preparedRoom._productName
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Seller
                    </span>

                    <strong
                      title={
                        shortText(
                          preparedRoom._sellerName
                        )
                      }
                    >
                      {shortText(
                        preparedRoom._sellerName
                      )}
                    </strong>
                  </div>
                </div>

                <div className="cpmku-room-status">
                  Status:{' '}
                  {label(
                    room.status
                  )}
                </div>

                <div className="cpmku-room-actions">
                  <div className="cpmku-room-actions-top">
                    <button
                      type="button"
                      className="cpmku-room-button cpmku-room-detail-button"
                      onClick={() =>
                        setSelected(
                          preparedRoom
                        )
                      }
                    >
                      Detail
                    </button>

                    <button
                      type="button"
                      className="cpmku-room-button cpmku-room-chat-button"
                      onClick={() =>
                        setSelectedChat(
                          preparedRoom
                        )
                      }
                    >
                      Chat
                    </button>
                  </div>

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
                {
                  selected._buyerName ||
                  selected.buyerName ||
                  findUser(
                    selected.buyerUid
                  )?.name ||
                  selected.buyerUid ||
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
                  selected._productName ||
                  selected.productName ||
                  selected.productTitle ||
                  selected.productId ||
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
                  selected._sellerName ||
                  selected.sellerName ||
                  findUser(
                    selected.sellerUid
                  )?.name ||
                  selected.sellerUid ||
                  '-'
                }
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

            <div>
              <span>
                Room ID
              </span>

              <strong>
                {
                  selected.id ||
                  '-'
                }
              </strong>
            </div>
          </div>
        </Modal>
      )}

      {selectedChat && (
        <Modal
          className="cpmku-room-chat-modal-bg"
          onClose={() =>
            setSelectedChat(
              null
            )
          }
        >
          <div className="cpmku-room-chat-modal">
            <ChatRoom
              room={
                selectedChat
              }
              floating={false}
              onClose={() =>
                setSelectedChat(
                  null
                )
              }
            />
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
