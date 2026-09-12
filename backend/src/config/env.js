const requiredEnv = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'ADMIN_UID'
];

export const env = {
  projectId: process.env.FIREBASE_PROJECT_ID || '',

  clientEmail:
    process.env.FIREBASE_CLIENT_EMAIL || '',

  privateKey:
    (process.env.FIREBASE_PRIVATE_KEY || '')
      .replace(/\\n/g, '\n'),

  origin:
    process.env.PUBLIC_APP_ORIGIN || '*',

  adminUid:
    process.env.ADMIN_UID || '',

  cloudinary: {
    cloudName:
      process.env.CLOUDINARY_CLOUD_NAME || '',

    apiKey:
      process.env.CLOUDINARY_API_KEY || '',

    apiSecret:
      process.env.CLOUDINARY_API_SECRET || ''
  }
};

export function assertEnv() {
  const missing = requiredEnv.filter(
    (key) => !process.env[key]
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
    missing.push('CLOUDINARY_CLOUD_NAME');
  }

  if (!env.cloudinary.apiKey) {
    missing.push('CLOUDINARY_API_KEY');
  }

  if (!env.cloudinary.apiSecret) {
    missing.push('CLOUDINARY_API_SECRET');
  }

  if (missing.length) {
    throw new Error(
      `Missing Cloudinary environment variables: ${missing.join(', ')}`
    );
  }
}
