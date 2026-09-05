import { db } from '../../src/firebase/admin.js';
import { asyncHandler } from '../../src/utils/errors.js';
const TWO_HOURS = 2 * 60 * 60 * 1000;
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
async function deleteRoom(roomDoc) {
  const messages = await roomDoc.ref.collection('messages').limit(450).get();
  const batch = db.batch();
  for (const message of messages.docs) batch.delete(message.ref);
  batch.delete(roomDoc.ref);
  await batch.commit();
  return messages.size;
}
export default asyncHandler(async (req, res) => {
  const secret = req.headers['x-cron-secret'] ||
    String(req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const now = Date.now();
  const [doneSnap, activeSnap] = await Promise.all([
    db.collection('rooms').where('status', '==', 'done').limit(100).get(),
    db.collection('rooms').where('status', '==', 'in_transaction').limit(100).get()
  ]);
  let deleted = 0;
  for (const room of [...doneSnap.docs, ...activeSnap.docs]) {
    const data = room.data();
    const timestamp = data.completedAt?.toMillis?.() || data.updatedAt?.toMillis?.() || 0;
    const maxAge = data.status === 'done' ? TWELVE_HOURS : TWO_HOURS;
    if (timestamp && now - timestamp >= maxAge) {
      await deleteRoom(room);
      deleted++;
    }
  }
  return res.json({ ok: true, deleted });
});
