import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  auth,
  googleProvider
} from '../../services/firebase';

export default function SellerLogin() {
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
      await signInWithPopup(
        auth,
        googleProvider
      );

      const r = await api('/me');

      if (r.user?.role !== 'seller') {
        await signOut(auth);

        throw new Error(
          'Akun Google ini belum terdaftar sebagai seller yang disetujui admin.'
        );
      }

      nav('/seller/dashboard');
    } catch (error) {
      setError(
        error?.message ||
        'Login seller gagal.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-card">
      <h1>Login Seller</h1>

      <p>
        Tunggu persetujuan admin setelah meninjau akun anda
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
          : 'Login dengan Google'}
      </button>
    </section>
  );
}
