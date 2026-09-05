# Johan Marketplace Backend

Vercel serverless backend untuk Johan Marketplace. Firebase Admin SDK dipakai untuk operasi yang tidak boleh dilakukan client, termasuk approval seller/produk, pembuatan order/room, dan admin actions.

## Deploy
1. Upload folder `backend` ke repository backend.
2. Import repository ke Vercel.
3. Set environment variables dari `.env.example`.
4. `FIREBASE_PRIVATE_KEY` harus memakai newline escaped `\n` jika ditempel satu baris.
5. `ADMIN_EMAILS` berisi email Google admin, dipisahkan koma.
6. Tambahkan `VITE_API_BASE_URL=https://DOMAIN-BACKEND.vercel.app/api` di project frontend.

Tidak ada custom claim admin. Admin diverifikasi dari email yang ada di `ADMIN_EMAILS` pada backend.
