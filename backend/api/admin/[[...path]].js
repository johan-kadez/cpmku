import {
  dashboard,
  settings,
  list,
  status,
  updateUser
} from '../../src/controllers/index.js';

import { requireAuth } from '../../src/middleware/auth.js';
import { requireAdmin } from '../../src/middleware/admin.js';
import { asyncHandler } from '../../src/utils/errors.js';

const LISTABLE = [
  'orders',
  'payments',
  'products',
  'rooms',
  'sellers',
  'users'
];

const STATUSABLE = [
  'orders',
  'payments',
  'products',
  'rooms',
  'sellers'
];

export default asyncHandler(async (req, res) => {
  await requireAuth(req, res, () => {});
  await requireAdmin(req, res, () => {});

  let segments = req.query?.path;

  // Normalisasi path
  if (!segments) {
    segments = [];
  } else if (!Array.isArray(segments)) {
    segments = [segments];
  }

  segments = segments.filter(Boolean);

  const [resource, id] = segments;

  // Jangan overwrite query object secara aneh
  req.query = {
    ...req.query,
    id
  };

  console.log('ADMIN ROUTE:', {
    method: req.method,
    url: req.url,
    path: req.query.path,
    segments,
    resource,
    id
  });

  // =========================
  // ROOT ADMIN API
  // =========================

  if (!resource) {
    return res.status(400).json({
      error: 'Admin resource tidak ditemukan',
      availableEndpoints: [
        'dashboard',
        'orders',
        'payments',
        'products',
        'rooms',
        'sellers',
        'users',
        'settings'
      ]
    });
  }

  // =========================
  // DASHBOARD
  // =========================

  if (resource === 'dashboard' && !id) {
    return dashboard(req, res);
  }

  // =========================
  // SETTINGS
  // =========================

  if (resource === 'settings' && !id) {
    if (req.method !== 'PATCH') {
      return res.status(405).json({
        error: 'Method not allowed'
      });
    }

    return settings(req, res);
  }

  // =========================
  // UPDATE USER
  // =========================

  if (resource === 'users' && id) {
    if (req.method !== 'PATCH') {
      return res.status(405).json({
        error: 'Method not allowed'
      });
    }

    return updateUser(req, res);
  }

  // =========================
  // LIST RESOURCE
  // =========================

  if (LISTABLE.includes(resource) && !id) {
    return list(resource)(req, res);
  }

  // =========================
  // UPDATE STATUS
  // =========================

  if (STATUSABLE.includes(resource) && id) {
    if (req.method !== 'PATCH') {
      return res.status(405).json({
        error: 'Method not allowed'
      });
    }

    return status(resource)(req, res);
  }

  return res.status(404).json({
    error: 'Endpoint tidak ditemukan',
    debug: {
      url: req.url,
      path: req.query.path,
      segments,
      resource,
      id
    }
  });
});
