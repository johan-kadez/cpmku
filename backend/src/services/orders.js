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

  if (
    !buyerUid ||
    !productId
  ) {
    throw new HttpError(
      400,
      'Data order tidak lengkap.'
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
        snap.data() || {};

      const stock = Number(
        product.stock
      );

      if (
        product.status !==
          'available' ||
        product.visibility !==
          'public' ||
        !Number.isInteger(stock) ||
        stock < 1
      ) {
        throw new HttpError(
          409,
          'Produk tidak tersedia atau sedang dalam transaksi.'
        );
      }

      if (
        product.sellerUid ===
        buyerUid
      ) {
        throw new HttpError(
          403,
          'Seller tidak dapat membeli produknya sendiri.'
        );
      }

      if (
        stock === 1 &&
        product.reservedOrderId
      ) {
        throw new HttpError(
          409,
          'Product sedang dipesan oleh seseorang.'
        );
      }

      if (
        product.activeOrderId
      ) {
        throw new HttpError(
          409,
          'Product sedang dipesan oleh seseorang.'
        );
      }

      const orderRef = db
        .collection('orders')
        .doc();

      const pid =
        product.productId ||
        productId;

      const isSingleStock =
        stock === 1;

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

          reservedProduct:
            isSingleStock,

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      if (isSingleStock) {
        tx.update(
          productRef,
          {
            reservedOrderId:
              orderRef.id,

            reservedAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );
      }

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
        orderSnap.data() || {};

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
        productSnap.data() || {};

      if (
        product.activeOrderId &&
        product.activeOrderId !==
          orderId
      ) {
        throw new HttpError(
          409,
          'Product sedang dipesan oleh seseorang.'
        );
      }

      const currentStock =
        Number(
          product.stock
        );

      if (
        !Number.isInteger(
          currentStock
        ) ||
        currentStock < 1
      ) {
        throw new HttpError(
          409,
          'Stok produk sudah habis.'
        );
      }

      const stock =
        currentStock - 1;

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

      if (
        stock === 0
      ) {
        tx.update(
          productRef,
          {
            stock: 0,

            status:
              'sold',

            visibility:
              'private',

            activeOrderId:
              FieldValue.delete(),

            reservedOrderId:
              FieldValue.delete(),

            reservedAt:
              FieldValue.delete(),

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );
      } else {
        tx.update(
          productRef,
          {
            stock,

            status:
              'available',

            visibility:
              'public',

            activeOrderId:
              FieldValue.delete(),

            reservedOrderId:
              FieldValue.delete(),

            reservedAt:
              FieldValue.delete(),

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );
      }

      return {
        ok: true,

        status:
          'completed'
      };
    }
  );
}
