import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const unavailable = (cb) => {
  cb([], new Error('Firebase belum dikonfigurasi.'));
  return () => {};
};

export const listenProducts = (cb) => db
  ? onSnapshot(query(collection(db, 'products'), where('visibility', '==', 'public'), where('status', '==', 'available')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => cb([], e))
  : unavailable(cb);

export const listenSeller = (uid, cb) => db
  ? onSnapshot(doc(db, 'sellers', uid), (s) => cb(s.exists() ? { uid: s.id, ...s.data() } : null), () => cb(null))
  : (() => { cb(null); return () => {}; })();

export const listenRooms = (uid, cb) => db
  ? onSnapshot(query(collection(db, 'rooms'), where('participantUids', 'array-contains', uid), orderBy('updatedAt', 'desc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => cb([], e))
  : unavailable(cb);

export const listenMessages = (roomId, cb) => db
  ? onSnapshot(query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => cb([], e))
  : unavailable(cb);
