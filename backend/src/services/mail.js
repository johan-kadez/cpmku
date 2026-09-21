import nodemailer from 'nodemailer';

import { env } from '../config/env.js';

function required(
  name,
  value
) {
  if (
    !String(value || '').trim()
  ) {
    throw new Error(
      `${name} belum dikonfigurasi.`
    );
  }

  return String(value).trim();
}

function getTransporter() {
  return nodemailer.createTransport({
    host:
      required(
        'ZOHO_SMTP_HOST',
        env.mail.host
      ),

    port:
      Number(
        env.mail.port || 465
      ),

    secure:
      env.mail.secure,

    auth: {
      user:
        required(
          'ZOHO_SMTP_USER',
          env.mail.user
        ),

      pass:
        required(
          'ZOHO_SMTP_PASS',
          env.mail.pass
        )
    }
  });
}

export async function sendPasswordResetOtp(
  email,
  otp
) {
  const from =
    required(
      'ZOHO_MAIL_FROM',
      env.mail.from
    );

  const transporter =
    getTransporter();

  await transporter.sendMail({
    from,

    to:
      email,

    subject:
      'Your CPMKU password reset code',

    text:
`Here is your CPMKU password reset code:

${otp}

This code is valid for 15 minutes and can only be used once.

You have a maximum of 3 attempts to enter this code correctly.

Please don't share this code with anyone. CPMKU will never ask for your authentication code by phone, chat, or email.

If you didn't request a password reset, you can safely ignore this email.

Thanks,
The CPMKU Team`,

    html:
`<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
  <p>Here is your CPMKU password reset code:</p>

  <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">
    ${otp}
  </p>

  <p>This code is valid for 15 minutes and can only be used once.</p>

  <p>You have a maximum of 3 attempts to enter this code correctly.</p>

  <p>
    Please don't share this code with anyone.
    CPMKU will never ask for your authentication code
    by phone, chat, or email.
  </p>

  <p>
    If you didn't request a password reset,
    you can safely ignore this email.
  </p>

  <p>
    Thanks,<br>
    The CPMKU Team
  </p>
</div>`
  });
}
