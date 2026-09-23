import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function required(name, value) {
  if (!String(value || '').trim()) {
    throw new Error(`${name} belum dikonfigurasi.`);
  }
  return String(value).trim();
}

function getTransporter() {
  return nodemailer.createTransport({
    host: required('ZOHO_SMTP_HOST', env.mail.host),
    port: Number(env.mail.port || 465),
    secure: env.mail.secure,
    auth: {
      user: required('ZOHO_SMTP_USER', env.mail.user),
      pass: required('ZOHO_SMTP_PASS', env.mail.pass)
    }
  });
}

export async function sendPasswordResetOtp(email, otp) {
  const from = required('ZOHO_MAIL_FROM', env.mail.from);
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Your CPMKU password reset code',
    text: `Here is your CPMKU password reset code:

${otp}

This code is valid for 15 minutes and can only be used once.

You have a maximum of 3 attempts to enter this code correctly.

Please don't share this code with anyone. CPMKU will never ask for your authentication code by phone, chat, or email.

If you didn't request a password reset, you can safely ignore this email.

Thanks,
The CPMKU Team`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
  <p>Here is your CPMKU password reset code:</p>
  <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">${otp}</p>
  <p>This code is valid for 15 minutes and can only be used once.</p>
  <p>You have a maximum of 3 attempts to enter this code correctly.</p>
  <p>Please don't share this code with anyone. CPMKU will never ask for your authentication code by phone, chat, or email.</p>
  <p>If you didn't request a password reset, you can safely ignore this email.</p>
  <p>Thanks,<br>The CPMKU Team</p>
</div>`
  });
}

export async function sendProductApprovedEmail(email, sellerName, productTitle, productId, productPrice) {
  const from = required('ZOHO_MAIL_FROM', env.mail.from);
  const transporter = getTransporter();

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(productPrice || 0);

  await transporter.sendMail({
    from,
    to: email,
    subject: `Your Product "${productTitle}" Has Been Approved!`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <p>Hi "${sellerName}",</p>
  <p>Great news! The product you submitted has been successfully reviewed and approved by the CPMKU team. Your product is now officially live and available for purchase by all users on CPMKU Marketplace.</p>
  <h3 style="color: #2c3e50;">Product Details:</h3>
  <ul style="background: #f9f9f9; padding: 15px; border-radius: 5px; list-style-type: none;">
    <li style="margin-bottom: 8px;"><strong>Product Name:</strong> ${productTitle}</li>
    <li style="margin-bottom: 8px;"><strong>Product ID:</strong> ${productId}</li>
    <li style="margin-bottom: 8px;"><strong>Price:</strong> ${formattedPrice}</li>
  </ul>
  <p>Make sure to regularly monitor your seller dashboard to respond to buyer messages and process incoming orders.</p>
  <p>Thank you for being a part of CPMKU Marketplace!</p>
  <p>Best regards,<br><strong>The CPMKU Team</strong></p>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0 15px 0;">
  <p style="font-size: 12px; color: #888; text-align: center;">Please note: This is an automated message. Please do not reply to this email.</p>
</div>`
  });
}
