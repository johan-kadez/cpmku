import {
  ok,
  created
} from '../utils/response.js';

import {
  currentUser,
  updateProfilePhoto,
  updateProfileNickname
} from '../services/auth.js';

import {
  applySeller
} from '../services/sellers.js';

import {
  createProduct
} from '../services/products.js';

import {
  createOrder,
  doneOrder
} from '../services/orders.js';

import {
  sendMessage,
  callSeller
} from '../services/rooms.js';

import * as A from '../services/admin.js';

import {
  HttpError
} from '../utils/errors.js';

import {
  env,
  assertCloudinaryEnv
} from '../config/env.js';

import crypto from 'node:crypto';

const PROFILE_TRANSFORMATION =
  'c_fill,g_auto,w_512,h_512';

function createCloudinarySignature(
  parameters
) {
  const serialized =
    Object.entries(
      parameters
    )
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ''
      )
      .sort(
        ([a], [b]) =>
          a.localeCompare(b)
      )
      .map(
        ([key, value]) =>
          `${key}=${value}`
      )
      .join('&');

  return crypto
    .createHash('sha1')
    .update(
      `${serialized}${env.cloudinary.apiSecret}`
    )
    .digest('hex');
}

export const me =
  async (req, res) => {
    return ok(
      res,
      {
        user:
          await currentUser(
            req.user
          )
      }
    );
  };

export const profileNickname =
  async (req, res) => {
    const result =
      await updateProfileNickname(
        req.user.uid,
        req.body?.name
      );

    return ok(
      res,
      result
    );
  };

export const profilePhotoSignature =
  async (req, res) => {
    assertCloudinaryEnv();

    const timestamp =
      Math.floor(
        Date.now() / 1000
      );

    const publicId =
      `cpmku/profiles/${req.user.uid}`;

    const parameters = {
      invalidate: true,
      overwrite: true,
      public_id: publicId,
      timestamp,
      transformation:
        PROFILE_TRANSFORMATION
    };

    const signature =
      createCloudinarySignature(
        parameters
      );

    return ok(
      res,
      {
        cloudName:
          env.cloudinary.cloudName,

        apiKey:
          env.cloudinary.apiKey,

        timestamp,

        signature,

        publicId,

        transformation:
          PROFILE_TRANSFORMATION
      }
    );
  };

export const profilePhotoUpdate =
  async (req, res) => {
    assertCloudinaryEnv();

    const {
      secureUrl,
      publicId,
      version,
      signature
    } = req.body || {};

    if (
      !secureUrl ||
      !publicId ||
      !version ||
      !signature
    ) {
      throw new HttpError(
        400,
        'Data foto dari Cloudinary tidak lengkap.'
      );
    }

    const expectedPublicId =
      `cpmku/profiles/${req.user.uid}`;

    if (
      publicId !==
      expectedPublicId
    ) {
      throw new HttpError(
        403,
        'Public ID foto tidak valid.'
      );
    }

    const expectedUrlPrefix =
      `https://res.cloudinary.com/${env.cloudinary.cloudName}/image/upload/`;

    if (
      !secureUrl.startsWith(
        expectedUrlPrefix
      )
    ) {
      throw new HttpError(
        400,
        'URL foto Cloudinary tidak valid.'
      );
    }

    const expectedSignature =
      createCloudinarySignature({
        public_id: publicId,
        version
      });

    if (
      signature.length !==
      expectedSignature.length
    ) {
      throw new HttpError(
        403,
        'Signature foto tidak valid.'
      );
    }

    const signaturesMatch =
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(
          expectedSignature
        )
      );

    if (!signaturesMatch) {
      throw new HttpError(
        403,
        'Signature foto tidak valid.'
      );
    }

    const result =
      await updateProfilePhoto({
        uid:
          req.user.uid,

        secureUrl,

        publicId
      });

    return ok(
      res,
      {
        ok: true,
        ...result
      }
    );
  };

export const sellerApply =
  async (req, res) =>
    created(
      res,
      await applySeller(
        req.user.uid,
        req.user.email,
        req.body
      )
    );

export const productCreate =
  async (req, res) =>
    created(
      res,
      await createProduct(
        req.user.uid,
        req.seller,
        req.body
      )
    );

export const orderCreate =
  async (req, res) =>
    created(
      res,
      await createOrder(
        req.user.uid,
        req.body.productId
      )
    );

export const orderDone =
  async (req, res) =>
    ok(
      res,
      await doneOrder(
        req.query.id,
        req.user.uid
      )
    );

export const messageCreate =
  async (req, res) =>
    ok(
      res,
      await sendMessage(
        req.query.id,
        {
          ...req.user,

          isAdmin:
            req.userRole === 'admin'
        },
        req.body?.body
      )
    );

export const sellerCall =
  async (req, res) =>
    ok(
      res,
      await callSeller(
        req.query.id
      )
    );

export const dashboard =
  async (req, res) =>
    ok(
      res,
      await A.dashboard()
    );

export const list =
  (type) =>
    async (req, res) =>
      ok(
        res,
        await A.listCollection(
          type
        )
      );

export const status =
  (type) =>
    async (req, res) =>
      ok(
        res,
        await A.setStatus(
          type,
          req.query.id,
          req.body?.status
        )
      );

export const settings =
  async (req, res) =>
    ok(
      res,
      await A.saveSettings(
        req.body
      )
    );

export const updateUser =
  async (req, res) =>
    ok(
      res,
      await A.updateUser(
        req.query.id,
        req.body || {}
      )
    );

export const health =
  async (req, res) =>
    ok(
      res,
      {
        ok: true,

        service:
          'johan-marketplace-backend',

        time:
          new Date().toISOString()
      }
    );

export const bad = () => {
  throw new HttpError(
    404,
    'Endpoint tidak ditemukan.'
  );
};
