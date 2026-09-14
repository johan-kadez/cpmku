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

  const rooms = useRooms();

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
          'in_transaction' &&
        room.sellerCalled === true
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
      <span>💬</span>
    </button>
  );
}
