# Johan Marketplace Frontend

React + Vite + Firebase client. Frontend membaca produk/seller/room secara realtime dari Firestore dan memakai backend Vercel untuk operasi yang membutuhkan hak istimewa.

## Deploy dari HP
1. Upload isi folder `frontend` ke repository GitHub frontend.
2. Import repository ke Vercel.
3. Set Environment Variables sesuai `.env.example`.
4. Vercel otomatis menjalankan install dan build. Tidak perlu menjalankan npm di HP.

Firebase Web config bukan secret. Jangan pernah memasukkan service-account private key ke frontend.

Admin routes include seller/product approval, orders, payment status, transaction rooms, user bans, and QRIS settings.
