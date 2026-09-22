import crypto from 'crypto';
import {
  db,
  FieldValue
} from '../firebase/admin.js';
import { env } from '../config/env.js';
import {
  destroyCloudinaryImages
} from './cloudinary.js';
import { HttpError } from '../utils/errors.js';

export const PRODUCT_IMAGE_PREFIX =
  'cpmku/products/';

const PRODUCT_ID_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateProductId() {
  let productId = '';

  for (let index = 0; index < 7; index += 1) {
    productId += PRODUCT_ID_CHARACTERS[
      crypto.randomInt(
        0,
        PRODUCT_ID_CHARACTERS.length
      )
    ];
  }

  return productId;
}

function normalizeImages(product) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return product.images;
  }

  if (product?.imageUrl) {
    return [
      {
        url: product.imageUrl,
        publicId: '',
        version: '',
        signature: ''
      }
    ];
  }

  return [];
}

function verifyCloudinarySignature(
  publicId,
  version,
  signature
) {
  if (!/^\d+$/.test(version)) {
    return false;
  }

  if (!/^[a-f0-9]{40}$/i.test(signature)) {
    return false;
  }

  if (!env.cloudinary.apiSecret) {
    return false;
  }

  const expected = crypto
    .createHash('sha1')
    .update(
      `public_id=${publicId}&version=${version}${env.cloudinary.apiSecret}`
    )
    .digest('hex');

  const expectedBuffer =
    Buffer.from(expected, 'utf8');

  const receivedBuffer =
    Buffer.from(
      signature.toLowerCase(),
      'utf8'
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

function validateImages(
  uid,
  images
) {
  if (!Array.isArray(images) || images.length < 1) {
    throw new HttpError(
      400,
      'Minimal 1 foto produk wajib diupload.'
    );
  }

  if (images.length > 7) {
    throw new HttpError(
      400,
      'Maksimal 7 foto produk.'
    );
  }

  if (!env.cloudinary.cloudName) {
    throw new HttpError(
      500,
      'Konfigurasi Cloudinary belum lengkap.'
    );
  }

  const prefix =
    `${PRODUCT_IMAGE_PREFIX}${uid}/`;

  const cloudinaryOrigin =
    `https://res.cloudinary.com/${env.cloudinary.cloudName}`;

  return images.map(
    (image, index) => {
      if (
        !image ||
        typeof image !== 'object' ||
        Array.isArray(image)
      ) {
        throw new HttpError(
          400,
          `Foto produk ke-${index + 1} tidak valid.`
        );
      }

      const url =
        String(image.url || '').trim();

      const publicId =
        String(image.publicId || '').trim();

      const version =
        String(image.version || '').trim();

      const signature =
        String(image.signature || '').trim();

      if (!url) {
        throw new HttpError(
          400,
          `URL foto produk ke-${index + 1} wajib diisi.`
        );
      }

      if (url.length > 2048) {
        throw new HttpError(
          400,
          `URL foto produk ke-${index + 1} terlalu panjang.`
        );
      }

      if (!publicId) {
        throw new HttpError(
          400,
          `Public ID foto produk ke-${index + 1} wajib diisi.`
        );
      }

      if (publicId.length > 512) {
        throw new HttpError(
          400,
          `Public ID foto produk ke-${index + 1} terlalu panjang.`
        );
      }

      if (!version) {
        throw new HttpError(
          400,
          `Version foto produk ke-${index + 1} wajib diisi.`
        );
      }

      if (version.length > 32) {
        throw new HttpError(
          400,
          `Version foto produk ke-${index + 1} tidak valid.`
        );
      }

      if (!signature) {
        throw new HttpError(
          400,
          `Signature foto produk ke-${index + 1} wajib diisi.`
        );
      }

      if (!publicId.startsWith(prefix)) {
        throw new HttpError(
          400,
          'Foto produk tidak berasal dari folder Cloudinary yang valid.'
        );
      }

      if (publicId.length <= prefix.length) {
        throw new HttpError(
          400,
          'Public ID foto produk tidak valid.'
        );
      }

      let parsedUrl;

      try {
        parsedUrl = new URL(url);
      } catch {
        throw new HttpError(
          400,
          `URL foto produk ke-${index + 1} tidak valid.`
        );
      }

      if (
        parsedUrl.protocol !== 'https:' ||
        parsedUrl.origin !== cloudinaryOrigin ||
        !parsedUrl.pathname.startsWith('/image/upload/')
      ) {
        throw new HttpError(
          400,
          'URL foto produk tidak berasal dari Cloudinary yang valid.'
        );
      }

      if (
        !verifyCloudinarySignature(
          publicId,
          version,
          signature
        )
      ) {
        throw new HttpError(
          400,
          `Signature foto produk ke-${index + 1} tidak valid.`
        );
      }

      return {
        url,
        publicId,
        version,
        signature
      };
    }
  );
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizePrice(value) {
  const price = Number(value);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new HttpError(
      400,
      'Harga produk tidak valid.'
    );
  }

  if (price > Number.MAX_SAFE_INTEGER) {
    throw new HttpError(
      400,
      'Harga produk terlalu besar.'
    );
  }

  return price;
}

function normalizeStock(value) {
  const stock = Number(value);

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw new HttpError(
      400,
      'Stok produk tidak valid.'
    );
  }

  if (stock > 1000000) {
    throw new HttpError(
      400,
      'Stok produk terlalu besar.'
    );
  }

  return stock;
}

function validateBasicProductData(input) {
  const title =
    normalizeText(input?.title);

  const description =
    normalizeText(input?.description);

  const category =
    normalizeText(input?.category);

  if (!title) {
    throw new HttpError(
      400,
      'Nama produk wajib diisi.'
    );
  }

  if (!description) {
    throw new HttpError(
      400,
      'Deskripsi produk wajib diisi.'
    );
  }

  if (!category) {
    throw new HttpError(
      400,
      'Kategori produk wajib diisi.'
    );
  }

  if (title.length > 150) {
    throw new HttpError(
      400,
      'Nama produk maksimal 150 karakter.'
    );
  }

  if (description.length > 5000) {
    throw new HttpError(
      400,
      'Deskripsi produk maksimal 5000 karakter.'
    );
  }

  if (category.length > 100) {
    throw new HttpError(
      400,
      'Kategori produk maksimal 100 karakter.'
    );
  }

  return {
    title,
    description,
    category,
    price: normalizePrice(input?.price),
    stock: normalizeStock(input?.stock)
  };
}

export async function createProduct(
  uid,
  seller,
  input
) {
  if (!uid) {
    throw new HttpError(
      401,
      'Login diperlukan.'
    );
  }

  const productData =
    validateBasicProductData(input);

  const images =
    validateImages(
      uid,
      input?.images
    );

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const productId =
      generateProductId();

    const ref =
      db
        .collection('products')
        .doc(productId);

    try {
      await db.runTransaction(
        async tx => {
          const existing =
            await tx.get(ref);

          if (existing.exists) {
            throw new HttpError(
              409,
              'ID produk bentrok. Silakan coba lagi.'
            );
          }

          tx.create(
            ref,
            {
              productId,

              title:
                productData.title,

              description:
                productData.description,

              images,

              imageUrl:
                images[0].url,

              price:
                productData.price,

              stock:
                productData.stock,

              category:
                productData.category,

              sellerUid:
                uid,

              sellerName:
                String(
                  seller?.name || ''
                ).trim(),

              sellerPhotoUrl:
                String(
                  seller?.photoUrl || ''
                ).trim(),

              status:
                'pending',

              visibility:
                'private',

              createdAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp()
            }
          );
        }
      );

      return {
        ok: true,
        productId
      };
    } catch (error) {
      if (
        error instanceof HttpError &&
        error.status === 409
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new HttpError(
    500,
    'Gagal membuat ID produk unik. Silakan coba lagi.'
  );
}

export async function updateProduct(
  uid,
  seller,
  id,
  input
) {
  if (!uid) {
    throw new HttpError(
      401,
      'Login diperlukan.'
    );
  }

  if (
    typeof id !== 'string' ||
    !id.trim() ||
    id.length > 150 ||
    id.includes('/')
  ) {
    throw new HttpError(
      400,
      'ID produk tidak valid.'
    );
  }

  const productData =
    validateBasicProductData(input);

  const images =
    validateImages(
      uid,
      input?.images
    );

  const ref =
    db
      .collection('products')
      .doc(id);

  let removedImages = [];

  await db.runTransaction(
    async tx => {
      const snapshot =
        await tx.get(ref);

      if (!snapshot.exists) {
        throw new HttpError(
          404,
          'Produk tidak ditemukan.'
        );
      }

      const existing =
        snapshot.data() || {};

      if (
        existing.sellerUid !== uid
      ) {
        throw new HttpError(
          403,
          'Anda tidak memiliki akses ke produk ini.'
        );
      }

      if (
        existing.status ===
        'in_transaction'
      ) {
        throw new HttpError(
          409,
          'Produk sedang dalam transaksi dan tidak dapat diedit.'
        );
      }

      if (
        existing.status === 'sold'
      ) {
        throw new HttpError(
          409,
          'Produk yang sudah terjual tidak dapat diedit.'
        );
      }

      if (
        existing.reservedOrderId
      ) {
        throw new HttpError(
          409,
          'Produk sedang dipesan oleh seseorang dan tidak dapat diedit.'
        );
      }

      const oldImages =
        normalizeImages(existing);

      const newPublicIds =
        new Set(
          images
            .map(
              image => image?.publicId
            )
            .filter(Boolean)
        );

      removedImages =
        oldImages.filter(
          image => {
            const publicId =
              image?.publicId;

            return Boolean(
              publicId &&
              !newPublicIds.has(publicId)
            );
          }
        );

      tx.update(
        ref,
        {
          title:
            productData.title,

          description:
            productData.description,

          images,

          imageUrl:
            images[0].url,

          price:
            productData.price,

          stock:
            productData.stock,

          category:
            productData.category,

          sellerName:
            String(
              seller?.name ||
              existing.sellerName ||
              ''
            ).trim(),

          sellerPhotoUrl:
            String(
              seller?.photoUrl ||
              existing.sellerPhotoUrl ||
              ''
            ).trim(),

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );
    }
  );

  await destroyCloudinaryImages(
    removedImages
  );

  return {
    ok: true,
    productId: id
  };
}

export async function deleteProduct(
  uid,
  id
) {
  if (!uid) {
    throw new HttpError(
      401,
      'Login diperlukan.'
    );
  }

  if (
    typeof id !== 'string' ||
    !id.trim() ||
    id.length > 150 ||
    id.includes('/')
  ) {
    throw new HttpError(
      400,
      'ID produk tidak valid.'
    );
  }

  const ref =
    db
      .collection('products')
      .doc(id);

  let images = [];

  await db.runTransaction(
    async tx => {
      const snapshot =
        await tx.get(ref);

      if (!snapshot.exists) {
        throw new HttpError(
          404,
          'Produk tidak ditemukan.'
        );
      }

      const product =
        snapshot.data() || {};

      if (
        product.sellerUid !== uid
      ) {
        throw new HttpError(
          403,
          'Anda tidak memiliki akses ke produk ini.'
        );
      }

      if (
        product.status ===
        'in_transaction'
      ) {
        throw new HttpError(
          409,
          'Produk sedang dalam transaksi dan tidak dapat dihapus.'
        );
      }

      if (
        product.reservedOrderId
      ) {
        throw new HttpError(
          409,
          'Produk sedang dipesan oleh seseorang dan tidak dapat dihapus.'
        );
      }

      if (
        product.activeOrderId
      ) {
        throw new HttpError(
          409,
          'Produk sedang dalam transaksi dan tidak dapat dihapus.'
        );
      }

      images =
        normalizeImages(product);

      tx.delete(ref);
    }
  );

  await destroyCloudinaryImages(
    images
  );

  return {
    ok: true,
    productId: id
  };
}
