import { auth, db } from '../firebase/admin.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new HttpError(401, 'Login diperlukan.');
  try {
    req.user = await auth.verifyIdToken(header.slice(7));
    const isAdmin = env.adminEmails.includes((req.user.email || '').toLowerCase());
    if (!isAdmin) {
      const profile = await db.collection('users').doc(req.user.uid).get();
      if (profile.exists && profile.data().banned === true) {
        throw new HttpError(403, 'Akun diblokir admin.');
      }
    }
    return next();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, 'Token login tidak valid.');
  }
}
