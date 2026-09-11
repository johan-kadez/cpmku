import { HttpError } from '../utils/errors.js';

export function requireAdmin(req, res, next) {
  if (req.user?.admin !== true) {
    throw new HttpError(
      403,
      'Akses admin ditolak.'
    );
  }

  req.userRole = 'admin';

  return next();
}
