import { useEffect, useState } from 'react';
import { api } from '../../services/api';

function getRoleLabel(role) {
  if (role === 'admin') {
    return 'Admin';
  }

  if (role === 'seller') {
    return 'Seller';
  }

  return 'Buyer';
}

function getStatusLabel(banned) {
  return banned ? 'Banned' : 'Aktif';
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  let date;

  if (
    typeof value === 'object' &&
    value.seconds
  ) {
    date = new Date(
      Number(value.seconds) * 1000
    );
  } else {
    date = new Date(value);
  }

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  ).format(date);
}

export default function Users() {
  const [
    rows,
    setRows
  ] = useState([]);

  const [
    busy,
    setBusy
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  const [
    notice,
    setNotice
  ] = useState(null);

  const [
    expandedId,
    setExpandedId
  ] = useState('');

  const [
    confirmAction,
    setConfirmAction
  ] = useState(null);

  const load = async () => {
    try {
      setError('');

      const response =
        await api(
          '/admin/users'
        );

      setRows(
        Array.isArray(
          response.items
        )
          ? response.items
          : []
      );
    } catch (e) {
      setError(
        e.message ||
          'Gagal memuat data user.'
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateUser = async (
    user,
    payload,
    action,
    successMessage
  ) => {
    const uid =
      user.uid ||
      user.id;

    if (
      !uid ||
      busy
    ) {
      return;
    }

    try {
      setBusy(
        `${uid}:${action}`
      );

      setError('');
      setNotice(null);

      await api(
        `/admin/users/${encodeURIComponent(uid)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(
            payload
          )
        }
      );

      await load();

      setNotice({
        type: 'success',
        message:
          successMessage
      });
    } catch (e) {
      setError(
        e.message ||
          'Aksi user gagal.'
      );
    } finally {
      setBusy('');
    }
  };

  const requestBan = (
    user
  ) => {
    const uid =
      user.uid ||
      user.id;

    if (!uid) {
      return;
    }

    if (
      user.role === 'admin'
    ) {
      setError(
        'Akun admin utama tidak dapat diubah.'
      );
      return;
    }

    const nextBanned =
      !Boolean(
        user.banned
      );

    setConfirmAction({
      type: nextBanned
        ? 'ban'
        : 'unban',
      user,
      payload: {
        banned:
          nextBanned
      },
      message:
        nextBanned
          ? `Yakin ingin memban ${user.name || user.email || uid}?`
          : `Yakin ingin membuka ban ${user.name || user.email || uid}?`,
      successMessage:
        nextBanned
          ? 'User berhasil diban.'
          : 'Ban user berhasil dibuka.'
    });
  };

  const requestRole = (
    user,
    role
  ) => {
    const uid =
      user.uid ||
      user.id;

    if (!uid) {
      return;
    }

    if (
      user.role === 'admin'
    ) {
      setError(
        'Role akun admin utama tidak dapat diubah.'
      );
      return;
    }

    if (
      user.role === role
    ) {
      return;
    }

    const roleLabel =
      role === 'seller'
        ? 'Seller'
        : 'Buyer';

    setConfirmAction({
      type: 'role',
      user,
      payload: {
        role
      },
      message:
        `Yakin ingin mengubah ${user.name || user.email || uid} menjadi ${roleLabel}?`,
      successMessage:
        `User berhasil diubah menjadi ${roleLabel}.`
    });
  };

  const executeConfirm = async () => {
    if (
      !confirmAction ||
      busy
    ) {
      return;
    }

    const {
      user,
      payload,
      type,
      successMessage
    } = confirmAction;

    setConfirmAction(null);

    await updateUser(
      user,
      payload,
      type,
      successMessage
    );
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>User</h2>

          <p>
            Kelola akun buyer,
            seller, dan status
            pengguna CPMKU.
          </p>
        </div>

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

      {notice && (
        <div
          className={`notice ${
            notice.type === 'error'
              ? 'error'
              : 'success'
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="admin-manage-list">
        {rows.map((user) => {
          const id =
            user.uid ||
            user.id;

          const isAdmin =
            user.role ===
              'admin' ||
            user.isAdmin === true;

          const isExpanded =
            expandedId === id;

          const currentBusy =
            busy.startsWith(
              `${id}:`
            );

          return (
            <article
              key={id}
              className="admin-manage-card"
            >
              <div className="admin-manage-card-head">
                <div>
                  <strong>
                    {user.name ||
                      user.displayName ||
                      user.email ||
                      'User'}
                  </strong>

                  <span>
                    {user.email ||
                      'Email belum tersedia'}
                  </span>
                </div>

                <div>
                  <span>
                    {getRoleLabel(
                      user.role
                    )}
                  </span>

                  <span>
                    {getStatusLabel(
                      user.banned
                    )}
                  </span>
                </div>
              </div>

              <div className="admin-manage-card-meta">
                <div>
                  <small>
                    Nomor HP
                  </small>

                  <b>
                    {user.phone ||
                      user.phoneNumber ||
                      '-'}
                  </b>
                </div>

                <div>
                  <small>
                    UID
                  </small>

                  <b>
                    {id}
                  </b>
                </div>

                <div>
                  <small>
                    Dibuat
                  </small>

                  <b>
                    {formatDate(
                      user.createdAt
                    )}
                  </b>
                </div>
              </div>

              {isExpanded && (
                <div className="admin-detail-panel">
                  <div>
                    <small>
                      Nama
                    </small>

                    <strong>
                      {user.name ||
                        user.displayName ||
                        '-'}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Email
                    </small>

                    <strong>
                      {user.email ||
                        '-'}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Nomor HP
                    </small>

                    <strong>
                      {user.phone ||
                        user.phoneNumber ||
                        '-'}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Role
                    </small>

                    <strong>
                      {getRoleLabel(
                        user.role
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Status
                    </small>

                    <strong>
                      {getStatusLabel(
                        user.banned
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>
                      UID
                    </small>

                    <strong>
                      {id}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Dibuat
                    </small>

                    <strong>
                      {formatDate(
                        user.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Diperbarui
                    </small>

                    <strong>
                      {formatDate(
                        user.updatedAt
                      )}
                    </strong>
                  </div>
                </div>
              )}

              <div className="admin-manage-card-actions">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(
                      isExpanded
                        ? ''
                        : id
                    );
                  }}
                  disabled={Boolean(busy)}
                >
                  {isExpanded
                    ? 'Tutup Detail'
                    : 'Detail User'}
                </button>

                {!isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        requestBan(
                          user
                        );
                      }}
                      disabled={Boolean(busy)}
                    >
                      {currentBusy &&
                      (
                        busy.endsWith(
                          ':ban'
                        ) ||
                        busy.endsWith(
                          ':unban'
                        )
                      )
                        ? 'Memproses...'
                        : user.banned
                          ? 'Unban'
                          : 'Ban'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        requestRole(
                          user,
                          'seller'
                        );
                      }}
                      disabled={
                        Boolean(busy) ||
                        user.role ===
                          'seller'
                      }
                    >
                      {currentBusy &&
                      busy.endsWith(
                        ':role'
                      )
                        ? 'Memproses...'
                        : 'Jadikan Seller'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        requestRole(
                          user,
                          'buyer'
                        );
                      }}
                      disabled={
                        Boolean(busy) ||
                        user.role ===
                          'buyer'
                      }
                    >
                      {currentBusy &&
                      busy.endsWith(
                        ':role'
                      )
                        ? 'Memproses...'
                        : 'Jadikan Buyer'}
                    </button>
                  </>
                )}

                {isAdmin && (
                  <span>
                    Admin utama
                  </span>
                )}
              </div>
            </article>
          );
        })}

        {!rows.length &&
          !error && (
            <div className="state">
              Belum ada user
              tersimpan saat ini.
            </div>
          )}
      </div>

      {confirmAction && (
        <div
          className="admin-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (!busy) {
              setConfirmAction(
                null
              );
            }
          }}
        >
          <div
            className="admin-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-confirm-title"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <h3 id="user-confirm-title">
              Konfirmasi
            </h3>

            <p>
              {confirmAction.message}
            </p>

            <div>
              <button
                type="button"
                onClick={() => {
                  setConfirmAction(
                    null
                  );
                }}
                disabled={Boolean(busy)}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  executeConfirm
                }
                disabled={Boolean(busy)}
              >
                {busy
                  ? 'Memproses...'
                  : 'Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
