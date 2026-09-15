import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
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
        error?.message ||
        'Login gagal.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-card">
      <h1>Login as Buyer</h1>

      <p>
        Sign in / Sign up untuk akses full CPMKU
      </p>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <button
        className="button primary"
        onClick={go}
        disabled={busy}
      >
        {busy
          ? 'Memproses...'
          : 'Continue with Google'}
      </button>
    </section>
  );
}
