import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const {
    loginAdmin,
    loginAdminWithGoogle
  } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();

    if (busy) return;

    setError('');
    setBusy(true);

    try {
      await loginAdmin(
        email.trim(),
        password
      );

      navigate('/admin', {
        replace: true
      });
    } catch (err) {
      setError(
        err?.message ===
          'Akun ini bukan akun admin.'
          ? 'Akun ini bukan akun admin.'
          : 'Email atau password admin salah.'
      );
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = async () => {
    if (busy) return;

    setError('');
    setBusy(true);

    try {
      await loginAdminWithGoogle();

      navigate('/admin', {
        replace: true
      });
    } catch (err) {
      if (
        err?.message ===
        'Akun Google ini bukan akun admin.'
      ) {
        setError(
          'Akun Google ini bukan akun admin.'
        );
      } else if (
        err?.code ===
        'auth/popup-closed-by-user'
      ) {
        setError(
          'Login Google dibatalkan.'
        );
      } else if (
        err?.code ===
        'auth/popup-blocked'
      ) {
        setError(
          'Popup login Google diblokir browser. Izinkan popup untuk CPMKU.'
        );
      } else {
        setError(
          err?.message ||
          'Login Google admin gagal.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="auth-card admin-login-card">
        <span className="eyebrow">
          ADMIN AREA
        </span>

        <h1>
          Admin Login
        </h1>

        <p className="muted">
          Akses khusus pengembang CPMKU MARKETPLACE.
        </p>

        {error && (
          <div className="notice error">
            {error}
          </div>
        )}

        <form
          className="form-card"
          onSubmit={submit}
        >
          <label>
            Email admin

            <input
              type="email"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="button primary"
            type="submit"
            disabled={busy}
          >
            {busy
              ? 'Memproses...'
              : 'Login'}
          </button>
        </form>

        <div
          className="auth-divider"
          style={{
            margin: '18px 0'
          }}
        >
          <span>
            or
          </span>
        </div>

        <button
          type="button"
          className="button google-button"
          onClick={googleLogin}
          disabled={busy}
        >
          {busy
            ? 'Memproses...'
            : 'Login with Google'}
        </button>
      </div>
    </div>
  );
}
