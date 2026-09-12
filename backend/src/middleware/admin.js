import { db } from '../firebase/admin.js';
import { HttpError } from '../utils/errors.js';

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

  const adminDoc = await db
    .collection('admins')
    .doc(uid)
    .get();

  if (
    !adminDoc.exists ||
    adminDoc.data()?.enabled !== true
  ) {
    throw new HttpError(
      403,
      'Akses admin ditolak.'
    );
  }

  req.userRole = 'admin';
  req.isAdmin = true;

  return next();
}
