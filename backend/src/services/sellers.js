import {
  db,
  FieldValue
} from '../firebase/admin.js';

import {
  HttpError
} from '../utils/errors.js';

export async function applySeller(
  uid,
  authEmail,
  data
) {
  if (!uid) {
    throw new HttpError(
      401,
      'Login diperlukan.'
    );
  }

  const email =
    String(authEmail || '')
      .trim()
      .toLowerCase();

  if (!email) {
    throw new HttpError(
      400,
      'Email akun Google tidak tersedia.'
    );
  }

  if (email.length > 320) {
    throw new HttpError(
      400,
      'Email akun tidak valid.'
    );
  }

  const name =
    String(data?.name || '').trim();

  const phone =
    String(data?.phone || '').trim();

  const reason =
    String(data?.reason || '').trim();

  if (!name) {
    throw new HttpError(
      400,
      'Nama seller wajib diisi.'
    );
  }

  if (!phone) {
    throw new HttpError(
      400,
      'Nomor WhatsApp wajib diisi.'
    );
  }

  if (!reason) {
    throw new HttpError(
      400,
      'Alasan menjadi seller wajib diisi.'
    );
  }

  if (name.length > 100) {
    throw new HttpError(
      400,
      'Nama seller maksimal 100 karakter.'
    );
  }

  if (phone.length > 30) {
    throw new HttpError(
      400,
      'Nomor WhatsApp maksimal 30 karakter.'
    );
  }

  if (reason.length > 1000) {
    throw new HttpError(
      400,
      'Alasan menjadi seller maksimal 1000 karakter.'
    );
  }

  const sellerRef =
    db
      .collection('sellers')
      .doc(uid);

  const registrationRef =
    db
      .collection('registrations')
      .doc(uid);

  const profileRef =
    db
      .collection('users')
      .doc(uid);

  await db.runTransaction(
    async tx => {
      const [
        sellerSnap,
        registrationSnap,
        profileSnap
      ] = await Promise.all([
        tx.get(sellerRef),
        tx.get(registrationRef),
        tx.get(profileRef)
      ]);

      if (
        sellerSnap.exists &&
        sellerSnap.data()?.status ===
          'approved'
      ) {
        throw new HttpError(
          409,
          'Akun ini sudah menjadi seller.'
        );
      }

      if (
        registrationSnap.exists &&
        registrationSnap.data()?.status ===
          'pending'
      ) {
        throw new HttpError(
          409,
          'Pengajuan seller masih pending.'
        );
      }

      const profileData =
        profileSnap.exists
          ? profileSnap.data() || {}
          : {};

      const photoUrl =
        String(
          profileData?.photoUrl || ''
        ).trim();

      const previous =
        registrationSnap.exists
          ? registrationSnap.data() || {}
          : {};

      tx.set(
        registrationRef,
        {
          uid,

          email,

          name,

          phone,

          reason,

          photoUrl,

          status:
            'pending',

          createdAt:
            previous.createdAt ||
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    }
  );

  return {
    ok: true,
    status: 'pending'
  };
}
