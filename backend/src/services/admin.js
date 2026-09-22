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

async function resolveUser(uid) {
  const normalizedUid =
    String(uid || '').trim();

  if (!normalizedUid) {
    return {
      user: null,
      userRef: null
    };
  }

  const directRef =
    db
      .collection('users')
      .doc(normalizedUid);

  const directSnap =
    await directRef.get();

  if (directSnap.exists) {
    const data =
      directSnap.data() || {};

    return {
      user: data,
      userRef: directSnap.ref
    };
  }

  const query =
    await db
      .collection('users')
      .where(
        'uid',
        '==',
        normalizedUid
      )
      .limit(20)
      .get();

  const found =
    query.docs.find(
      doc =>
        String(
          doc.data()?.uid || ''
        ).trim() === normalizedUid
    );

  if (!found) {
    return {
      user: null,
      userRef: null
    };
  }

  return {
    user:
      found.data() || {},
    userRef:
      found.ref
  };
}

async function resolveSeller(uid) {
  const normalizedUid =
    String(uid || '').trim();

  if (!normalizedUid) {
    return {
      seller: null,
      sellerRef: null,
      registration: null,
      registrationRef: null
    };
  }

  const sellerRef =
    db
      .collection('sellers')
      .doc(normalizedUid);

  const registrationRef =
    db
      .collection('registrations')
      .doc(normalizedUid);

  const [
    sellerSnap,
    registrationSnap
  ] = await Promise.all([
    sellerRef.get(),
    registrationRef.get()
  ]);

  let seller =
    sellerSnap.exists
      ? sellerSnap.data() || {}
      : null;

  let actualSellerRef =
    sellerSnap.exists
      ? sellerSnap.ref
      : null;

  let registration =
    registrationSnap.exists
      ? registrationSnap.data() || {}
      : null;

  let actualRegistrationRef =
    registrationSnap.exists
      ? registrationSnap.ref
      : null;

  if (
    !seller ||
    seller.status !== 'approved'
  ) {
    const sellerQuery =
      await db
        .collection('sellers')
        .where(
          'uid',
          '==',
          normalizedUid
        )
        .limit(20)
        .get();

    const approvedSeller =
      sellerQuery.docs.find(
        doc =>
          doc.data()?.status ===
          'approved'
      );

    if (approvedSeller) {
      seller =
        approvedSeller.data() || {};

      actualSellerRef =
        approvedSeller.ref;
    }
  }

  if (
    !registration ||
    registration.status !==
      'approved'
  ) {
    const registrationQuery =
      await db
        .collection('registrations')
        .where(
          'uid',
          '==',
          normalizedUid
        )
        .limit(20)
        .get();

    const approvedRegistration =
      registrationQuery.docs.find(
        doc =>
          doc.data()?.status ===
          'approved'
      );

    if (approvedRegistration) {
      registration =
        approvedRegistration.data() ||
        {};

      actualRegistrationRef =
        approvedRegistration.ref;
    }
  }

  return {
    seller,
    sellerRef:
      actualSellerRef,
    registration,
    registrationRef:
      actualRegistrationRef
  };
}

function isApprovedSeller(
  seller
) {
  return Boolean(
    seller &&
    seller.status === 'approved' &&
    seller.banned !== true
  );
}

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
      .where(
        'status',
        '==',
        'approved'
      )
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

  const normalizedUsers =
    await Promise.all(
      items.map(
        async user => {
          const uid =
            String(
              user.uid ||
              user.id ||
              ''
            ).trim();

          const resolved =
            await resolveSeller(uid);

          const seller =
            resolved.seller;

          const sellerApproved =
            isApprovedSeller(
              seller
            );

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
      )
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
        String(
          registration.uid ||
          id
        ).trim();

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
            registration.description ||
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
      payment.status !==
      'pending'
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
  const normalizedUid =
    String(uid || '').trim();

  if (!normalizedUid) {
    throw new HttpError(
      400,
      'UID user wajib diisi.'
    );
  }

  if (
    isAdminUid(
      normalizedUid
    )
  ) {
    throw new HttpError(
      403,
      'Akun admin utama tidak dapat diban.'
    );
  }

  const resolvedUser =
    await resolveUser(
      normalizedUid
    );

  if (
    !resolvedUser.userRef
  ) {
    throw new HttpError(
      404,
      'User tidak ditemukan.'
    );
  }

  const value =
    Boolean(banned);

  await resolvedUser.userRef.set(
    {
      uid:
        normalizedUid,

      banned:
        value,

      updatedAt:
        FieldValue.serverTimestamp()
    },
    {
      merge: true
    }
  );

  const resolvedSeller =
    await resolveSeller(
      normalizedUid
    );

  if (
    resolvedSeller.sellerRef
  ) {
    await resolvedSeller.sellerRef.set(
      {
        banned:
          value,

        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );
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
  const normalizedUid =
    String(uid || '').trim();

  if (!normalizedUid) {
    throw new HttpError(
      400,
      'UID user wajib diisi.'
    );
  }

  if (
    isAdminUid(
      normalizedUid
    )
  ) {
    throw new HttpError(
      403,
      'Akun admin utama tidak dapat diubah.'
    );
  }

  const resolvedUser =
    await resolveUser(
      normalizedUid
    );

  if (
    !resolvedUser.userRef
  ) {
    throw new HttpError(
      404,
      'User tidak ditemukan.'
    );
  }

  const userRef =
    resolvedUser.userRef;

  const user =
    resolvedUser.user || {};

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
    let resolvedSeller =
      await resolveSeller(
        normalizedUid
      );

    let seller =
      resolvedSeller.seller;

    let sellerRef =
      resolvedSeller.sellerRef;

    let registration =
      resolvedSeller.registration;

    let registrationRef =
      resolvedSeller.registrationRef;

    if (
      seller?.banned === true
    ) {
      throw new HttpError(
        409,
        'Seller ini sedang diblokir.'
      );
    }

    if (
      !isApprovedSeller(
        seller
      ) &&
      registration?.status !==
        'approved' &&
      user.role === 'seller'
    ) {
      await db
        .collection('sellers')
        .doc(
          normalizedUid
        )
        .set(
          {
            uid:
              normalizedUid,

            email:
              user.email || '',

            name:
              user.name || '',

            phone:
              user.phone || '',

            reason:
              user.reason || '',

            description:
              user.description ||
              user.reason ||
              '',

            photoUrl:
              user.photoUrl ||
              user.photoURL ||
              '',

            status:
              'approved',

            banned:
              user.banned === true,

            approvedAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp()
          },
          {
            merge: true
          }
        );

      resolvedSeller =
        await resolveSeller(
          normalizedUid
        );

      seller =
        resolvedSeller.seller;

      sellerRef =
        resolvedSeller.sellerRef;

      registration =
        resolvedSeller.registration;

      registrationRef =
        resolvedSeller.registrationRef;
    }

    const activeSeller =
      isApprovedSeller(
        seller
      );

    const activeRegistration =
      Boolean(
        registration &&
        registration.status ===
          'approved' &&
        registration.banned !== true
      );

    if (
      !activeSeller &&
      !activeRegistration
    ) {
      throw new HttpError(
        409,
        'User ini bukan seller aktif.'
      );
    }

    const source =
      activeSeller
        ? seller
        : registration;

    const cleanName =
      hasName
        ? String(
            name ?? ''
          ).trim()
        : String(
            source?.name ||
            seller?.name ||
            registration?.name ||
            user.name ||
            ''
          ).trim();

    const cleanPhone =
      hasPhone
        ? String(
            phone ?? ''
          ).trim()
        : String(
            source?.phone ||
            seller?.phone ||
            registration?.phone ||
            user.phone ||
            ''
          ).trim();

    if (!cleanName) {
      throw new HttpError(
        400,
        'Nama seller wajib diisi.'
      );
    }

    const batch =
      db.batch();

    const targetSellerRef =
      sellerRef ||
      db
        .collection('sellers')
        .doc(
          normalizedUid
        );

    batch.set(
      targetSellerRef,
      {
        uid:
          normalizedUid,

        email:
          seller?.email ||
          registration?.email ||
          user.email ||
          '',

        name:
          cleanName,

        phone:
          cleanPhone,

        reason:
          seller?.reason ||
          registration?.reason ||
          user.reason ||
          '',

        description:
          seller?.description ||
          registration?.description ||
          user.description ||
          user.reason ||
          '',

        photoUrl:
          seller?.photoUrl ||
          registration?.photoUrl ||
          user.photoUrl ||
          user.photoURL ||
          '',

        status:
          'approved',

        banned:
          seller?.banned === true ||
          registration?.banned === true ||
          user.banned === true,

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
        uid:
          normalizedUid,

        name:
          cleanName,

        phone:
          cleanPhone,

        role:
          'seller',

        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );

    if (
      registrationRef
    ) {
      batch.set(
        registrationRef,
        {
          uid:
            registration?.uid ||
            normalizedUid,

          name:
            cleanName,

          phone:
            cleanPhone,

          status:
            'approved',

          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    }

    await batch.commit();

    result.name =
      cleanName;

    result.phone =
      cleanPhone;

    result.role =
      'seller';
  }

  if (
    typeof banned ===
    'boolean'
  ) {
    const banResult =
      await setBan(
        normalizedUid,
        banned
      );

    result.banned =
      banResult.banned;
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
      const sellerRef =
        db
          .collection('sellers')
          .doc(
            normalizedUid
          );

      await sellerRef.set(
        {
          uid:
            normalizedUid,

          email:
            user.email || '',

          name:
            user.name || '',

          phone:
            user.phone || '',

          reason:
            user.reason || '',

          description:
            user.description ||
            user.reason ||
            '',

          photoUrl:
            user.photoUrl ||
            user.photoURL ||
            '',

          status:
            'approved',

          banned:
            Boolean(
              user.banned
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
          uid:
            normalizedUid,

          role:
            'seller',

          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

      result.role =
        'seller';
    }

    if (
      role === 'buyer'
    ) {
      const sellerRef =
        db
          .collection('sellers')
          .doc(
            normalizedUid
          );

      const sellerSnap =
        await sellerRef.get();

      if (
        sellerSnap.exists
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
          uid:
            normalizedUid,

          role:
            'buyer',

          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

      result.role =
        'buyer';
    }
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
