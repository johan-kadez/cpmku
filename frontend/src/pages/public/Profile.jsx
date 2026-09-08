import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

export default function Profile() {
  const {
    user,
    role,
    login,
    logout,
    loading,
    updateUserPhoto
  } = useAuth();

  const nav = useNavigate();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const go = async () => {
    try {
      await login();
      nav('/profile');
    } catch (error) {
      alert(error.message);
    }
  };

  const openFilePicker = () => {
    if (uploading) {
      return;
    }

    setError('');
    fileInputRef.current?.click();
  };

  const uploadProfilePhoto = async (file) => {
    if (!file) {
      return;
    }

    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Format foto harus JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Ukuran foto maksimal 5 MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);

    setPreview(localPreview);
    setUploading(true);

    try {
      const signature = await api(
        '/profile/signature',
        {
          method: 'POST'
        }
      );

      const formData = new FormData();

      formData.append('file', file);
      formData.append('api_key', signature.apiKey);
      formData.append(
        'timestamp',
        String(signature.timestamp)
      );
      formData.append(
        'signature',
        signature.signature
      );
      formData.append(
        'public_id',
        signature.publicId
      );
      formData.append('overwrite', 'true');
      formData.append('invalidate', 'true');
      formData.append(
        'transformation',
        signature.transformation
      );

      const cloudinaryResponse = await fetch(
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

      if (!cloudinaryResponse.ok) {
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

      const saved = await api(
        '/profile/photo',
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

      await updateUserPhoto(saved.photoURL);

      URL.revokeObjectURL(localPreview);
      setPreview('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(
        'Profile photo upload error:',
        error
      );

      URL.revokeObjectURL(localPreview);
      setPreview('');

      setError(
        error.message ||
        'Gagal mengubah foto profil.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    await uploadProfilePhoto(file);
  };

  if (loading) {
    return (
      <div className="state">
        Memuat akun...
      </div>
    );
  }

  if (!user) {
    return (
      <section className="profile-page">
        <h1>Profile</h1>

        <div className="login-choices">
          <div>
            <span>LOGIN AS BUYER</span>

            <h2>Buyer</h2>

            <button
              className="button primary"
              onClick={go}
            >
              Sign In dengan Google
            </button>

            <button
              className="button"
              onClick={go}
            >
              Sign Up dengan Google
            </button>
          </div>

          <div>
            <span>LOGIN AS SELLER</span>

            <h2>Seller</h2>

            <Link
              className="button primary"
              to="/seller/login"
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
      </section>
    );
  }

  const displayedPhoto =
    preview ||
    user.photoURL ||
    '';

  return (
    <section className="profile-page">
      <div className="account-card">
        <div className="profile-avatar-area">
          {displayedPhoto ? (
            <img
              className="avatar large"
              src={displayedPhoto}
              alt="Foto profil"
            />
          ) : (
            <div className="avatar large fallback">
              {(
                user.displayName ||
                user.email ||
                'U'
              )
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            hidden
          />
        </div>

        <div className="profile-info">
          <h1>
            {user.displayName || 'User'}
          </h1>

          <p className="profile-email">
            {user.email}
          </p>

          <span className="badge">
            {role || 'buyer'}
          </span>
        </div>
      </div>

      <div className="profile-links">
        <Link to="/favorites">
          Favorite
        </Link>

        <Link to="/transactions">
          Transaksi
        </Link>

        {role === 'seller' && (
          <Link to="/seller/dashboard">
            Seller Dashboard
          </Link>
        )}

        {role === 'admin' && (
          <Link to="/admin">
            Admin Panel
          </Link>
        )}

        <button
          type="button"
          onClick={openFilePicker}
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

        <button
          type="button"
          onClick={async () => {
            await logout();
            nav('/');
          }}
        >
          Logout
        </button>
      </div>
    </section>
  );
}
