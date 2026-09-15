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

async function adminUids() {
  const adminUid = String(
    env.adminUid || ''
  ).trim();

  if (!adminUid) {
    return [];
  }

  return [
    adminUid
  ];
}

export async function createOrder(
  buyerUid,
  productId
) {
  const admins = await adminUids();

  if (!admins.length) {
    throw new HttpError(
      503,
      'Admin belum tersedia.'
    );
  }

  return db.runTransaction(
    async tx => {
      const productRef = db
        .collection('products')
        .doc(productId);

      const snap = await tx.get(
        productRef
      );

      if (!snap.exists) {
        throw new HttpError(
          404,
          'Produk tidak ditemukan.'
        );
      }

      const product =
        snap.data();

      const stock = Number(
        product.stock
      );

      if (
        product.status !== 'available' ||
        product.visibility !== 'public' ||
        !Number.isInteger(stock) ||
        stock < 1
      ) {
        throw new HttpError(
          409,
          'Produk tidak tersedia atau sedang dalam transaksi.'
        );
      }

      if (
        product.sellerUid === buyerUid
      ) {
        throw new HttpError(
          403,
          'Seller tidak dapat membeli produknya sendiri.'
        );
      }

      const orderRef = db
        .collection('orders')
        .doc();

      const pid =
        product.productId ||
        productId;

      tx.set(
        orderRef,
        {
          buyerUid,

          sellerUid:
            product.sellerUid,

          productId:
            pid,

          productName:
            product.title || '',

          amount:
            Number(product.price),

          status:
            'pending_admin',

          paymentStatus:
            'waiting_admin',

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      return {
        orderId:
          orderRef.id,

        roomId:
          null,

        productId:
          pid,

        status:
          'pending_admin'
      };
    }
  );
}

export async function doneOrder(
  orderId,
  buyerUid
) {
  return db.runTransaction(
    async tx => {
      const orderRef = db
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
        order.buyerUid !==
        buyerUid
      ) {
        throw new HttpError(
          403,
          'Hanya buyer yang dapat menekan DONE.'
        );
      }

      if (
        [
          'completed',
          'cancelled',
          'rejected'
        ].includes(
          order.status
        )
      ) {
        throw new HttpError(
          409,
          'Transaksi sudah selesai atau dibatalkan.'
        );
      }

      if (
        order.status !==
        'in_transaction'
      ) {
        throw new HttpError(
          409,
          'Order belum disetujui admin.'
        );
      }

      if (
        order.paymentStatus !==
        'verified'
      ) {
        throw new HttpError(
          409,
          'Pembayaran belum diverifikasi admin.'
        );
      }

      const roomRef = db
        .collection('rooms')
        .doc(
          order.roomId ||
          orderId
        );

      const roomSnap =
        await tx.get(
          roomRef
        );

      const productRef = db
        .collection('products')
        .doc(
          order.productId
        );

      const productSnap =
        await tx.get(
          productRef
        );

      if (
        !productSnap.exists
      ) {
        throw new HttpError(
          409,
          'Produk transaksi tidak ditemukan.'
        );
      }

      const product =
        productSnap.data();

      const stock = Math.max(
        0,
        Number(product.stock) - 1
      );

      tx.update(
        orderRef,
        {
          status:
            'completed',

          completedAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      if (
        roomSnap.exists
      ) {
        tx.update(
          roomRef,
          {
            status:
              'completed',

            completedAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );
      }

      tx.update(
        productRef,
        stock === 0
          ? {
              stock: 0,

              status:
                'sold',

              visibility:
                'private',

              updatedAt:
                FieldValue.serverTimestamp()
            }
          : {
              stock,

              status:
                'available',

              visibility:
                'public',

              updatedAt:
                FieldValue.serverTimestamp()
            }
      );

      return {
        ok: true,

        status:
          'completed'
      };
    }
  );
}
