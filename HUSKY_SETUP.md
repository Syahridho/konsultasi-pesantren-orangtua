# Husky Setup

Proyek ini menggunakan Husky untuk mengelola Git hooks dan memastikan kualitas kode.

## Instalasi

Husky sudah diinstal dan dikonfigurasi dalam proyek ini. Instalasi otomatis terjadi saat menjalankan `npm install`.

## Git Hooks yang Dikonfigurasi

### Pre-commit Hook

- Menjalankan `npm run lint` sebelum setiap commit
- Mencegah commit jika ada error linting

### Commit-msg Hook

- Memvalidasi format pesan commit menggunakan Commitlint
- Memastikan pesan commit mengikuti konvensi Conventional Commits

## Format Pesan Commit

Gunakan format berikut untuk pesan commit:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Tipe yang Diizinkan:

- `feat`: Menambahkan fitur baru
- `fix`: Memperbaiki bug
- `docs`: Perubahan dokumentasi
- `style`: Perubahan format kode (tidak mengubah logika)
- `refactor`: Perubahan kode yang bukan fitur atau bug fix
- `perf`: Peningkatan performa
- `test`: Menambah atau memperbaiki test
- `chore`: Perubahan build process atau tools
- `ci`: Perubahan konfigurasi CI
- `build`: Perubahan yang mempengaruhi build system
- `revert`: Membatalkan commit sebelumnya

### Contoh:

```
feat(auth): tambahkan validasi password
fix(chat): perbaiki error saat mengirim pesan
docs(readme): update instruksi instalasi
```

## Menonaktikan Hooks Sementara

Jika perlu melewati hooks (tidak direkomendasikan):

```bash
git commit --no-verify -m "pesan commit"
```

## Mengubah Konfigurasi

- File hook: `.husky/pre-commit`, `.husky/commit-msg`
- Konfigurasi commitlint: `commitlint.config.js`
- Dependensi: `package.json` (devDependencies)
