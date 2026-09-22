import {
  useEffect,
  useState
} from 'react';

import {
  api
} from '../../services/api';

function getPhoto(
  user
) {
  return (
    user?.photoUrl ||
    user?.photoURL ||
    user?.photo ||
    ''
  );
}

function Modal({
  children,
  onClose
}) {
  return (
    <div
      className="cpmku-user-modal-bg"
      onMouseDown={
        onClose
      }
    >
      <div
        className="cpmku-user-modal"
        onMouseDown={event =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="cpmku-user-close"
          onClick={
            onClose
          }
        >
          ×
        </button>

        {children}
      </div>
    </div>
  );
}

export default function Users() {
  const [
    users,
    setUsers
  ] = useState([]);

  const [
    error,
    setError
  ] = useState('');

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    selected,
    setSelected
  ] = useState(null);

  const [
    confirm,
    setConfirm
  ] = useState(null);

  const [
    editing,
    setEditing
  ] = useState(null);

  const [
    editName,
    setEditName
  ] = useState('');

  const [
    editPhone,
    setEditPhone
  ] = useState('');

  const load =
    async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await api(
            '/admin/users'
          );

        setUsers(
          Array.isArray(
            response?.items
          )
            ? response.items
            : []
        );
      } catch (
        requestError
      ) {
        setError(
          requestError?.message ||
          'Gagal memuat user.'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    load();
  }, []);

  const ban =
    async user => {
      const uid =
        user?.id ||
        user?.uid;

      if (
        !uid ||
        user.role === 'admin'
      ) {
        return;
      }

      try {
        setLoading(true);
        setConfirm(null);

        await api(
          `/admin/users/${encodeURIComponent(uid)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              banned:
                !Boolean(
                  user.banned
                ),

              uid,
              userId:
                user?.id || '',
              email:
                user?.email || ''
            })
          }
        );

        setSelected(null);

        await load();
      } catch (
        actionError
      ) {
        setError(
          actionError?.message ||
          'Gagal mengubah status user.'
        );
      } finally {
        setLoading(false);
      }
    };

  const openEdit =
    user => {
      if (
        !user ||
        user.role !== 'seller'
      ) {
        return;
      }

      setEditing(user);

      setEditName(
        user.name ||
        user.displayName ||
        ''
      );

      setEditPhone(
        user.phone ||
        user.phoneNumber ||
        ''
      );
    };

  const closeEdit =
    () => {
      if (loading) {
        return;
      }

      setEditing(null);
      setEditName('');
      setEditPhone('');
    };

  const saveEdit =
    async () => {
      const uid =
        editing?.id ||
        editing?.uid;

      const name =
        String(
          editName || ''
        ).trim();

      const phone =
        String(
          editPhone || ''
        ).trim();

      if (!uid) {
        setError(
          'UID seller tidak ditemukan.'
        );
        return;
      }

      if (!name) {
        setError(
          'Nama seller wajib diisi.'
        );
        return;
      }

      try {
        setLoading(true);
        setError('');

        await api(
          `/admin/users/${encodeURIComponent(uid)}`,
          {
            method: 'PATCH',

            body: JSON.stringify({
              name,
              phone,

              uid:
                editing?.id ||
                editing?.uid ||
                '',

              userId:
                editing?.id ||
                '',

              id:
                editing?.id ||
                '',

              email:
                editing?.email ||
                ''
            })
          }
        );

        setEditing(null);
        setEditName('');
        setEditPhone('');
        setSelected(null);

        await load();
      } catch (
        actionError
      ) {
        setError(
          actionError?.message ||
          'Gagal mengubah informasi seller.'
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <section>
      <style>
        {`
          .cpmku-users-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .cpmku-user-card {
            min-width: 0;
            box-sizing: border-box;
            padding: 20px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 22px;
            background: rgba(20,20,20,.72);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.03),
              0 12px 35px rgba(0,0,0,.16);
          }

          .cpmku-user-card-top {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
          }

          .cpmku-user-avatar {
            flex: 0 0 auto;
            width: 58px;
            height: 58px;
            object-fit: cover;
            border-radius: 18px;
            border: 1px solid rgba(65,125,255,.4);
            background: rgba(24,35,57,.8);
          }

          .cpmku-user-avatar-empty {
            flex: 0 0 auto;
            width: 58px;
            height: 58px;
            display: grid;
            place-items: center;
            border-radius: 18px;
            border: 1px solid rgba(65,125,255,.3);
            background: rgba(24,35,57,.8);
            color: #4b8dff;
            font-size: 23px;
          }

          .cpmku-user-card-info {
            min-width: 0;
          }

          .cpmku-user-name {
            overflow: hidden;
            color: #fff;
            font-size: 17px;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .cpmku-user-email {
            margin-top: 5px;
            overflow: hidden;
            color: #8995aa;
            font-size: 13px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .cpmku-user-role {
            display: inline-flex;
            margin-top: 9px;
            padding: 5px 9px;
            border: 1px solid rgba(55,119,255,.32);
            border-radius: 9px;
            background: rgba(23,45,89,.48);
            color: #78a5ff;
            font-size: 11px;
            font-weight: 700;
          }

          .cpmku-user-status {
            display: inline-flex;
            margin-left: 6px;
            padding: 5px 9px;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 9px;
            background: rgba(255,255,255,.04);
            color: #a8b1c0;
            font-size: 11px;
            font-weight: 700;
          }

          .cpmku-user-status-banned {
            border-color: rgba(255,75,95,.35);
            background: rgba(100,36,51,.3);
            color: #ff8998;
          }

          .cpmku-user-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 18px;
          }

          .cpmku-user-button {
            min-height: 40px;
            padding: 9px 15px;
            border: 1px solid rgba(55,119,255,.5);
            border-radius: 13px;
            background: linear-gradient(
              180deg,
              #172d59,
              #10224a
            );
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          }

          .cpmku-user-button:hover {
            border-color: rgba(90,150,255,.8);
          }

          .cpmku-user-button:disabled {
            opacity: .55;
            cursor: not-allowed;
          }

          .cpmku-user-detail-button {
            flex: 1;
          }

          .cpmku-user-edit {
            border-color: rgba(55,119,255,.55);
            background: linear-gradient(
              180deg,
              #193b7b,
              #122b5d
            );
          }

          .cpmku-user-danger {
            border-color: rgba(255,75,95,.5);
            background: linear-gradient(
              180deg,
              #642433,
              #411723
            );
          }

          .cpmku-user-modal-bg {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.74);
            backdrop-filter: blur(12px);
          }

          .cpmku-user-modal {
            position: relative;
            width: min(520px,100%);
            max-height: 88vh;
            overflow-y: auto;
            padding: 26px;
            border: 1px solid rgba(50,115,255,.4);
            border-radius: 24px;
            background: rgba(11,16,27,.98);
            color: #fff;
            box-shadow: 0 25px 80px rgba(0,0,0,.55);
          }

          .cpmku-user-close {
            position: absolute;
            top: 14px;
            right: 14px;
            width: 42px;
            height: 42px;
            border: 1px solid rgba(70,125,255,.45);
            border-radius: 14px;
            background: rgba(23,43,78,.8);
            color: #fff;
            font-size: 28px;
            cursor: pointer;
          }

          .cpmku-user-photo {
            display: block;
            width: 130px;
            height: 130px;
            margin: 42px auto 22px;
            object-fit: cover;
            border-radius: 28px;
            border: 1px solid rgba(60,125,255,.45);
          }

          .cpmku-user-photo-empty {
            width: 130px;
            height: 130px;
            margin: 42px auto 22px;
            display: grid;
            place-items: center;
            border-radius: 28px;
            background: rgba(24,35,57,.8);
            color: #4b8dff;
            font-size: 44px;
          }

          .cpmku-user-detail {
            display: grid;
            gap: 13px;
          }

          .cpmku-user-detail-row {
            display: grid;
            gap: 4px;
            padding-bottom: 11px;
            border-bottom: 1px solid rgba(255,255,255,.07);
          }

          .cpmku-user-detail-row span {
            color: #8e9ab0;
            font-size: 13px;
          }

          .cpmku-user-detail-row strong {
            word-break: break-word;
          }

          .cpmku-user-modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 22px;
          }

          .cpmku-user-modal-actions .cpmku-user-button {
            flex: 1;
          }

          .cpmku-user-form {
            display: grid;
            gap: 16px;
            margin-top: 24px;
          }

          .cpmku-user-field {
            display: grid;
            gap: 7px;
          }

          .cpmku-user-field label {
            color: #8e9ab0;
            font-size: 13px;
            font-weight: 600;
          }

          .cpmku-user-field input {
            width: 100%;
            box-sizing: border-box;
            min-height: 46px;
            padding: 11px 14px;
            border: 1px solid rgba(75,125,220,.35);
            border-radius: 13px;
            outline: none;
            background: rgba(17,25,40,.92);
            color: #fff;
            font-size: 14px;
          }

          .cpmku-user-field input:focus {
            border-color: rgba(80,145,255,.85);
            box-shadow: 0 0 0 3px rgba(55,119,255,.12);
          }

          .cpmku-user-edit-note {
            margin: 0;
            color: #8995aa;
            font-size: 13px;
            line-height: 1.5;
          }

          @media(max-width:760px) {
            .cpmku-users-list {
              grid-template-columns: 1fr;
            }
          }

          @media(max-width:600px) {
            .cpmku-user-modal-actions {
              flex-direction: column;
            }
          }
        `}
      </style>

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
          className="cpmku-user-button"
          onClick={load}
          disabled={loading}
        >
          {loading
            ? 'Memuat...'
            : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <div className="cpmku-users-list">
        {users.map(
          user => {
            const id =
              user.id ||
              user.uid;

            const seller =
              user.role === 'seller';

            return (
              <article
                key={id}
                className="cpmku-user-card"
              >
                <div className="cpmku-user-card-top">
                  {getPhoto(user) ? (
                    <img
                      src={getPhoto(user)}
                      alt="Foto profil"
                      className="cpmku-user-avatar"
                    />
                  ) : (
                    <div className="cpmku-user-avatar-empty">
                      ◈
                    </div>
                  )}

                  <div className="cpmku-user-card-info">
                    <div className="cpmku-user-name">
                      {user.name ||
                        user.displayName ||
                        'User'}
                    </div>

                    <div className="cpmku-user-email">
                      {user.email || '-'}
                    </div>

                    <div>
                      <span className="cpmku-user-role">
                        {user.role === 'seller'
                          ? 'Seller'
                          : user.role === 'admin'
                            ? 'Admin'
                            : 'Buyer'}
                      </span>

                      <span
                        className={
                          user.banned
                            ? 'cpmku-user-status cpmku-user-status-banned'
                            : 'cpmku-user-status'
                        }
                      >
                        {user.banned
                          ? 'Banned'
                          : 'Aktif'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cpmku-user-actions">
                  <button
                    type="button"
                    className="cpmku-user-button cpmku-user-detail-button"
                    onClick={() =>
                      setSelected(user)
                    }
                  >
                    Detail
                  </button>

                  {seller && (
                    <button
                      type="button"
                      className="cpmku-user-button cpmku-user-edit"
                      onClick={() =>
                        openEdit(user)
                      }
                      disabled={loading}
                    >
                      Edit
                    </button>
                  )}

                  {user.role !== 'admin' && (
                    <button
                      type="button"
                      className="cpmku-user-button cpmku-user-danger"
                      onClick={() =>
                        setConfirm(user)
                      }
                      disabled={loading}
                    >
                      {user.banned
                        ? 'Unban'
                        : 'Ban'}
                    </button>
                  )}
                </div>
              </article>
            );
          }
        )}

        {!users.length && !error && (
          <div className="state">
            Tidak ada user.
          </div>
        )}
      </div>

      {selected && (
        <Modal
          onClose={() =>
            setSelected(null)
          }
        >
          {getPhoto(selected) ? (
            <img
              src={getPhoto(selected)}
              alt="Foto profil"
              className="cpmku-user-photo"
            />
          ) : (
            <div className="cpmku-user-photo-empty">
              ◈
            </div>
          )}

          <h3>Detail User</h3>

          <div className="cpmku-user-detail">
            <div className="cpmku-user-detail-row">
              <span>Nama</span>
              <strong>
                {selected.name ||
                  selected.displayName ||
                  '-'}
              </strong>
            </div>

            <div className="cpmku-user-detail-row">
              <span>Email</span>
              <strong>
                {selected.email || '-'}
              </strong>
            </div>

            <div className="cpmku-user-detail-row">
              <span>Role</span>
              <strong>
                {selected.role === 'seller'
                  ? 'Seller'
                  : selected.role === 'admin'
                    ? 'Admin'
                    : 'Buyer'}
              </strong>
            </div>

            {selected.role === 'seller' && (
              <div className="cpmku-user-detail-row">
                <span>Nomor</span>
                <strong>
                  {selected.phone ||
                    selected.phoneNumber ||
                    '-'}
                </strong>
              </div>
            )}

            <div className="cpmku-user-detail-row">
              <span>Status</span>
              <strong>
                {selected.banned
                  ? 'Banned'
                  : 'Aktif'}
              </strong>
            </div>
          </div>

          {selected.role === 'seller' && (
            <div className="cpmku-user-modal-actions">
              <button
                type="button"
                className="cpmku-user-button cpmku-user-edit"
                onClick={() => {
                  setSelected(null);
                  openEdit(selected);
                }}
                disabled={loading}
              >
                Edit
              </button>

              <button
                type="button"
                className="cpmku-user-button cpmku-user-danger"
                onClick={() =>
                  setConfirm(selected)
                }
                disabled={loading}
              >
                {selected.banned
                  ? 'Unban'
                  : 'Ban'}
              </button>
            </div>
          )}

          {selected.role === 'buyer' && (
            <div className="cpmku-user-modal-actions">
              <button
                type="button"
                className="cpmku-user-button cpmku-user-danger"
                onClick={() =>
                  setConfirm(selected)
                }
                disabled={loading}
              >
                {selected.banned
                  ? 'Unban'
                  : 'Ban'}
              </button>
            </div>
          )}
        </Modal>
      )}

      {editing && (
        <Modal onClose={closeEdit}>
          <h3>Edit Seller</h3>

          <p className="cpmku-user-edit-note">
            Admin dapat mengubah
            nama seller dan nomor
            telepon seller.
          </p>

          <div className="cpmku-user-form">
            <div className="cpmku-user-field">
              <label>Nama Seller</label>

              <input
                type="text"
                value={editName}
                onChange={event =>
                  setEditName(
                    event.target.value
                  )
                }
                placeholder="Nama seller"
                maxLength={80}
                disabled={loading}
              />
            </div>

            <div className="cpmku-user-field">
              <label>Nomor Telepon</label>

              <input
                type="tel"
                value={editPhone}
                onChange={event =>
                  setEditPhone(
                    event.target.value
                  )
                }
                placeholder="Nomor telepon"
                maxLength={25}
                disabled={loading}
              />
            </div>
          </div>

          <div className="cpmku-user-modal-actions">
            <button
              type="button"
              className="cpmku-user-button"
              onClick={closeEdit}
              disabled={loading}
            >
              Batal
            </button>

            <button
              type="button"
              className="cpmku-user-button cpmku-user-edit"
              onClick={saveEdit}
              disabled={loading}
            >
              {loading
                ? 'Menyimpan...'
                : 'Simpan'}
            </button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal
          onClose={() =>
            setConfirm(null)
          }
        >
          <h3>Konfirmasi</h3>

          <p>
            {confirm.banned
              ? 'Buka ban user ini?'
              : 'Ban user ini?'}
          </p>

          <div className="cpmku-user-modal-actions">
            <button
              type="button"
              className="cpmku-user-button"
              onClick={() =>
                setConfirm(null)
              }
              disabled={loading}
            >
              Batal
            </button>

            <button
              type="button"
              className="cpmku-user-button cpmku-user-danger"
              onClick={() =>
                ban(confirm)
              }
              disabled={loading}
            >
              {loading
                ? 'Memproses...'
                : 'Lanjutkan'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
