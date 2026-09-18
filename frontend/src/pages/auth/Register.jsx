import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
const {
register,
login
} = useAuth();

const nav = useNavigate();

const [name, setName] =
useState('');

const [email, setEmail] =
useState('');

const [phone, setPhone] =
useState('');

const [password, setPassword] =
useState('');

const [confirmPassword, setConfirmPassword] =
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

if (
  password !==
  confirmPassword
) {
  setError(
    'Password dan confirm password tidak sama.'
  );

  return;
}

setBusy(true);

try {
  await register({
    name,
    email,
    phone,
    password
  });

  nav('/profile');
} catch (error) {
  setError(
    getAuthErrorMessage(error)
  );
} finally {
  setBusy(false);
}

};

const googleRegister = async () => {
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

    <h1>Create Account</h1>

    <p>
      Buat akun CPMKU untuk mulai menggunakan marketplace.
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
      Nama
      <input
        type="text"
        value={name}
        onChange={event =>
          setName(
            event.target.value
          )
        }
        placeholder="Nama kamu"
        autoComplete="name"
        required
      />
    </label>

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
      Nomor
      <input
        type="tel"
        value={phone}
        onChange={event =>
          setPhone(
            event.target.value
          )
        }
        placeholder="08xxxxxxxxxx"
        autoComplete="tel"
        required
      />
    </label>

    <div className="auth-password-row">
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
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <label>
        Confirm Password
        <input
          type="password"
          value={confirmPassword}
          onChange={event =>
            setConfirmPassword(
              event.target.value
            )
          }
          placeholder="Ulangi password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>
    </div>

    <button
      type="submit"
      className="button primary auth-submit"
      disabled={busy}
    >
      {busy
        ? 'Memproses...'
        : 'Daftar'}
    </button>
  </form>

  <div className="auth-divider">
    <span>or</span>
  </div>

  <button
    type="button"
    className="button google-button"
    onClick={googleRegister}
    disabled={busy}
  >
    {busy
      ? 'Memproses...'
      : 'Sign up with Google'}
  </button>

  <p className="auth-switch">
    Already have an account?{' '}
    <Link to="/login">
      Sign In
    </Link>
  </p>
</section>

);
}

function getAuthErrorMessage(error) {
switch (error?.code) {
case 'auth/email-already-in-use':
return 'Email tersebut sudah terdaftar. Silakan Sign In.';

case 'auth/invalid-email':
  return 'Format email tidak valid.';

case 'auth/weak-password':
  return 'Password terlalu lemah. Gunakan minimal 6 karakter.';

case 'auth/popup-closed-by-user':
  return 'Pendaftaran Google dibatalkan.';

case 'auth/popup-blocked':
  return 'Popup Google diblokir browser. Izinkan popup untuk CPMKU.';

default:
  return (
    error?.message ||
    'Pendaftaran gagal.'
  );

}
}
