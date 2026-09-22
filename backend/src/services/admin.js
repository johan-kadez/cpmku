import {
  db,
  auth,
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

function normalize(
  value
) {
  return String(
    value || ''
  ).trim();
}

function uniqueValues(
  values
) {
  return [
    ...new Set(
      values
        .map(normalize)
        .filter(Boolean)
    )
  ];
}

async function findByIdOrUid(
  collectionName,
  identifiers
) {
  const values =
    uniqueValues(
      identifiers
    );

  if (!values.length) {
    return null;
  }

  const collection =
    db.collection(
      collectionName
    );

  for (
    const value of values
  ) {
    const directRef =
      collection.doc(
        value
      );

    const directSnap =
      await directRef.get();

    if (
      directSnap.exists
    ) {
      return directSnap;
    }
  }

  for (
    const value of values
  ) {
    const query =
      await collection
        .where(
          'uid',
          '==',
          value
        )
        .limit(20)
        .get();

    const match =
      query.docs.find(
        doc =>
          normalize(
            doc.data()?.uid
          ) === value
      );

    if (match) {
      return match;
    }
  }

  return null;
}

async function findUserByEmail(
  email
) {
  const normalizedEmail =
    normalize(email).toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const query =
    await db
      .collection('users')
      .where(
        'email',
        '==',
        normalizedEmail
      )
      .limit(20)
      .get();

  return (
    query.docs.find(
      doc =>
        normalize(
          doc.data()?.email
        ).toLowerCase() ===
        normalizedEmail
    ) || null
  );
}

async function resolveFirebaseAuth(
  identifiers,
  email
) {
  const values =
    uniqueValues(
      identifiers
    );

  const normalizedEmail =
    normalize(email).toLowerCase();

  if (
    normalizedEmail
  ) {
    try {
      const user =
        await auth.getUserByEmail(
          normalizedEmail
        );

      if (user?.uid) {
        return user;
      }
    } catch {
      // Firebase Auth user tidak ditemukan berdasarkan email.
    }
  }

  for (
    const value of values
  ) {
    try {
      const user =
        await auth.getUser(
          value
        );

      if (user?.uid) {
        return user;
      }
    } catch {
      // Lanjutkan ke identifier berikutnya.
    }
  }

  return null;
}

async function resolveUser(
  identifier,
  hints = {}
) {
  const identifiers =
    uniqueValues([
      identifier,
      hints.uid,
      hints.userId,
      hints.id
    ]);

  const email =
    normalize(
      hints.email
    );

  if (
    !identifiers.length &&
    !email
  ) {
    return {
      user: null,
      userRef: null,
      uid: null,
      seller: null,
      sellerRef: null,
      registration: null,
      registrationRef: null,
      authUser: null
    };
  }

  /*
   * 1. Cari seller lebih dahulu.
   *
   * Ini penting karena admin sedang mengedit seller.
   * Firestore document ID seller tidak selalu sama
   * dengan Firebase Auth UID.
   */
  const sellerSnap =
    await findByIdOrUid(
      'sellers',
      identifiers
    );

  let seller =
    sellerSnap?.data() || null;

  let sellerRef =
    sellerSnap?.ref || null;

  /*
   * 2. Cari registration.
   */
  const registrationSnap =
    await findByIdOrUid(
      'registrations',
      identifiers
    );

  let registration =
    registrationSnap?.data() ||
    null;

  let registrationRef =
    registrationSnap?.ref ||
    null;

  /*
   * 3. Cari user berdasarkan document ID
   * atau field uid.
   */
  const userSnap =
    await findByIdOrUid(
      'users',
      identifiers
    );

  let user =
    userSnap?.data() || null;

  let userRef =
    userSnap?.ref || null;

  /*
   * 4. Cari berdasarkan email kalau tersedia.
   */
  if (
    !user &&
    email
  ) {
    const emailUser =
      await findUserByEmail(
        email
      );

    if (emailUser) {
      user =
        emailUser.data() || {};

      userRef =
        emailUser.ref;
    }
  }

  /*
   * 5. Ambil Firebase Auth user.
   */
  const authUser =
    await resolveFirebaseAuth(
      identifiers,
      email
    );

  /*
   * 6. Tentukan UID yang benar.
   *
   * Prioritas:
   * seller.uid
   * registration.uid
   * user.uid
   * Firebase Auth UID
   * identifier
   */
  const resolvedUid =
    normalize(
      seller?.uid ||
      registration?.uid ||
      user?.uid ||
      authUser?.uid ||
      identifier ||
      hints.uid ||
      hints.userId ||
      hints.id
    );

  /*
   * Kalau belum ada UID sama sekali,
   * data memang tidak bisa dipetakan.
   */
  if (!resolvedUid) {
    return {
      user: null,
      userRef: null,
      uid: null,
      seller,
      sellerRef,
      registration,
      registrationRef,
      authUser
    };
  }

  /*
   * 7. Kalau seller ditemukan berdasarkan
   * document ID tetapi field uid kosong,
   * tetap gunakan document ID sebagai fallback.
   */
  if (
    sellerRef &&
    seller &&
    !normalize(
      seller.uid
    )
  ) {
    seller = {
      ...seller,
      uid:
        resolvedUid
    };
  }

  if (
    registrationRef &&
    registration &&
    !normalize(
      registration.uid
    )
  ) {
    registration = {
      ...registration,
      uid:
        resolvedUid
    };
  }

  /*
   * 8. Kalau user belum ditemukan berdasarkan
   * identifier awal, coba users/{resolvedUid}.
   */
  if (
    !userRef
  ) {
    const resolvedUserRef =
      db
        .collection('users')
        .doc(
          resolvedUid
        );

    const resolvedUserSnap =
      await resolvedUserRef.get();

    if (
      resolvedUserSnap.exists
    ) {
      user =
        resolvedUserSnap.data() ||
        {};

      userRef =
        resolvedUserSnap.ref;
    }
  }

  /*
   * 9. Kalau seller belum ditemukan,
   * coba sellers/{resolvedUid}.
   */
  if (
    !sellerRef
  ) {
    const resolvedSellerRef =
      db
        .collection('sellers')
        .doc(
          resolvedUid
        );

    const resolvedSellerSnap =
      await resolvedSellerRef.get();

    if (
      resolvedSellerSnap.exists
    ) {
      seller =
        resolvedSellerSnap.data() ||
        {};

      sellerRef =
        resolvedSellerSnap.ref;
    }
  }

  /*
   * 10. Kalau registration belum ditemukan,
   * coba registrations/{resolvedUid}.
   */
  if (
    !registrationRef
  ) {
    const resolvedRegistrationRef =
      db
        .collection('registrations')
        .doc(
          resolvedUid
        );

    const resolvedRegistrationSnap =
      await resolvedRegistrationRef.get();

    if (
      resolvedRegistrationSnap.exists
    ) {
      registration =
        resolvedRegistrationSnap.data() ||
        {};

      registrationRef =
        resolvedRegistrationSnap.ref;
    }
  }

  /*
   * 11. Kalau user document belum ada tetapi
   * seller / registration / Firebase Auth ada,
   * buat users/{resolvedUid}.
   */
  if (
    !userRef &&
    (
      sellerRef ||
      registrationRef ||
      authUser
    )
  ) {
    const seedRef =
      db
        .collection('users')
        .doc(
          resolvedUid
        );

    const seed = {
      uid:
        resolvedUid,

      email:
        authUser?.email ||
        seller?.email ||
        registration?.email ||
        email ||
        '',

      name:
        seller?.name ||
        registration?.name ||
        authUser?.displayName ||
        '',

      phone:
        seller?.phone ||
        registration?.phone ||
        '',

      photoUrl:
        seller?.photoUrl ||
        registration?.photoUrl ||
        authUser?.photoURL ||
        '',

      role:
        isApprovedSeller(
          seller
        ) ||
        registration?.status ===
          'approved'
          ? 'seller'
          : 'buyer',

      banned:
        seller?.banned === true ||
        registration?.banned === true,

      updatedAt:
        FieldValue.serverTimestamp()
    };

    await seedRef.set(
      seed,
      {
        merge: true
      }
    );

    user =
      seed;

    userRef =
      seedRef;
  }

  /*
   * 12. Kalau users document ditemukan,
   * pastikan UID-nya konsisten.
   */
  if (
    userRef
  ) {
    user = {
      ...(user || {}),
      uid:
        resolvedUid
    };
  }

  /*
   * 13. Tidak ada satu pun sumber data.
   */
  if (
    !userRef &&
    !sellerRef &&
    !registrationRef &&
    !authUser
  ) {
    return {
      user: null,
      userRef: null,
      uid: null,
      seller: null,
      sellerRef: null,
      registration: null,
      registrationRef: null,
      authUser: null
    };
  }

  /*
   * 14. Kalau seller ditemukan tetapi users belum
   * ada, seed users sekarang.
   */
  if (
    !userRef &&
    sellerRef
  ) {
    const seedRef =
      db
        .collection('users')
        .doc(
          resolvedUid
        );

    const seed = {
      uid:
        resolvedUid,

      email:
        seller?.email ||
        registration?.email ||
        authUser?.email ||
        email ||
        '',

      name:
        seller?.name ||
        registration?.name ||
        authUser?.displayName ||
        '',

      phone:
        seller?.phone ||
        registration?.phone ||
        '',

      photoUrl:
        seller?.photoUrl ||
        registration?.photoUrl ||
        authUser?.photoURL ||
        '',

      role:
        'seller',

      banned:
        seller?.banned === true,

      updatedAt:
        FieldValue.serverTimestamp()
    };

    await seedRef.set(
      seed,
      {
        merge: true
      }
    );

    user =
      seed;

    userRef =
      seedRef;
  }

  return {
    user:
      user || {},

    userRef,

    uid:
      resolvedUid,

    seller,

    sellerRef,

    registration,

    registrationRef,

    authUser
  };
}

async function resolveSeller(
  uid
) {
  const normalizedUid =
    normalize(uid);

  if (!normalizedUid) {
    return {
      seller: null,
      sellerRef: null,
      registration: null,
      registrationRef: null
    };
  }

  let sellerSnap =
    await findByIdOrUid(
      'sellers',
      [normalizedUid]
    );

  let registrationSnap =
    await findByIdOrUid(
      'registrations',
      [normalizedUid]
    );

  let seller =
    sellerSnap?.data() ||
    null;

  let sellerRef =
    sellerSnap?.ref ||
    null;

  let registration =
    registrationSnap?.data() ||
    null;

  let registrationRef =
    registrationSnap?.ref ||
    null;

  if (
    !isApprovedSeller(
      seller
    )
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
          isApprovedSeller(
            doc.data()
          )
      );

    if (
      approvedSeller
    ) {
      seller =
        approvedSeller.data() ||
        {};

      sellerRef =
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

    if (
      approvedRegistration
    ) {
      registration =
        approvedRegistration.data() ||
        {};

      registrationRef =
        approvedRegistration.ref;
    }
  }

  return {
    seller,
    sellerRef,
    registration,
    registrationRef
  };
}

function isApprovedSeller(
  seller
) {
  return Boolean(
    seller &&
    seller.status ===
      'approved' &&
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
        id:
          doc.id,

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
            normalize(
              user.uid ||
              user.id
            );

          const resolved =
            await resolveSeller(
              uid
            );

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

            id:
              user.id,

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
      return approveOrder(
        id
      );
    }

    if (
      status === 'rejected'
    ) {
      return rejectOrder(
        id
      );
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
        normalize(
          registration.uid ||
          id
        );

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
  const identifier =
    normalize(uid);

  if (!identifier) {
    throw new HttpError(
      400,
      'UID user wajib diisi.'
    );
  }

  const resolvedUser =
    await resolveUser(
      identifier,
      {
        uid:
          identifier
      }
    );

  /*
   * Seller bisa saja ditemukan tetapi users/{uid}
   * belum ada. resolveUser() sudah membuatnya.
   */
  if (
    !resolvedUser.uid
  ) {
    throw new HttpError(
      404,
      'User tidak ditemukan.'
    );
  }

  const normalizedUid =
    resolvedUser.uid;

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

  const value =
    Boolean(banned);

  const userRef =
    resolvedUser.userRef ||
    db
      .collection('users')
      .doc(
        normalizedUid
      );

  await userRef.set(
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
    phone,
    userId,
    id,
    email
  } = {}
) {
  /*
   * Jangan cuma mengandalkan parameter URL.
   * Frontend sekarang mengirim beberapa identifier
   * supaya backend bisa menemukan dokumen yang benar.
   */
  const identifier =
    normalize(uid);

  const resolvedUser =
    await resolveUser(
      identifier,
      {
        uid,
        userId,
        id,
        email
      }
    );

  /*
   * Kalau URL identifier gagal, coba semua
   * identifier dari body secara berurutan.
   */
  let resolved =
    resolvedUser;

  if (
    !resolved.uid
  ) {
    const fallbackIdentifiers =
      uniqueValues([
        userId,
        id,
        email
      ]);

    for (
      const fallback
      of fallbackIdentifiers
    ) {
      const attempt =
        await resolveUser(
          fallback,
          {
            uid,
            userId,
            id,
            email
          }
        );

      if (
        attempt.uid
      ) {
        resolved =
          attempt;
        break;
      }
    }
  }

  if (
    !resolved.uid
  ) {
    throw new HttpError(
      404,
      'User tidak ditemukan.'
    );
  }

  const normalizedUid =
    resolved.uid;

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

  const userRef =
    resolved.userRef ||
    db
      .collection('users')
      .doc(
        normalizedUid
      );

  const user =
    resolved.user || {};

  const result = {
    ok: true
  };

  /*
   * Edit nama / nomor seller.
   */
  const hasName =
    name !== undefined;

  const hasPhone =
    phone !== undefined;

  if (
    hasName ||
    hasPhone
  ) {
    let seller =
      resolved.seller;

    let sellerRef =
      resolved.sellerRef;

    let registration =
      resolved.registration;

    let registrationRef =
      resolved.registrationRef;

    /*
     * Kalau resolver menemukan seller tetapi belum
     * mendapatkan approved seller, tetap cari ulang.
     */
    if (
      !sellerRef
    ) {
      const sellerResolved =
        await resolveSeller(
          normalizedUid
        );

      seller =
        sellerResolved.seller;

      sellerRef =
        sellerResolved.sellerRef;

      registration =
        sellerResolved.registration;

      registrationRef =
        sellerResolved.registrationRef;
    }

    /*
     * Seller aktif ditentukan dari sellers/{uid}
     * yang approved dan tidak banned.
     */
    const activeSeller =
      isApprovedSeller(
        seller
      );

    /*
     * Registration approved juga dianggap sebagai
     * sumber seller aktif untuk data legacy.
     */
    const activeRegistration =
      Boolean(
        registration &&
        registration.status ===
          'approved' &&
        registration.banned !== true
      );

    /*
     * Kalau user role seller tetapi sellers document
     * belum ada, buat seller document dari data user.
     * Ini menangani data lama/migrasi.
     */
    if (
      !activeSeller &&
      !activeRegistration &&
      user.role === 'seller'
    ) {
      const sellerSeedRef =
        db
          .collection('sellers')
          .doc(
            normalizedUid
          );

      await sellerSeedRef.set(
        {
          uid:
            normalizedUid,

          email:
            user.email ||
            resolved.authUser?.email ||
            '',

          name:
            user.name ||
            '',

          phone:
            user.phone ||
            '',

          reason:
            user.reason ||
            '',

          description:
            user.description ||
            user.reason ||
            '',

          photoUrl:
            user.photoUrl ||
            user.photoURL ||
            resolved.authUser?.photoURL ||
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

      sellerRef =
        sellerSeedRef;

      const seededSeller =
        await sellerSeedRef.get();

      seller =
        seededSeller.data() ||
        {};

      registration =
        registration || null;

      registrationRef =
        registrationRef || null;
    }

    const finalActiveSeller =
      isApprovedSeller(
        seller
      );

    const finalActiveRegistration =
      Boolean(
        registration &&
        registration.status ===
          'approved' &&
        registration.banned !== true
      );

    /*
     * Ini tidak lagi langsung bergantung pada
     * users.role saja.
     */
    if (
      !finalActiveSeller &&
      !finalActiveRegistration
    ) {
      throw new HttpError(
        409,
        'User ini bukan seller aktif.'
      );
    }

    const source =
      finalActiveSeller
        ? seller
        : registration;

    const cleanName =
      hasName
        ? normalize(name)
        : normalize(
            source?.name ||
            seller?.name ||
            registration?.name ||
            user.name ||
            user.displayName ||
            ''
          );

    const cleanPhone =
      hasPhone
        ? normalize(phone)
        : normalize(
            source?.phone ||
            seller?.phone ||
            registration?.phone ||
            user.phone ||
            user.phoneNumber ||
            ''
          );

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
          resolved.authUser?.email ||
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
          resolved.authUser?.photoURL ||
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

    /*
     * users/{actual UID}
     */
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

    /*
     * Sinkronkan registration kalau memang
     * registration document tersedia.
     */
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

    result.uid =
      normalizedUid;
  }

  /*
   * Ban / unban.
   */
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

  /*
   * Perubahan role.
   */
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
            user.email ||
            resolved.authUser?.email ||
            '',

          name:
            user.name ||
            '',

          phone:
            user.phone ||
            '',

          reason:
            user.reason ||
            '',

          description:
            user.description ||
            user.reason ||
            '',

          photoUrl:
            user.photoUrl ||
            user.photoURL ||
            resolved.authUser?.photoURL ||
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
    normalize(uid) ===
    ADMIN_UID
  );
}

export async function saveSettings(
  data
) {
  const qrisUrl =
    normalize(
      data?.qrisUrl
    );

  const maintenanceMode =
    Boolean(
      data?.maintenanceMode
    );

  const maintenanceTitle =
    normalize(
      data?.maintenanceTitle
    );

  const maintenanceMessage =
    normalize(
      data?.maintenanceMessage
    );

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
