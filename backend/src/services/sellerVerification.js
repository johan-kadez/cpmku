import {
  db,
  FieldValue
} from '../firebase/admin.js';

import {
  env
} from '../config/env.js';

import {
  HttpError
} from '../utils/errors.js';

const ADMIN_UID = String(
  env.adminUid || ''
).trim();

export async function listVerifiedSellers() {
  const snapshot = await db
    .collection('sellers')
    .limit(200)
    .get();

  const sellers = snapshot.docs
    .map(doc => ({
      uid: doc.id,
      ...doc.data()
    }))
    .filter(
      seller =>
        seller.status ===
          'approved' &&
        seller.banned !== true
    );

  sellers.sort(
    (a, b) => {
      const aVerified =
        a.verification?.status ===
        'verified';

      const bVerified =
        b.verification?.status ===
        'verified';

      if (
        aVerified !==
        bVerified
      ) {
        return bVerified
          ? 1
          : -1;
      }

      return String(
        a.name || ''
      ).localeCompare(
        String(
          b.name || ''
        ),
        'id'
      );
    }
  );

  return {
    items: sellers
  };
}

export async function setSellerVerification(
  uid,
  verified
) {
  const sellerUid = String(
    uid || ''
  ).trim();

  if (!sellerUid) {
    throw new HttpError(
      400,
      'UID seller wajib diisi.'
    );
  }

  if (
    sellerUid ===
    ADMIN_UID
  ) {
    throw new HttpError(
      403,
      'Akun admin tidak dapat diberi title Verified Seller.'
    );
  }

  const sellerRef = db
    .collection('sellers')
    .doc(sellerUid);

  const sellerSnapshot =
    await sellerRef.get();

  if (
    !sellerSnapshot.exists
  ) {
    throw new HttpError(
      404,
      'Seller tidak ditemukan.'
    );
  }

  const seller =
    sellerSnapshot.data() || {};

  if (
    seller.status !==
    'approved'
  ) {
    throw new HttpError(
      409,
      'Hanya seller aktif yang dapat memiliki title Verified Seller.'
    );
  }

  if (
    seller.banned === true
  ) {
    throw new HttpError(
      409,
      'Seller yang sedang dibanned tidak dapat memiliki title Verified Seller.'
    );
  }

  const value =
    Boolean(verified);

  if (value) {
    await sellerRef.update({
      'verification.status':
        'verified',

      'verification.verifiedAt':
        FieldValue.serverTimestamp(),

      'verification.verifiedBy':
        ADMIN_UID,

      'verification.revokedAt':
        null,

      'verification.revokedBy':
        null,

      updatedAt:
        FieldValue.serverTimestamp()
    });
  } else {
    await sellerRef.update({
      'verification.status':
        'none',

      'verification.revokedAt':
        FieldValue.serverTimestamp(),

      'verification.revokedBy':
        ADMIN_UID,

      updatedAt:
        FieldValue.serverTimestamp()
    });
  }

  const updatedSnapshot =
    await sellerRef.get();

  return {
    ok: true,

    seller: {
      uid:
        updatedSnapshot.id,

      ...updatedSnapshot.data()
    }
  };
}
