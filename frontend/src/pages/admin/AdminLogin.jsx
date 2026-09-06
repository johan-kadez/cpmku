import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await loginAdmin(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError('Email atau password admin salah.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="auth-card admin-login-card">
        <span className="eyebrow">ADMIN AREA</span>
        <h1>Admin Login</h1>
        <p className="muted">Akses khusus pengelola JOHAN MARKETPLACE.</p>
        {error && <div className="notice error">{error}</div>}
        <form className="form-card" onSubmit={submit}>
          <label>Email admin
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          <button className="button primary" type="submit" disabled={busy}>{busy ? 'Memproses...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}
