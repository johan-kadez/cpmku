import { db, FieldValue } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';

export async function sendMessage(roomId, user, body) {
  if (typeof roomId !== 'string' || !roomId.trim() || roomId.length > 150 || roomId.includes('/')) {
    throw new HttpError(400, 'Room ID tidak valid.');
  }
  const text = String(body || '').trim();
  if (!text) {
    throw new HttpError(400, 'Pesan kosong.');
  }
  if (text.length > 5000) {
    throw new HttpError(400, 'Pesan maksimal 5000 karakter.');
  }
  const ref = db.collection('rooms').doc(roomId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpError(404, 'Room tidak ditemukan.');
  }
  const room = snap.data() || {};
  const isAdmin = user.role === 'admin';
  const participant = Array.isArray(room.participantUids) && room.participantUids.includes(user.uid);
  if (!participant && !isAdmin) {
    throw new HttpError(403, 'Bukan peserta room.');
  }
  let messageRole = 'buyer';
  if (isAdmin) {
    messageRole = 'admin';
  } else if (room.buyerUid === user.uid) {
    messageRole = 'buyer';
  } else if (room.sellerUid === user.uid) {
    messageRole = 'seller';
  } else {
    throw new HttpError(403, 'Role pengguna tidak sesuai dengan transaksi.');
  }
  await ref.collection('messages').add({
    senderUid: user.uid,
    senderName: String(user.name || user.email || 'User').slice(0, 150),
    role: messageRole,
    body: text,
    createdAt: FieldValue.serverTimestamp()
  });
  await ref.update({ updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
}

export async function callSeller(roomId) {
  if (typeof roomId !== 'string' || !roomId.trim() || roomId.length > 150 || roomId.includes('/')) {
    throw new HttpError(400, 'Room ID tidak valid.');
  }
  const ref = db.collection('rooms').doc(roomId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpError(404, 'Room tidak ditemukan.');
  }
  const room = snap.data() || {};
  if (room.status !== 'in_transaction') {
    throw new HttpError(409, 'Transaksi sudah tidak aktif.');
  }
  if (!room.sellerUid) {
    throw new HttpError(409, 'Seller transaksi tidak valid.');
  }
  const batch = db.batch();
  batch.set(db.collection('notifications').doc(), {
    toUid: room.buyerUid,
    type: 'order_approved',
    title: 'Pesanan disetujui oleh admin',
    message: `Pesanan ${room.productId} sudah disetujui oleh admin. Obrolan transaksi sekarang tersedia.`,
    roomId,
    createdAt: FieldValue.serverTimestamp(),
    read: false
  });
  batch.set(db.collection('notifications').doc(), {
    toUid: room.sellerUid,
    type: 'order_approved',
    title: 'Pesanan baru disetujui',
    message: `Pesanan ${room.productId} sudah disetujui admin. Anda sekarang dapat bergabung ke obrolan transaksi.`,
    roomId,
    createdAt: FieldValue.serverTimestamp(),
    read: false
  });
  await batch.commit();
  return { ok: true };
}
