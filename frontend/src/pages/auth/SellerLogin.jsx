import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

  const go = async () => {
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
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section className="auth-card">
      <h1>Login Seller</h1>

      <p>
        Hanya akun seller yang sudah disetujui admin
        yang dapat masuk.
      </p>

      <button
        className="button primary"
        onClick={go}
      >
        Login dengan Google
      </button>
    </section>
  );
}
