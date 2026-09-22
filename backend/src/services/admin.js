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
    normalize(
      email
    ).toLowerCase();

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
    normalize(
      email
    ).toLowerCase();

  if (
    normalizedEmail
  ) {
    try {
      const user =
        await auth.getUserByEmail(
          normalizedEmail
        );

      if (
        user?.uid
      ) {
        return user;
      }
    } catch {
      // Lanjutkan ke identifier lain.
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

      if (
        user?.uid
      ) {
        return user;
      }
    } catch {
      // Lanjutkan ke identifier berikutnya.
    }
  }

  return null;
}

async function loadUserByAuthUid(
  uid
) {
  const normalizedUid =
    normalize(uid);

  if (!normalizedUid) {
    return null;
  }

  const ref =
    db
      .collection('users')
      .doc(
        normalizedUid
      );

  const snap =
    await ref.get();

  if (
    !snap.exists
  ) {
    return null;
  }

  return {
    user:
      snap.data() || {},

    userRef:
      snap.ref
  };
}

async function loadSellerByAuthUid(
  uid
) {
  const normalizedUid =
    normalize(uid);

  if (!normalizedUid) {
    return null;
  }

  const ref =
    db
      .collection('sellers')
      .doc(
        normalizedUid
      );

  const snap =
    await ref.get();

  if (
    !snap.exists
  ) {
    return null;
  }

  return {
    seller:
      snap.data() || {},

    sellerRef:
      snap.ref
  };
}

async function loadRegistrationByAuthUid(
  uid
) {
  const normalizedUid =
    normalize(uid);

  if (!normalizedUid) {
    return null;
  }

  const ref =
    db
      .collection('registrations')
      .doc(
        normalizedUid
      );

  const snap =
    await ref.get();

  if (
    !snap.exists
  ) {
    return null;
  }

  return {
    registration:
      snap.data() || {},

    registrationRef:
      snap.ref
  };
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
   * 1. Firebase Auth adalah sumber UID utama.
   *
   * users/{uid}, sellers/{uid}, dan
   * registrations/{uid} menggunakan Firebase Auth UID.
   */
  const authUser =
    await resolveFirebaseAuth(
      identifiers,
      email
    );

  let resolvedUid =
    normalize(
      authUser?.uid
    );

  /*
   * 2. Kalau Auth tidak ditemukan berdasarkan
   * identifier/email, cari users berdasarkan ID/uid.
   *
   * Ini menangani data lama dan identifier Firestore.
   */
  let user =
    null;

  let userRef =
    null;

  if (
    resolvedUid
  ) {
    const authProfile =
      await loadUserByAuthUid(
        resolvedUid
      );

    if (
      authProfile
    ) {
      user =
        authProfile.user;

      userRef =
        authProfile.userRef;
    }
  }

  if (
    !userRef
  ) {
    const directUser =
      await findByIdOrUid(
        'users',
        identifiers
      );

    if (
      directUser
    ) {
      user =
        directUser.data() ||
        {};

      userRef =
        directUser.ref;

      /*
       * Document ID users adalah canonical UID.
       */
      const documentUid =
        normalize(
          directUser.id
        );

      const fieldUid =
        normalize(
          directUser.data()?.uid
        );

      resolvedUid =
        normalize(
          authUser?.uid ||
          documentUid ||
          fieldUid
        );
    }
  }

  /*
   * 3. Kalau users tidak ketemu, coba email.
   */
  if (
    !userRef &&
    email
  ) {
    const emailUser =
      await findUserByEmail(
        email
      );

    if (
      emailUser
    ) {
      user =
        emailUser.data() ||
        {};

      userRef =
        emailUser.ref;

      resolvedUid =
        normalize(
          authUser?.uid ||
          emailUser.id ||
          emailUser.data()?.uid
        );
    }
  }

  /*
   * 4. Kalau sudah mendapatkan UID canonical,
   * SELALU cari seller dan registration menggunakan
   * UID tersebut terlebih dahulu.
   */
  let seller =
    null;

  let sellerRef =
    null;

  let registration =
    null;

  let registrationRef =
    null;

  if (
    resolvedUid
  ) {
    const [
      authSeller,
      authRegistration
    ] = await Promise.all([
      loadSellerByAuthUid(
        resolvedUid
      ),
      loadRegistrationByAuthUid(
        resolvedUid
      )
    ]);

    if (
      authSeller
    ) {
      seller =
        authSeller.seller;

      sellerRef =
        authSeller.sellerRef;
    }

    if (
      authRegistration
    ) {
      registration =
        authRegistration.registration;

      registrationRef =
        authRegistration.registrationRef;
    }
  }

  /*
   * 5. Legacy fallback.
   *
   * Hanya dilakukan kalau data berdasarkan canonical
   * UID belum ditemukan.
   */
  if (
    !sellerRef
  ) {
    const sellerSnap =
      await findByIdOrUid(
        'sellers',
        uniqueValues([
          resolvedUid,
          ...identifiers
        ])
      );

    if (
      sellerSnap
    ) {
      seller =
        sellerSnap.data() ||
        {};

      sellerRef =
        sellerSnap.ref;
    }
  }

  if (
    !registrationRef
  ) {
    const registrationSnap =
      await findByIdOrUid(
        'registrations',
        uniqueValues([
          resolvedUid,
          ...identifiers
        ])
      );

    if (
      registrationSnap
    ) {
      registration =
        registrationSnap.data() ||
        {};

      registrationRef =
        registrationSnap.ref;
    }
  }

  /*
   * 6. Kalau seller/registration legacy memiliki
   * field uid yang valid, gunakan sebagai fallback
   * hanya jika canonical UID belum tersedia.
   */
  if (
    !resolvedUid
  ) {
    resolvedUid =
      normalize(
        user?.uid ||
        seller?.uid ||
        registration?.uid
      );
  }

  /*
   * 7. Kalau UID masih belum ada tetapi ada user
   * document, gunakan document ID.
   */
  if (
    !resolvedUid &&
    userRef
  ) {
    resolvedUid =
      normalize(
        userRef.id
      );
  }

  /*
   * 8. Tidak ada sumber data sama sekali.
   */
  if (
    !resolvedUid &&
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
   * 9. Kalau UID sudah diketahui tetapi users document
   * belum ada, coba users/{uid}.
   */
  if (
    resolvedUid &&
    !userRef
  ) {
    const resolvedUser =
      await loadUserByAuthUid(
        resolvedUid
      );

    if (
      resolvedUser
    ) {
      user =
        resolvedUser.user;

      userRef =
        resolvedUser.userRef;
    }
  }

  /*
   * 10. Kalau user belum ada tetapi seller,
   * registration, atau Auth tersedia, seed users/{uid}.
   */
  if (
    resolvedUid &&
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
   * 11. Pastikan UID pada user object selalu
   * mengikuti canonical UID.
   */
  if (
    userRef &&
    resolvedUid
  ) {
    user = {
      ...(user || {}),
      uid:
        resolvedUid
    };
  }

  /*
   * 12. Kalau seller belum ditemukan berdasarkan
   * canonical UID, coba sellers/{uid} sekali lagi.
   */
  if (
    resolvedUid &&
    !sellerRef
  ) {
    const resolvedSeller =
      await loadSellerByAuthUid(
        resolvedUid
      );

    if (
      resolvedSeller
    ) {
      seller =
        resolvedSeller.seller;

      sellerRef =
        resolvedSeller.sellerRef;
    }
  }

  /*
   * 13. Kalau registration belum ditemukan
   * berdasarkan canonical UID, coba lagi.
   */
  if (
    resolvedUid &&
    !registrationRef
  ) {
    const resolvedRegistration =
      await loadRegistrationByAuthUid(
        resolvedUid
      );

    if (
      resolvedRegistration
    ) {
      registration =
        resolvedRegistration.registration;

      registrationRef =
        resolvedRegistration.registrationRef;
    }
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

  /*
   * Canonical path terlebih dahulu:
   * sellers/{Firebase Auth UID}
   * registrations/{Firebase Auth UID}
   */
  let sellerSnap =
    await loadSellerByAuthUid(
      normalizedUid
    );

  let registrationSnap =
    await loadRegistrationByAuthUid(
      normalizedUid
    );

  let seller =
    sellerSnap?.seller ||
    null;

  let sellerRef =
    sellerSnap?.sellerRef ||
    null;

  let registration =
    registrationSnap?.registration ||
    null;

  let registrationRef =
    registrationSnap?.registrationRef ||
    null;

  /*
   * Legacy fallback seller.
   */
  if (
    !sellerRef
  ) {
    const legacySeller =
      await findByIdOrUid(
        'sellers',
        [normalizedUid]
      );

    if (
      legacySeller
    ) {
      seller =
        legacySeller.data() ||
        {};

      sellerRef =
        legacySeller.ref;
    }
  }

  /*
   * Legacy fallback registration.
   */
  if (
    !registrationRef
  ) {
    const legacyRegistration =
      await findByIdOrUid(
        'registrations',
        [normalizedUid]
      );

    if (
      legacyRegistration
    ) {
      registration =
        legacyRegistration.data() ||
        {};

      registrationRef =
        legacyRegistration.ref;
    }
  }

  /*
   * Kalau seller yang ditemukan bukan seller aktif,
   * cari seller aktif berdasarkan field uid.
   */
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

  /*
   * Cari registration approved berdasarkan UID.
   */
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
          /*
           * Document ID users/{uid} adalah sumber
           * identifier utama. Jangan mendahulukan
           * field uid lama.
           */
          const uid =
            normalize(
              user.id ||
              user.uid
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
  { banned, role, name, phone, userId, id, email } = {}
) {
  const identifier = normalize(uid);
  console.log('[updateUser] Mencoba resolve identifier:', identifier);

  // 1. Coba resolve user seperti biasa
  let resolved = await resolveUser(
    identifier,
    { uid, userId, id, email }
  );
  console.log('[updateUser] Hasil resolveUser awal:', { uid: resolved.uid, hasUserRef: !!resolved.userRef });

  // 2. ULTRA FALLBACK: Jika resolveUser gagal, cari manual di semua collection
  if (!resolved.uid) {
    console.log('[updateUser] resolveUser gagal, menjalankan Ultra Fallback...');
    try {
      let canonicalUid = null;
      let foundData = null;

      // Helper untuk cek collection
      const checkCollection = async (collName, idToCheck) => {
        const ref = db.collection(collName).doc(idToCheck);
        const snap = await ref.get();
        if (snap.exists) {
          return { ref, data: snap.data() };
        }
        const query = await db.collection(collName).where('uid', '==', idToCheck).limit(1).get();
        if (!query.empty) {
          return { ref: query.docs[0].ref, data: query.docs[0].data() };
        }
        return null;
      };

      // Cek di users
      let result = await checkCollection('users', identifier);
      if (result) {
        canonicalUid = result.data?.uid || result.ref.id;
        foundData = result.data;
        console.log('[updateUser] Ditemukan di users:', canonicalUid);
      }

      // Cek di sellers jika belum ketemu
      if (!canonicalUid) {
        result = await checkCollection('sellers', identifier);
        if (result) {
          canonicalUid = result.data?.uid || result.ref.id;
          foundData = result.data;
          console.log('[updateUser] Ditemukan di sellers:', canonicalUid);
        }
      }

      // Cek di registrations jika masih belum ketemu
      if (!canonicalUid) {
        result = await checkCollection('registrations', identifier);
        if (result) {
          canonicalUid = result.data?.uid || result.ref.id;
          foundData = result.data;
          console.log('[updateUser] Ditemukan di registrations:', canonicalUid);
        }
      }

      // Jika UID asli berhasil ditemukan, resolve ulang
      if (canonicalUid) {
        console.log('[updateUser] Resolve ulang dengan UID:', canonicalUid);
        resolved = await resolveUser(canonicalUid, { 
          uid: canonicalUid, 
          email: foundData?.email || email 
        });
      } else {
        console.log('[updateUser] ID tidak ditemukan di collection manapun:', identifier);
      }
    } catch (err) {
      console.error('[updateUser] Error di Ultra Fallback:', err);
    }
  }

  // 3. Validasi hasil akhir
  if (!resolved.uid) {
    console.error('[updateUser] GAGAL TOTAL. User tidak ditemukan untuk ID:', identifier);
    throw new HttpError(404, 'User tidak ditemukan.');
  }

  console.log('[updateUser] Berhasil resolve. UID akhir:', resolved.uid);

  const normalizedUid = resolved.uid;

  if (isAdminUid(normalizedUid)) {
    throw new HttpError(403, 'Akun admin utama tidak dapat diubah.');
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
     * Selalu resolve seller berdasarkan canonical UID
     * sebelum memakai fallback legacy.
     */
    const sellerResolved =
      await resolveSeller(
        normalizedUid
      );

    if (
      sellerResolved.sellerRef
    ) {
      seller =
        sellerResolved.seller;

      sellerRef =
        sellerResolved.sellerRef;
    }

    if (
      sellerResolved.registrationRef
    ) {
      registration =
        sellerResolved.registration;

      registrationRef =
        sellerResolved.registrationRef;
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

    /*
     * Data lama: users role seller tetapi
     * sellers/{uid} belum ada.
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
        registration ||
        null;

      registrationRef =
        registrationRef ||
        null;
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
        ? normalize(
            name
          )
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
        ? normalize(
            phone
          )
        : normalize(
            source?.phone ||
            seller?.phone ||
            registration?.phone ||
            user.phone ||
            user.phoneNumber ||
            ''
          );

    if (
      !cleanName
    ) {
      throw new HttpError(
        400,
        'Nama seller wajib diisi.'
      );
    }

    const batch =
      db.batch();

    /*
     * Target seller selalu menggunakan sellerRef
     * yang sudah diverifikasi terhadap canonical UID.
     */
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
     * users/{Firebase Auth UID}
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
     * Sinkronisasi registration.
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
      ].includes(
        role
      )
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
  
  // ... (LANJUTKAN DENGAN KODE ASLI DI BAWAHNYA, jangan diubah yang sisa)

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
     * Selalu resolve seller berdasarkan canonical UID
     * sebelum memakai fallback legacy.
     */
    const sellerResolved =
      await resolveSeller(
        normalizedUid
      );

    if (
      sellerResolved.sellerRef
    ) {
      seller =
        sellerResolved.seller;

      sellerRef =
        sellerResolved.sellerRef;
    }

    if (
      sellerResolved.registrationRef
    ) {
      registration =
        sellerResolved.registration;

      registrationRef =
        sellerResolved.registrationRef;
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

    /*
     * Data lama: users role seller tetapi
     * sellers/{uid} belum ada.
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
        registration ||
        null;

      registrationRef =
        registrationRef ||
        null;
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
        ? normalize(
            name
          )
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
        ? normalize(
            phone
          )
        : normalize(
            source?.phone ||
            seller?.phone ||
            registration?.phone ||
            user.phone ||
            user.phoneNumber ||
            ''
          );

    if (
      !cleanName
    ) {
      throw new HttpError(
        400,
        'Nama seller wajib diisi.'
      );
    }

    const batch =
      db.batch();

    /*
     * Target seller selalu menggunakan sellerRef
     * yang sudah diverifikasi terhadap canonical UID.
     */
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
     * users/{Firebase Auth UID}
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
     * Sinkronisasi registration.
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
      ].includes(
        role
      )
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

  if (
    qrisUrl
  ) {
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
