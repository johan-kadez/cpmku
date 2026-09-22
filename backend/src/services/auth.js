import {
  db,
  auth,
  FieldValue
} from '../firebase/admin.js';

import {
  env
} from '../config/env.js';

export async function currentUser(user) {
  const email = (
    user.email || ''
  ).toLowerCase();

  const profileRef = db
    .collection('users')
    .doc(user.uid);

  const [
    seller,
    profile
  ] = await Promise.all([
    db
      .collection('sellers')
      .doc(user.uid)
      .get(),

    profileRef.get()
  ]);

  if (!profile.exists) {
    await profileRef.set(
      {
        uid: user.uid,

        email,

        name:
          user.name ||
          user.picture ||
          email.split('@')[0] ||
          'User',

        nickname:
          user.name ||
          email.split('@')[0] ||
          'User',

        photoUrl:
          user.picture || '',

        photoURL:
          user.picture || '',

        banned: false,

        createdAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );
  }

  const profileData =
    profile.exists
      ? profile.data()
      : {
          name:
            user.name ||
            email.split('@')[0] ||
            'User',

          nickname:
            user.name ||
            email.split('@')[0] ||
            'User',

          photoUrl:
            user.picture || '',

          photoURL:
            user.picture || '',

          banned: false
        };

  let role = 'buyer';

  if (
    user.uid === env.adminUid
  ) {
    role = 'admin';
  } else if (
    seller.exists &&
    seller.data().status === 'approved' &&
    !seller.data().banned
  ) {
    role = 'seller';
  }

  const nickname =
    profileData?.nickname ||
    profileData?.name ||
    user.name ||
    email.split('@')[0] ||
    'User';

  return {
    uid: user.uid,

    email,

    name: nickname,

    nickname,

    role,

    banned: Boolean(
      profileData?.banned
    ),

    phone:
      profileData?.phone || '',

    photoUrl:
      profileData?.photoUrl ||
      profileData?.photoURL ||
      user.picture ||
      '',

    photoURL:
      profileData?.photoUrl ||
      profileData?.photoURL ||
      user.picture ||
      ''
  };
}

export async function registerProfile({
  uid,
  email,
  name,
  phone
}) {
  const profileRef = db
    .collection('users')
    .doc(uid);

  const cleanName =
    String(name || '').trim();

  const cleanPhone =
    String(phone || '').trim();

  if (!cleanName) {
    throw new Error(
      'Nama wajib diisi.'
    );
  }

  if (!cleanPhone) {
    throw new Error(
      'Nomor wajib diisi.'
    );
  }

  if (cleanName.length > 100) {
    throw new Error(
      'Nama maksimal 100 karakter.'
    );
  }

  if (cleanPhone.length > 30) {
    throw new Error(
      'Nomor maksimal 30 karakter.'
    );
  }

  await profileRef.set(
    {
      uid,

      email:
        String(email || '')
          .trim()
          .toLowerCase(),

      name: cleanName,

      nickname: cleanName,

      phone: cleanPhone,

      banned: false,

      createdAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp()
    },
    {
      merge: true
    }
  );

  try {
    await auth.updateUser(
      uid,
      {
        displayName: cleanName
      }
    );
  } catch (error) {
    console.error(
      'Gagal menyinkronkan nama Firebase Auth:',
      error
    );
  }

  return {
    ok: true,

    name: cleanName,

    nickname: cleanName,

    phone: cleanPhone
  };
}

export async function updateProfileNickname({
  uid,
  nickname
}) {
  const profileRef = db
    .collection('users')
    .doc(uid);

  const cleanNickname =
    String(nickname || '')
      .trim();

  if (!cleanNickname) {
    throw new Error(
      'Nickname tidak boleh kosong.'
    );
  }

  if (cleanNickname.length > 50) {
    throw new Error(
      'Nickname maksimal 50 karakter.'
    );
  }

  await profileRef.set(
    {
      name: cleanNickname,

      nickname: cleanNickname,

      updatedAt:
        FieldValue.serverTimestamp()
    },
    {
      merge: true
    }
  );

  await auth.updateUser(
    uid,
    {
      displayName:
        cleanNickname
    }
  );

  return {
    nickname:
      cleanNickname,

    name:
      cleanNickname
  };
}

export async function updateProfilePhoto({
  uid,
  secureUrl,
  publicId
}) {
  const profileRef = db
    .collection('users')
    .doc(uid);

  await Promise.all([
    auth.updateUser(
      uid,
      {
        photoURL:
          secureUrl
      }
    ),

    profileRef.set(
      {
        photoUrl:
          secureUrl,

        photoURL:
          secureUrl,

        cloudinaryPublicId:
          publicId,

        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    )
  ]);

  return {
    photoUrl:
      secureUrl,

    photoURL:
      secureUrl,

    cloudinaryPublicId:
      publicId
  };
}
