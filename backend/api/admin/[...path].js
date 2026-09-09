import {
  dashboard,
  listCollection,
  setStatus,
  setBan,
  updateUser,
  saveSettings
} from '../../src/services/admin.js';

import { requireAuth } from '../../src/middleware/auth.js';
import { requireAdmin } from '../../src/middleware/admin.js';

function getSegments(req) {
  const queryPath =
    req.query?.path ??
    req.query?.['...path'];

  if (Array.isArray(queryPath)) {
    return queryPath.filter(Boolean);
  }

  if (typeof queryPath === 'string' && queryPath) {
    return queryPath.split('/').filter(Boolean);
  }

  const pathname = new URL(
    req.url || '/',
    `https://${req.headers.host || 'localhost'}`
  ).pathname;

  const marker = '/api/admin/';

  if (pathname.startsWith(marker)) {
    return pathname
      .slice(marker.length)
      .split('/')
      .filter(Boolean);
  }

  return [];
}

function sendCors(req, res) {
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
    'GET,POST,PATCH,OPTIONS'
  );

  res.setHeader(
    'Vary',
    'Origin'
  );
}

export default async function handler(req, res) {
  sendCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await requireAuth(req, res);

    await requireAdmin(req, res);

    const segments = getSegments(req);
    const resource = segments[0];
    const id = segments[1];

    if (resource === 'dashboard' && !id) {
      return res.status(200).json(
        await dashboard()
      );
    }

    if (resource === 'settings' && !id) {
      if (req.method === 'GET') {
        return res.status(200).json(
          await listCollection('settings')
        );
      }

      if (req.method === 'PATCH') {
        return res.status(200).json(
          await saveSettings(req.body || {})
        );
      }

      return res.status(405).json({
        error: 'Method not allowed.'
      });
    }

    if (resource === 'users' && id) {
      if (req.method !== 'PATCH') {
        return res.status(405).json({
          error: 'Method not allowed.'
        });
      }

      return res.status(200).json(
        await updateUser(
          id,
          req.body || {}
        )
      );
    }

    if (
      [
        'sellers',
        'products',
        'orders',
        'payments',
        'rooms'
      ].includes(resource)
    ) {
      if (!id && req.method === 'GET') {
        return res.status(200).json(
          await listCollection(resource)
        );
      }

      if (id && req.method === 'PATCH') {
        const status =
          req.body?.status;

        return res.status(200).json(
          await setStatus(
            resource,
            id,
            status
          )
        );
      }
    }

    return res.status(404).json({
      error: 'Endpoint tidak ditemukan.'
    });
  } catch (error) {
    console.error(
      'ADMIN API ERROR:',
      error
    );

    const status =
      Number.isInteger(error?.statusCode)
        ? error.statusCode
        : Number.isInteger(error?.status)
          ? error.status
          : 500;

    return res.status(status).json({
      error:
        error?.message ||
        'Internal server error.'
    });
  }
}
