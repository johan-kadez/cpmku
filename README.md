# JOHAN MARKETPLACE

Monorepo marketplace React + Vite + Firebase Authentication + Firestore + Firebase Admin SDK.

## Struktur

- `frontend/` — React/Vite SPA.
- `backend/` — Vercel Serverless Functions dengan Firebase Admin SDK.

## Fitur utama

- Google Sign-In untuk Buyer.
- Seller Sign Up dengan nama, WhatsApp, email akun, tujuan, dan URL foto profile.
- Seller hanya dapat dashboard setelah approval Admin.
- Admin ditentukan server-side melalui `ADMIN_EMAILS`.
- Produk pending sampai Admin approve.
- Favorite tersimpan per akun di Firestore.
- Riwayat transaksi realtime per akun.
- Order memakai Firestore transaction untuk mencegah double purchase.
- Room chat Buyer/Admin, Seller setelah Admin menekan **Panggil Seller**.
- QRIS manual, tanpa payment gateway dan tanpa auto-verification.
- Buyer-only DONE, server-side validation.
- Admin approve/reject seller dan produk, verify/reject payment, cancel order, call seller, ban user.
- Maintenance mode realtime dari `settings/main`.
- Mobile floating bottom navigation dengan efek neumorphism.

## Deploy dari HP / Vercel

### 1. Backend

Buat project Vercel dari repository yang sama dan pilih Root Directory `backend`.

Tambahkan Environment Variables:

```env
FIREBASE_PROJECT_ID=cartier-syndicate
FIREBASE_CLIENT_EMAIL=SERVICE_ACCOUNT_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
ADMIN_EMAILS=email-admin-anda@gmail.com
PUBLIC_APP_ORIGIN=https://DOMAIN-FRONTEND.vercel.app
CRON_SECRET=buat-random-secret-panjang
```

Deploy. URL hasilnya menjadi base API, contoh:

`https://nama-backend.vercel.app/api`

### 2. Frontend

Buat project Vercel kedua dari repository yang sama dan pilih Root Directory `frontend`.

Tambahkan:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=cartier-syndicate.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cartier-syndicate
VITE_FIREBASE_STORAGE_BUCKET=cartier-syndicate.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=398099569686
VITE_FIREBASE_APP_ID=1:398099569686:web:c63901a0eea0b187de6937
VITE_API_BASE_URL=https://NAMA-BACKEND.vercel.app/api
```

Redeploy setelah mengubah Environment Variables.

## Firebase

Aktifkan Google provider di Firebase Authentication.

Deploy `backend/firestore.rules` dan `backend/firestore.indexes.json` ke Firestore.

Jangan pernah memasukkan `FIREBASE_PRIVATE_KEY` ke frontend atau repository publik.

## Catatan penting

Vercel akan menginstal dependency dari `package.json` secara otomatis saat build. Tidak perlu menjalankan instalasi manual dari HP untuk proses deployment.
