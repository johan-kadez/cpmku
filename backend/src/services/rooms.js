import { db, FieldValue } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';

export async function sendMessage(roomId, user, body) {
  const text = String(body || '').trim();
  if (!text) throw new HttpError(400, 'Pesan kosong.');

  const ref = db.collection('rooms').doc(roomId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Room tidak ditemukan.');

  const room = snap.data();
  const participant = Array.isArray(room.participantUids) && room.participantUids.includes(user.uid);
  if (!participant && !user.isAdmin) throw new HttpError(403, 'Bukan peserta room.');

  const role = user.isAdmin ? 'admin' : room.buyerUid === user.uid ? 'buyer' : 'seller';
  await ref.collection('messages').add({
    senderUid: user.uid,
    senderName: user.name || user.email || 'User',
    role,
    body: text,
    createdAt: FieldValue.serverTimestamp()
  });
  await ref.update({ updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
}

export async function callSeller(roomId) {
  const ref = db.collection('rooms').doc(roomId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Room tidak ditemukan.');

  const room = snap.data();
  if (room.status !== 'in_transaction') throw new HttpError(409, 'Transaksi sudah tidak aktif.');

  await ref.update({
    participantUids: FieldValue.arrayUnion(room.sellerUid),
    sellerCalled: true,
    sellerCalledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  const batch = db.batch();
  batch.set(db.collection('notifications').doc(), {
    toUid: room.buyerUid,
    type: 'seller_called',
    title: 'Seller dipanggil',
    message: `Admin sudah memanggil seller untuk produk ${room.productId}.`,
    roomId,
    createdAt: FieldValue.serverTimestamp(),
    read: false
  });
  batch.set(db.collection('notifications').doc(), {
    toUid: room.sellerUid,
    type: 'seller_called',
    title: 'Anda dipanggil admin',
    message: `Admin memanggil Anda untuk transaksi produk ${room.productId}.`,
    roomId,
    createdAt: FieldValue.serverTimestamp(),
    read: false
  });
  await batch.commit();

  return { ok: true };
}
