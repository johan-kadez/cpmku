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
          email.split('@')[0] ||
          'User',

        photoUrl:
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

          photoUrl:
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

    photoUrl:
      profileData?.photoUrl ||
      user.picture ||
      '',

    photoURL:
      profileData?.photoUrl ||
      user.picture ||
      ''
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
        photoURL: secureUrl
      }
    ),

    profileRef.set(
      {
        photoUrl: secureUrl,

        photoURL: secureUrl,

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
    photoUrl: secureUrl,

    photoURL: secureUrl,

    cloudinaryPublicId:
      publicId
  };
}
