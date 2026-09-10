import {
  setStatus,
  updateUser
} from '../../../src/services/admin.js';

import { requireAuth } from '../../../src/middleware/auth.js';
import { requireAdmin } from '../../../src/middleware/admin.js';

function setCors(req, res) {
  const origin = req.headers.origin;

  if (origin === 'https://cpmku.vercel.app') {
    res.setHeader(
      'Access-Control-Allow-Origin',
      origin
    );
  }

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, OPTIONS'
  );

  res.setHeader(
    'Vary',
    'Origin'
  );
}

async function authenticate(req, res) {
  await requireAuth(
    req,
    res,
    () => {}
  );

  await requireAdmin(
    req,
    res,
    () => {}
  );
}

function getResource(req) {
  if (
    typeof req.query?.resource === 'string' &&
    req.query.resource
  ) {
    return req.query.resource;
  }

  const url = String(req.url || '');

  const pathname = url.split('?')[0];

  const marker = '/api/admin/';

  const markerIndex =
    pathname.indexOf(marker);

  if (markerIndex === -1) {
    return '';
  }

  const remaining = pathname.slice(
    markerIndex + marker.length
  );

  const parts = remaining
    .split('/')
    .filter(Boolean);

  return parts[0] || '';
}

function getId(req) {
  if (
    typeof req.query?.id === 'string' &&
    req.query.id
  ) {
    return req.query.id;
  }

  const url = String(req.url || '');

  const pathname = url.split('?')[0];

  const marker = '/api/admin/';

  const markerIndex =
    pathname.indexOf(marker);

  if (markerIndex === -1) {
    return '';
  }

  const remaining = pathname.slice(
    markerIndex + marker.length
  );

  const parts = remaining
    .split('/')
    .filter(Boolean);

  return parts[1] || '';
}

export default async function handler(req, res) {
  setCors(req, res);

  if (
    String(req.method || '').toUpperCase() ===
    'OPTIONS'
  ) {
    return res.status(204).end();
  }

  try {
    await authenticate(req, res);

    const resource = getResource(req);
    const id = getId(req);

    if (!resource || !id) {
      return res.status(404).json({
        error: 'Endpoint tidak ditemukan.'
      });
    }

    if (req.method !== 'PATCH') {
      return res.status(405).json({
        error: 'Method not allowed.'
      });
    }

    if (resource === 'users') {
      const result = await updateUser(
        id,
        req.body || {}
      );

      return res.status(200).json(result);
    }

    const statusResources = [
      'sellers',
      'products',
      'orders',
      'payments',
      'rooms'
    ];

    if (
      !statusResources.includes(resource)
    ) {
      return res.status(404).json({
        error: 'Endpoint tidak ditemukan.'
      });
    }

    const status = req.body?.status;

    if (!status) {
      return res.status(400).json({
        error: 'Status wajib diisi.'
      });
    }

    const result = await setStatus(
      resource,
      id,
      status
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      'ADMIN DYNAMIC API ERROR:',
      error
    );

    const statusCode =
      Number.isInteger(error?.statusCode)
        ? error.statusCode
        : Number.isInteger(error?.status)
          ? error.status
          : 500;

    return res.status(statusCode).json({
      error:
        error?.message ||
        'Internal server error.'
    });
  }
}
