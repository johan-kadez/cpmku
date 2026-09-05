import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      setError('');
      const r = await api('/admin/rooms');
      setRooms(r.items || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const call = async id => {
    try {
      await api(`/rooms/${id}/call-seller`, { method: 'POST' });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section>
      <div className="section-head">
        <h2>Room Transaksi</h2>
        <button onClick={load}>Refresh</button>
      </div>
      {error && <div className="notice error">{error}</div>}
      <div className="admin-table">
        {rooms.map(r => (
          <article key={r.id}>
            <b>#{r.productId}</b>
            <span>{r.status}</span>
            <div>
              <button onClick={() => navigate(`/chat/${r.id}`)}>Buka Chat</button>
              {r.status === 'in_transaction' && (
                <button onClick={() => call(r.id)}>{r.sellerCalled ? 'Panggil Lagi' : 'Panggil Seller'}</button>
              )}
            </div>
          </article>
        ))}
        {!rooms.length && !error && <div className="state">Tidak ada room.</div>}
      </div>
    </section>
  );
}
