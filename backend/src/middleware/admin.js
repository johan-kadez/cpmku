import { HttpError } from '../utils/errors.js';
import { env } from '../config/env.js';

export async function requireAdmin(
  req,
  res,
  next
) {
  const uid = req.user?.uid;

  if (!uid) {
    throw new HttpError(
      403,
      'Akses admin ditolak.'
    );
  }

  const adminUid = String(
    env.adminUid || ''
  ).trim();

  if (!adminUid) {
    throw new HttpError(
      500,
      'ADMIN_UID belum dikonfigurasi.'
    );
  }

  if (String(uid) !== adminUid) {
    throw new HttpError(
      403,
      'Akses admin ditolak.'
    );
  }

  req.userRole = 'admin';
  req.isAdmin = true;

  return next();
}
