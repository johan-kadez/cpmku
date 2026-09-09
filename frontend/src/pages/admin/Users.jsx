import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function Users() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      const r = await api('/admin/users');
      setRows(r.items || []);
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const ban = async (uid, banned) => {
    try {
      await api(`/admin/users/${uid}`, {
        method: 'PATCH',
        body: JSON.stringify({ banned })
      });

      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const setRole = async (uid, role) => {
    try {
      await api(`/admin/users/${uid}`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });

      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section>
      <div className="section-head">
        <h2>Users</h2>
        <button onClick={load}>Refresh</button>
      </div>

      <div className="admin-table">
        {rows.map(r => (
          <article key={r.id}>
            <b>{r.name || r.email || r.id}</b>

            <span>
              {r.banned ? 'BANNED' : 'ACTIVE'}
            </span>

            <div>
              <button
                onClick={() => ban(r.id, !r.banned)}
              >
                {r.banned ? 'Unban' : 'Ban'}
              </button>

              <button
                onClick={() => setRole(r.id, 'seller')}
              >
                Jadikan Seller
              </button>

              <button
                onClick={() => setRole(r.id, 'buyer')}
              >
                Jadikan Buyer
              </button>
            </div>
          </article>
        ))}

        {!rows.length && (
          <div className="state">
            Belum ada profil user tersimpan.
          </div>
        )}
      </div>
    </section>
  );
}
