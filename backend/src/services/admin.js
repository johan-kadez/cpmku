import {
  db,
  FieldValue
} from '../firebase/admin.js';

import {
  HttpError
} from '../utils/errors.js';

import {
  env
} from '../config/env.js';

import {
  approveOrder,
  rejectOrder
} from './adminActions.js';

const COLLECTIONS = {
  sellers: 'registrations',
  products: 'products',
  orders: 'orders',
  payments: 'payments',
  users: 'users'
};

const ADMIN_UID = String(
  env.adminUid || ''
).trim();

export async function dashboard() {
  const [
    users,
    sellers,
    products,
    orders,
    payments,
    rooms
  ] = await Promise.all([
    db
      .collection('users')
      .count()
      .get(),

    db
      .collection('sellers')
      .where('status', '==', 'approved')
      .get(),

    db
      .collection('products')
      .count()
      .get(),

    db
      .collection('orders')
      .count()
      .get(),

    db
      .collection('payments')
      .count()
      .get(),

    db
      .collection('rooms')
      .count()
      .get()
  ]);

  const activeSellers =
    sellers.docs.filter(
      doc =>
        doc.data()?.banned !== true
    ).length;

  return {
    stats: {
      users:
        users.data().count,

      sellers:
        activeSellers,

      products:
        products.data().count,

      orders:
        orders.data().count,

      payments:
        payments.data().count,

      rooms:
        rooms.data().count
    }
  };
}

export async function listCollection(
  name
) {
  const collection =
    COLLECTIONS[name] ||
    name;

  const snap =
    await db
      .collection(collection)
      .limit(200)
      .get();

  const items =
    snap.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );

  if (
    name !== 'users'
  ) {
    return {
      items
    };
  }

  const sellerRefs =
    items.map(
      user =>
        db
          .collection('sellers')
          .doc(
            user.uid ||
            user.id
          )
          .get()
    );

  const sellerSnapshots =
    await Promise.all(
      sellerRefs
    );

  const sellerMap =
    new Map();

  sellerSnapshots.forEach(
    sellerSnap => {
      if (
        sellerSnap.exists
      ) {
        sellerMap.set(
          sellerSnap.id,
          sellerSnap.data()
        );
      }
    }
  );

  const normalizedUsers =
    items.map(
      user => {
        const uid =
          String(
            user.uid ||
            user.id ||
            ''
          ).trim();

        const seller =
          sellerMap.get(uid);

        const sellerApproved =
          seller?.status ===
            'approved' &&
          seller?.banned !== true;

        const role =
          uid === ADMIN_UID
            ? 'admin'
            : sellerApproved
              ? 'seller'
              : (
                  user.role ||
                  'buyer'
                );

        return {
          ...user,

          uid,

          role,

          sellerActive:
            sellerApproved,

          sellerStatus:
            seller?.status ||
            null,

          sellerBanned:
            Boolean(
              seller?.banned
            )
        };
      }
    );

  return {
    items:
      normalizedUsers
  };
}

export async function setStatus(
  type,
  id,
  status
) {
  if (!id) {
    throw new HttpError(
      400,
      'ID data wajib diisi.'
    );
  }

  if (
    type === 'orders'
  ) {
    if (
      status === 'approved'
    ) {
      return approveOrder(id);
    }

    if (
      status === 'rejected'
    ) {
      return rejectOrder(id);
    }

    if (
      status !== 'cancelled'
    ) {
      throw new HttpError(
        400,
        'Status order tidak valid.'
      );
    }
  }

  if (
    type === 'rooms'
  ) {
    throw new HttpError(
      400,
      'Room tidak menggunakan status approve/reject. Gunakan lifecycle transaksi.'
    );
  }

  const collection =
    COLLECTIONS[type];

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
    ]
  };

  if (
    !allowed[type]?.includes(
      status
    )
  ) {
    throw new HttpError(
      400,
      'Status tidak valid.'
    );
  }

  const ref =
    db
      .collection(collection)
      .doc(id);

  const snap =
    await ref.get();

  if (!snap.exists) {
    throw new HttpError(
      404,
      'Data tidak ditemukan.'
    );
  }

  if (
    type === 'sellers'
  ) {
    const registration =
      snap.data();

    if (
      registration.status !==
      'pending'
    ) {
      throw new HttpError(
        409,
        'Pengajuan seller ini sudah diproses.'
      );
    }

    if (
      status === 'approved'
    ) {
      const sellerUid =
        registration.uid ||
        id;

      const sellerRef =
        db
          .collection('sellers')
          .doc(
            sellerUid
          );

      const batch =
        db.batch();

      batch.set(
        sellerRef,
        {
          uid:
            sellerUid,

          email:
            registration.email ||
            '',

          name:
            registration.name ||
            '',

          phone:
            registration.phone ||
            '',

          reason:
            registration.reason ||
            '',

          description:
            registration.reason ||
            '',

          photoUrl:
            registration.photoUrl ||
            '',

          status:
            'approved',

          banned:
            false,

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
          status:
            'approved',

          approvedAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      await batch.commit();

      return {
        ok: true,
        status:
          'approved'
      };
    }

    await ref.update({
      status:
        'rejected',

      rejectedAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp()
    });

    return {
      ok: true,
      status:
        'rejected'
    };
  }

  if (
    type === 'products'
  ) {
    if (
      status === 'approved'
    ) {
      await ref.update({
        status:
          'available',

        visibility:
          'public',

        approvedAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp()
      });

      return {
        ok: true,
        status:
          'approved',
        actualStatus:
          'available'
      };
    }

    await ref.update({
      status:
        'rejected',

      visibility:
        'private',

      rejectedAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp()
    });

    return {
      ok: true,
      status:
        'rejected'
    };
  }

  if (
    type === 'orders' &&
    status === 'cancelled'
  ) {
    const order =
      snap.data();

    if (
      order.status !==
      'in_transaction'
    ) {
      throw new HttpError(
        409,
        'Order tidak sedang aktif.'
      );
    }

    return db.runTransaction(
      async transaction => {
        const fresh =
          await transaction.get(
            ref
          );

        if (!fresh.exists) {
          throw new HttpError(
            404,
            'Order tidak ditemukan.'
          );
        }

        const current =
          fresh.data();

        if (
          current.status !==
          'in_transaction'
        ) {
          throw new HttpError(
            409,
            'Order tidak sedang aktif.'
          );
        }

        const productRef =
          db
            .collection('products')
            .doc(
              current.productId
            );

        const roomRef =
          db
            .collection('rooms')
            .doc(
              current.roomId ||
              id
            );

        const paymentRef =
          db
            .collection('payments')
            .doc(id);

        const [
          product,
          room,
          payment
        ] =
          await Promise.all([
            transaction.get(
              productRef
            ),

            transaction.get(
              roomRef
            ),

            transaction.get(
              paymentRef
            )
          ]);

        transaction.update(
          ref,
          {
            status:
              'cancelled',

            cancelledAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        if (
          product.exists &&
          product.data()?.status ===
            'in_transaction'
        ) {
          transaction.update(
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

        if (
          room.exists
        ) {
          transaction.update(
            roomRef,
            {
              status:
                'cancelled',

              cancelledAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp()
            }
          );
        }

        if (
          payment.exists &&
          payment.data()?.status ===
            'pending'
        ) {
          transaction.update(
            paymentRef,
            {
              status:
                'rejected',

              rejectedAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp()
            }
          );
        }

        return {
          ok: true,
          status:
            'cancelled'
        };
      }
    );
  }

  if (
    type === 'payments'
  ) {
    const payment =
      snap.data();

    if (
      ![
        'pending'
      ].includes(
        payment.status
      )
    ) {
      throw new HttpError(
        409,
        'Pembayaran ini sudah diproses.'
      );
    }

    const orderRef =
      db
        .collection('orders')
        .doc(
          payment.orderId ||
          id
        );

    const orderSnap =
      await orderRef.get();

    if (
      status === 'verified'
    ) {
      await ref.update({
        status:
          'verified',

        verifiedAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp()
      });

      if (
        orderSnap.exists
      ) {
        await orderRef.update({
          paymentStatus:
            'verified',

          updatedAt:
            FieldValue.serverTimestamp()
        });
      }
    } else {
      await ref.update({
        status:
          'rejected',

        rejectedAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp()
      });

      if (
        orderSnap.exists
      ) {
        await orderRef.update({
          paymentStatus:
            'rejected',

          updatedAt:
            FieldValue.serverTimestamp()
        });
      }
    }

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
  if (!uid) {
    throw new HttpError(
      400,
      'UID user wajib diisi.'
    );
  }

  if (
    isAdminUid(uid)
  ) {
    throw new HttpError(
      403,
      'Akun admin utama tidak dapat diban.'
    );
  }

  const value =
    Boolean(banned);

  const userRef =
    db
      .collection('users')
      .doc(uid);

  const userSnap =
    await userRef.get();

  if (!userSnap.exists) {
    throw new HttpError(
      404,
      'User tidak ditemukan.'
    );
  }

  await userRef.set(
    {
      uid,

      banned:
        value,

      updatedAt:
        FieldValue.serverTimestamp()
    },
    {
      merge: true
    }
  );

  const seller =
    await db
      .collection('sellers')
      .doc(uid)
      .get();

  if (
    seller.exists
  ) {
    await seller.ref.update({
      banned:
        value,

      updatedAt:
        FieldValue.serverTimestamp()
    });
  }

  return {
    ok: true,
    banned:
      value
  };
}

export async function updateUser(
  uid,
  {
    banned,
    role,
    name,
    phone
  } = {}
) {
  if (!uid) {
    throw new HttpError(
      400,
      'UID user wajib diisi.'
    );
  }

  if (
    isAdminUid(uid)
  ) {
    throw new HttpError(
      403,
      'Akun admin utama tidak dapat diubah.'
    );
  }

  const userRef =
    db
      .collection('users')
      .doc(uid);

  const sellerRef =
    db
      .collection('sellers')
      .doc(uid);

  const [
    userSnap,
    sellerSnap
  ] = await Promise.all([
    userRef.get(),
    sellerRef.get()
  ]);

  const user =
    userSnap.exists
      ? userSnap.data() || {}
      : {};

  const seller =
    sellerSnap.exists
      ? sellerSnap.data() || {}
      : {};

  const result = {
    ok: true
  };

  const hasName =
    name !== undefined;

  const hasPhone =
    phone !== undefined;

  if (
    hasName ||
    hasPhone
  ) {
    if (
      !sellerSnap.exists
    ) {
      throw new HttpError(
        409,
        'User ini bukan seller aktif.'
      );
    }

    if (
      seller.status !==
      'approved'
    ) {
      throw new HttpError(
        409,
        'Seller belum berstatus aktif.'
      );
    }

    const sellerName =
      hasName
        ? String(
            name || ''
          ).trim()
        : String(
            seller.name ||
            user.name ||
            ''
          ).trim();

    const sellerPhone =
      hasPhone
        ? String(
            phone || ''
          ).trim()
        : String(
            seller.phone ||
            user.phone ||
            ''
          ).trim();

    if (
      !sellerName
    ) {
      throw new HttpError(
        400,
        'Nama seller wajib diisi.'
      );
    }

    const batch =
      db.batch();

    batch.set(
      sellerRef,
      {
        uid,

        name:
          sellerName,

        phone:
          sellerPhone,

        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );

    batch.set(
      userRef,
      {
        uid,

        name:
          sellerName,

        phone:
          sellerPhone,

        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );

    await batch.commit();

    result.name =
      sellerName;

    result.phone =
      sellerPhone;
  }

  if (
    typeof banned ===
    'boolean'
  ) {
    await setBan(
      uid,
      banned
    );

    result.banned =
      banned;
  }

  if (
    role !== undefined
  ) {
    if (
      ![
        'buyer',
        'seller'
      ].includes(role)
    ) {
      throw new HttpError(
        400,
        'Role tidak valid.'
      );
    }

    if (
      role === 'seller'
    ) {
      const currentUser =
        user;

      await sellerRef.set(
        {
          uid,

          email:
            currentUser.email ||
            '',

          name:
            currentUser.name ||
            '',

          phone:
            currentUser.phone ||
            '',

          reason:
            currentUser.reason ||
            '',

          description:
            currentUser.reason ||
            '',

          photoUrl:
            currentUser.photoUrl ||
            currentUser.photoURL ||
            '',

          status:
            'approved',

          banned:
            Boolean(
              currentUser.banned
            ),

          approvedAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

      await userRef.set(
        {
          uid,

          role:
            'seller',

          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    }

    if (
      role === 'buyer'
    ) {
      const currentSeller =
        await sellerRef.get();

      if (
        currentSeller.exists
      ) {
        await sellerRef.update({
          status:
            'revoked',

          updatedAt:
            FieldValue.serverTimestamp()
        });
      }

      await userRef.set(
        {
          uid,

          role:
            'buyer',

          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    }

    result.role =
      role;
  }

  return result;
}

export function isAdminUid(
  uid
) {
  if (
    !uid ||
    !ADMIN_UID
  ) {
    return false;
  }

  return (
    String(uid) ===
    ADMIN_UID
  );
}

export async function saveSettings(
  data
) {
  const qrisUrl =
    String(
      data?.qrisUrl ||
      ''
    ).trim();

  const maintenanceMode =
    Boolean(
      data?.maintenanceMode
    );

  const maintenanceTitle =
    String(
      data?.maintenanceTitle ||
      ''
    ).trim();

  const maintenanceMessage =
    String(
      data?.maintenanceMessage ||
      ''
    ).trim();

  if (qrisUrl) {
    try {
      new URL(
        qrisUrl
      );
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
