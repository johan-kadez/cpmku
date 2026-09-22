import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './ForgotPassword.css';

const OTP_LENGTH = 6;

const MIN_VERIFY_MS = 1200;

const SUCCESS_DURATION = 1500;
const FAIL_DURATION = 420;

const TOAST_DURATION = 2600;

const ORBIT_UNITS = Array.from(
  { length: OTP_LENGTH },
  (_, index) => {
    const angle =
      (Math.PI * 2 * index) / OTP_LENGTH -
      Math.PI / 2;

    return {
      x: Math.cos(angle).toFixed(3),
      y: Math.sin(angle).toFixed(3)
    };
  }
);

export default function ForgotPassword() {
  const nav = useNavigate();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(
    Array(OTP_LENGTH).fill('')
  );
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] =
    useState(0);
  const [otpState, setOtpState] =
    useState('idle');
  const [toast, setToast] = useState(null);

  const inputRefs = useRef([]);
  const cooldownTimerRef = useRef(null);
  const verificationTimerRef = useRef(null);
  const animationTimersRef = useRef([]);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(
          cooldownTimerRef.current
        );
      }

      if (verificationTimerRef.current) {
        clearTimeout(
          verificationTimerRef.current
        );
      }

      if (toastTimerRef.current) {
        clearTimeout(
          toastTimerRef.current
        );
      }

      animationTimersRef.current.forEach(
        timer => {
          clearTimeout(timer);
        }
      );
    };
  }, []);

  useEffect(() => {
    if (otpState !== 'success') {
      return;
    }

    const timer = setTimeout(() => {
      setStep('password');
      setOtpState('idle');
      setOtp(
        Array(OTP_LENGTH).fill('')
      );
      setError('');
      setSuccess('');
      setBusy(false);
    }, SUCCESS_DURATION);

    return () => clearTimeout(timer);
  }, [otpState]);

  useEffect(() => {
    if (otpState !== 'failed') {
      return;
    }

    const timer = setTimeout(() => {
      setOtpState('error');
      setBusy(false);

      const focusTimer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 650);

      animationTimersRef.current.push(
        focusTimer
      );
    }, FAIL_DURATION);

    return () => clearTimeout(timer);
  }, [otpState]);

  const showToast = (
    message,
    type = 'success'
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(
        toastTimerRef.current
      );
    }

    setToast({
      message,
      type
    });

    toastTimerRef.current =
      setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, TOAST_DURATION);
  };

  const setInputRef = (
    element,
    index
  ) => {
    inputRefs.current[index] =
      element;
  };

  const clearOtpError = () => {
    if (otpState === 'error') {
      setOtpState('idle');
    }

    setError('');
  };

  const updateOtp = (
    index,
    value
  ) => {
    const digit = value
      .replace(/\D/g, '')
      .slice(-1);

    setOtp(current => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    clearOtpError();

    if (
      digit &&
      index <
        OTP_LENGTH - 1
    ) {
      requestAnimationFrame(() => {
        inputRefs.current[
          index + 1
        ]?.focus();
      });
    }

    if (
      digit &&
      index ===
        OTP_LENGTH - 1
    ) {
      requestAnimationFrame(() => {
        setOtp(current => {
          const nextOtp = [
            ...current
          ];

          nextOtp[index] =
            digit;

          if (
            nextOtp.every(
              Boolean
            )
          ) {
            scheduleVerification(
              nextOtp.join('')
            );
          }

          return current;
        });
      });
    }
  };

  const scheduleVerification =
    value => {
      if (
        verificationTimerRef.current
      ) {
        clearTimeout(
          verificationTimerRef.current
        );
      }

      verificationTimerRef.current =
        setTimeout(() => {
          verifyCode(value);
        }, 80);
    };

  const handleOtpChange = (
    index,
    event
  ) => {
    if (
      busy ||
      otpState ===
        'success'
    ) {
      return;
    }

    const value =
      event.target.value;

    if (
      value.length > 1
    ) {
      handleOtpPaste(
        index,
        value
      );
      return;
    }

    updateOtp(
      index,
      value
    );
  };

  const handleOtpKeyDown = (
    index,
    event
  ) => {
    if (
      busy ||
      otpState ===
        'success'
    ) {
      return;
    }

    if (
      event.key ===
      'Backspace'
    ) {
      if (otp[index]) {
        setOtp(current => {
          const next = [
            ...current
          ];

          next[index] =
            '';

          return next;
        });

        clearOtpError();
        return;
      }

      if (index > 0) {
        event.preventDefault();

        setOtp(current => {
          const next = [
            ...current
          ];

          next[
            index - 1
          ] = '';

          return next;
        });

        clearOtpError();

        requestAnimationFrame(
          () => {
            inputRefs.current[
              index - 1
            ]?.focus();
          }
        );
      }

      return;
    }

    if (
      event.key ===
        'ArrowLeft' &&
      index > 0
    ) {
      event.preventDefault();

      inputRefs.current[
        index - 1
      ]?.focus();

      return;
    }

    if (
      event.key ===
        'ArrowRight' &&
      index <
        OTP_LENGTH - 1
    ) {
      event.preventDefault();

      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  const handleOtpPaste = (
    startIndex,
    value
  ) => {
    if (
      busy ||
      otpState ===
        'success'
    ) {
      return;
    }

    const digits = value
      .replace(/\D/g, '')
      .slice(
        0,
        OTP_LENGTH -
          startIndex
      );

    if (!digits) {
      return;
    }

    const nextOtp = [
      ...otp
    ];

    digits
      .split('')
      .forEach(
        (
          digit,
          offset
        ) => {
          const targetIndex =
            startIndex +
            offset;

          if (
            targetIndex <
            OTP_LENGTH
          ) {
            nextOtp[
              targetIndex
            ] = digit;
          }
        }
      );

    setOtp(nextOtp);
    clearOtpError();

    const nextEmptyIndex =
      nextOtp.findIndex(
        digit => !digit
      );

    if (
      nextOtp.every(
        Boolean
      )
    ) {
      scheduleVerification(
        nextOtp.join('')
      );

      return;
    }

    requestAnimationFrame(
      () => {
        inputRefs.current[
          nextEmptyIndex >= 0
            ? nextEmptyIndex
            : OTP_LENGTH - 1
        ]?.focus();
      }
    );
  };

  const handleOtpPasteEvent = (
    index,
    event
  ) => {
    event.preventDefault();

    const pasted =
      event.clipboardData
        .getData('text')
        .replace(/\D/g, '');

    handleOtpPaste(
      index,
      pasted
    );
  };

  const requestCode = async event => {
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

      setOtp(
        Array(OTP_LENGTH).fill('')
      );

      setOtpState('idle');

      setSuccess(
        'If the email is registered with CPMKU, a verification code has been sent.'
      );

      startCooldown();

      requestAnimationFrame(
        () => {
          inputRefs.current[
            0
          ]?.focus();
        }
      );
    } catch (error) {
      setError(
        error?.message ||
          'Gagal mengirim kode.'
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async value => {
    if (
      busy ||
      otpState ===
        'success'
    ) {
      return;
    }

    const cleanOtp = value
      .replace(/\D/g, '')
      .slice(
        0,
        OTP_LENGTH
      );

    if (
      cleanOtp.length !==
      OTP_LENGTH
    ) {
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');
    setOtpState(
      'verifying'
    );

    const startedAt =
      Date.now();

    try {
      const result =
        await api(
          '/auth/password-reset/verify',
          {
            method:
              'POST',
            body: JSON.stringify({
              email:
                email.trim(),
              otp:
                cleanOtp
            })
          }
        );

      if (
        !result?.resetToken
      ) {
        throw new Error(
          'Kode berhasil diverifikasi, tetapi reset token tidak diterima.'
        );
      }

      await waitForMinVerify(
        startedAt
      );

      setResetToken(
        result.resetToken
      );

      setOtpState(
        'success'
      );
    } catch (error) {
      await waitForMinVerify(
        startedAt
      );

      setError(
        getOtpErrorMessage(
          error
        )
      );

      setOtpState(
        'failed'
      );
    }
  };

  const waitForMinVerify =
    startedAt =>
      new Promise(
        resolve => {
          const remaining =
            Math.max(
              0,
              MIN_VERIFY_MS -
                (Date.now() -
                  startedAt)
            );

          const timer =
            setTimeout(
              resolve,
              remaining
            );

          animationTimersRef.current.push(
            timer
          );
        }
      );

  const reset = async event => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setError('');
    setSuccess('');

    if (
      password.length <
      6
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
          method:
            'POST',
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

      const timer =
        setTimeout(() => {
          nav('/login', {
            replace: true
          });
        }, 1200);

      animationTimersRef.current.push(
        timer
      );
    } catch (error) {
      setError(
        error?.message ||
          'Gagal mengubah password.'
      );

      setBusy(false);
    }
  };

  const startCooldown = () => {
    if (
      cooldownTimerRef.current
    ) {
      clearInterval(
        cooldownTimerRef.current
      );
    }

    setResendCooldown(
      120
    );

    let remaining = 120;

    cooldownTimerRef.current =
      setInterval(() => {
        remaining -= 1;

        setResendCooldown(
          Math.max(
            remaining,
            0
          )
        );

        if (
          remaining <=
          0
        ) {
          clearInterval(
            cooldownTimerRef.current
          );

          cooldownTimerRef.current =
            null;
        }
      }, 1000);
  };

  const resend = async () => {
    if (
      busy ||
      resendCooldown >
        0
    ) {
      return;
    }

    setError('');
    setSuccess('');
    setOtpState('idle');
    setBusy(true);

    try {
      await api(
        '/auth/password-reset/request',
        {
          method:
            'POST',
          body: JSON.stringify({
            email:
              email.trim()
          })
        }
      );

      setOtp(
        Array(OTP_LENGTH).fill('')
      );

      startCooldown();

      showToast(
        'OTP sudah dikirim.',
        'success'
      );

      requestAnimationFrame(
        () => {
          inputRefs.current[
            0
          ]?.focus();
        }
      );
    } catch (error) {
      showToast(
        error?.message ||
          'Gagal mengirim ulang kode.',
        'error'
      );
    } finally {
      setBusy(false);
    }
  };

  const formattedCooldown =
    `${Math.floor(
      resendCooldown / 60
    )}:${String(
      resendCooldown % 60
    ).padStart(
      2,
      '0'
    )}`;

  return (
    <>
      {toast && (
        <div
          className={`forgot-password-toast ${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="forgot-password-toast-icon">
            {toast.type ===
            'error'
              ? '!'
              : '✓'}
          </span>

          <span>
            {toast.message}
          </span>
        </div>
      )}

      <section className="auth-card auth-modern">
        <div className="auth-heading">
          <span className="eyebrow">
            CPMKU ACCOUNT
          </span>

          <h1>
            {step ===
              'email' &&
              'Forgot Password'}

            {step ===
              'otp' &&
              'Verify Code'}

            {step ===
              'password' &&
              'Set new password'}
          </h1>

          <p>
            {step ===
              'email' &&
              'Masukkan email akun CPMKU kamu untuk menerima kode reset password.'}

            {step ===
              'otp' &&
              'Masukkan 6 digit kode yang dikirim ke email kamu.'}

            {step ===
              'password' &&
              'Buat password baru untuk akun CPMKU kamu.'}
          </p>
        </div>

        {error &&
          step !==
            'otp' && (
            <div className="notice error">
              {error}
            </div>
          )}

        {success &&
          step !==
            'otp' && (
            <div className="notice success">
              {success}
            </div>
          )}

        {step ===
          'email' && (
          <form
            className="auth-form"
            onSubmit={
              requestCode
            }
          >
            <label>
              Email

              <input
                type="email"
                value={email}
                onChange={event =>
                  setEmail(
                    event.target
                      .value
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

        {step ===
          'otp' && (
          <div>
            <div
              className={`cpmku-otp-stage state-${otpState}`}
              aria-label="OTP verification"
            >
              <div
                className={`cpmku-otp-row ${
                  otpState ===
                  'error'
                    ? 'shake'
                    : ''
                }`}
              >
                {otp.map(
                  (
                    digit,
                    index
                  ) => (
                    <input
                      key={
                        index
                      }
                      ref={element =>
                        setInputRef(
                          element,
                          index
                        )
                      }
                      className={`cpmku-otp-cell ${
                        otpState ===
                        'error'
                          ? 'invalid'
                          : ''
                      }`}
                      type="text"
                      inputMode="numeric"
                      maxLength={
                        1
                      }
                      value={
                        digit
                      }
                      disabled={
                        busy ||
                        otpState ===
                          'success'
                      }
                      autoComplete={
                        index ===
                        0
                          ? 'one-time-code'
                          : 'off'
                      }
                      aria-label={`OTP digit ${
                        index + 1
                      }`}
                      onChange={event =>
                        handleOtpChange(
                          index,
                          event
                        )
                      }
                      onKeyDown={event =>
                        handleOtpKeyDown(
                          index,
                          event
                        )
                      }
                      onPaste={event =>
                        handleOtpPasteEvent(
                          index,
                          event
                        )
                      }
                    />
                  )
                )}
              </div>

              <div
                className="cpmku-otp-orbit"
                aria-hidden="true"
              >
                {otp.map(
                  (
                    digit,
                    index
                  ) => (
                    <span
                      key={
                        index
                      }
                      className="cpmku-otp-tile"
                      style={{
                        '--i':
                          index,
                        '--ux':
                          ORBIT_UNITS[
                            index
                          ].x,
                        '--uy':
                          ORBIT_UNITS[
                            index
                          ].y
                      }}
                    >
                      {
                        digit
                      }
                    </span>
                  )
                )}
              </div>

              <div
                className="cpmku-otp-ring"
                aria-hidden="true"
              />

              <div className="cpmku-otp-success">
                <svg
                  className="cpmku-otp-success-check"
                  viewBox="0 0 48 48"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    className="cpmku-otp-success-path"
                    d="M11 25.5L20.5 35L37.5 15"
                  />
                </svg>
              </div>
            </div>

            <div
              className={`cpmku-otp-error ${
                otpState ===
                'error'
                  ? 'show'
                  : ''
              }`}
              aria-live="assertive"
            >
              {error ||
                'Invalid OTP verification'}
            </div>

            <div className="forgot-resend-wrap">
              <button
                type="button"
                className="button forgot-resend-button"
                onClick={
                  resend
                }
                disabled={
                  busy ||
                  resendCooldown >
                    0 ||
                  otpState ===
                    'success'
                }
              >
                {resendCooldown >
                0
                  ? `Resend code in ${formattedCooldown}`
                  : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {step ===
          'password' && (
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
                    event.target
                      .value
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
                value={
                  confirmPassword
                }
                onChange={event =>
                  setConfirmPassword(
                    event.target
                      .value
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

            <button
              type="submit"
              className="button primary auth-submit"
              disabled={
                busy ||
                password.length <
                  6 ||
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

        {step !==
          'password' && (
          <p className="auth-switch">
            Remember your password?{' '}

            <Link to="/login">
              Sign In
            </Link>
          </p>
        )}

        {step ===
          'password' && (
          <p className="auth-switch">
            <Link to="/login">
              Back to Sign In
            </Link>
          </p>
        )}
      </section>
    </>
  );
}

function getOtpErrorMessage(
  error
) {
  const message =
    error?.message ||
    '';

  if (
    message.includes(
      'You have 2 trials remaining'
    )
  ) {
    return 'Incorrect code. You have 2 trials remaining.';
  }

  if (
    message.includes(
      'You have 1 trials remaining'
    )
  ) {
    return 'Incorrect code. You have 1 trials remaining.';
  }

  if (
    message.includes(
      'You have 0 trials remaining'
    )
  ) {
    return 'Incorrect code. You have 0 trials remaining. Please request a new code.';
  }

  return (
    message ||
    'Invalid OTP verification'
  );
}
