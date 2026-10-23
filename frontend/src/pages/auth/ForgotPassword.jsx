import { useState } from 'react';
import { api } from '../../services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setStep(2);
      setSuccess('Kode OTP telah dikirim ke email Anda.');
    } catch (err) {
      setError(err?.message || 'Gagal mengirim kode OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api('/auth/password-reset/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
      setStep(3);
      setSuccess('Kode OTP valid. Silakan buat password baru.');
    } catch (err) {
      setError(err?.message || 'Kode OTP tidak valid atau sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      });
      setSuccess('Password berhasil diubah! Silakan login dengan password baru.');
      setStep(4);
    } catch (err) {
      setError(err?.message || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <span className="eyebrow">AUTH</span>
          <h1>Lupa Password</h1>
        </div>
      </div>

      <div className="cpmku-admin-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
        {error && <div className="notice error" style={{ marginBottom: '16px' }}>{error}</div>}
        {success && <div className="notice success" style={{ marginBottom: '16px' }}>{success}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="cpmku-admin-edit-form">
            <div className="cpmku-admin-edit-field">
              <label>Email Akun</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email akun Anda"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="cpmku-admin-button" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="cpmku-admin-edit-form">
            <div className="cpmku-admin-edit-field">
              <label>Kode OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Masukkan 6 digit kode OTP"
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="cpmku-admin-button" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? 'Memverifikasi...' : 'Verifikasi Kode'}
            </button>
            <button type="button" className="cpmku-admin-button" onClick={() => setStep(1)} disabled={loading} style={{ width: '100%', marginTop: '8px', opacity: 0.7 }}>
              Kembali
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="cpmku-admin-edit-form">
            <div className="cpmku-admin-edit-field">
              <label>Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                minLength={8}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="cpmku-admin-button cpmku-admin-success" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? 'Mengubah...' : 'Ubah Password'}
            </button>
            <button type="button" className="cpmku-admin-button" onClick={() => setStep(2)} disabled={loading} style={{ width: '100%', marginTop: '8px', opacity: 0.7 }}>
              Kembali
            </button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fff', marginBottom: '20px' }}>Password berhasil diubah.</p>
            <a href="/login" className="cpmku-admin-button" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
              Masuk Sekarang
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
