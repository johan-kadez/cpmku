import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useAuth
} from '../../context/AuthContext';

import {
  useNotifications
} from '../../context/NotificationContext';

import {
  useRooms
} from '../../hooks/useChat';

import ChatRoom from './ChatRoom';

import './TransactionChatFloat.css';

export default function TransactionChatFloat() {
  const {
    user,
    role
  } = useAuth();

  const rooms =
    useRooms();

  const {
    showToast
  } = useNotifications();

  const [
    open,
    setOpen
  ] = useState(false);

  const initialized =
    useRef(false);

  const seenPendingRooms =
    useRef(new Set());

  const activeRoom =
    rooms.find(
      room =>
        room.status ===
        'in_transaction'
    ) || null;

  useEffect(() => {
    if (
      !user ||
      role === 'admin'
    ) {
      initialized.current =
        false;

      seenPendingRooms.current.clear();

      return;
    }

    const pendingRooms =
      rooms.filter(
        room =>
          room.status ===
            'in_transaction' &&
          room.sellerCalled !== true
      );

    if (
      !initialized.current
    ) {
      pendingRooms.forEach(
        room => {
          seenPendingRooms.current.add(
            room.id
          );
        }
      );

      initialized.current =
        true;

      return;
    }

    pendingRooms.forEach(
      room => {
        if (
          seenPendingRooms.current.has(
            room.id
          )
        ) {
          return;
        }

        seenPendingRooms.current.add(
          room.id
        );

        showToast(
          'Pesanan sedang ditinjau admin',
          `Pesanan ${
            room.productId || ''
          } sedang ditinjau admin. Tunggu sampai pesanan disetujui.`
        );
      }
    );
  }, [
    rooms,
    role,
    showToast,
    user
  ]);

  useEffect(() => {
    if (!activeRoom) {
      setOpen(false);
    }
  }, [
    activeRoom
  ]);

  if (
    !user ||
    role === 'admin' ||
    !activeRoom
  ) {
    return null;
  }

  if (open) {
    return (
      <div className="floating-chat-panel-wrap">
        <div className="floating-chat-panel">
          <ChatRoom
            room={activeRoom}
            floating
            onClose={() =>
              setOpen(false)
            }
          />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="floating-chat-button"
      onClick={() =>
        setOpen(true)
      }
      aria-label="Buka obrolan transaksi"
      title="Buka obrolan transaksi"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M20 11.5a8 8 0 0 1-8 8 8.9 8.9 0 0 1-3.5-.7L4 20l1.3-3.4A8 8 0 1 1 20 11.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>

      <span className="floating-chat-badge">
        CHAT
      </span>
    </button>
  );
}
