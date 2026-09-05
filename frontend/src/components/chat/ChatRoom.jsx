import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import { PAYMENT_CONFIG } from '../../config/payment';

export default function ChatRoom({ room }) {
  const { user, role } = useAuth();
  const { messages, send, error } = useChat(room?.id);
  const [text, setText] = useState('');
  const [qris, setQris] = useState(false);
  const [qrisUrl, setQrisUrl] = useState(PAYMENT_CONFIG.qrisUrl);

  useEffect(() => onSnapshot(
    doc(db, 'settings', 'main'),
    snap => { if (snap.exists()) setQrisUrl(snap.data().qrisUrl || ''); }
  ), []);

  if (!room) return <div className="state">Pilih ruang chat.</div>;

  const submit = async e => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    try {
      await send(value);
      setText('');
    } catch (e) {
      alert(e.message);
    }
  };

  const done = async () => {
    if (role !== 'buyer' || room.status !== 'in_transaction') return;
    try {
      await api(`/orders/${room.orderId}/done`, { method: 'POST' });
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section className="chat-room">
      <header>
        <div>
          <b>Transaksi #{room.productId}</b>
          <small>Buyer + Seller + Admin</small>
        </div>
        <button onClick={() => setQris(true)}>Lihat QRIS</button>
      </header>

      {error && <div className="notice error">{error}</div>}

      <div className="messages">
        {messages.map(m => (
          <div className={`msg ${m.senderUid === user?.uid ? 'mine' : ''}`} key={m.id}>
            <b>{m.senderName} <small>• {m.role}</small></b>
            <p>{m.body}</p>
          </div>
        ))}
      </div>

      {role === 'buyer' && room.status === 'in_transaction' && (
        <div className="chat-actions">
          <button onClick={done}>DONE</button>
        </div>
      )}

      <form onSubmit={submit}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Tulis pesan..." />
        <button type="submit">Kirim</button>
      </form>

      {qris && (
        <Modal title={`Bayar Produk ${room.productId}`} onClose={() => setQris(false)}>
          <p className="center">Masukkan <b>{room.productId}</b> sebagai keterangan pembayaran.</p>
          {qrisUrl
            ? <img className="qris" src={qrisUrl} alt="QRIS utama" />
            : <div className="notice error">QRIS belum dikonfigurasi admin.</div>}
          <p>{PAYMENT_CONFIG.note}</p>
        </Modal>
      )}
    </section>
  );
}
