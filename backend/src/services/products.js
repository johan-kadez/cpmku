import {
  db,
  FieldValue
} from '../firebase/admin.js';

import {
  HttpError
} from '../utils/errors.js';

import {
  productId
} from '../utils/productId.js';

const MAX_IMAGES = 7;

const PRODUCT_IMAGE_PREFIX =
  'cpmku/products/';

function normalizeImage(image) {
  if (
    !image ||
    typeof image !== 'object'
  ) {
    return null;
  }

  const url =
    String(
      image.url || ''
    ).trim();

  const publicId =
    String(
      image.publicId || ''
    ).trim();

  const version =
    Number(
      image.version
    );

  const signature =
    String(
      image.signature || ''
    ).trim();

  if (
    !url ||
    !publicId ||
    !Number.isInteger(version) ||
    version <= 0 ||
    !signature
  ) {
    return null;
  }

  return {
    url,
    publicId,
    version,
    signature
  };
}

function normalizeImages(data) {
  const source =
    Array.isArray(data?.images)
      ? data.images
      : [];

  const images =
    source
      .map(normalizeImage)
      .filter(Boolean);

  return images;
}

function validateImages(
  images,
  uid
) {
  if (
    images.length < 1
  ) {
    throw new HttpError(
      400,
      'Minimal 1 foto produk.'
    );
  }

  if (
    images.length > MAX_IMAGES
  ) {
    throw new HttpError(
      400,
      'Maksimal 7 foto produk.'
    );
  }

  const publicIds =
    new Set();

  for (
    const image of images
  ) {
    if (
      !image.publicId.startsWith(
        `${PRODUCT_IMAGE_PREFIX}${uid}/`
      )
    ) {
      throw new HttpError(
        403,
        'Foto produk tidak valid.'
      );
    }

    if (
      publicIds.has(
        image.publicId
      )
    ) {
      throw new HttpError(
        400,
        'Foto produk duplikat.'
      );
    }

    publicIds.add(
      image.publicId
    );

    try {
      new URL(
        image.url
      );
    } catch {
      throw new HttpError(
        400,
        'URL foto produk tidak valid.'
      );
    }
  }

  return images;
}

function productData(
  uid,
  seller,
  data,
  images
) {
  return {
    productId:
      data.productId,

    title:
      data.title,

    description:
      data.description,

    images,

    imageUrl:
      images[0].url,

    price:
      data.price,

    stock:
      data.stock,

    category:
      data.category,

    sellerUid:
      uid,

    sellerName:
      seller.name,

    sellerPhotoUrl:
      seller.photoUrl
  };
}

export async function createProduct(
  uid,
  seller,
  data
) {
  const title =
    String(
      data?.title || ''
    ).trim();

  const description =
    String(
      data?.description || ''
    ).trim();

  const price =
    Number(
      data?.price
    );

  const stock =
    Number(
      data?.stock
    );

  const category =
    String(
      data?.category ||
        'mobil'
    ).trim();

  const images =
    normalizeImages(
      data
    );

  validateImages(
    images,
    uid
  );

  if (
    !title ||
    !description ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 1
  ) {
    throw new HttpError(
      400,
      'Data produk tidak valid.'
    );
  }

  if (
    title.length > 150
  ) {
    throw new HttpError(
      400,
      'Nama produk maksimal 150 karakter.'
    );
  }

  if (
    description.length > 5000
  ) {
    throw new HttpError(
      400,
      'Deskripsi produk maksimal 5000 karakter.'
    );
  }

  let id;

  for (
    let i = 0;
    i < 10;
    i++
  ) {
    const candidate =
      productId();

    const existing =
      await db
        .collection('products')
        .doc(candidate)
        .get();

    if (
      !existing.exists
    ) {
      id =
        candidate;

      break;
    }
  }

  if (!id) {
    throw new HttpError(
      500,
      'Gagal membuat ID produk unik.'
    );
  }

  await db
    .collection('products')
    .doc(id)
    .set({
      ...productData(
        uid,
        seller,
        {
          productId: id,
          title,
          description,
          price,
          stock,
          category
        },
        images
      ),

      visibility:
        'private',

      status:
        'pending',

      createdAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp()
    });

  return {
    productId:
      id,

    images
  };
}

export async function updateProduct(
  uid,
  seller,
  id,
  data
) {
  if (!id) {
    throw new HttpError(
      400,
      'ID produk tidak tersedia.'
    );
  }

  const ref =
    db
      .collection('products')
      .doc(id);

  const snapshot =
    await ref.get();

  if (
    !snapshot.exists
  ) {
    throw new HttpError(
      404,
      'Produk tidak ditemukan.'
    );
  }

  const existing =
    snapshot.data();

  if (
    existing.sellerUid !==
    uid
  ) {
    throw new HttpError(
      403,
      'Anda bukan pemilik produk ini.'
    );
  }

  if (
    existing.status ===
      'in_transaction' ||
    existing.status ===
      'sold'
  ) {
    throw new HttpError(
      409,
      'Produk yang sedang bertransaksi atau sudah terjual tidak dapat diedit.'
    );
  }

  const title =
    String(
      data?.title || ''
    ).trim();

  const description =
    String(
      data?.description || ''
    ).trim();

  const price =
    Number(
      data?.price
    );

  const stock =
    Number(
      data?.stock
    );

  const category =
    String(
      data?.category ||
        existing.category ||
        'mobil'
    ).trim();

  const images =
    normalizeImages(
      data
    );

  validateImages(
    images,
    uid
  );

  if (
    !title ||
    !description ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 1
  ) {
    throw new HttpError(
      400,
      'Data produk tidak valid.'
    );
  }

  if (
    title.length > 150
  ) {
    throw new HttpError(
      400,
      'Nama produk maksimal 150 karakter.'
    );
  }

  if (
    description.length > 5000
  ) {
    throw new HttpError(
      400,
      'Deskripsi produk maksimal 5000 karakter.'
    );
  }

  await ref.update({
    title,
    description,

    images,

    imageUrl:
      images[0].url,

    price,
    stock,
    category,

    sellerName:
      seller.name,

    sellerPhotoUrl:
      seller.photoUrl,

    updatedAt:
      FieldValue.serverTimestamp()
  });

  return {
    ok: true,

    productId:
      id,

    images
  };
}

export async function deleteProduct(
  uid,
  id
) {
  if (!id) {
    throw new HttpError(
      400,
      'ID produk tidak tersedia.'
    );
  }

  const ref =
    db
      .collection('products')
      .doc(id);

  const snapshot =
    await ref.get();

  if (
    !snapshot.exists
  ) {
    throw new HttpError(
      404,
      'Produk tidak ditemukan.'
    );
  }

  const product =
    snapshot.data();

  if (
    product.sellerUid !==
    uid
  ) {
    throw new HttpError(
      403,
      'Anda bukan pemilik produk ini.'
    );
  }

  if (
    product.status ===
      'in_transaction' ||
    product.status ===
      'sold'
  ) {
    throw new HttpError(
      409,
      'Produk yang sedang bertransaksi atau sudah terjual tidak dapat dihapus.'
    );
  }

  await ref.delete();

  return {
    ok: true,

    productId:
      id
  };
}

export {
  MAX_IMAGES,
  PRODUCT_IMAGE_PREFIX
};
