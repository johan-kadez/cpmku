import { dashboard, settings, list, status, updateUser } from '../../src/controllers/index.js';
import { requireAuth } from '../../src/middleware/auth.js';
import { requireAdmin } from '../../src/middleware/admin.js';
import { asyncHandler } from '../../src/utils/errors.js';

const LISTABLE = ['orders', 'payments', 'products', 'rooms', 'sellers', 'users'];
const STATUSABLE = ['orders', 'payments', 'products', 'rooms', 'sellers'];

export default asyncHandler(async (req, res) => {
  await requireAuth(req, res, () => {});
  await requireAdmin(req, res, () => {});

  const segments = Array.isArray(req.query.path) ? req.query.path : (req.query.path ? [req.query.path] : []);
  const [resource, id] = segments;
  req.query.id = id;

  if (resource === 'dashboard' && !id) {
    return dashboard(req, res);
  }

  if (resource === 'settings' && !id) {
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
    return settings(req, res);
  }

  if (resource === 'users' && id) {
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
    return updateUser(req, res);
  }

  if (LISTABLE.includes(resource) && !id) {
    return list(resource)(req, res);
  }

  if (STATUSABLE.includes(resource) && id) {
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
    return status(resource)(req, res);
  }

  return res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});
