import { db, FieldValue } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';
import { getAdminUid } from '../middleware/admin.js';

export async function approveOrder(orderId) {
  if (!orderId) {
    throw new HttpError(400, 'Order ID wajib diisi.');
  }
  return db.runTransaction(async tx => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpError(404, 'Order tidak ditemukan.');
    }
    const order = orderSnap.data() || {};
    if (!['pending_admin', 'pending'].includes(order.status)) {
      throw new HttpError(409, 'Order ini sudah diproses.');
    }
    const productRef = db.collection('products').doc(order.productId);
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists) {
      throw new HttpError(404, 'Produk order tidak ditemukan.');
    }
    const product = productSnap.data() || {};
    if (product.activeOrderId && product.activeOrderId !== orderId) {
      throw new HttpError(409, 'Product sedang dipesan oleh seseorang.');
    }
    if (product.reservedOrderId && product.reservedOrderId !== orderId) {
      throw new HttpError(409, 'Product sedang dipesan oleh seseorang.');
    }
    const reservationMatches = product.reservedOrderId === orderId;
    if (product.status !== 'available' || product.visibility !== 'public') {
      throw new HttpError(409, 'Produk sudah tidak tersedia.');
    }
    if (!reservationMatches && order.reservedProduct === true && Number(product.stock) === 1) {
      throw new HttpError(409, 'Product sedang dipesan oleh seseorang.');
    }
    const roomRef = db.collection('rooms').doc(orderId);
    const paymentRef = db.collection('payments').doc(orderId);
    const adminUid = getAdminUid();
    tx.update(productRef, {
      status: 'in_transaction',
      visibility: 'private',
      activeOrderId: orderId,
      reservedOrderId: FieldValue.delete(),
      reservedAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp()
    });
    tx.update(orderRef, {
      status: 'in_transaction',
      roomId: roomRef.id,
      paymentStatus: 'pending',
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    tx.set(roomRef, {
      roomId: roomRef.id,
      orderId,
      productId: order.productId,
      productName: order.productName || '',
      buyerUid: order.buyerUid,
      sellerUid: order.sellerUid,
      participantUids: [
        order.buyerUid,
        order.sellerUid,
        ...(adminUid ? [adminUid] : [])
      ],
      sellerCalled: false,
      status: 'in_transaction',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    tx.set(paymentRef, {
      orderId,
      productId: order.productId,
      productName: order.productName || '',
      buyerUid: order.buyerUid,
      sellerUid: order.sellerUid,
      amount: Number(order.amount),
      paymentMethod: 'qris',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { ok: true, status: 'in_transaction', orderId, roomId: roomRef.id };
  });
}

export async function rejectOrder(orderId) {
  if (!orderId) {
    throw new HttpError(400, 'Order ID wajib diisi.');
  }
  return db.runTransaction(async tx => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpError(404, 'Order tidak ditemukan.');
    }
    const order = orderSnap.data() || {};
    if (!['pending_admin', 'pending'].includes(order.status)) {
      throw new HttpError(409, 'Order ini sudah diproses.');
    }
    const productRef = db.collection('products').doc(order.productId);
    const productSnap = await tx.get(productRef);
    if (productSnap.exists) {
      tx.update(productRef, {
        status: 'available',
        visibility: 'public',
        activeOrderId: FieldValue.delete(),
        reservedOrderId: FieldValue.delete(),
        reservedAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    tx.delete(orderRef);
    return { ok: true, status: 'rejected', orderId };
  });
}

export async function cancelOrder(orderId) {
  if (!orderId) {
    throw new HttpError(400, 'Order ID wajib diisi.');
  }
  return db.runTransaction(async tx => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpError(404, 'Order tidak ditemukan.');
    }
    const order = orderSnap.data() || {};
    if (order.status !== 'in_transaction') {
      throw new HttpError(409, 'Order tidak sedang aktif.');
    }
    const productRef = db.collection('products').doc(order.productId);
    const productSnap = await tx.get(productRef);
    if (productSnap.exists && productSnap.data()?.status === 'in_transaction') {
      tx.update(productRef, {
        status: 'available',
        visibility: 'public',
        activeOrderId: FieldValue.delete(),
        reservedOrderId: FieldValue.delete(),
        reservedAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    const roomRef = db.collection('rooms').doc(order.roomId || orderId);
    const roomSnap = await tx.get(roomRef);
    if (roomSnap.exists) {
      tx.update(roomRef, {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    const paymentRef = db.collection('payments').doc(orderId);
    const paymentSnap = await tx.get(paymentRef);
    if (paymentSnap.exists && paymentSnap.data()?.status === 'pending') {
      tx.update(paymentRef, {
        status: 'rejected',
        rejectedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    tx.update(orderRef, {
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { ok: true, status: 'cancelled', orderId };
  });
}

export async function deleteRoom(roomId) {
  if (!roomId) {
    throw new HttpError(400, 'Room ID wajib diisi.');
  }
  const ref = db.collection('rooms').doc(roomId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpError(404, 'Room tidak ditemukan.');
  }
  const room = snap.data() || {};
  if (room.status === 'in_transaction') {
    throw new HttpError(409, 'Room sedang dalam transaksi dan tidak dapat dihapus.');
  }
  await ref.delete();
  return { ok: true, roomId };
}

export async function deleteProduct(productId) {
  if (!productId) {
    throw new HttpError(400, 'Product ID wajib diisi.');
  }
  const ref = db.collection('products').doc(productId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpError(404, 'Produk tidak ditemukan.');
  }
  const product = snap.data() || {};
  if (product.status === 'in_transaction') {
    throw new HttpError(409, 'Produk sedang dalam transaksi dan tidak dapat dihapus.');
  }
  await ref.delete();
  return { ok: true, productId };
}

export async function deletePayment(paymentId) {
  if (!paymentId) {
    throw new HttpError(400, 'Payment ID wajib diisi.');
  }
  const ref = db.collection('payments').doc(paymentId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpError(404, 'Pembayaran tidak ditemukan.');
  }
  const payment = snap.data() || {};
  if (payment.status === 'pending' || payment.status === 'verified') {
    throw new HttpError(409, 'Pembayaran aktif atau terverifikasi tidak dapat dihapus.');
  }
  await ref.delete();
  return { ok: true, paymentId };
}
