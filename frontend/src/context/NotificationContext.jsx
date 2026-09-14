import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';

import {
  db
} from '../services/firebase';

import {
  useAuth
} from './AuthContext';

const C =
  createContext(null);

export function NotificationProvider({
  children
}) {
  const {
    user
  } = useAuth();

  const [
    notifications,
    setNotifications
  ] = useState([]);

  const [
    toast,
    setToast
  ] = useState(null);

  const notifiedIds =
    useRef(new Set());

  const toastTimer =
    useRef(null);

  useEffect(() => {
    notifiedIds.current.clear();

    setToast(null);

    if (
      toastTimer.current
    ) {
      clearTimeout(
        toastTimer.current
      );

      toastTimer.current =
        null;
    }

    if (!user) {
      setNotifications([]);

      return undefined;
    }

    return onSnapshot(
      query(
        collection(
          db,
          'notifications'
        ),
        where(
          'toUid',
          '==',
          user.uid
        ),
        orderBy(
          'createdAt',
          'desc'
        )
      ),
      snapshot => {
        const rows =
          snapshot.docs.map(
            doc => ({
              id: doc.id,
              ...doc.data()
            })
          );

        setNotifications(rows);

        const latest =
          rows[0];

        if (
          latest &&
          !notifiedIds.current.has(
            latest.id
          )
        ) {
          notifiedIds.current.add(
            latest.id
          );

          showToast(
            latest.title ||
              'Notifikasi CPMKU',
            latest.message ||
              latest.body ||
              ''
          );
        }
      },
      () => {
        setNotifications([]);
      }
    );
  }, [
    user
  ]);

  useEffect(() => {
    return () => {
      if (
        toastTimer.current
      ) {
        clearTimeout(
          toastTimer.current
        );
      }
    };
  }, []);

  const showToast = (
    title,
    message
  ) => {
    if (
      toastTimer.current
    ) {
      clearTimeout(
        toastTimer.current
      );
    }

    setToast({
      id:
        `toast-${Date.now()}`,
      title:
        title ||
        'Notifikasi CPMKU',
      message:
        message || ''
    });

    toastTimer.current =
      setTimeout(() => {
        setToast(null);
        toastTimer.current =
          null;
      }, 5000);
  };

  const dismissToast = () => {
    if (
      toastTimer.current
    ) {
      clearTimeout(
        toastTimer.current
      );

      toastTimer.current =
        null;
    }

    setToast(null);
  };

  return (
    <C.Provider
      value={{
        notifications,
        toast,
        showToast,
        dismissToast
      }}
    >
      {children}
    </C.Provider>
  );
}

export const useNotifications =
  () => useContext(C);
