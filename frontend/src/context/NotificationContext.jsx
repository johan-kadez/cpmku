import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

const C = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const notifiedIds = useRef(new Set());

  useEffect(() => {
    notifiedIds.current.clear();
    if (!user) {
      setNotifications([]);
      return undefined;
    }

    return onSnapshot(
      query(collection(db, 'notifications'), where('toUid', '==', user.uid), orderBy('createdAt', 'desc')),
      snap => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setNotifications(rows);

        const latest = rows[0];
        if (
          latest &&
          !notifiedIds.current.has(latest.id) &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          notifiedIds.current.add(latest.id);
          new Notification(latest.title || 'Johan Marketplace', { body: latest.message || latest.body || '' });
        }
      }
    );
  }, [user]);

  const requestPermission = () =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.requestPermission()
      : Promise.resolve('denied');

  return <C.Provider value={{ notifications, requestPermission }}>{children}</C.Provider>;
}

export const useNotifications = () => useContext(C);
