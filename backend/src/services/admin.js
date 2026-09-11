import {
  db,
  auth,
  FieldValue
} from '../firebase/admin.js';

import { HttpError } from '../utils/errors.js';
import { env } from '../config/env.js';

const COLLECTIONS = {
  sellers: 'registrations',
  products: 'products',
  orders: 'orders',
  payments: 'payments',
  rooms: 'rooms',
  users: 'users'
};

export async function dashboard() {
  const [
    sellers,
    products,
    orders,
    payments,
    rooms
  ] = await Promise.all(
    [
      'registrations',
      'products',
      'orders',
      'payments',
      'rooms'
    ].map((collection) =>
      db.collection(collection).get()
    )
  );

  return {
    stats: {
      registrations: sellers.size,
      products: products.size,
      orders: orders.size,
      payments: payments.size,
      rooms: rooms.size
    }
  };
}

export async function listCollection(name) {
  const collection =
    COLLECTIONS[name] || name;

  const snap = await db
    .collection(collection)
    .limit(200)
    .get();

  return {
    items: snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  };
}

export async function setStatus(
  type,
  id,
  status
) {
  const collection = COLLECTIONS[type];

  if (!collection) {
    throw new HttpError(
      400,
      'Jenis tidak valid.'
    );
  }

  const allowed = {
    sellers: [
      'approved',
      'rejected'
    ],
    products: [
      'approved',
      'rejected'
    ],
    orders: [
      'cancelled'
    ],
    payments: [
      'verified',
      'rejected'
    ],
    rooms: [
      'cancelled'
    ]
  };

  if (
    !allowed[type]?.includes(status)
  ) {
    throw new HttpError(
      400,
      'Status tidak valid.'
    );
  }

  if (!id) {
    throw new HttpError(
      400,
      'ID data wajib diisi.'
    );
  }

  const ref = db
    .collection(collection)
    .doc(id);

  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpError(
      404,
      'Data tidak ditemukan.'
    );
  }

  if (type === 'sellers') {
    const registration = snap.data();

    if (
      registration.status !== 'pending'
    ) {
      throw new HttpError(
        409,
        'Pengajuan seller ini sudah diproses.'
      );
    }

    if (status === 'approved') {
      const sellerRef = db
        .collection('sellers')
        .doc(id);

      const batch = db.batch();

      batch.set(
        sellerRef,
        {
          uid: registration.uid || id,
          email: registration.email || '',
          name: registration.name || '',
          phone: registration.phone || '',
          reason: registration.reason || '',
          description:
            registration.reason || '',
          photoUrl:
            registration.photoUrl || '',
          status: 'approved',
          banned: false,
          approvedAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

      batch.update(
        ref,
        {
          status: 'approved',
          approvedAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      await batch.commit();

      return {
        ok: true,
        status: 'approved'
      };
    }

    await ref.update({
      status: 'rejected',
      rejectedAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp()
    });

    return {
      ok: true,
      status: 'rejected'
    };
  }

  if (type === 'products') {
    if (status === 'approved') {
      await ref.update({
        status: 'available',
        visibility: 'public',
        approvedAt:
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp()
      });
    } else {
      await ref.update({
        status: 'rejected',
        visibility: 'private',
        rejectedAt:
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp()
      });
    }

    return {
      ok: true,
      status
    };
  }

  if (
    type === 'orders' &&
    status === 'cancelled'
  ) {
    return db.runTransaction(
      async (transaction) => {
        const fresh =
          await transaction.get(ref);

        if (!fresh.exists) {
          throw new HttpError(
            404,
            'Order tidak ditemukan.'
          );
        }

        const order = fresh.data();

        if (
          order.status !== 'in_transaction'
        ) {
          throw new HttpError(
            409,
            'Order tidak sedang aktif.'
          );
        }

        const productRef = db
          .collection('products')
          .doc(order.productId);

        const roomRef = db
          .collection('rooms')
          .doc(order.roomId || id);

        const paymentRef = db
          .collection('payments')
          .doc(id);

        const [
          product,
          room,
          payment
        ] = await Promise.all([
          transaction.get(productRef),
          transaction.get(roomRef),
          transaction.get(paymentRef)
        ]);

        transaction.update(
          ref,
          {
            status: 'cancelled',
            cancelledAt:
              FieldValue.serverTimestamp(),
            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        if (
          product.exists &&
          product.data().status ===
            'in_transaction'
        ) {
          transaction.update(
            productRef,
            {
              status: 'available',
              visibility: 'public',
              updatedAt:
                FieldValue.serverTimestamp()
            }
          );
        }

        if (room.exists) {
          transaction.update(
            roomRef,
            {
              status: 'cancelled',
              cancelledAt:
                FieldValue.serverTimestamp(),
              updatedAt:
                FieldValue.serverTimestamp()
            }
          );
        }

        if (
          payment.exists &&
          payment.data().status === 'pending'
        ) {
          transaction.update(
            paymentRef,
            {
              status: 'rejected',
              updatedAt:
                FieldValue.serverTimestamp()
            }
          );
        }

        return {
          ok: true,
          status: 'cancelled'
        };
      }
    );
  }

  if (type === 'payments') {
    const payment = snap.data();

    const orderRef = db
      .collection('orders')
      .doc(payment.orderId);

    if (status === 'verified') {
      await ref.update({
        status: 'verified',
        verifiedAt:
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp()
      });

      await orderRef.update({
        paymentStatus: 'verified',
        updatedAt:
          FieldValue.serverTimestamp()
      });
    } else {
      await ref.update({
        status: 'rejected',
        rejectedAt:
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp()
      });

      await orderRef.update({
        paymentStatus: 'rejected',
        updatedAt:
          FieldValue.serverTimestamp()
      });
    }

    return {
      ok: true,
      status
    };
  }

  if (type === 'rooms') {
    await ref.update({
      status,
      updatedAt:
        FieldValue.serverTimestamp()
    });

    return {
      ok: true,
      status
    };
  }

  throw new HttpError(
    400,
    'Aksi tidak tersedia.'
  );
}

export async function setBan(
  uid,
  banned
) {
  const value = Boolean(banned);

  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        uid,
        banned: value,
        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );

  const seller = await db
    .collection('sellers')
    .doc(uid)
    .get();

  if (seller.exists) {
    await seller.ref.update({
      banned: value,
      updatedAt:
        FieldValue.serverTimestamp()
    });
  }

  return {
    ok: true
  };
}

export async function updateUser(
  uid,
  {
    banned,
    role
  } = {}
) {
  const result = {
    ok: true
  };

  if (
    typeof banned === 'boolean'
  ) {
    await setBan(
      uid,
      banned
    );

    result.banned = banned;
  }

  if (role) {
    if (
      !['buyer', 'seller'].includes(role)
    ) {
      throw new HttpError(
        400,
        'Role tidak valid.'
      );
    }

    const sellerRef = db
      .collection('sellers')
      .doc(uid);

    if (role === 'seller') {
      const userSnap = await db
        .collection('users')
        .doc(uid)
        .get();

      const user = userSnap.exists
        ? userSnap.data()
        : {};

      await sellerRef.set(
        {
          uid,
          email: user.email || '',
          name: user.name || '',
          photoUrl:
            user.photoUrl || '',
          status: 'approved',
          banned: false,
          approvedAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    } else {
      const existing =
        await sellerRef.get();

      if (existing.exists) {
        await sellerRef.update({
          status: 'revoked',
          updatedAt:
            FieldValue.serverTimestamp()
        });
      }
    }

    result.role = role;
  }

  return result;
}

export async function setAdminClaim(
  uid,
  isAdmin = true
) {
  if (!uid) {
    throw new HttpError(
      400,
      'UID pengguna wajib diisi.'
    );
  }

  let user;

  try {
    user = await auth.getUser(uid);
  } catch {
    throw new HttpError(
      404,
      'Pengguna Firebase tidak ditemukan.'
    );
  }

  const currentClaims =
    user.customClaims || {};

  const nextClaims = {
    ...currentClaims,
    admin: Boolean(isAdmin)
  };

  await auth.setCustomUserClaims(
    uid,
    nextClaims
  );

  return {
    ok: true,
    uid,
    email: user.email || '',
    admin: Boolean(isAdmin)
  };
}

export async function bootstrapAdmin() {
  if (
    !env.adminBootstrapSecret ||
    !env.adminBootstrapUid
  ) {
    throw new HttpError(
      503,
      'Admin bootstrap belum dikonfigurasi.'
    );
  }

  return setAdminClaim(
    env.adminBootstrapUid,
    true
  );
}

export async function saveSettings(data) {
  const qrisUrl = String(
    data?.qrisUrl || ''
  ).trim();

  const maintenanceMode = Boolean(
    data?.maintenanceMode
  );

  const maintenanceTitle = String(
    data?.maintenanceTitle || ''
  ).trim();

  const maintenanceMessage = String(
    data?.maintenanceMessage || ''
  ).trim();

  if (qrisUrl) {
    try {
      new URL(qrisUrl);
    } catch {
      throw new HttpError(
        400,
        'URL QRIS tidak valid.'
      );
    }
  }

  await db
    .collection('settings')
    .doc('main')
    .set(
      {
        qrisUrl,
        maintenanceMode,
        maintenanceTitle,
        maintenanceMessage,
        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );

  return {
    ok: true
  };
}
