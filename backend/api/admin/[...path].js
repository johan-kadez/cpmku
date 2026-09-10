import {
  dashboard,
  listCollection,
  setStatus,
  updateUser,
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

function getSegments(req) {
  const url = String(req.url || '');

  const pathname = url.split('?')[0];

  const marker = '/api/admin/';

  const markerIndex =
    pathname.indexOf(marker);

  if (markerIndex !== -1) {
    return pathname
      .slice(markerIndex + marker.length)
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      });
  }

  const queryPath =
    req.query?.path ??
    req.query?.['...path'];

  if (Array.isArray(queryPath)) {
    return queryPath
      .map((segment) => String(segment))
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

  return [];
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

    if (
      resource === 'dashboard' &&
      !id &&
      req.method === 'GET'
    ) {
      const result = await dashboard();

      return res.status(200).json(result);
    }

    if (
      resource === 'settings' &&
      !id
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

    if (
      resource === 'users' &&
      !id
    ) {
      if (req.method !== 'GET') {
        return res.status(405).json({
          error: 'Method not allowed.'
        });
      }

      const result =
        await listCollection('users');

      return res.status(200).json(result);
    }

    if (
      resource === 'users' &&
      id
    ) {
      if (req.method !== 'PATCH') {
        return res.status(405).json({
          error: 'Method not allowed.'
        });
      }

      const result =
        await updateUser(
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
      statusResources.includes(resource)
    ) {
      if (
        !id &&
        req.method === 'GET'
      ) {
        const result =
          await listCollection(resource);

        return res.status(200).json(result);
      }

      if (
        id &&
        req.method === 'PATCH'
      ) {
        const requestedStatus =
          req.body?.status;

        if (!requestedStatus) {
          return res.status(400).json({
            error: 'Status wajib diisi.'
          });
        }

        const result =
          await setStatus(
            resource,
            id,
            requestedStatus
          );

        return res.status(200).json(result);
      }

      return res.status(405).json({
        error: 'Method not allowed.'
      });
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
