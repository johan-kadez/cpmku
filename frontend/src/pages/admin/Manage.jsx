import { useEffect, useState } from 'react';
import { api } from '../../services/api';

const ACTIONS = {
  sellers: [['approved', 'Approve'], ['rejected', 'Reject']],
  products: [['approved', 'Approve'], ['rejected', 'Reject']],
  orders: [['cancelled', 'Batalkan']],
  payments: [['verified', 'Verifikasi'], ['rejected', 'Tolak']]
};

export default function Manage({ type, title }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      setError('');
      const r = await api(`/admin/${type}`);
      setRows(r.items || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, [type]);

  const action = async (id, status) => {
    if (type === 'orders' && !window.confirm('Batalkan transaksi ini?')) return;
    try {
      await api(`/admin/${type}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section>
      <div className="section-head">
        <h2>{title}</h2>
        <button onClick={load}>Refresh</button>
      </div>
      {error && <div className="notice error">{error}</div>}
      <div className="admin-table">
        {rows.map(r => (
          <article key={r.id}>
            <b>{r.name || r.title || r.productId || r.orderId || r.id}</b>
            <span>{r.status}</span>
            <div>
              {(ACTIONS[type] || []).map(([status, label]) => (
                <button key={status} onClick={() => action(r.id, status)}>{label}</button>
              ))}
            </div>
          </article>
        ))}
        {!rows.length && !error && <div className="state">Tidak ada data.</div>}
      </div>
    </section>
  );
}
