import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');

      const r = await api('/admin/users');

      setRows(
        Array.isArray(r.items)
          ? r.items
          : []
      );
    } catch (e) {
      setError(
        e.message ||
          'Gagal memuat users.'
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateUser = async (
    uid,
    payload,
    action
  ) => {
    if (!uid || busy) {
      return;
    }

    try {
      setBusy(
        `${uid}:${action}`
      );

      setError('');

      await api(
        `/admin/users/${encodeURIComponent(uid)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload)
        }
      );

      await load();
    } catch (e) {
      setError(
        e.message ||
          'Aksi user gagal.'
      );
    } finally {
      setBusy('');
    }
  };

  const ban = (
    uid,
    banned
  ) => {
    return updateUser(
      uid,
      {
        banned
      },
      banned
        ? 'ban'
        : 'unban'
    );
  };

  const setRole = (
    uid,
    role
  ) => {
    return updateUser(
      uid,
      {
        role
      },
      role
    );
  };

  return (
    <section>
      <div className="section-head">
        <h2>Users</h2>

        <button
          type="button"
          onClick={load}
          disabled={Boolean(busy)}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <div className="admin-table">
        {rows.map((r) => {
          const id =
            r.uid ||
            r.id;

          const action =
            busy.startsWith(
              `${id}:`
            )
              ? busy.slice(
                  `${id}:`.length
                )
              : '';

          return (
            <article key={id}>
              <b>
                {r.name ||
                  r.email ||
                  id}
              </b>

              <span>
                {r.banned
                  ? 'BANNED'
                  : 'ACTIVE'}
              </span>

              <div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    ban(
                      id,
                      !r.banned
                    );
                  }}
                  disabled={Boolean(busy)}
                >
                  {action === 'ban' ||
                  action === 'unban'
                    ? 'Memproses...'
                    : r.banned
                      ? 'Unban'
                      : 'Ban'}
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    setRole(
                      id,
                      'seller'
                    );
                  }}
                  disabled={Boolean(busy)}
                >
                  {action === 'seller'
                    ? 'Memproses...'
                    : 'Jadikan Seller'}
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    setRole(
                      id,
                      'buyer'
                    );
                  }}
                  disabled={Boolean(busy)}
                >
                  {action === 'buyer'
                    ? 'Memproses...'
                    : 'Jadikan Buyer'}
                </button>
              </div>
            </article>
          );
        })}

        {!rows.length &&
          !error && (
            <div className="state">
              Belum ada profil user
              tersimpan saat ini.
            </div>
          )}
      </div>
    </section>
  );
}
