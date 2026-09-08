import { auth } from './firebase';

const base =
import.meta.env.VITE_API_BASE_URL ||
'/api';

export async function api(
path,
options = {}
) {
const token =
auth.currentUser
? await auth.currentUser.getIdToken()
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
