import {
  dashboard,
  listCollection,
  saveSettings
} from '../../src/services/admin.js';

import { requireAuth } from '../../src/middleware/auth.js';
import { requireAdmin } from '../../src/middleware/admin.js';

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

function getSegments(req) {
  const queryPath =
    req.query?.path ??
    req.query?.['...path'];

  if (Array.isArray(queryPath)) {
    return queryPath
      .map((value) => String(value))
      .filter(Boolean);
  }

  if (
    typeof queryPath === 'string' &&
    queryPath
  ) {
    return queryPath
      .split('/')
      .filter(Boolean);
  }

  const url = String(req.url || '');

  const pathname = url.split('?')[0];

  const markers = [
    '/api/admin/',
    '/admin/'
  ];

  for (const marker of markers) {
    const markerIndex =
      pathname.indexOf(marker);

    if (markerIndex === -1) {
      continue;
    }

    return pathname
      .slice(markerIndex + marker.length)
      .split('/')
      .filter(Boolean);
  }

  return [];
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

    const segments = getSegments(req);

    const resource = segments[0] || '';
    const id = segments[1] || '';

    if (id) {
      return res.status(404).json({
        error: 'Endpoint tidak ditemukan.'
      });
    }

    if (
      resource === 'dashboard' &&
      req.method === 'GET'
    ) {
      const result = await dashboard();

      return res.status(200).json(result);
    }

    if (
      resource === 'settings'
    ) {
      if (req.method === 'GET') {
        const result =
          await listCollection('settings');

        return res.status(200).json(result);
      }

      if (req.method === 'PATCH') {
        const result =
          await saveSettings(
            req.body || {}
          );

        return res.status(200).json(result);
      }

      return res.status(405).json({
        error: 'Method not allowed.'
      });
    }

    const listableResources = [
      'users',
      'sellers',
      'products',
      'orders',
      'payments',
      'rooms'
    ];

    if (
      listableResources.includes(resource) &&
      req.method === 'GET'
    ) {
      const result =
        await listCollection(resource);

      return res.status(200).json(result);
    }

    return res.status(404).json({
      error: 'Endpoint tidak ditemukan.'
    });
  } catch (error) {
    console.error(
      'ADMIN API ERROR:',
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
