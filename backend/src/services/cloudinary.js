import crypto from 'crypto';
import { env } from '../config/env.js';

function createSignature(parameters) {
  const entries = Object.entries(parameters)
    .filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ''
    )
    .sort(([a], [b]) =>
      a.localeCompare(b)
    );

  const payload = entries
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(
      `${payload}${env.cloudinary.apiSecret}`
    )
    .digest('hex');
}

export async function destroyCloudinaryImage(
  publicId
) {
  if (!publicId) {
    return {
      ok: false,
      skipped: true
    };
  }

  if (
    !publicId.startsWith(
      'cpmku/products/'
    )
  ) {
    return {
      ok: false,
      skipped: true
    };
  }

  if (
    !env.cloudinary.cloudName ||
    !env.cloudinary.apiKey ||
    !env.cloudinary.apiSecret
  ) {
    console.warn(
      'Cloudinary belum dikonfigurasi lengkap. Asset tidak dihapus.'
    );

    return {
      ok: false,
      skipped: true
    };
  }

  const timestamp =
    Math.floor(Date.now() / 1000);

  const signature =
    createSignature({
      public_id: publicId,
      timestamp
    });

  const body = new URLSearchParams();

  body.set(
    'public_id',
    publicId
  );

  body.set(
    'timestamp',
    String(timestamp)
  );

  body.set(
    'api_key',
    env.cloudinary.apiKey
  );

  body.set(
    'signature',
    signature
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/destroy`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded'
      },
      body
    }
  );

  const data =
    await response.json().catch(
      () => ({})
    );

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        'Gagal menghapus gambar dari Cloudinary.'
    );
  }

  return {
    ok: true,
    result: data?.result || null,
    publicId
  };
}

export async function destroyCloudinaryImages(
  images = []
) {
  if (!Array.isArray(images)) {
    return;
  }

  for (const image of images) {
    const publicId =
      typeof image === 'string'
        ? image
        : image?.publicId;

    if (!publicId) {
      continue;
    }

    if (
      !publicId.startsWith(
        'cpmku/products/'
      )
    ) {
      continue;
    }

    try {
      await destroyCloudinaryImage(
        publicId
      );
    } catch (error) {
      console.error(
        'Gagal menghapus asset Cloudinary:',
        publicId,
        error
      );
    }
  }
}
