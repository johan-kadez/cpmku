import { dashboard, settings, list, status, updateUser } from '../../src/controllers/index.js';
import { requireAuth } from '../../src/middleware/auth.js';
import { requireAdmin } from '../../src/middleware/admin.js';
import { asyncHandler } from '../../src/utils/errors.js';

const LISTABLE = ['orders', 'payments', 'products', 'rooms', 'sellers', 'users'];
const STATUSABLE = ['orders', 'payments', 'products', 'rooms', 'sellers'];

const inner = asyncHandler(async (req, res) => {
  await requireAuth(req, res, () => {});
  await requireAdmin(req, res, () => {});

  const pathname = (req.url || '').split('?')[0];
  const parts = pathname.split('/').filter(Boolean);
  const adminIdx = parts.lastIndexOf('admin');
  const segments = adminIdx >= 0 ? parts.slice(adminIdx + 1) : parts;
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

  return res.status(404).json({ error: `Endpoint tidak ditemukan. (url=${JSON.stringify(req.url)}, resource=${JSON.stringify(resource)}, id=${JSON.stringify(id)})` });
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  if ((req.method || '').toUpperCase() === 'OPTIONS') {
    return res.status(200).end();
  }
  return inner(req, res);
}
