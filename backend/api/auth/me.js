import { me } from '../../src/controllers/index.js';
import { requireAuth } from '../../src/middleware/auth.js';
import { asyncHandler } from '../../src/utils/errors.js';

export default async function handler(req, res) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, OPTIONS'
  );

  if (
    (req.method || '').toUpperCase() ===
    'OPTIONS'
  ) {
    return res.status(200).end();
  }

  return asyncHandler(
    async (req, res) => {
      await requireAuth(
        req,
        res,
        () => {}
      );

      return me(req, res);
    }
  )(req, res);
}
