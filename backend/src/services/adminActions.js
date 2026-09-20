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

import {
  destroyCloudinaryImages
} from './cloudinary.js';

function getAdminUid() {
  return String(
    env.adminUid || ''
  ).trim();
}

export async function approveOrder(
  orderId
) {
  if (!orderId) {
    throw new HttpError(
      400,
      'Order ID wajib diisi.'
    );
  }

  return db.runTransaction(
    async tx => {
      const orderRef =
        db
          .collection('orders')
          .doc(orderId);

      const orderSnap =
        await tx.get(
          orderRef
        );

      if (!orderSnap.exists) {
        throw new HttpError(
          404,
          'Order tidak ditemukan.'
        );
      }

      const order =
        orderSnap.data();

      if (
        ![
          'pending_admin',
          'pending'
        ].includes(
          order.status
        )
      ) {
        throw new HttpError(
          409,
          'Order ini sudah diproses.'
        );
      }

      const productRef =
        db
          .collection('products')
          .doc(
            order.productId
          );

      const productSnap =
        await tx.get(
          productRef
        );

      if (!productSnap.exists) {
        throw new HttpError(
          404,
          'Produk order tidak ditemukan.'
        );
      }

      const product =
        productSnap.data();

      if (
        product.status !==
          'available' ||
        product.visibility !==
          'public'
      ) {
        throw new HttpError(
          409,
          'Produk sudah tidak tersedia.'
        );
      }

      const roomRef =
        db
          .collection('rooms')
          .doc(orderId);

      const paymentRef =
        db
          .collection('payments')
          .doc(orderId);

      const adminUid =
        getAdminUid();

      tx.update(
        productRef,
        {
          status:
            'in_transaction',

          visibility:
            'private',

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      tx.update(
        orderRef,
        {
          status:
            'in_transaction',

          roomId:
            roomRef.id,

          paymentStatus:
            'pending',

          approvedAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      tx.set(
        roomRef,
        {
          roomId:
            roomRef.id,

          orderId,

          productId:
            order.productId,

          productName:
            order.productName || '',

          buyerUid:
            order.buyerUid,

          sellerUid:
            order.sellerUid,

          participantUids:
            [
              order.buyerUid,
              ...(adminUid
                ? [adminUid]
                : [])
            ],

          sellerCalled:
            false,

          status:
            'in_transaction',

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      tx.set(
        paymentRef,
        {
          orderId,

          productId:
            order.productId,

          productName:
            order.productName || '',

          buyerUid:
            order.buyerUid,

          sellerUid:
            order.sellerUid,

          amount:
            Number(order.amount),

          paymentMethod:
            'qris',

          status:
            'pending',

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      return {
        ok: true,

        status:
          'in_transaction',

        orderId,

        roomId:
          roomRef.id
      };
    }
  );
}

export async function rejectOrder(
  orderId
) {
  if (!orderId) {
    throw new HttpError(
      400,
      'Order ID wajib diisi.'
    );
  }

  return db.runTransaction(
    async tx => {
      const orderRef =
        db
          .collection('orders')
          .doc(orderId);

      const orderSnap =
        await tx.get(
          orderRef
        );

      if (!orderSnap.exists) {
        throw new HttpError(
          404,
          'Order tidak ditemukan.'
        );
      }

      const order =
        orderSnap.data();

      if (
        ![
          'pending_admin',
          'pending'
        ].includes(
          order.status
        )
      ) {
        throw new HttpError(
          409,
          'Order ini sudah diproses.'
        );
      }

      const productRef =
        db
          .collection('products')
          .doc(
            order.productId
          );

      const roomRef =
        db
          .collection('rooms')
          .doc(
            order.roomId ||
            orderId
          );

      const paymentRef =
        db
          .collection('payments')
          .doc(orderId);

      const [
        productSnap,
        roomSnap,
        paymentSnap
      ] =
        await Promise.all([
          tx.get(productRef),
          tx.get(roomRef),
          tx.get(paymentRef)
        ]);

      tx.delete(
        orderRef
      );

      if (
        roomSnap.exists
      ) {
        tx.delete(
          roomRef
        );
      }

      if (
        paymentSnap.exists
      ) {
        tx.delete(
          paymentRef
        );
      }

      if (
        productSnap.exists
      ) {
        tx.update(
          productRef,
          {
            status:
              'available',

            visibility:
              'public',

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );
      }

      return {
        ok: true,

        status:
          'rejected',

        orderId
      };
    }
  );
}

export async function cancelOrder(
  orderId
) {
  if (!orderId) {
    throw new HttpError(
      400,
      'Order ID wajib diisi.'
    );
  }

  return db.runTransaction(
    async tx => {
      const orderRef =
        db
          .collection('orders')
          .doc(orderId);

      const orderSnap =
        await tx.get(
          orderRef
        );

      if (!orderSnap.exists) {
        throw new HttpError(
          404,
          'Order tidak ditemukan.'
        );
      }

      const order =
        orderSnap.data();

      if (
        ![
          'pending_admin',
          'pending',
          'in_transaction'
        ].includes(
          order.status
        )
      ) {
        throw new HttpError(
          409,
          'Order tidak dapat dibatalkan.'
        );
      }

      const productRef =
        db
          .collection('products')
          .doc(
            order.productId
          );

      const roomRef =
        db
          .collection('rooms')
          .doc(
            order.roomId ||
            orderId
          );

      const paymentRef =
        db
          .collection('payments')
          .doc(orderId);

      const [
        productSnap,
        roomSnap,
        paymentSnap
      ] =
        await Promise.all([
          tx.get(productRef),
          tx.get(roomRef),
          tx.get(paymentRef)
        ]);

      tx.delete(
        orderRef
      );

      if (
        roomSnap.exists
      ) {
        tx.delete(
          roomRef
        );
      }

      if (
        paymentSnap.exists
      ) {
        tx.delete(
          paymentRef
        );
      }

      if (
        productSnap.exists
      ) {
        tx.update(
          productRef,
          {
            status:
              'available',

            visibility:
              'public',

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );
      }

      return {
        ok: true,

        status:
          'cancelled',

        orderId
      };
    }
  );
}

export async function deleteProduct(
  productId
) {
  if (!productId) {
    throw new HttpError(
      400,
      'Product ID wajib diisi.'
    );
  }

  const productRef =
    db
      .collection('products')
      .doc(productId);

  const snap =
    await productRef.get();

  if (!snap.exists) {
    throw new HttpError(
      404,
      'Produk tidak ditemukan.'
    );
  }

  const product =
    snap.data() || {};

  if (
    product.status ===
    'in_transaction'
  ) {
    throw new HttpError(
      409,
      'Produk sedang dalam transaksi dan tidak dapat dihapus.'
    );
  }

  const images =
    Array.isArray(
      product.images
    )
      ? product.images
      : product.imageUrl
        ? [
            {
              url:
                product.imageUrl,

              publicId:
                ''
            }
          ]
        : [];

  await productRef.delete();

  try {
    await destroyCloudinaryImages(
      images
    );
  } catch {
  }

  return {
    ok: true,

    productId
  };
}

export async function deletePayment(
  paymentId
) {
  if (!paymentId) {
    throw new HttpError(
      400,
      'Payment ID wajib diisi.'
    );
  }

  const paymentRef =
    db
      .collection('payments')
      .doc(paymentId);

  const snap =
    await paymentRef.get();

  if (!snap.exists) {
    throw new HttpError(
      404,
      'Pembayaran tidak ditemukan.'
    );
  }

  const payment =
    snap.data() || {};

  if (
    [
      'pending',
      'verified'
    ].includes(
      payment.status
    )
  ) {
    throw new HttpError(
      409,
      'Pembayaran aktif atau terverifikasi tidak dapat dihapus.'
    );
  }

  await paymentRef.delete();

  return {
    ok: true,

    paymentId
  };
}

export async function deleteRoom(
  roomId
) {
  if (!roomId) {
    throw new HttpError(
      400,
      'Room ID wajib diisi.'
    );
  }

  const roomRef =
    db
      .collection('rooms')
      .doc(roomId);

  const snap =
    await roomRef.get();

  if (!snap.exists) {
    throw new HttpError(
      404,
      'Room tidak ditemukan.'
    );
  }

  const room =
    snap.data() || {};

  if (
    room.status ===
    'in_transaction'
  ) {
    throw new HttpError(
      409,
      'Room sedang dalam transaksi dan tidak dapat dihapus.'
    );
  }

  await roomRef.delete();

  return {
    ok: true,

    roomId
  };
}
