JOHAN MARKETPLACE

Marketplace jual-beli mobil/item dengan Admin sebagai perantara transaksi.

Project menggunakan:

- React + Vite
- Firebase Authentication
- Google Sign-In
- Firebase Firestore
- Firebase Admin SDK
- Vercel Functions
- Firestore Realtime Listener

---

FITUR

Buyer

- Login menggunakan Google
- Melihat produk yang tersedia
- Melihat detail produk
- Melihat profile seller
- Membeli produk
- Masuk ke transaction room
- Melihat QRIS
- Chat dengan Admin
- Chat dengan Seller setelah Seller dipanggil Admin
- Menerima notification realtime
- Menekan DONE setelah produk diterima

---

Seller

Seller harus mengajukan aplikasi terlebih dahulu.

Form Seller Application:

- Nama
- Nomor WhatsApp
- Alasan
- URL Foto Profile

Status aplikasi:

pending
approved
rejected

Seller yang belum disetujui tidak dapat mengakses Seller Dashboard.

Seller dapat:

- Membuat product
- Melihat product sendiri
- Mengedit product jika tidak sedang dalam transaksi
- Menghapus product jika diizinkan sistem
- Chat setelah dipanggil Admin

---

Admin

Admin ditentukan menggunakan environment variable:

ADMIN_EMAILS=email1@gmail.com,email2@gmail.com

Admin dapat:

Seller Applications

- View
- Approve
- Reject

Products

- View
- Approve
- Reject

Orders

- View
- Cancel

Payments

- Verify
- Reject

Transaction Rooms

- View
- Open Chat
- Panggil Seller

Users

- View
- Ban
- Unban

Settings

- QRIS URL
- Maintenance Mode

---

TECH STACK

Frontend

React
Vite
React Router
Firebase Web SDK

Backend

Vercel Functions
Firebase Admin SDK

Database

Firebase Firestore

Authentication

Firebase Authentication
Google Sign-In

---

STRUKTUR PROJECT

johan-marketplace/

├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── api/
│   ├── lib/
│   ├── services/
│   └── package.json
│
├── firestore.rules
├── firestore.indexes.json
├── vercel.json
├── DEPLOY_TUTORIAL.md
└── README.md

---

ENVIRONMENT VARIABLES

Frontend

Buat file:

frontend/.env

Isi:

VITE_FIREBASE_API_KEY=

VITE_FIREBASE_AUTH_DOMAIN=

VITE_FIREBASE_PROJECT_ID=

VITE_FIREBASE_STORAGE_BUCKET=

VITE_FIREBASE_MESSAGING_SENDER_ID=

VITE_FIREBASE_APP_ID=

VITE_API_BASE_URL=

VITE_MAIN_QRIS_URL=

---

Backend

Buat environment variables:

FIREBASE_PROJECT_ID=

FIREBASE_CLIENT_EMAIL=

FIREBASE_PRIVATE_KEY=

ADMIN_EMAILS=

PUBLIC_APP_ORIGIN=

CRON_SECRET=

Jangan upload:

.env

ke GitHub.

---

LOCAL STORAGE

Project menggunakan localStorage hanya untuk data non-kritis.

Contoh:

UI preferences

Theme preferences

Form draft

Seller application draft

Product form draft

Tutorial viewed flag

Lightweight cache

localStorage BUKAN database utama.

Data berikut tidak disimpan sebagai source of truth di localStorage:

Products

Stock

Orders

Payments

Seller approval

Seller status

Admin status

Transaction status

Chat messages

Notifications

Maintenance mode

Semua data bisnis utama berasal dari:

Firebase Firestore

Firebase Authentication menangani session secara otomatis.

Firebase ID Token tidak disimpan manual ke localStorage.

---

FIRESTORE COLLECTIONS

users
sellers
registrations
products
orders
payments
rooms
notifications
settings

Messages:

rooms/{roomId}/messages

---

PRODUCT FLOW

Seller membuat produk:

Seller
↓
Create Product
↓
Backend Generate Product ID
↓
Product Pending
↓
Private
↓
Admin Review

Jika Admin approve:

status = available

visibility = public

Produk dapat muncul di marketplace publik.

---

PRODUCT ID

Product ID dibuat otomatis oleh Backend.

Contoh:

kga-lgsls

Seller tidak dapat menentukan Product ID sendiri.

---

BUY FLOW

Buyer Login
↓
Pilih Product
↓
Buy
↓
Backend Validation
↓
Order Created
↓
Product Locked
↓
status = in_transaction
↓
Room Created
↓
Payment Created
↓
Buyer + Admin masuk Room

Backend memvalidasi:

Product tersedia

Stock > 0

Product approved

Product public

Product tidak sedang transaksi

Buyer bukan Seller produk

Admin tersedia

---

TRANSACTION ROOM

Room dibuat otomatis ketika Order berhasil.

Participant awal:

Buyer

Admin

Seller tidak otomatis masuk.

Seller ditambahkan ketika Admin menekan:

Panggil Seller

Room menyimpan:

roomId

orderId

productId

buyerUid

sellerUid

participantUids

status

createdAt

updatedAt

sellerCalled

---

CHAT

Role:

buyer

seller

admin

Contoh:

Rizal • buyer

Raka • seller

Minjo • admin

Rules:

Buyer dapat chat.

Admin dapat chat.

Seller dapat chat setelah dipanggil.

Hanya participant dapat membaca room.

Backend memvalidasi senderUid.

---

PAYMENT

Metode pembayaran:

QRIS

Tidak menggunakan:

Payment Gateway

Payment API

Automatic Payment Verification

DANA API

GoPay API

Wallet

Seller Balance

Buyer melakukan pembayaran secara manual.

Transaction Room memiliki tombol:

Lihat QRIS

QRIS ditampilkan menggunakan:

Modal

atau

Bottom Sheet

Bukan halaman full screen.

---

PAYMENT FLOW

Order Created
↓
Payment Created
↓
status = pending
↓
Buyer melakukan pembayaran manual
↓
Admin memeriksa pembayaran
↓
Admin Verify / Reject

Status Payment:

pending

verified

rejected

Payment tidak otomatis dianggap berhasil.

---

COMPLETE ORDER

Hanya Buyer yang dapat menekan:

DONE

Flow:

Admin Verify Payment
↓
Admin Panggil Seller
↓
Seller mengirim produk
↓
Buyer menerima produk
↓
Buyer tekan DONE
↓
Order Completed

Jika:

Stock > 1

Maka:

Stock dikurangi 1

Product kembali available/public

Jika:

Stock = 1

Maka:

Stock = 0

Product = sold

Visibility = private

Firestore Transaction digunakan untuk mencegah:

Overselling

Race Condition

Double Stock Restore

---

CANCEL ORDER

Hanya Admin dapat Cancel Order.

Ketika Cancel:

Order = cancelled

Room = cancelled

Product diproses kembali

Stock dikembalikan secara aman menggunakan Firestore Transaction.

Sistem mencegah stock dikembalikan dua kali.

---

NOTIFICATIONS

Collection:

notifications

Field:

toUid

type

title

message

createdAt

read

Notification menggunakan:

Firestore Realtime Listener

Jika website masih terbuka:

Notification muncul realtime.

Browser Notification API dapat digunakan jika user memberikan permission.

Project tidak mengklaim menggunakan push notification ketika browser ditutup.

---

MAINTENANCE MODE

Source of truth:

Firestore

Document:

settings/main

Contoh:

{
  "maintenanceMode": false,
  "maintenanceTitle": "WEBSITE SEDANG MAINTENANCE",
  "maintenanceMessage": "Kami sedang melakukan pemeliharaan sistem. Silakan kembali beberapa saat lagi."
}

Maintenance menggunakan realtime listener.

Admin dapat mengaktifkan atau menonaktifkan maintenance tanpa redeploy.

Admin tetap dapat membuka:

/admin

ketika maintenance aktif.

---

SECURITY

Backend menggunakan:

Authorization: Bearer Firebase_ID_Token

Setiap private request:

1. Verify Firebase Token

2. Get UID

3. Get Email

4. Check Banned User

5. Check Admin melalui ADMIN_EMAILS

6. Validate Input

7. Execute Service

8. Return Safe Response

Backend tidak percaya:

role dari frontend

admin flag

product status

payment status

price dari client

stock dari client

seller approval dari client

---

FIRESTORE REALTIME

Realtime listener digunakan untuk:

Products

Seller Products

Rooms

Messages

Notifications

Maintenance Settings

Semua listener harus:

unsubscribe()

ketika component unmount.

---

ROUTES

/

 /products

/product/:id

/seller/:id

/login

/seller/apply

/seller/login

/seller/dashboard

/chat/:roomId

/admin

/maintenance

React Router digunakan untuk routing.

Vercel SPA Rewrite diperlukan agar refresh halaman tidak menghasilkan:

404

---

DEPLOY DARI HP KE VERCEL

Kamu tidak perlu menjalankan:

npm install

secara manual di HP.

Vercel akan melakukan:

Install Dependency
↓
Build
↓
Deploy

secara otomatis.

---

CARA DEPLOY

1. Upload Project ke GitHub

Buat repository baru.

Contoh:

johan-marketplace

Upload seluruh project.

Jangan upload:

.env

node_modules

---

2. Setup Firebase

Buka Firebase Console.

Buat project Firebase.

Aktifkan:

Authentication

Firestore Database

---

3. Aktifkan Google Login

Firebase:

Authentication
↓
Sign-in Method
↓
Google
↓
Enable

Tambahkan domain Vercel setelah deployment.

Contoh:

johan-marketplace.vercel.app

---

4. Setup Firestore Rules

Deploy file:

firestore.rules

Gunakan Firebase Console atau Firebase CLI jika tersedia.

---

5. Setup Firestore Indexes

Gunakan:

firestore.indexes.json

Jika Firestore meminta composite index, buat index yang diminta.

---

6. Import Repository ke Vercel

Buka:

Vercel

Login menggunakan GitHub.

Pilih:

Add New Project

Import repository:

johan-marketplace

---

7. Environment Variables

Tambahkan semua environment variables.

Frontend:

VITE_FIREBASE_API_KEY

VITE_FIREBASE_AUTH_DOMAIN

VITE_FIREBASE_PROJECT_ID

VITE_FIREBASE_STORAGE_BUCKET

VITE_FIREBASE_MESSAGING_SENDER_ID

VITE_FIREBASE_APP_ID

VITE_API_BASE_URL

Backend:

FIREBASE_PROJECT_ID

FIREBASE_CLIENT_EMAIL

FIREBASE_PRIVATE_KEY

ADMIN_EMAILS

PUBLIC_APP_ORIGIN

CRON_SECRET

---

FIREBASE ADMIN PRIVATE KEY

Untuk:

FIREBASE_PRIVATE_KEY

Masukkan private key dari Firebase Service Account.

Pastikan newline diproses dengan benar.

Contoh:

FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPRIVATE_KEY\n-----END PRIVATE KEY-----\n"

Jangan pernah memasukkan private key ke:

Frontend

GitHub Repository

Public Source Code

---

ADMIN

Tambahkan email Admin:

ADMIN_EMAILS=admin@gmail.com

Multiple admin:

ADMIN_EMAILS=admin1@gmail.com,admin2@gmail.com

Frontend tidak menentukan siapa Admin.

Backend melakukan validasi.

---

QRIS

QRIS dapat diatur melalui:

Admin Panel
↓
Settings
↓
QRIS URL

Source utama:

Firestore settings/main

Fallback:

VITE_MAIN_QRIS_URL

Firestore tetap menjadi source of truth jika QRIS sudah dikonfigurasi Admin.

---

CRON CLEANUP

Room:

Completed:

Target cleanup setelah 12 jam

Inactive:

Target cleanup setelah 2 jam

Cleanup dijalankan menggunakan:

Vercel Cron

Cleanup dapat berjalan secara berkala.

Sistem tidak menjamin penghapusan tepat pada detik tertentu.

Cleanup menghapus:

Room

Messages terkait

untuk mencegah orphan data.

---

ERROR HANDLING

Frontend menangani:

Loading

Empty State

Error

Network Error

Authentication Error

Unavailable Product

Transaction Conflict

Banned Account

Backend menangani:

Validation Error

Authentication Error

Authorization Error

Not Found

Conflict

Firebase Error

Internal Error

Backend tidak mengirim:

Stack Trace

Private Key

Firebase Credential

Internal Secret

---

PENTING

Jangan gunakan localStorage sebagai database marketplace.

Gunakan:

Firestore

untuk seluruh data bisnis utama.

Jangan percaya validasi frontend.

Semua operasi penting seperti:

Buy Product

Reserve Product

Complete Order

Cancel Order

Restore Stock

Approve Seller

Approve Product

Verify Payment

Ban User

harus divalidasi oleh Backend.

---

LICENSE

Private Project.

Johan Marketplace.
