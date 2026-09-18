import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
const {
login,
loginWithEmail
} = useAuth();

const nav = useNavigate();

const [email, setEmail] =
useState('');

const [password, setPassword] =
useState('');

const [error, setError] =
useState('');

const [busy, setBusy] =
useState(false);

const submit = async event => {
event.preventDefault();

if (busy) {
  return;
}

setError('');
setBusy(true);

try {
  await loginWithEmail(
    email,
    password
  );

  nav('/profile');
} catch (error) {
  setError(
    getAuthErrorMessage(error)
  );
} finally {
  setBusy(false);
}

};

const googleLogin = async () => {
if (busy) {
return;
}

setError('');
setBusy(true);

try {
  await login();
  nav('/profile');
} catch (error) {
  setError(
    getAuthErrorMessage(error)
  );
} finally {
  setBusy(false);
}

};

return (
<section className="auth-card auth-modern">
<div className="auth-heading">
<span className="eyebrow">
CPMKU ACCOUNT
</span>

    <h1>Sign In</h1>

    <p>
      Masuk ke akun CPMKU kamu.
    </p>
  </div>

  {error && (
    <div className="notice error">
      {error}
    </div>
  )}

  <form
    className="auth-form"
    onSubmit={submit}
  >
    <label>
      Email
      <input
        type="email"
        value={email}
        onChange={event =>
          setEmail(
            event.target.value
          )
        }
        placeholder="nama@email.com"
        autoComplete="email"
        required
      />
    </label>

    <label>
      Password
      <input
        type="password"
        value={password}
        onChange={event =>
          setPassword(
            event.target.value
          )
        }
        placeholder="Masukkan password"
        autoComplete="current-password"
        required
      />
    </label>

    <button
      type="submit"
      className="button primary auth-submit"
      disabled={busy}
    >
      {busy
        ? 'Memproses...'
        : 'Masuk'}
    </button>
  </form>

  <div className="auth-divider">
    <span>or</span>
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

  <p className="auth-switch">
    Don't have an account?{' '}
    <Link to="/register">
      Register
    </Link>
  </p>
</section>

);
}

function getAuthErrorMessage(error) {
switch (error?.code) {
case 'auth/invalid-credential':
case 'auth/wrong-password':
case 'auth/user-not-found':
return 'Email atau password salah.';

case 'auth/invalid-email':
  return 'Format email tidak valid.';

case 'auth/too-many-requests':
  return 'Terlalu banyak percobaan login. Coba lagi nanti.';

case 'auth/user-disabled':
  return 'Akun ini telah dinonaktifkan.';

case 'auth/popup-closed-by-user':
  return 'Login Google dibatalkan.';

case 'auth/popup-blocked':
  return 'Popup login Google diblokir browser. Izinkan popup untuk CPMKU.';

default:
  return (
    error?.message ||
    'Login gagal.'
  );

}
}
