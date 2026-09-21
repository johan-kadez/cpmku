import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function ForgotPassword() {
  const nav =
    useNavigate();

  const [step, setStep] =
    useState('email');

  const [email, setEmail] =
    useState('');

  const [otp, setOtp] =
    useState('');

  const [resetToken, setResetToken] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [resendCooldown, setResendCooldown] =
    useState(0);

  const requestCode =
    async event => {
      event.preventDefault();

      if (busy) {
        return;
      }

      setError('');
      setSuccess('');

      const cleanEmail =
        email.trim();

      if (!cleanEmail) {
        setError(
          'Email wajib diisi.'
        );
        return;
      }

      setBusy(true);

      try {
        await api(
          '/auth/password-reset/request',
          {
            method: 'POST',
            body: JSON.stringify({
              email:
                cleanEmail
            })
          }
        );

        setStep('otp');

        setSuccess(
          'If the email is registered with CPMKU, a verification code has been sent.'
        );

        startCooldown();
      } catch (error) {
        setError(
          error?.message ||
          'Gagal mengirim kode.'
        );
      } finally {
        setBusy(false);
      }
    };

  const verifyCode =
    async event => {
      event.preventDefault();

      if (busy) {
        return;
      }

      setError('');
      setSuccess('');

      const cleanOtp =
        otp.replace(/\D/g, '');

      if (
        cleanOtp.length !== 6
      ) {
        setError(
          'Masukkan 6 digit kode.'
        );
        return;
      }

      setBusy(true);

      try {
        const result =
          await api(
            '/auth/password-reset/verify',
            {
              method: 'POST',
              body: JSON.stringify({
                email:
                  email.trim(),

                otp:
                  cleanOtp
              })
            }
          );

        if (
          !result.resetToken
        ) {
          throw new Error(
            'Kode berhasil diverifikasi, tetapi reset token tidak diterima.'
          );
        }

        setResetToken(
          result.resetToken
        );

        setStep('password');

        setError('');
        setSuccess('');
      } catch (error) {
        setError(
          error?.message ||
          'Kode tidak valid.'
        );
      } finally {
        setBusy(false);
      }
    };

  const reset =
    async event => {
      event.preventDefault();

      if (busy) {
        return;
      }

      setError('');
      setSuccess('');

      if (
        password.length < 6
      ) {
        setError(
          'Password minimal 6 karakter.'
        );
        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          "Passwords don't match."
        );
        return;
      }

      setBusy(true);

      try {
        await api(
          '/auth/password-reset/confirm',
          {
            method: 'POST',
            body: JSON.stringify({
              email:
                email.trim(),

              resetToken,

              newPassword:
                password,

              confirmPassword
            })
          }
        );

        setSuccess(
          'Password berhasil diubah. Mengembalikan ke Sign In...'
        );

        setTimeout(() => {
          nav('/login', {
            replace: true
          });
        }, 1200);
      } catch (error) {
        setError(
          error?.message ||
          'Gagal mengubah password.'
        );
      } finally {
        setBusy(false);
      }
    };

  const startCooldown =
    () => {
      setResendCooldown(120);

      let remaining = 120;

      const timer =
        setInterval(() => {
          remaining -= 1;

          setResendCooldown(
            remaining
          );

          if (
            remaining <= 0
          ) {
            clearInterval(timer);
          }
        }, 1000);
    };

  const resend =
    async () => {
      if (
        busy ||
        resendCooldown > 0
      ) {
        return;
      }

      setError('');
      setSuccess('');
      setBusy(true);

      try {
        await api(
          '/auth/password-reset/request',
          {
            method: 'POST',
            body: JSON.stringify({
              email:
                email.trim()
            })
          }
        );

        setOtp('');

        setSuccess(
          'A new verification code has been sent.'
        );

        startCooldown();
      } catch (error) {
        setError(
          error?.message ||
          'Gagal mengirim ulang kode.'
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

        <h1>
          {step === 'email' &&
            'Forgot Password'}

          {step === 'otp' &&
            'Verify Code'}

          {step === 'password' &&
            'Set new password'}
        </h1>

        <p>
          {step === 'email' &&
            'Masukkan email akun CPMKU kamu untuk menerima kode reset password.'}

          {step === 'otp' &&
            'Masukkan 6 digit kode yang dikirim ke email kamu.'}

          {step === 'password' &&
            'Buat password baru untuk akun CPMKU kamu.'}
        </p>
      </div>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      {success && (
        <div className="notice success">
          {success}
        </div>
      )}

      {step === 'email' && (
        <form
          className="auth-form"
          onSubmit={requestCode}
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

          <button
            type="submit"
            className="button primary auth-submit"
            disabled={busy}
          >
            {busy
              ? 'Memproses...'
              : 'Send code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form
          className="auth-form"
          onSubmit={verifyCode}
        >
          <label>
            Verification code

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={event =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)
                )
              }
              placeholder="******"
              autoComplete="one-time-code"
              required
            />
          </label>

          <button
            type="submit"
            className="button primary auth-submit"
            disabled={
              busy ||
              otp.length !== 6
            }
          >
            {busy
              ? 'Memverifikasi...'
              : 'Verify code'}
          </button>

          <button
            type="button"
            className="button"
            onClick={resend}
            disabled={
              busy ||
              resendCooldown > 0
            }
          >
            {resendCooldown > 0
              ? `Resend code in ${Math.floor(
                  resendCooldown / 60
                )}:${String(
                  resendCooldown % 60
                ).padStart(2, '0')}`
              : 'Resend code'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form
          className="auth-form"
          onSubmit={reset}
        >
          <label>
            Set new password

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
            Confirm new password

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

            {confirmPassword &&
              password !==
                confirmPassword && (
                <span
                  style={{
                    color:
                      '#ef4444',
                    fontSize:
                      '0.85rem',
                    marginTop:
                      '6px',
                    display:
                      'block'
                  }}
                >
                  Passwords don't match.
                </span>
              )}
          </label>

          <button
            type="submit"
            className="button primary auth-submit"
            disabled={
              busy ||
              password.length < 6 ||
              password !==
                confirmPassword
            }
          >
            {busy
              ? 'Saving...'
              : 'Set password'}
          </button>
        </form>
      )}

      {step !== 'password' && (
        <p className="auth-switch">
          Remember your password?{' '}

          <Link to="/login">
            Sign In
          </Link>
        </p>
      )}

      {step === 'password' && (
        <p className="auth-switch">
          <Link to="/login">
            Back to Sign In
          </Link>
        </p>
      )}
    </section>
  );
}
