import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();

  const nav = useNavigate();

  const go = async () => {
    try {
      await login();

      nav('/profile');
    } catch (error) {
      alert(
        error?.message ||
        'Login gagal.'
      );
    }
  };

  return (
    <section className="auth-card">
      <h1>Login as Buyer</h1>

      <p>
        Buyer menggunakan Google Sign-In.
        Sign In dan Sign Up menggunakan
        flow Google yang sama.
      </p>

      <button
        className="button primary"
        onClick={go}
      >
        Continue with Google
      </button>
    </section>
  );
}
