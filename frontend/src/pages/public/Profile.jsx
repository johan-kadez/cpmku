import { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Profile() {
  const {
    user,
    role,
    updateUserPhoto
  } = useAuth();

  const [nickname, setNickname] = useState(
    user?.displayName ||
    user?.name ||
    ''
  );

  const [nicknameLoading, setNicknameLoading] =
    useState(false);

  const [sellerName, setSellerName] =
    useState('');

  const [sellerPhone, setSellerPhone] =
    useState('');

  const [sellerReason, setSellerReason] =
    useState('');

  const [sellerLoading, setSellerLoading] =
    useState(false);

  const isBuyer =
    role === 'buyer';

  const isSeller =
    role === 'seller';

  const saveNickname = async (event) => {
    event.preventDefault();

    const value =
      nickname.trim();

    if (!value) {
      alert(
        'Nickname wajib diisi.'
      );

      return;
    }

    try {
      setNicknameLoading(true);

      const result =
        await api(
          '/profile/nickname',
          {
            method: 'PATCH',
            body: JSON.stringify({
              name: value
            })
          }
        );

      if (
        result?.name &&
        user
      ) {
        user.displayName =
          result.name;

        user.name =
          result.name;
      }

      setNickname(
        result?.name || value
      );

      alert(
        'Nickname berhasil diubah.'
      );
    } catch (error) {
      alert(
        error?.message ||
        'Gagal mengubah nickname.'
      );
    } finally {
      setNicknameLoading(false);
    }
  };

  const submitSellerApplication =
    async (event) => {
      event.preventDefault();

      const name =
        sellerName.trim();

      const phone =
        sellerPhone.trim();

      const reason =
        sellerReason.trim();

      if (!name) {
        alert(
          'Nama seller wajib diisi.'
        );

        return;
      }

      if (!phone) {
        alert(
          'Nomor telepon wajib diisi.'
        );

        return;
      }

      if (!reason) {
        alert(
          'Alasan menjadi seller wajib diisi.'
        );

        return;
      }

      try {
        setSellerLoading(true);

        await api(
          '/seller/apply',
          {
            method: 'POST',
            body: JSON.stringify({
              name,
              phone,
              reason
            })
          }
        );

        setSellerName('');
        setSellerPhone('');
        setSellerReason('');

        alert(
          'Pendaftaran seller berhasil dikirim dan menunggu persetujuan admin.'
        );
      } catch (error) {
        alert(
          error?.message ||
          'Gagal mengirim pendaftaran seller.'
        );
      } finally {
        setSellerLoading(false);
      }
    };

  return (
    <section className="profile-page">
      <div className="profile-card">

        {/* ========================= */}
        {/* PROFILE HEADER */}
        {/* ========================= */}

        <div className="profile-header">

          <img
            src={
              user?.photoURL ||
              user?.photoUrl ||
              '/avatar.png'
            }
            alt="Profile"
            className="profile-avatar"
          />

          <div>
            <h1>
              {user?.displayName ||
                user?.name ||
                'User'}
            </h1>

            <p>
              {user?.email || ''}
            </p>
          </div>

        </div>

        {/* ========================= */}
        {/* CHANGE PROFILE PHOTO */}
        {/* ========================= */}

        <div className="profile-section">

          <h2>
            Change Profile Photo
          </h2>

          <label className="button">
            Choose Photo

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (event) => {
                const file =
                  event.target.files?.[0];

                if (!file) {
                  return;
                }

                try {
                  await updateUserPhoto(
                    file
                  );

                  alert(
                    'Profile photo berhasil diubah.'
                  );
                } catch (error) {
                  alert(
                    error?.message ||
                    'Gagal mengubah profile photo.'
                  );
                }

                event.target.value = '';
              }}
            />
          </label>

        </div>

        {/* ========================= */}
        {/* CHANGE NICKNAME */}
        {/* BUYER ONLY */}
        {/* ========================= */}

        {isBuyer && (
          <div className="profile-section">

            <h2>
              Change Nickname
            </h2>

            <form
              onSubmit={
                saveNickname
              }
            >

              <label>
                Nickname

                <input
                  type="text"
                  value={nickname}
                  onChange={(event) =>
                    setNickname(
                      event.target.value
                    )
                  }
                  maxLength={30}
                  placeholder="Masukkan nickname"
                  required
                />
              </label>

              <button
                type="submit"
                className="button primary"
                disabled={
                  nicknameLoading
                }
              >
                {nicknameLoading
                  ? 'Menyimpan...'
                  : 'Change Nickname'}
              </button>

            </form>

          </div>
        )}

        {/* ========================= */}
        {/* SELLER APPLICATION */}
        {/* BUYER ONLY */}
        {/* ========================= */}

        {isBuyer && (
          <div className="profile-section">

            <h2>
              Daftar Jadi Seller
            </h2>

            <p>
              Isi data berikut untuk
              mengajukan pendaftaran
              sebagai seller.
            </p>

            <form
              onSubmit={
                submitSellerApplication
              }
            >

              <label>
                Nama Seller

                <input
                  type="text"
                  value={sellerName}
                  onChange={(event) =>
                    setSellerName(
                      event.target.value
                    )
                  }
                  required
                  maxLength={100}
                  placeholder="Nama seller"
                />
              </label>

              <label>
                Nomor Telepon

                <input
                  type="tel"
                  value={sellerPhone}
                  onChange={(event) =>
                    setSellerPhone(
                      event.target.value
                    )
                  }
                  required
                  maxLength={30}
                  placeholder="08xxxxxxxxxx"
                />
              </label>

              <label>
                Alasan Jadi Seller

                <textarea
                  value={sellerReason}
                  onChange={(event) =>
                    setSellerReason(
                      event.target.value
                    )
                  }
                  required
                  maxLength={1000}
                  placeholder="Jelaskan alasan ingin menjadi seller"
                  rows={5}
                />
              </label>

              <button
                type="submit"
                className="button primary"
                disabled={
                  sellerLoading
                }
              >
                {sellerLoading
                  ? 'Mengirim...'
                  : 'Kirim Pendaftaran'}
              </button>

            </form>

          </div>
        )}

        {/* ========================= */}
        {/* SELLER PROFILE */}
        {/* ========================= */}

        {isSeller && (
          <div className="profile-section">

            <p>
              Nama seller hanya dapat
              diubah oleh admin.
            </p>

          </div>
        )}

      </div>
    </section>
  );
}
