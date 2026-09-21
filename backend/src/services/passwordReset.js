import crypto from 'node:crypto';

import { db, auth } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';
import { sendPasswordResetOtp } from './mail.js';
import { env } from '../config/env.js';

const OTP_TTL_MS =
  15 * 60 * 1000;

const RESEND_COOLDOWN_MS =
  2 * 60 * 1000;

const RESET_TOKEN_TTL_MS =
  10 * 60 * 1000;

const MAX_ATTEMPTS = 3;

const REQUEST_IP_LIMIT = 5;
const REQUEST_IP_WINDOW_MS = 15 * 60 * 1000;

const REQUEST_EMAIL_LIMIT = 3;
const REQUEST_EMAIL_WINDOW_MS = 60 * 60 * 1000;

const VERIFY_IP_LIMIT = 10;
const VERIFY_IP_WINDOW_MS = 15 * 60 * 1000;

const VERIFY_EMAIL_LIMIT = 10;
const VERIFY_EMAIL_WINDOW_MS = 15 * 60 * 1000;

const RESET_EMAIL_LIMIT = 5;
const RESET_EMAIL_WINDOW_MS = 15 * 60 * 1000;

function cleanEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function cleanIp(ip) {
  const value = String(ip || '')
    .trim();

  if (!value) {
    return 'unknown';
  }

  return value.slice(0, 128);
}

function getSecret() {
  const secret = String(
    env.passwordReset.secret || ''
  );

  if (!secret) {
    throw new Error(
      'Missing PASSWORD_RESET_SECRET environment variable.'
    );
  }

  return secret;
}

function hash(value) {
  return crypto
    .createHmac(
      'sha256',
      getSecret()
    )
    .update(String(value))
    .digest('hex');
}

function safeEqualHex(a, b) {
  if (
    !a ||
    !b ||
    a.length !== b.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}

function generateOtp() {
  return String(
    crypto.randomInt(
      100000,
      1000000
    )
  );
}

function generateResetToken() {
  return crypto
    .randomBytes(32)
    .toString('hex');
}

function timestampMillis(value) {
  return value?.toMillis
    ? value.toMillis()
    : Number(value || 0);
}

function genericRequestResponse() {
  return {
    ok: true,
    message:
      'If the email is registered with CPMKU, a verification code has been sent.'
  };
}

function rateLimitError(
  message,
  retryAfter
) {
  const error = new HttpError(
    429,
    message
  );

  error.retryAfter =
    Math.max(
      1,
      Math.ceil(
        retryAfter / 1000
      )
    );

  return error;
}

function rateLimitRef(
  type,
  value
) {
  return db
    .collection(
      'passwordResetRateLimits'
    )
    .doc(
      hash(
        `${type}:${value}`
      )
    );
}

async function consumeRateLimit(
  type,
  value,
  limit,
  windowMs,
  message
) {
  const cleanValue =
    String(value || '').trim() ||
    'unknown';

  const ref =
    rateLimitRef(
      type,
      cleanValue
    );

  const now =
    Date.now();

  const result =
    await db.runTransaction(
      async transaction => {
        const snapshot =
          await transaction.get(
            ref
          );

        const data =
          snapshot.exists
            ? snapshot.data()
            : null;

        const expiresAt =
          timestampMillis(
            data?.expiresAt
          );

        let count =
          Number(
            data?.count
          );

        if (
          !Number.isInteger(count) ||
          expiresAt <= now
        ) {
          count = 0;
        }

        if (
          count >= limit
        ) {
          return {
            limited: true,
            retryAfter:
              expiresAt > now
                ? expiresAt - now
                : windowMs
          };
        }

        const nextCount =
          count + 1;

        transaction.set(
          ref,
          {
            count: nextCount,
            expiresAt:
              new Date(
                count === 0 ||
                expiresAt <= now
                  ? now + windowMs
                  : expiresAt
              ),
            updatedAt:
              new Date(now)
          },
          {
            merge: true
          }
        );

        return {
          limited: false
        };
      }
    );

  if (result.limited) {
    throw rateLimitError(
      message,
      result.retryAfter
    );
  }
}

export async function requestPasswordResetOtp(
  email,
  ip
) {
  const clean =
    cleanEmail(email);

  const clientIp =
    cleanIp(ip);

  if (
    !clean ||
    !/^\S+@\S+\.\S+$/.test(
      clean
    )
  ) {
    throw new HttpError(
      400,
      'Format email tidak valid.'
    );
  }

  await consumeRateLimit(
    'request-ip',
    clientIp,
    REQUEST_IP_LIMIT,
    REQUEST_IP_WINDOW_MS,
    'Too many password reset requests. Please try again later.'
  );

  await consumeRateLimit(
    'request-email',
    clean,
    REQUEST_EMAIL_LIMIT,
    REQUEST_EMAIL_WINDOW_MS,
    'Too many password reset requests. Please try again later.'
  );

  const ref =
    db
      .collection(
        'passwordResetOtps'
      )
      .doc(hash(clean));

  const now =
    Date.now();

  let otp;
  let firebaseUser;

  try {
    firebaseUser =
      await auth.getUserByEmail(
        clean
      );
  } catch (error) {
    if (
      error?.code ===
      'auth/user-not-found'
    ) {
      return genericRequestResponse();
    }

    throw error;
  }

  if (
    firebaseUser.disabled
  ) {
    return genericRequestResponse();
  }

  otp =
    generateOtp();

  const transactionResult =
    await db.runTransaction(
      async transaction => {
        const snapshot =
          await transaction.get(
            ref
          );

        if (snapshot.exists) {
          const data =
            snapshot.data();

          const resendAt =
            timestampMillis(
              data.resendAvailableAt
            );

          if (
            resendAt > now
          ) {
            return {
              limited: true,
              retryAfter:
                resendAt - now
            };
          }
        }

        transaction.set(
          ref,
          {
            uid:
              firebaseUser.uid,

            email:
              clean,

            codeHash:
              hash(otp),

            attemptsRemaining:
              MAX_ATTEMPTS,

            expiresAt:
              new Date(
                now +
                OTP_TTL_MS
              ),

            resendAvailableAt:
              new Date(
                now +
                RESEND_COOLDOWN_MS
              ),

            resetTokenHash:
              null,

            resetTokenExpiresAt:
              null,

            verifiedAt:
              null,

            createdAt:
              new Date(now),

            updatedAt:
              new Date(now)
          }
        );

        return {
          limited: false
        };
      }
    );

  if (
    transactionResult.limited
  ) {
    throw rateLimitError(
      'Please wait before requesting a new code.',
      transactionResult.retryAfter
    );
  }

  try {
    await sendPasswordResetOtp(
      clean,
      otp
    );
  } catch (error) {
    await ref.delete();
    throw error;
  }

  return genericRequestResponse();
}

export async function verifyPasswordResetOtp(
  email,
  otp,
  ip
) {
  const clean =
    cleanEmail(email);

  const cleanOtp =
    String(otp || '')
      .replace(/\D/g, '');

  const clientIp =
    cleanIp(ip);

  if (
    !clean ||
    cleanOtp.length !== 6
  ) {
    throw new HttpError(
      400,
      'Kode OTP tidak valid.'
    );
  }

  await consumeRateLimit(
    'verify-ip',
    clientIp,
    VERIFY_IP_LIMIT,
    VERIFY_IP_WINDOW_MS,
    'Too many verification attempts. Please try again later.'
  );

  await consumeRateLimit(
    'verify-email',
    clean,
    VERIFY_EMAIL_LIMIT,
    VERIFY_EMAIL_WINDOW_MS,
    'Too many verification attempts. Please try again later.'
  );

  const ref =
    db
      .collection(
        'passwordResetOtps'
      )
      .doc(hash(clean));

  const now =
    Date.now();

  const result =
    await db.runTransaction(
      async transaction => {
        const snapshot =
          await transaction.get(
            ref
          );

        if (!snapshot.exists) {
          return {
            type: 'invalid'
          };
        }

        const data =
          snapshot.data();

        if (
          timestampMillis(
            data.expiresAt
          ) <= now
        ) {
          transaction.delete(
            ref
          );

          return {
            type: 'expired'
          };
        }

        const remaining =
          Number(
            data.attemptsRemaining
          );

        if (
          !Number.isInteger(
            remaining
          ) ||
          remaining <= 0
        ) {
          transaction.delete(
            ref
          );

          return {
            type: 'attempts'
          };
        }

        const matches =
          safeEqualHex(
            hash(cleanOtp),
            String(
              data.codeHash || ''
            )
          );

        if (!matches) {
          const nextRemaining =
            remaining - 1;

          if (
            nextRemaining <= 0
          ) {
            transaction.delete(
              ref
            );

            return {
              type: 'wrong',
              remaining: 0
            };
          }

          transaction.update(
            ref,
            {
              attemptsRemaining:
                nextRemaining,

              updatedAt:
                new Date(now)
            }
          );

          return {
            type: 'wrong',
            remaining:
              nextRemaining
          };
        }

        const resetToken =
          generateResetToken();

        transaction.update(
          ref,
          {
            codeHash:
              null,

            attemptsRemaining:
              0,

            verifiedAt:
              new Date(now),

            resetTokenHash:
              hash(
                resetToken
              ),

            resetTokenExpiresAt:
              new Date(
                now +
                RESET_TOKEN_TTL_MS
              ),

            updatedAt:
              new Date(now)
          }
        );

        return {
          type: 'success',
          resetToken
        };
      }
    );

  if (
    result.type ===
    'invalid'
  ) {
    throw new HttpError(
      400,
      'Kode OTP tidak valid atau sudah kedaluwarsa.'
    );
  }

  if (
    result.type ===
    'expired'
  ) {
    throw new HttpError(
      400,
      'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.'
    );
  }

  if (
    result.type ===
    'attempts'
  ) {
    throw new HttpError(
      400,
      'Kode OTP sudah tidak dapat digunakan. Silakan minta kode baru.'
    );
  }

  if (
    result.type ===
    'wrong'
  ) {
    if (
      result.remaining === 0
    ) {
      throw new HttpError(
        400,
        'Incorrect code. You have 0 trials remaining. Please request a new code.'
      );
    }

    throw new HttpError(
      400,
      `Incorrect code. You have ${result.remaining} trials remaining.`
    );
  }

  return {
    ok: true,
    resetToken:
      result.resetToken
  };
}

export async function resetPassword(
  email,
  resetToken,
  newPassword,
  confirmPassword,
  ip
) {
  const clean =
    cleanEmail(email);

  const token =
    String(
      resetToken || ''
    ).trim();

  const password =
    String(
      newPassword || ''
    );

  const confirmation =
    String(
      confirmPassword || ''
    );

  const clientIp =
    cleanIp(ip);

  if (
    !clean ||
    !token
  ) {
    throw new HttpError(
      400,
      'Data reset password tidak lengkap.'
    );
  }

  if (
    password.length < 6
  ) {
    throw new HttpError(
      400,
      'Password minimal 6 karakter.'
    );
  }

  if (
    password !==
    confirmation
  ) {
    throw new HttpError(
      400,
      "Passwords don't match."
    );
  }

  await consumeRateLimit(
    'reset-email',
    clean,
    RESET_EMAIL_LIMIT,
    RESET_EMAIL_WINDOW_MS,
    'Too many password reset attempts. Please try again later.'
  );

  await consumeRateLimit(
    'reset-ip',
    clientIp,
    RESET_EMAIL_LIMIT,
    RESET_EMAIL_WINDOW_MS,
    'Too many password reset attempts. Please try again later.'
  );

  const ref =
    db
      .collection(
        'passwordResetOtps'
      )
      .doc(hash(clean));

  const now =
    Date.now();

  const result =
    await db.runTransaction(
      async transaction => {
        const snapshot =
          await transaction.get(
            ref
          );

        if (!snapshot.exists) {
          return {
            type: 'invalid'
          };
        }

        const data =
          snapshot.data();

        if (
          !data.resetTokenHash ||
          !safeEqualHex(
            hash(token),
            String(
              data.resetTokenHash
            )
          )
        ) {
          return {
            type: 'invalid'
          };
        }

        if (
          timestampMillis(
            data.resetTokenExpiresAt
          ) <= now
        ) {
          transaction.delete(
            ref
          );

          return {
            type: 'expired'
          };
        }

        transaction.delete(
          ref
        );

        return {
          type: 'success',
          uid: data.uid
        };
      }
    );

  if (
    result.type ===
    'expired'
  ) {
    throw new HttpError(
      400,
      'Reset password sudah kedaluwarsa. Silakan mulai lagi.'
    );
  }

  if (
    result.type !==
    'success'
  ) {
    throw new HttpError(
      400,
      'Reset password tidak valid atau sudah kedaluwarsa.'
    );
  }

  await auth.updateUser(
    result.uid,
    {
      password
    }
  );

  return {
    ok: true
  };
}
