import crypto from 'node:crypto';

import {
  env,
  assertCloudinaryEnv
} from '../config/env.js';

function createSignature(
  parameters
) {
  const serialized =
    Object.entries(
      parameters
    )
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ''
      )
      .sort(
        ([a], [b]) =>
          a.localeCompare(b)
      )
      .map(
        ([key, value]) =>
          `${key}=${value}`
      )
      .join('&');

  return crypto
    .createHash('sha1')
    .update(
      `${serialized}${env.cloudinary.apiSecret}`
    )
    .digest('hex');
}

export async function destroyCloudinaryImage(
  publicId
) {
  assertCloudinaryEnv();

  if (
    !publicId ||
    typeof publicId !== 'string'
  ) {
    return {
      ok: false,
      skipped: true
    };
  }

  const timestamp =
    Math.floor(
      Date.now() / 1000
    );

  const signature =
    createSignature({
      public_id:
        publicId,

      timestamp
    });

  const body =
    new URLSearchParams();

  body.append(
    'public_id',
    publicId
  );

  body.append(
    'timestamp',
    String(timestamp)
  );

  body.append(
    'api_key',
    env.cloudinary.apiKey
  );

  body.append(
    'signature',
    signature
  );

  const response =
    await fetch(
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

  let data = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (
    !response.ok
  ) {
    throw new Error(
      data.error?.message ||
        'Gagal menghapus foto dari Cloudinary.'
    );
  }

  return {
    ok: true,

    result:
      data.result ||
      null
  };
}

export async function destroyCloudinaryImages(
  images
) {
  if (
    !Array.isArray(images) ||
    images.length === 0
  ) {
    return;
  }

  for (
    const image of images
  ) {
    const publicId =
      typeof image === 'string'
        ? ''
        : image?.publicId;

    if (
      !publicId
    ) {
      continue;
    }

    try {
      await destroyCloudinaryImage(
        publicId
      );
    } catch (
      error
    ) {
      console.error(
        'Cloudinary destroy failed:',
        publicId,
        error
      );
    }
  }
}
