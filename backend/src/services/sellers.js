import { db, FieldValue } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';

export async function applySeller(uid, email, data) {
  const seller = await db.collection('sellers').doc(uid).get();
  if (seller.exists && seller.data().status === 'approved') {
    throw new HttpError(409, 'Akun ini sudah menjadi seller.');
  }

  const ref = db.collection('sellerApplications').doc(uid);
  const old = await ref.get();
  if (old.exists && old.data().status === 'pending') {
    throw new HttpError(409, 'Pengajuan seller masih pending.');
  }

  const name = String(data?.name || '').trim();
  const phone = String(data?.phone || '').trim();
  const reason = String(data?.reason || '').trim();
  const photoUrl = String(data?.photoUrl || '').trim();
  if (!name || !phone || !reason || !photoUrl) {
    throw new HttpError(400, 'Nama, nomor, alasan, dan URL foto wajib diisi.');
  }

  await ref.set({
    uid,
    email: email || '',
    name,
    phone,
    reason,
    photoUrl,
    status: 'pending',
    createdAt: old.exists ? (old.data().createdAt || FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return { ok: true };
}
