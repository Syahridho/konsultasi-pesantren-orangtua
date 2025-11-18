# User Seeder Script

Script ini digunakan untuk membuat data testing berupa user ustad, santri, dan orangtua.

## 📋 Yang Akan Dibuat

- **20 Ustad** dengan email: `ustad1@pesantren.test` sampai `ustad20@pesantren.test`
- **60 Santri** dengan email: `santri1@pesantren.test` sampai `santri60@pesantren.test`
- **60 Orangtua** dengan email: `orangtua1@pesantren.test` sampai `orangtua60@pesantren.test`

**Total: 140 user accounts**

## 🔑 Password Default

Semua akun menggunakan password yang sama:
```
Password123!
```

## 🚀 Cara Menjalankan

1. Pastikan file `.env.local` sudah ada dan berisi konfigurasi Firebase yang benar

2. Jalankan script seeder:
```bash
npm run seed
```

3. Tunggu proses selesai (sekitar 1-2 menit karena ada delay untuk menghindari rate limiting)

## 📊 Data yang Dibuat

### Ustad
- Nama: Random nama Indonesia
- Email: ustad[1-20]@pesantren.test
- Role: ustad
- Specialization: Random (Tahfidz, Fiqih, Hadits, dll)
- Available: true
- Current Classes: 0-4 (random)

### Santri
- Nama: Random nama Indonesia
- Email: santri[1-60]@pesantren.test
- Role: santri
- Entry Year: 2021-2024 (random)
- Status: active/inactive (random, 75% active)
- Parent ID: Linked ke orangtua

### Orangtua
- Nama: Random nama Indonesia
- Email: orangtua[1-60]@pesantren.test
- Role: orangtua
- Student IDs: Linked ke santri

## 🧹 Menghapus Data Testing

Untuk menghapus semua data testing, Anda bisa:

1. Masuk ke Firebase Console
2. Pilih Authentication
3. Filter user dengan email `@pesantren.test`
4. Delete secara batch

Atau buat script cleanup (opsional).

## ⚠️ Catatan

- Script ini menggunakan Firebase Client SDK, bukan Admin SDK
- Ada delay 500ms antar user creation untuk menghindari rate limiting
- Jika ada email yang sudah exist, akan di-skip dengan warning
- Data akan tersimpan di Firebase Realtime Database di path `/users/{uid}`

## 🔍 Verifikasi

Setelah seeder selesai, cek:

1. **Firebase Console > Authentication**: Harus ada 140 users
2. **Firebase Console > Realtime Database**: Harus ada data di `/users`
3. **Login ke aplikasi**: Coba login dengan salah satu akun
4. **UI Aplikasi**: User harus muncul di list ustad/santri

## 📝 Contoh Login

```
Email: ustad1@pesantren.test
Password: Password123!

Email: santri1@pesantren.test
Password: Password123!

Email: orangtua1@pesantren.test
Password: Password123!
```
