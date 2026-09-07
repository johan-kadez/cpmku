import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);

  const fetchUsers = () => {
    api('/admin/users')
      .then((res) => setUsers(res.items || []))
      .catch((err) => alert(err.message));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBan = async (id, banned) => {
    try {
      await api(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ banned }),
      });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const changeRole = async (id, role) => {
    try {
      await api(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section>
      <div className="section-head">
        <h2>Users</h2>
        <button onClick={fetchUsers}>Refresh</button>
      </div>
      <div className="admin-table">
        {users.map((u) => (
          <article key={u.id}>
            <b>{u.name || u.email || u.id}</b>
            <span>{u.banned ? 'BANNED' : 'ACTIVE'}</span>
            <div>
              <button onClick={() => toggleBan(u.id, !u.banned)}>
                {u.banned ? 'Unban' : 'Ban'}
              </button>
              <button onClick={() => changeRole(u.id, 'seller')}>
                Jadikan Seller
              </button>
              <button onClick={() => changeRole(u.id, 'buyer')}>
                Jadikan Buyer
              </button>
            </div>
          </article>
        ))}
        {!users.length && (
          <div className="state">Belum ada profil user tersimpan.</div>
        )}
      </div>
    </section>
  );
}
