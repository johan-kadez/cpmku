import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function SellerApply() {
  const {
    user,
    login
  } = useAuth();

  const nav = useNavigate();

  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: '',
    email: user?.email || '',
    reason: '',
    photoUrl: user?.photoURL || ''
  });

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({
    type: '',
    message: ''
  });

  const updateField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  };

  const loginGoogle = async () => {
    if (busy) {
      return;
    }

    setNotice({
      type: '',
      message: ''
    });

    try {
      await login();
    } catch (error) {
      setNotice({
        type: 'error',
        message:
          error?.message ||
          'Login Google gagal.'
      });
    }
  };

  const submit = async event => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setNotice({
      type: '',
      message: ''
    });

    setBusy(true);

    try {
      await api(
        '/sellers/apply',
        {
          method: 'POST',
          body: JSON.stringify(form)
        }
      );

      setNotice({
        type: 'success',
        message:
          'Pengajuan seller berhasil dikirim dan menunggu Admin.'
      });

      setTimeout(() => {
        nav('/profile');
      }, 900);
    } catch (error) {
      setNotice({
        type: 'error',
        message:
          error?.message ||
          'Gagal mengirim pengajuan seller.'
      });
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <section className="auth-card">
        <h1>Daftar Seller</h1>

        <p>
          Sign In Google terlebih dahulu
          sebelum mengirim pengajuan.
        </p>

        {notice.message && (
          <div
            className={`notice ${
              notice.type === 'error'
                ? 'error'
                : ''
            }`}
          >
            {notice.message}
          </div>
        )}

        <button
          className="button primary"
          onClick={loginGoogle}
          disabled={busy}
        >
          Login Google
        </button>
      </section>
    );
  }

  return (
    <form
      className="form-card"
      onSubmit={submit}
    >
      <span className="eyebrow">
        LOGIN AS SELLER · SIGN UP
      </span>

      <h1>Daftar Seller</h1>

      {notice.message && (
        <div
          className={`notice ${
            notice.type === 'error'
              ? 'error'
              : ''
          }`}
        >
          {notice.message}
        </div>
      )}

      <label>
        Nama Seller

        <input
          required
          value={form.name}
          onChange={event =>
            updateField(
              'name',
              event.target.value
            )
          }
        />
      </label>

      <label>
        Nomor WhatsApp Seller

        <input
          required
          value={form.phone}
          onChange={event =>
            updateField(
              'phone',
              event.target.value
            )
          }
        />
      </label>

      <label>
        Email Seller

        <input
          required
          type="email"
          value={form.email}
          onChange={event =>
            updateField(
              'email',
              event.target.value
            )
          }
        />
      </label>

      <label>
        Tujuan menjadi Seller

        <textarea
          required
          value={form.reason}
          onChange={event =>
            updateField(
              'reason',
              event.target.value
            )
          }
        />
      </label>

      <label>
        URL Foto Profile

        <input
          required
          type="url"
          value={form.photoUrl}
          onChange={event =>
            updateField(
              'photoUrl',
              event.target.value
            )
          }
        />
      </label>

      <button
        className="button primary"
        disabled={busy}
      >
        {busy
          ? 'Mengirim...'
          : 'Daftar'}
      </button>
    </form>
  );
}
