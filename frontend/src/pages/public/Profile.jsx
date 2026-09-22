import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';

import {
  useAuth
} from '../../context/AuthContext';

import {
  api
} from '../../services/api';

import './Profile.css';

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MAX_IMAGE_DIMENSION = 768;
const TARGET_FILE_SIZE = 200 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url =
      URL.createObjectURL(file);

    const image =
      new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          'Foto tidak dapat diproses.'
        )
      );
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas,
  quality
) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(
            new Error(
              'Browser gagal memproses foto.'
            )
          );
          return;
        }

        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

async function compressProfilePhoto(file) {
  const image =
    await loadImage(file);

  let width =
    image.naturalWidth;

  let height =
    image.naturalHeight;

  const longestSide =
    Math.max(width, height);

  if (
    longestSide >
    MAX_IMAGE_DIMENSION
  ) {
    const scale =
      MAX_IMAGE_DIMENSION /
      longestSide;

    width =
      Math.max(
        1,
        Math.round(width * scale)
      );

    height =
      Math.max(
        1,
        Math.round(height * scale)
      );
  }

  const canvas =
    document.createElement(
      'canvas'
    );

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext('2d', {
      alpha: true
    });

  if (!context) {
    throw new Error(
      'Browser tidak mendukung pemrosesan foto.'
    );
  }

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    'high';

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  const qualities = [
    0.82,
    0.76,
    0.70,
    0.64,
    0.58
  ];

  let bestBlob = null;

  for (
    const quality of qualities
  ) {
    const blob =
      await canvasToBlob(
        canvas,
        quality
      );

    bestBlob = blob;

    if (
      blob.size <=
      TARGET_FILE_SIZE
    ) {
      break;
    }
  }

  if (!bestBlob) {
    throw new Error(
      'Foto gagal dikompres.'
    );
  }

  return new File(
    [bestBlob],
    'profile.webp',
    {
      type: 'image/webp',
      lastModified: Date.now()
    }
  );
}

export default function Profile() {
  const {
    user,
    role,
    login,
    logout,
    loading,
    updateUserPhoto
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPanel =
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/');

  const fileInputRef =
    useRef(null);

  const [uploading, setUploading] =
    useState(false);

  const [preview, setPreview] =
    useState('');

  const [error, setError] =
    useState('');

  const [notice, setNotice] =
    useState('');

  const [nickname, setNickname] =
    useState('');

  const [
    nicknameLoading,
    setNicknameLoading
  ] = useState(false);

  const [sellerName, setSellerName] =
    useState('');

  const [sellerPhone, setSellerPhone] =
    useState('');

  const [sellerReason, setSellerReason] =
    useState('');

  const [
    sellerLoading,
    setSellerLoading
  ] = useState(false);

  useEffect(() => {
    setNickname(
      user?.name ||
      user?.nickname ||
      user?.displayName ||
      ''
    );
  }, [
    user?.name,
    user?.nickname,
    user?.displayName
  ]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);

  const showError = message => {
    setError(message);
    setNotice('');
  };

  const showSuccess = message => {
    setNotice(message);
    setError('');
  };

  const loginToProfile = async () => {
    setError('');
    setNotice('');

    try {
      await login();
      navigate('/profile');
    } catch (error) {
      showError(
        error?.message ||
        'Login gagal.'
      );
    }
  };

  const openFilePicker = () => {
    if (uploading) {
      return;
    }

    setError('');
    setNotice('');

    fileInputRef.current?.click();
  };

  const uploadProfilePhoto = async file => {
    if (!file) {
      return;
    }

    setError('');
    setNotice('');

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      showError(
        'Format foto harus JPG, PNG, atau WEBP.'
      );
      return;
    }

    if (
      file.size > MAX_FILE_SIZE
    ) {
      showError(
        'Ukuran foto maksimal 5 MB.'
      );
      return;
    }

    const originalPreview =
      URL.createObjectURL(file);

    setPreview(
      originalPreview
    );

    setUploading(true);

    try {
      const compressedFile =
        await compressProfilePhoto(
          file
        );

      const compressedPreview =
        URL.createObjectURL(
          compressedFile
        );

      URL.revokeObjectURL(
        originalPreview
      );

      setPreview(
        compressedPreview
      );

      const signature =
        await api(
          '/profile/photo/signature',
          {
            method: 'POST'
          }
        );

      const formData =
        new FormData();

      formData.append(
        'file',
        compressedFile
      );

      formData.append(
        'api_key',
        signature.apiKey
      );

      formData.append(
        'timestamp',
        String(
          signature.timestamp
        )
      );

      formData.append(
        'signature',
        signature.signature
      );

      formData.append(
        'public_id',
        signature.publicId
      );

      formData.append(
        'overwrite',
        'true'
      );

      formData.append(
        'invalidate',
        'true'
      );

      formData.append(
        'transformation',
        signature.transformation
      );

      const cloudinaryResponse =
        await fetch(
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

      let cloudinaryData = {};

      try {
        cloudinaryData =
          await cloudinaryResponse.json();
      } catch {
        cloudinaryData = {};
      }

      if (
        !cloudinaryResponse.ok
      ) {
        throw new Error(
          cloudinaryData.error?.message ||
          'Upload foto ke Cloudinary gagal.'
        );
      }

      if (
        !cloudinaryData.secure_url ||
        !cloudinaryData.public_id ||
        !cloudinaryData.version ||
        !cloudinaryData.signature
      ) {
        throw new Error(
          'Respons Cloudinary tidak lengkap.'
        );
      }

      const saved =
        await api(
          '/profile/photo/update',
          {
            method: 'POST',
            body: JSON.stringify({
              secureUrl:
                cloudinaryData.secure_url,
              publicId:
                cloudinaryData.public_id,
              version:
                cloudinaryData.version,
              signature:
                cloudinaryData.signature
            })
          }
        );

      await updateUserPhoto(
        saved.photoURL
      );

      setPreview('');

      showSuccess(
        'Profile photo berhasil diubah.'
      );
    } catch (error) {
      console.error(
        'Profile photo upload error:',
        error
      );

      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }

      setPreview('');

      showError(
        error?.message ||
        'Gagal mengubah foto profil.'
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveNickname = async event => {
    event.preventDefault();

    setError('');
    setNotice('');

    const value =
      nickname.trim();

    if (!value) {
      showError(
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

      if (user) {
        user.displayName =
          result?.name ||
          value;

        user.name =
          result?.name ||
          value;

        user.nickname =
          result?.nickname ||
          result?.name ||
          value;
      }

      setNickname(
        result?.name ||
        result?.nickname ||
        value
      );

      showSuccess(
        'Nickname berhasil diubah.'
      );
    } catch (error) {
      showError(
        error?.message ||
        'Gagal mengubah nickname.'
      );
    } finally {
      setNicknameLoading(false);
    }
  };

  const submitSellerApplication =
    async event => {
      event.preventDefault();

      setError('');
      setNotice('');

      const name =
        sellerName.trim();

      const phone =
        sellerPhone.trim();

      const reason =
        sellerReason.trim();

      if (!name) {
        showError(
          'Nama seller wajib diisi.'
        );
        return;
      }

      if (!phone) {
        showError(
          'Nomor telepon wajib diisi.'
        );
        return;
      }

      if (!reason) {
        showError(
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

        showSuccess(
          'Pendaftaran seller berhasil dikirim dan menunggu persetujuan admin.'
        );
      } catch (error) {
        showError(
          error?.message ||
          'Gagal mengirim pendaftaran seller.'
        );
      } finally {
        setSellerLoading(false);
      }
    };

  if (loading) {
    return (
      <section className="profile-page">
        <div className="state">
          Memuat akun...
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="profile-page">
        <div className="profile-card">
          <h1>Profile</h1>

          {error && (
            <div className="notice error">
              {error}
            </div>
          )}

          {notice && (
            <div className="notice">
              {notice}
            </div>
          )}

          <div className="login-choices">
            <div>
              <span>
                LOGIN AS BUYER
              </span>

              <h2>Buyer</h2>

              <button
                className="button primary"
                onClick={
                  loginToProfile
                }
              >
                Sign In dengan Google
              </button>

              <button
                className="button"
                onClick={
                  loginToProfile
                }
              >
                Sign Up dengan Google
              </button>
            </div>

            <div>
              <span>
                LOGIN AS SELLER
              </span>

              <h2>Seller</h2>

              <Link
                className="button primary"
                to="/seller"
              >
                Sign In
              </Link>

              <Link
                className="button"
                to="/seller/apply"
              >
                Sign Up / Daftar
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const displayedPhoto =
    preview ||
    user.photoURL ||
    user.photoUrl ||
    '';

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            {displayedPhoto ? (
              <img
                src={displayedPhoto}
                alt="Foto profil"
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">
                {(
                  user.name ||
                  user.nickname ||
                  user.displayName ||
                  user.email ||
                  'U'
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h1>
              {user.name ||
                user.nickname ||
                user.displayName ||
                'User'}
            </h1>

            <p>
              {user.email || ''}
            </p>

            <span className="badge">
              {role || 'buyer'}
            </span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={event =>
            uploadProfilePhoto(
              event.target.files?.[0]
            )
          }
          hidden
        />

        <div className="profile-links">
          <Link to="/favorites">
            Favorite
          </Link>

          <Link to="/transactions">
            Transaksi
          </Link>

          {role === 'seller' && (
            <Link to="/seller">
              Seller Dashboard
            </Link>
          )}

          {role === 'admin' && (
            <Link
              to={
                isAdminPanel
                  ? '/'
                  : '/admin'
              }
            >
              {isAdminPanel
                ? 'Public Web'
                : 'Panel Admin'}
            </Link>
          )}

          <button
            type="button"
            onClick={
              openFilePicker
            }
            disabled={uploading}
          >
            {uploading
              ? 'Mengupload Foto...'
              : 'Ganti Foto Profile'}
          </button>

          {error && (
            <div className="notice error">
              {error}
            </div>
          )}

          {notice && (
            <div className="notice">
              {notice}
            </div>
          )}

          <button
            type="button"
            onClick={async () => {
              try {
                await logout();
                navigate('/');
              } catch (error) {
                showError(
                  error?.message ||
                  'Logout gagal.'
                );
              }
            }}
          >
            Logout
          </button>
        </div>

        {(role === 'buyer' || role === 'admin') && (
          <>
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
                    onChange={event =>
                      setNickname(
                        event.target.value
                      )
                    }
                    maxLength={50}
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
                    onChange={event =>
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
                    onChange={event =>
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
                    onChange={event =>
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
          </>
        )}

        {role === 'seller' && (
          <div className="profile-section seller-profile-note">
            <p>
              Contact admin for change Nickname
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
