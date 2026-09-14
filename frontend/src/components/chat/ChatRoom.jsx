import {
  useEffect,
  useState
} from 'react';

import {
  doc,
  onSnapshot
} from 'firebase/firestore';

import {
  db
} from '../../services/firebase';

import {
  useAuth
} from '../../context/AuthContext';

import {
  useNotifications
} from '../../context/NotificationContext';

import {
  useChat
} from '../../hooks/useChat';

import {
  api
} from '../../services/api';

import Modal from '../common/Modal';

import {
  PAYMENT_CONFIG
} from '../../config/payment';

export default function ChatRoom({
  room,
  floating = false,
  onClose
}) {
  const {
    user,
    role
  } = useAuth();

  const {
    showToast
  } = useNotifications();

  const {
    messages,
    send,
    error
  } = useChat(
    room?.id
  );

  const [
    text,
    setText
  ] = useState('');

  const [
    qris,
    setQris
  ] = useState(false);

  const [
    qrisUrl,
    setQrisUrl
  ] = useState(
    PAYMENT_CONFIG.qrisUrl
  );

  useEffect(
    () =>
      onSnapshot(
        doc(
          db,
          'settings',
          'main'
        ),
        snap => {
          if (
            snap.exists()
          ) {
            setQrisUrl(
              snap.data()
                .qrisUrl || ''
            );
          }
        }
      ),
    []
  );

  if (!room) {
    return null;
  }

  const submit = async event => {
    event.preventDefault();

    const value =
      text.trim();

    if (!value) {
      return;
    }

    try {
      await send(value);

      setText('');
    } catch (error) {
      showToast(
        'Pesan gagal dikirim',
        error?.message ||
          'Terjadi kesalahan saat mengirim pesan.'
      );
    }
  };

  const done =
    async () => {
      if (
        role !== 'buyer' ||
        room.status !==
          'in_transaction'
      ) {
        return;
      }

      try {
        await api(
          `/orders/${room.orderId}/done`,
          {
            method:
              'POST'
          }
        );

        showToast(
          'Transaksi selesai',
          'Transaksi berhasil diselesaikan.'
        );
      } catch (error) {
        showToast(
          'Transaksi gagal diselesaikan',
          error?.message ||
            'Terjadi kesalahan.'
        );
      }
    };

  return (
    <section
      className={
        floating
          ? 'chat-room floating-chat-room'
          : 'chat-room'
      }
    >
      <header>
        <div>
          <b>
            Transaksi #
            {
              room.productId
            }
          </b>

          {!floating && (
            <small>
              Buyer + Seller + Admin
            </small>
          )}
        </div>

        <div className="chat-header-actions">
          {!floating && (
            <button
              type="button"
              onClick={() =>
                setQris(true)
              }
            >
              Lihat QRIS
            </button>
          )}

          {floating && (
            <button
              type="button"
              className="chat-close-button"
              onClick={onClose}
              aria-label="Tutup chat"
            >
              ×
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <div className="messages">
        {messages.map(
          message => {
            const messageRole =
              message.role ||
              message.senderRole ||
              'buyer';

            return (
              <div
                className={
                  `msg ${
                    message.senderUid ===
                    user?.uid
                      ? 'mine'
                      : ''
                  }`
                }
                key={
                  message.id
                }
              >
                <b>
                  {
                    message.senderName
                  }{' '}
                  <small>
                    •{' '}
                    {
                      messageRole
                    }
                  </small>
                </b>

                <p>
                  {
                    message.body
                  }
                </p>
              </div>
            );
          }
        )}
      </div>

      {role ===
        'buyer' &&
        room.status ===
          'in_transaction' && (
          <div className="chat-actions">
            <button
              type="button"
              onClick={done}
            >
              DONE
            </button>
          </div>
        )}

      <form
        onSubmit={submit}
      >
        <input
          value={text}
          onChange={event =>
            setText(
              event.target.value
            )
          }
          placeholder="Tulis pesan..."
        />

        <button type="submit">
          Kirim
        </button>
      </form>

      {qris && (
        <Modal
          title={
            `Bayar Produk ${
              room.productId
            }`
          }
          onClose={() =>
            setQris(false)
          }
        >
          <p className="center">
            Masukkan{' '}
            <b>
              {
                room.productId
              }
            </b>{' '}
            sebagai keterangan
            pembayaran.
          </p>

          {qrisUrl ? (
            <img
              className="qris"
              src={qrisUrl}
              alt="QRIS utama"
            />
          ) : (
            <div className="notice error">
              QRIS belum
              dikonfigurasi admin.
            </div>
          )}

          <p>
            {
              PAYMENT_CONFIG.note
            }
          </p>
        </Modal>
      )}
    </section>
  );
}
