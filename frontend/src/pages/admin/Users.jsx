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

  const load =
    async () => {
      try {
        setLoading(
          true
        );

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
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    load();
  }, []);

  const ban =
    async user => {
      const uid =
        user?.uid ||
        user?.id;

      if (
        !uid ||
        user.role ===
          'admin'
      ) {
        return;
      }

      try {
        setLoading(
          true
        );

        setConfirm(
          null
        );

        await api(
          `/admin/users/${encodeURIComponent(uid)}`,
          {
            method:
              'PATCH',

            body:
              JSON.stringify({
                banned:
                  !Boolean(
                    user.banned
                  )
              })
          }
        );

        setSelected(
          null
        );

        await load();
      } catch (
        actionError
      ) {
        setError(
          actionError?.message ||
          'Gagal mengubah status user.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  return (
    <section>
      <style>
        {`
          .cpmku-users-list {
            display: grid;
            gap: 14px;
          }

          .cpmku-user-card {
            width: 100%;
            box-sizing: border-box;
            padding: 22px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 22px;
            background: rgba(20,20,20,.72);
          }

          .cpmku-user-name {
            text-align: center;
            color: #fff;
            font-size: 21px;
            font-weight: 700;
          }

          .cpmku-user-actions {
            display: flex;
            justify-content: center;
            margin-top: 16px;
          }

          .cpmku-user-button {
            min-height: 42px;
            padding: 10px 20px;
            border: 1px solid rgba(55,119,255,.5);
            border-radius: 13px;
            background: linear-gradient(180deg,#172d59,#10224a);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
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

          .cpmku-user-danger {
            border-color: rgba(255,75,95,.5);
            background: linear-gradient(180deg,#642433,#411723);
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
          <h2>
            User
          </h2>

          <p>
            Kelola akun buyer,
            seller, dan status
            pengguna CPMKU.
          </p>
        </div>

        <button
          type="button"
          className="cpmku-user-button"
          onClick={
            load
          }
          disabled={
            loading
          }
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
              user.uid ||
              user.id;

            return (
              <article
                key={id}
                className="cpmku-user-card"
              >
                <div className="cpmku-user-name">
                  {user.name ||
                    user.displayName ||
                    'User'}
                </div>

                <div className="cpmku-user-actions">
                  <button
                    type="button"
                    className="cpmku-user-button"
                    onClick={() =>
                      setSelected(
                        user
                      )
                    }
                  >
                    Detail
                  </button>
                </div>
              </article>
            );
          }
        )}

        {!users.length &&
          !error && (
            <div className="state">
              Tidak ada user.
            </div>
          )}
      </div>

      {selected && (
        <Modal
          onClose={() =>
            setSelected(
              null
            )
          }
        >
          {getPhoto(
            selected
          ) ? (
            <img
              src={getPhoto(
                selected
              )}
              alt="Foto profil"
              className="cpmku-user-photo"
            />
          ) : (
            <div className="cpmku-user-photo-empty">
              ◈
            </div>
          )}

          <h3>
            Detail User
          </h3>

          <div className="cpmku-user-detail">
            <div className="cpmku-user-detail-row">
              <span>
                Nama
              </span>
              <strong>
                {selected.name ||
                  selected.displayName ||
                  '-'}
              </strong>
            </div>

            <div className="cpmku-user-detail-row">
              <span>
                Email
              </span>
              <strong>
                {selected.email ||
                  '-'}
              </strong>
            </div>

            <div className="cpmku-user-detail-row">
              <span>
                Role
              </span>
              <strong>
                {selected.role ===
                'seller'
                  ? 'Seller'
                  : selected.role ===
                      'admin'
                    ? 'Admin'
                    : 'Buyer'}
              </strong>
            </div>

            {selected.role ===
              'seller' && (
              <div className="cpmku-user-detail-row">
                <span>
                  Nomor
                </span>
                <strong>
                  {selected.phone ||
                    selected.phoneNumber ||
                    '-'}
                </strong>
              </div>
            )}

            <div className="cpmku-user-detail-row">
              <span>
                Status
              </span>
              <strong>
                {selected.banned
                  ? 'Banned'
                  : 'Aktif'}
              </strong>
            </div>
          </div>

          {selected.role !==
            'admin' && (
            <div className="cpmku-user-modal-actions">
              <button
                type="button"
                className="cpmku-user-button cpmku-user-danger"
                onClick={() =>
                  setConfirm(
                    selected
                  )
                }
                disabled={
                  loading
                }
              >
                {selected.banned
                  ? 'Unban'
                  : 'Ban'}
              </button>
            </div>
          )}
        </Modal>
      )}

      {confirm && (
        <Modal
          onClose={() =>
            setConfirm(
              null
            )
          }
        >
          <h3>
            Konfirmasi
          </h3>

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
                setConfirm(
                  null
                )
              }
            >
              Batal
            </button>

            <button
              type="button"
              className="cpmku-user-button cpmku-user-danger"
              onClick={() =>
                ban(
                  confirm
                )
              }
              disabled={
                loading
              }
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
