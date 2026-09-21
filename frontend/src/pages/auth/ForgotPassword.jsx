import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const OTP_LENGTH = 6;
const ORBIT_RADIUS = 82;
const ORBIT_SCALE = 0.85;
const ORBIT_DURATION = 1900;
const ORBIT_FRAMES = 90;
const SUCCESS_REVEAL_DELAY = 1770;
const SUCCESS_HOLD = 1000;

// Akhir tiap fase animasi, dihitung dari 0 sampai 1 dari ORBIT_DURATION:
// kumpul ke tengah -> menyebar jadi lingkaran -> berputar -> menyusut ke tengah.
const PHASE_GATHER = 0.12;
const PHASE_SPREAD = 0.26;
const PHASE_SPIN = 0.82;

const easeInOutCubic = t =>
  t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeOutCubic = t =>
  1 - Math.pow(1 - t, 3);

// Posisi satu kotak OTP pada progress tertentu (0 sampai 1).
// x dan y dihitung dari tengah stage; start = posisi awal kotak di baris.
function getOrbitFrame(progress, start, baseAngle, radius) {
  if (progress < PHASE_GATHER) {
    const k = easeInOutCubic(
      progress / PHASE_GATHER
    );

    return {
      x: start.x * (1 - k),
      y: start.y * (1 - k),
      rotate: 0,
      scale: 1 - (1 - ORBIT_SCALE) * k,
      opacity: 1
    };
  }

  if (progress < PHASE_SPREAD) {
    const k = easeOutCubic(
      (progress - PHASE_GATHER) /
      (PHASE_SPREAD - PHASE_GATHER)
    );

    return {
      x: Math.cos(baseAngle) * radius * k,
      y: Math.sin(baseAngle) * radius * k,
      rotate: 0,
      scale: ORBIT_SCALE,
      opacity: 1
    };
  }

  if (progress < PHASE_SPIN) {
    const k = easeInOutCubic(
      (progress - PHASE_SPREAD) /
      (PHASE_SPIN - PHASE_SPREAD)
    );

    const spin = k * 360;
    const angle =
      baseAngle + (spin * Math.PI) / 180;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotate: spin,
      scale: ORBIT_SCALE,
      opacity: 1
    };
  }

  const k = easeInOutCubic(
    (progress - PHASE_SPIN) /
    (1 - PHASE_SPIN)
  );

  const spin = 360 + k * 120;
  const angle =
    baseAngle + (spin * Math.PI) / 180;

  const distance = radius * (1 - k);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: spin,
    scale: ORBIT_SCALE * (1 - 0.4 * k),
    opacity: 1 - k * k
  };
}

export default function ForgotPassword() {
  const nav = useNavigate();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpState, setOtpState] = useState('idle');

  const inputRefs = useRef([]);
  const cooldownTimerRef = useRef(null);
  const verificationTimerRef = useRef(null);
  const animationTimersRef = useRef([]);
  const otpAnimationsRef = useRef([]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }

      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
      }

      animationTimersRef.current.forEach(timer => {
        clearTimeout(timer);
      });

      otpAnimationsRef.current.forEach(animation => {
        try {
          animation.cancel();
        } catch {
          // Ignore cancelled animations during unmount.
        }
      });
    };
  }, []);

  useEffect(() => {
    if (otpState !== 'success') {
      return;
    }

    const frame = requestAnimationFrame(() => {
      playSuccessAnimation();
    });

    return () => cancelAnimationFrame(frame);
  }, [otpState]);

  const setInputRef = (element, index) => {
    inputRefs.current[index] = element;
  };

  const clearOtpError = () => {
    if (otpState === 'error') {
      setOtpState('idle');
    }

    setError('');
  };

  const updateOtp = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);

    setOtp(current => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    clearOtpError();

    if (digit && index < OTP_LENGTH - 1) {
      requestAnimationFrame(() => {
        inputRefs.current[index + 1]?.focus();
      });
    }

    if (digit && index === OTP_LENGTH - 1) {
      requestAnimationFrame(() => {
        setOtp(current => {
          const nextOtp = [...current];
          nextOtp[index] = digit;

          if (nextOtp.every(Boolean)) {
            scheduleVerification(nextOtp.join(''));
          }

          return current;
        });
      });
    }
  };

  const scheduleVerification = value => {
    if (verificationTimerRef.current) {
      clearTimeout(verificationTimerRef.current);
    }

    verificationTimerRef.current = setTimeout(() => {
      verifyCode(value);
    }, 80);
  };

  const handleOtpChange = (index, event) => {
    if (busy || otpState === 'success') {
      return;
    }

    const value = event.target.value;

    if (value.length > 1) {
      handleOtpPaste(index, value);
      return;
    }

    updateOtp(index, value);
  };

  const handleOtpKeyDown = (index, event) => {
    if (busy || otpState === 'success') {
      return;
    }

    if (event.key === 'Backspace') {
      if (otp[index]) {
        setOtp(current => {
          const next = [...current];
          next[index] = '';
          return next;
        });

        clearOtpError();
        return;
      }

      if (index > 0) {
        event.preventDefault();

        setOtp(current => {
          const next = [...current];
          next[index - 1] = '';
          return next;
        });

        clearOtpError();

        requestAnimationFrame(() => {
          inputRefs.current[index - 1]?.focus();
        });
      }

      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (
      event.key === 'ArrowRight' &&
      index < OTP_LENGTH - 1
    ) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (startIndex, value) => {
    if (busy || otpState === 'success') {
      return;
    }

    const digits = value
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH - startIndex);

    if (!digits) {
      return;
    }

    const nextOtp = [...otp];

    digits.split('').forEach((digit, offset) => {
      const targetIndex = startIndex + offset;

      if (targetIndex < OTP_LENGTH) {
        nextOtp[targetIndex] = digit;
      }
    });

    setOtp(nextOtp);
    clearOtpError();

    const nextEmptyIndex = nextOtp.findIndex(
      digit => !digit
    );

    if (nextOtp.every(Boolean)) {
      scheduleVerification(nextOtp.join(''));
      return;
    }

    requestAnimationFrame(() => {
      inputRefs.current[
        nextEmptyIndex >= 0
          ? nextEmptyIndex
          : OTP_LENGTH - 1
      ]?.focus();
    });
  };

  const handleOtpPasteEvent = (index, event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '');

    handleOtpPaste(index, pasted);
  };

  const requestCode = async event => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setError('');
    setSuccess('');

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Email wajib diisi.');
      return;
    }

    setBusy(true);

    try {
      await api(
        '/auth/password-reset/request',
        {
          method: 'POST',
          body: JSON.stringify({
            email: cleanEmail
          })
        }
      );

      setStep('otp');
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpState('idle');

      setSuccess(
        'If the email is registered with CPMKU, a verification code has been sent.'
      );

      startCooldown();

      requestAnimationFrame(() => {
        inputRefs.current[0]?.focus();
      });
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
    if (busy || otpState === 'success') {
      return;
    }

    const cleanOtp = value
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);

    if (cleanOtp.length !== OTP_LENGTH) {
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const result = await api(
        '/auth/password-reset/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            otp: cleanOtp
          })
        }
      );

      if (!result?.resetToken) {
        throw new Error(
          'Kode berhasil diverifikasi, tetapi reset token tidak diterima.'
        );
      }

      setResetToken(result.resetToken);
      setOtpState('success');
    } catch (error) {
      setOtpState('error');

      setError(
        getOtpErrorMessage(error)
      );

      setBusy(false);

      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 650);

      animationTimersRef.current.push(timer);
    }
  };

  const playSuccessAnimation = () => {
    const cells = inputRefs.current.filter(Boolean);

    if (cells.length !== OTP_LENGTH) {
      return;
    }

    otpAnimationsRef.current.forEach(animation => {
      try {
        animation.cancel();
      } catch {
        // Ignore cancelled animations.
      }
    });

    otpAnimationsRef.current = [];

    const stage = cells[0].closest(
      '.cpmku-otp-stage'
    );

    if (!stage) {
      return;
    }

    const stageRect =
      stage.getBoundingClientRect();

    const stageCenterX =
      stageRect.width / 2;

    const stageCenterY =
      stageRect.height / 2;

    // Lingkaran dibatasi supaya tidak keluar dari stage di layar kecil.
    const radius = Math.min(
      ORBIT_RADIUS,
      stageCenterY - 34
    );

    cells.forEach((cell, index) => {
      const rect =
        cell.getBoundingClientRect();

      // Posisi awal kotak relatif ke tengah stage.
      const start = {
        x:
          rect.left -
          stageRect.left +
          rect.width / 2 -
          stageCenterX,

        y:
          rect.top -
          stageRect.top +
          rect.height / 2 -
          stageCenterY
      };

      const baseAngle =
        (Math.PI * 2 * index) /
        OTP_LENGTH -
        Math.PI / 2;

      const keyframes = [];

      for (
        let i = 0;
        i <= ORBIT_FRAMES;
        i += 1
      ) {
        const progress =
          i / ORBIT_FRAMES;

        const frame = getOrbitFrame(
          progress,
          start,
          baseAngle,
          radius
        );

        // transform dihitung dari posisi asli kotak di baris,
        // jadi yang dipakai selisih terhadap posisi awal.
        keyframes.push({
          transform:
            `translate(${frame.x - start.x}px, ${frame.y - start.y}px) ` +
            `rotate(${frame.rotate}deg) ` +
            `scale(${frame.scale})`,

          opacity: frame.opacity,
          offset: progress
        });
      }

      cell.classList.add('orbiting-active');

      const animation =
        cell.animate(
          keyframes,
          {
            duration:
              ORBIT_DURATION,

            easing: 'linear',
            fill: 'forwards'
          }
        );

      otpAnimationsRef.current.push(
        animation
      );
    });

    const revealTimer = setTimeout(() => {
      stage
        .querySelector('.cpmku-otp-success')
        ?.classList.add('show');

      stage
        .querySelector('.cpmku-otp-ring')
        ?.classList.add('show');
    }, SUCCESS_REVEAL_DELAY);

    animationTimersRef.current.push(
      revealTimer
    );

    const finishTimer = setTimeout(() => {
      cells.forEach(cell => {
        cell.style.opacity = '0';
        cell.style.visibility = 'hidden';
      });

      setStep('password');
      setOtpState('idle');
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      setSuccess('');
      setBusy(false);
    }, SUCCESS_REVEAL_DELAY + SUCCESS_HOLD);

    animationTimersRef.current.push(
      finishTimer
    );
  };

  const reset = async event => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError(
        'Password minimal 6 karakter.'
      );
      return;
    }

    if (password !== confirmPassword) {
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
            email: email.trim(),
            resetToken,
            newPassword: password,
            confirmPassword
          })
        }
      );

      setSuccess(
        'Password berhasil diubah. Mengembalikan ke Sign In...'
      );

      const timer = setTimeout(() => {
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
    if (cooldownTimerRef.current) {
      clearInterval(
        cooldownTimerRef.current
      );
    }

    setResendCooldown(120);

    let remaining = 120;

    cooldownTimerRef.current =
      setInterval(() => {
        remaining -= 1;

        setResendCooldown(
          Math.max(remaining, 0)
        );

        if (remaining <= 0) {
          clearInterval(
            cooldownTimerRef.current
          );

          cooldownTimerRef.current = null;
        }
      }, 1000);
  };

  const resend = async () => {
    if (
      busy ||
      resendCooldown > 0
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
          method: 'POST',
          body: JSON.stringify({
            email: email.trim()
          })
        }
      );

      setOtp(Array(OTP_LENGTH).fill(''));

      setSuccess(
        'A new verification code has been sent.'
      );

      startCooldown();

      requestAnimationFrame(() => {
        inputRefs.current[0]?.focus();
      });
    } catch (error) {
      setError(
        error?.message ||
        'Gagal mengirim ulang kode.'
      );
    } finally {
      setBusy(false);
    }
  };

  const formattedCooldown =
    `${Math.floor(resendCooldown / 60)}:${String(
      resendCooldown % 60
    ).padStart(2, '0')}`;

  return (
    <>
      <style>{`
        .cpmku-otp-stage {
          position: relative;
          width: 100%;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .cpmku-otp-row {
          position: relative;
          z-index: 2;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .cpmku-otp-cell {
          width: 48px;
          height: 60px;
          flex: 0 0 48px;
          padding: 0;
          border: 1px solid rgba(96, 165, 250, 0.62);
          border-radius: 14px;
          outline: none;
          background: rgba(15, 23, 42, 0.68);
          color: #ffffff;
          text-align: center;
          font-size: 23px;
          font-weight: 600;
          caret-color: #60a5fa;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 0 0 rgba(59, 130, 246, 0);

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .cpmku-otp-cell:focus {
          border-color: #60a5fa;
          background: rgba(30, 41, 59, 0.8);
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.11),
            0 0 25px rgba(59, 130, 246, 0.18);
        }

        .cpmku-otp-cell.invalid {
          border-color: #ef4444;
          background: rgba(127, 29, 29, 0.22);
          box-shadow:
            0 0 0 3px rgba(239, 68, 68, 0.08),
            0 0 25px rgba(239, 68, 68, 0.16);
        }

        .cpmku-otp-row.shake
          .cpmku-otp-cell {
          animation:
            cpmkuOtpShake
            0.56s
            cubic-bezier(.36,.07,.19,.97);
        }

        @keyframes cpmkuOtpShake {
          0%, 100% {
            transform: translateX(0);
          }

          12% {
            transform: translateX(-7px);
          }

          24% {
            transform: translateX(7px);
          }

          36% {
            transform: translateX(-6px);
          }

          48% {
            transform: translateX(6px);
          }

          60% {
            transform: translateX(-4px);
          }

          72% {
            transform: translateX(4px);
          }

          84% {
            transform: translateX(-2px);
          }
        }

        .cpmku-otp-cell.orbiting-active {
          position: relative;
          z-index: 5;
          pointer-events: none;
          transform-origin: center center;
          will-change: transform, opacity;
        }

        .cpmku-otp-success {
          position: absolute;
          z-index: 10;
          left: 50%;
          top: 50%;
          width: 0;
          height: 60px;
          margin-top: -30px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(74, 222, 128, 0.95);
          border-radius: 15px;
          background: rgba(20, 83, 45, 0.22);
          opacity: 0;
          box-shadow:
            0 0 0 3px rgba(34, 197, 94, 0.08),
            0 0 28px rgba(34, 197, 94, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          pointer-events: none;
        }

        .cpmku-otp-success.show {
          animation:
            cpmkuOtpSuccessBox
            0.48s
            cubic-bezier(.22,1,.36,1)
            forwards;
        }

        @keyframes cpmkuOtpSuccessBox {
          0% {
            width: 0;
            transform:
              translateX(0)
              scale(.72);
            opacity: 0;
          }

          60% {
            width: 76px;
            transform:
              translateX(-38px)
              scale(1.08);
            opacity: 1;
          }

          100% {
            width: 72px;
            transform:
              translateX(-36px)
              scale(1);
            opacity: 1;
          }
        }

        .cpmku-otp-success-check {
          width: 35px;
          height: 35px;
          overflow: visible;
        }

        .cpmku-otp-success-path {
          fill: none;
          stroke: #4ade80;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 42;
          stroke-dashoffset: 42;
          filter:
            drop-shadow(
              0 0 7px
              rgba(74, 222, 128, 0.5)
            );
        }

        .cpmku-otp-success.show
          .cpmku-otp-success-path {
          animation:
            cpmkuOtpDrawCheck
            0.42s
            cubic-bezier(.65,0,.35,1)
            0.08s
            forwards;
        }

        @keyframes cpmkuOtpDrawCheck {
          from {
            stroke-dashoffset: 42;
          }

          to {
            stroke-dashoffset: 0;
          }
        }

        .cpmku-otp-ring {
          position: absolute;
          z-index: 9;
          left: 50%;
          top: 50%;
          width: 64px;
          height: 64px;
          margin: -32px 0 0 -32px;
          border: 2px solid rgba(74, 222, 128, 0.85);
          border-radius: 50%;
          opacity: 0;
          box-shadow: 0 0 22px rgba(34, 197, 94, 0.35);
          pointer-events: none;
        }

        .cpmku-otp-ring.show {
          animation:
            cpmkuOtpRing
            0.8s
            cubic-bezier(.22,1,.36,1)
            forwards;
        }

        @keyframes cpmkuOtpRing {
          0% {
            transform: scale(0.55);
            opacity: 0.9;
          }

          100% {
            transform: scale(2.7);
            opacity: 0;
          }
        }

        .cpmku-otp-error {
          min-height: 22px;
          margin-top: -2px;
          color: #f87171;
          font-size: 13px;
          text-align: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .cpmku-otp-error.show {
          opacity: 1;
        }

        @media (max-width: 430px) {
          .cpmku-otp-stage {
            height: 205px;
          }

          .cpmku-otp-row {
            gap: 5px;
          }

          .cpmku-otp-cell {
            width: 43px;
            height: 56px;
            flex-basis: 43px;
            border-radius: 12px;
            font-size: 21px;
          }
        }
      `}</style>

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

        {error &&
          step !== 'otp' && (
            <div className="notice error">
              {error}
            </div>
          )}

        {success &&
          step !== 'otp' && (
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
          <div>
            <div
              className="cpmku-otp-stage"
              aria-label="OTP verification"
            >
              <div
                className={
                  `cpmku-otp-row ${
                    otpState === 'error'
                      ? 'shake'
                      : ''
                  }`
                }
              >
                {otp.map(
                  (digit, index) => (
                    <input
                      key={index}
                      ref={element =>
                        setInputRef(
                          element,
                          index
                        )
                      }
                      className={
                        `cpmku-otp-cell ${
                          otpState === 'error'
                            ? 'invalid'
                            : ''
                        }`
                      }
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      disabled={
                        busy ||
                        otpState ===
                          'success'
                      }
                      autoComplete={
                        index === 0
                          ? 'one-time-code'
                          : 'off'
                      }
                      aria-label={
                        `OTP digit ${index + 1}`
                      }
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

              <div className="cpmku-otp-ring" />

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
              className={
                `cpmku-otp-error ${
                  otpState === 'error'
                    ? 'show'
                    : ''
                }`
              }
              aria-live="assertive"
            >
              {error ||
                'Invalid OTP verification'}
            </div>

            {success && (
              <div
                className="notice success"
                style={{
                  marginTop: '8px'
                }}
              >
                {success}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '14px'
              }}
            >
              <button
                type="button"
                className="button"
                onClick={resend}
                disabled={
                  busy ||
                  resendCooldown > 0 ||
                  otpState === 'success'
                }
              >
                {resendCooldown > 0
                  ? `Resend code in ${formattedCooldown}`
                  : 'Resend code'}
              </button>
            </div>
          </div>
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
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      marginTop: '6px',
                      display: 'block'
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
    </>
  );
}

function getOtpErrorMessage(error) {
  const message =
    error?.message || '';

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
