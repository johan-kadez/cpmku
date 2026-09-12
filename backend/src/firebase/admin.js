import admin from 'firebase-admin';

import {
  env,
  assertEnv
} from '../config/env.js';

function validatePrivateKey(
  privateKey
) {
  if (!privateKey) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY belum dikonfigurasi.'
    );
  }

  if (
    !privateKey.includes(
      '-----BEGIN PRIVATE KEY-----'
    )
  ) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY tidak memiliki BEGIN PRIVATE KEY yang valid.'
    );
  }

  if (
    !privateKey.includes(
      '-----END PRIVATE KEY-----'
    )
  ) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY tidak memiliki END PRIVATE KEY yang valid.'
    );
  }

  return privateKey;
}

assertEnv();

if (!admin.apps.length) {
  const privateKey =
    validatePrivateKey(
      env.privateKey
    );

  admin.initializeApp({
    credential:
      admin.credential.cert({
        projectId:
          env.projectId,

        clientEmail:
          env.clientEmail,

        privateKey
      })
  });
}

export const db =
  admin.firestore();

export const auth =
  admin.auth();

export const FieldValue =
  admin.firestore.FieldValue;
