import { auth } from './firebase';

const base =
  import.meta.env.VITE_API_BASE_URL ||
  '/api';

function getAuthUser() {
  return new Promise(resolve => {
    const unsubscribe =
      auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
  });
}

export async function api(
  path,
  options = {}
) {
  let user = auth.currentUser;

  if (!user) {
    user = await getAuthUser();
  }

  const token = user
    ? await user.getIdToken()
    : null;

  const response = await fetch(
    `${base}${path}`,
    {
      ...options,
      headers: {
        'Content-Type':
          'application/json',
        ...(options.headers || {}),
        ...(token
          ? {
              Authorization:
                `Bearer ${token}`
            }
          : {})
      }
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      `Request gagal (${response.status})`
    );
  }

  return data;
}
