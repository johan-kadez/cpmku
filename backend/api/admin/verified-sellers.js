import {
  asyncHandler
} from '../../src/utils/errors.js';

import {
  requireAuth
} from '../../src/middleware/auth.js';

import {
  requireAdmin
} from '../../src/middleware/admin.js';

import {
  env
} from '../../src/config/env.js';

import {
  listVerifiedSellers,
  setSellerVerification
} from '../../src/services/sellerVerification.js';

function setCors(res) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    env.origin || '*'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,PATCH,OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type'
  );
}

async function handler(
  req,
  res
) {
  setCors(res);

  const method =
    req.method?.toUpperCase();

  if (
    method ===
    'OPTIONS'
  ) {
    return res
      .status(204)
      .end();
  }

  if (
    method !== 'GET' &&
    method !== 'PATCH'
  ) {
    return res
      .status(405)
      .json({
        error:
          'Method tidak diizinkan.'
      });
  }

  return requireAuth(
    req,
    res,
    () =>
      requireAdmin(
        req,
        res,
        async () => {
          if (
            method ===
            'GET'
          ) {
            const result =
              await listVerifiedSellers();

            return res
              .status(200)
              .json(result);
          }

          const uid =
            req.body?.uid;

          const verified =
            req.body?.verified;

          if (
            typeof verified !==
            'boolean'
          ) {
            return res
              .status(400)
              .json({
                error:
                  'Field verified wajib berupa boolean.'
              });
          }

          const result =
            await setSellerVerification(
              uid,
              verified
            );

          return res
            .status(200)
            .json(result);
        }
      )
  );
}

export default asyncHandler(
  handler
);
