import { db, FieldValue } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';
const COLLECTIONS = {
  sellers: 'registrations',
  products: 'products',
  orders: 'orders',
  payments: 'payments',
  rooms: 'rooms',
  users: 'users'
};
export async function dashboard() {
  const [s, p, o, pa, r] = await Promise.all(
    ['registrations', 'products', 'orders', 'payments', 'rooms'].map(c => db.collection(c).get())
  );
  return { stats: { registrations: s.size, products: p.size, orders: o.size, payments: pa.size, rooms: r.size } };
}
export async function listCollection(name) {
  const collection = COLLECTIONS[name] || name;
  const snap = await db.collection(collection).limit(200).get();
  return { items: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
}
export async function setStatus(type, id, status) {
  const collection = COLLECTIONS[type];
  if (!collection) throw new HttpError(400, 'Jenis tidak valid.');
  const allowed = {
    sellers: ['approved', 'rejected'],
    products: ['approved', 'rejected'],
    orders: ['cancelled'],
    payments: ['verified', 'rejected'],
    rooms: ['cancelled']
  };
  if (!allowed[type]?.includes(status)) throw new HttpError(400, 'Status tidak valid.');
  const ref = db.collection(collection).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Data tidak ditemukan.');
  if (type === 'sellers') {
    if (status === 'approved') {
      const d = snap.data();
      const batch = db.batch();
      batch.set(db.collection('sellers').doc(id), {
        uid: id,
        email: d.email || '',
        name: d.name,
        description: d.reason,
        photoUrl: d.photoUrl,
        status: 'approved',
        banned: false,
        approvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      batch.update(ref, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
      await batch.commit();
    } else {
      await ref.update({ status: 'rejected', updatedAt: FieldValue.serverTimestamp() });
    }
    return { ok: true };
  }
  if (type === 'products') {
    if (status === 'approved') {
      await ref.update({ status: 'available', approvalStatus: 'approved', visibility: 'public', approvedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    } else {
      await ref.update({ status: 'rejected', approvalStatus: 'rejected', visibility: 'private', updatedAt: FieldValue.serverTimestamp() });
    }
    return { ok: true };
  }
  if (type === 'orders' && status === 'cancelled') {
    const d = snap.data();
    if (d.status !== 'in_transaction') throw new HttpError(409, 'Order tidak sedang aktif.');
    const batch = db.batch();
    batch.update(ref, { status: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    const product = await db.collection('products').doc(d.productDocId || d.productId).get();
    if (product.exists && product.data().status === 'in_transaction') {
      batch.update(product.ref, { status: 'available', visibility: 'public', updatedAt: FieldValue.serverTimestamp() });
    }
    const room = await db.collection('rooms').doc(id).get();
    if (room.exists) batch.update(room.ref, { status: 'cancelled', cancelledAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    const payment = await db.collection('payments').doc(id).get();
    if (payment.exists && payment.data().status === 'pending') {
      batch.update(payment.ref, { status: 'rejected', updatedAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();
    return { ok: true };
  }
  if (type === 'payments') {
    const d = snap.data();
    const orderRef = db.collection('orders').doc(d.orderId);
    if (status === 'verified') {
      await ref.update({ status: 'verified', verifiedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      await orderRef.update({ paymentStatus: 'verified', updatedAt: FieldValue.serverTimestamp() });
    } else {
      await ref.update({ status: 'rejected', rejectedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      await orderRef.update({ paymentStatus: 'rejected', updatedAt: FieldValue.serverTimestamp() });
    }
    return { ok: true };
  }
  if (type === 'rooms') {
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
    return { ok: true };
  }
  throw new HttpError(400, 'Aksi tidak tersedia.');
}
export async function setBan(uid, banned) {
  const value = Boolean(banned);
  await db.collection('users').doc(uid).set({ uid, banned: value, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  const seller = await db.collection('sellers').doc(uid).get();
  if (seller.exists) await seller.ref.update({ banned: value, updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
}
export async function saveSettings(data) {
  const qrisUrl = String(data?.qrisUrl || '').trim();
  if (qrisUrl) {
    try { new URL(qrisUrl);
 } catch { throw new HttpError(400, 'URL QRIS tidak valid.');
 }
  }
  await db.collection('settings').doc('main').set({ qrisUrl, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true };
}
