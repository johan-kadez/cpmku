import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, googleProvider, firebaseReady } from '../services/firebase';
import { api } from '../services/api';

const C = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [role, setRole] = useState(null), [banned, setBanned] = useState(false);
  useEffect(() => {
    if (!firebaseReady) { setLoading(false); return; }
    let alive = true;
    const off = onAuthStateChanged(auth, async current => {
      if (!alive) return;
      setUser(current); setRole(null); setBanned(false);
      if (!current) { setLoading(false); return; }
      try {
        const result = await api('/auth/me');
        if (alive) { setRole(result.user?.role || 'buyer'); setBanned(Boolean(result.user?.banned)); }
      } catch (e) { if (alive) setRole('buyer'); }
      finally { if (alive) setLoading(false); }
    });
    return () => { alive = false; off(); };
  }, []);
  const login = async () => {
    if (!firebaseReady) throw new Error('Firebase belum dikonfigurasi.');
    return signInWithPopup(auth, googleProvider);
  };
  const loginAdmin = async (email, password) => {
    if (!firebaseReady) throw new Error('Firebase belum dikonfigurasi.');
    return signInWithEmailAndPassword(auth, email, password);
  };
  const logout = () => signOut(auth);
  const value = useMemo(() => ({ user, loading, role, banned, login, loginAdmin, logout }), [user, loading, role, banned]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useAuth = () => useContext(C);
