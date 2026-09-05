import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { api } from '../services/api';
const C = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async current => {
      if (!active) return;
      setUser(current);
      setRole(null);
      if (!current) {
        setLoading(false);
        return;
      }
      try {
        const result = await api('/auth/me');
        if (active) setRole(result.user?.role || 'buyer');
      } catch {
        if (active) setRole('buyer');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);
  const value = useMemo(() => ({ user, loading, role, login, logout }), [user, loading, role]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useAuth = () => useContext(C);
