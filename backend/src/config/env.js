const requiredEnv = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'ADMIN_UID'
];

function normalizePrivateKey(value) {
  let key = String(value || '').trim();

  if (
    key.startsWith('"') &&
    key.endsWith('"')
  ) {
    key = key.slice(1, -1);
  }

  if (
    key.startsWith("'") &&
    key.endsWith("'")
  ) {
    key = key.slice(1, -1);
  }

  key = key
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r');

  return key.trim();
}

export const env = {
  projectId:
    String(
      process.env.FIREBASE_PROJECT_ID || ''
    ).trim(),

  clientEmail:
    String(
      process.env.FIREBASE_CLIENT_EMAIL || ''
    ).trim(),

  privateKey:
    normalizePrivateKey(
      process.env.FIREBASE_PRIVATE_KEY
    ),

  origin:
    String(
      process.env.PUBLIC_APP_ORIGIN ||
      'https://cpmku.vercel.app'
    ).trim(),

  adminUid:
    String(
      process.env.ADMIN_UID || ''
    ).trim(),

  cloudinary: {
    cloudName:
      String(
        process.env.CLOUDINARY_CLOUD_NAME || ''
      ).trim(),

    apiKey:
      String(
        process.env.CLOUDINARY_API_KEY || ''
      ).trim(),

    apiSecret:
      String(
        process.env.CLOUDINARY_API_SECRET || ''
      ).trim()
  },

  mail: {
    host:
      String(
        process.env.ZOHO_SMTP_HOST ||
        'smtp.zoho.com'
      ).trim(),

    port:
      Number(
        process.env.ZOHO_SMTP_PORT || 465
      ),

    secure:
      String(
        process.env.ZOHO_SMTP_SECURE || 'true'
      ).toLowerCase() === 'true',

    user:
      String(
        process.env.ZOHO_SMTP_USER || ''
      ).trim(),

    pass:
      String(
        process.env.ZOHO_SMTP_PASS || ''
      ).trim(),

    from:
      String(
        process.env.ZOHO_MAIL_FROM ||
        process.env.ZOHO_SMTP_USER ||
        ''
      ).trim()
  }
};

export function assertEnv() {
  const missing =
    requiredEnv.filter(
      key =>
        !String(
          process.env[key] || ''
        ).trim()
    );

  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}`
    );
  }
}

export function assertCloudinaryEnv() {
  const missing = [];

  if (!env.cloudinary.cloudName) {
    missing.push(
      'CLOUDINARY_CLOUD_NAME'
    );
  }

  if (!env.cloudinary.apiKey) {
    missing.push(
      'CLOUDINARY_API_KEY'
    );
  }

  if (!env.cloudinary.apiSecret) {
    missing.push(
      'CLOUDINARY_API_SECRET'
    );
  }

  if (missing.length) {
    throw new Error(
      `Missing Cloudinary environment variables: ${missing.join(', ')}`
    );
  }
}
