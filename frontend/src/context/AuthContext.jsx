import {
createContext,
useContext,
useEffect,
useMemo,
useState
} from 'react';

import {
onAuthStateChanged,
signInWithPopup,
signInWithEmailAndPassword,
signOut,
updateProfile
} from 'firebase/auth';

import {
auth,
googleProvider,
firebaseReady
} from '../services/firebase';

import { api } from '../services/api';

const C = createContext(null);

export function AuthProvider({ children }) {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [role, setRole] = useState(null);
const [banned, setBanned] = useState(false);

useEffect(() => {
if (!firebaseReady) {
setLoading(false);
return;
}

let alive = true;

const off = onAuthStateChanged(
  auth,
  async (current) => {
    if (!alive) return;

    setUser(current);
    setRole(null);
    setBanned(false);

    if (!current) {
      setLoading(false);
      return;
    }

    try {
      await current.getIdToken();

      const result = await api('/me');

      if (!alive) return;

      setRole(
        result.user?.role || null
      );

      setBanned(
        Boolean(result.user?.banned)
      );
    } catch (error) {
      console.error(
        'Gagal memuat data user:',
        error
      );

      if (!alive) return;

      setRole(null);
      setBanned(false);
    } finally {
      if (alive) {
        setLoading(false);
      }
    }
  }
);

return () => {
  alive = false;
  off();
};

}, []);

const login = async () => {
if (!firebaseReady) {
throw new Error(
'Firebase belum dikonfigurasi.'
);
}

return signInWithPopup(
  auth,
  googleProvider
);

};

const loginAdmin = async (
email,
password
) => {
if (!firebaseReady) {
throw new Error(
'Firebase belum dikonfigurasi.'
);
}

return signInWithEmailAndPassword(
  auth,
  email,
  password
);

};

const logout = () =>
signOut(auth);

const updateUserPhoto = async (
photoURL
) => {
if (!auth.currentUser) {
throw new Error(
'User belum login.'
);
}

await updateProfile(
  auth.currentUser,
  {
    photoURL
  }
);

await auth.currentUser.reload();

setUser(auth.currentUser);

return auth.currentUser;

};

const value = useMemo(
() => ({
user,
loading,
role,
banned,
login,
loginAdmin,
logout,
updateUserPhoto
}),
[
user,
loading,
role,
banned
]
);

return (
<C.Provider value={value}>
{children}
</C.Provider>
);
}

export const useAuth = () =>
useContext(C);
