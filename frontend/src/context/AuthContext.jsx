import {
createContext,
useContext,
useEffect,
useMemo,
useState
} from 'react';

import {
createUserWithEmailAndPassword,
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

const ADMIN_UID =
import.meta.env.VITE_ADMIN_UID || '';

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
  async current => {
    if (!alive) return;

    setUser(current);
    setRole(null);
    setBanned(false);

    if (!current) {
      setLoading(false);
      return;
    }

    const isAdmin =
      Boolean(ADMIN_UID) &&
      current.uid === ADMIN_UID;

    if (isAdmin) {
      setRole('admin');
      setBanned(false);
      setLoading(false);
      return;
    }

    try {
      await current.getIdToken();

      const result =
        await api('/me');

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

const loginWithEmail = async (
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
  email.trim(),
  password
);

};

const register = async ({
name,
email,
phone,
password
}) => {
if (!firebaseReady) {
throw new Error(
'Firebase belum dikonfigurasi.'
);
}

const cleanName =
  String(name || '').trim();

const cleanEmail =
  String(email || '').trim();

const cleanPhone =
  String(phone || '').trim();

if (!cleanName) {
  throw new Error(
    'Nama wajib diisi.'
  );
}

if (!cleanEmail) {
  throw new Error(
    'Email wajib diisi.'
  );
}

if (!cleanPhone) {
  throw new Error(
    'Nomor wajib diisi.'
  );
}

if (!password) {
  throw new Error(
    'Password wajib diisi.'
  );
}

if (password.length < 6) {
  throw new Error(
    'Password minimal 6 karakter.'
  );
}

const credential =
  await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

try {
  await updateProfile(
    credential.user,
    {
      displayName: cleanName
    }
  );

  await api('/profile/register', {
    method: 'POST',
    body: JSON.stringify({
      name: cleanName,
      phone: cleanPhone
    })
  });

  await credential.user.reload();

  setUser(auth.currentUser);

  return credential;
} catch (error) {
  await signOut(auth);

  throw error;
}

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

if (!ADMIN_UID) {
  throw new Error(
    'VITE_ADMIN_UID belum dikonfigurasi.'
  );
}

const credential =
  await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

const loggedInUser =
  credential.user;

if (
  loggedInUser.uid !==
  ADMIN_UID
) {
  await signOut(auth);

  throw new Error(
    'Akun ini bukan akun admin.'
  );
}

setUser(loggedInUser);
setRole('admin');
setBanned(false);
setLoading(false);

return credential;

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
loginWithEmail,
register,
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
