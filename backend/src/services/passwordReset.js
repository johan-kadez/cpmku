import crypto from 'node:crypto';

import { db, auth } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';
import { sendPasswordResetOtp } from './mail.js';

const OTP_TTL_MS =
  15 * 60 * 1000;

const RESEND_COOLDOWN_MS =
  2 * 60 * 1000;

const RESET_TOKEN_TTL_MS =
  10 * 60 * 1000;

const MAX_ATTEMPTS = 3;

function cleanEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function hash(value) {
  return crypto
    .createHash('sha256')
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

export async function requestPasswordResetOtp(
  email
) {
  const clean =
    cleanEmail(email);

  if (
    !clean ||
    !/^\S+@\S+\.\S+$/.test(clean)
  ) {
    throw new HttpError(
      400,
      'Format email tidak valid.'
    );
  }

  const ref =
    db
      .collection(
        'passwordResetOtps'
      )
      .doc(hash(clean));

  const snapshot =
    await ref.get();

  const now =
    Date.now();

  if (snapshot.exists) {
    const data =
      snapshot.data();

    const resendAt =
      timestampMillis(
        data.resendAvailableAt
      );

    if (resendAt > now) {
      const error =
        new HttpError(
          429,
          'Please wait before requesting a new code.'
        );

      error.retryAfter =
        Math.ceil(
          (resendAt - now) /
          1000
        );

      throw error;
    }
  }

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

  if (firebaseUser.disabled) {
    return genericRequestResponse();
  }

  const otp =
    generateOtp();

  await ref.set({
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
        now + OTP_TTL_MS
      ),

    resendAvailableAt:
      new Date(
        now + RESEND_COOLDOWN_MS
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
  });

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
  otp
) {
  const clean =
    cleanEmail(email);

  const cleanOtp =
    String(otp || '')
      .replace(/\D/g, '');

  if (
    !clean ||
    cleanOtp.length !== 6
  ) {
    throw new HttpError(
      400,
      'Kode OTP tidak valid.'
    );
  }

  const ref =
    db
      .collection(
        'passwordResetOtps'
      )
      .doc(hash(clean));

  const snapshot =
    await ref.get();

  if (!snapshot.exists) {
    throw new HttpError(
      400,
      'Kode OTP tidak valid atau sudah kedaluwarsa.'
    );
  }

  const data =
    snapshot.data();

  const now =
    Date.now();

  if (
    timestampMillis(
      data.expiresAt
    ) <= now
  ) {
    await ref.delete();

    throw new HttpError(
      400,
      'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.'
    );
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
    await ref.delete();

    throw new HttpError(
      400,
      'Kode OTP sudah tidak dapat digunakan. Silakan minta kode baru.'
    );
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
      await ref.delete();

      throw new HttpError(
        400,
        'Incorrect code. You have 0 trials remaining. Please request a new code.'
      );
    }

    await ref.update({
      attemptsRemaining:
        nextRemaining,

      updatedAt:
        new Date()
    });

    throw new HttpError(
      400,
      `Incorrect code. You have ${nextRemaining} trials remaining.`
    );
  }

  const resetToken =
    generateResetToken();

  await ref.update({
    codeHash:
      null,

    attemptsRemaining:
      0,

    verifiedAt:
      new Date(),

    resetTokenHash:
      hash(resetToken),

    resetTokenExpiresAt:
      new Date(
        now +
        RESET_TOKEN_TTL_MS
      ),

    updatedAt:
      new Date()
  });

  return {
    ok: true,
    resetToken
  };
}

export async function resetPassword(
  email,
  resetToken,
  newPassword,
  confirmPassword
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

  const ref =
    db
      .collection(
        'passwordResetOtps'
      )
      .doc(hash(clean));

  const snapshot =
    await ref.get();

  if (!snapshot.exists) {
    throw new HttpError(
      400,
      'Reset password tidak valid atau sudah kedaluwarsa.'
    );
  }

  const data =
    snapshot.data();

  const now =
    Date.now();

  if (
    !data.resetTokenHash ||
    !safeEqualHex(
      hash(token),
      String(
        data.resetTokenHash
      )
    )
  ) {
    throw new HttpError(
      400,
      'Reset password tidak valid atau sudah kedaluwarsa.'
    );
  }

  if (
    timestampMillis(
      data.resetTokenExpiresAt
    ) <= now
  ) {
    await ref.delete();

    throw new HttpError(
      400,
      'Reset password sudah kedaluwarsa. Silakan mulai lagi.'
    );
  }

  await auth.updateUser(
    data.uid,
    {
      password
    }
  );

  await ref.delete();

  return {
    ok: true
  };
}
