# 📋 Logbook Bimbingan Proyek — Bengkelku

| Informasi | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Bengkelku (Sistem Manajemen Operasional Bengkel Modern) |
| **Nama Mahasiswa** | Prabu Pebe |
| **NIM** | [NIM Mahasiswa] |
| **Dosen Pembimbing** | [Dosen Pembimbing] |
| **Periode / Milestone** | **Milestone 1**: Pondasi Arsitektur Sistem, Autentikasi NextAuth, & Desain UI |
| **Status Milestone** | 🟢 **Selesai (Completed & Deployed)** |
| **Repositori & Deploy** | GitHub: `PrabuPebe/bengkel-app` \| Deployment: Vercel Production |

---

## 1. 🎯 Tujuan & Target Milestone 1
Membangun pondasi arsitektur sistem bengkel modern berbasis web yang tangguh, aman, dan berstandar industri dengan target:
1. Setup arsitektur Next.js 16 (App Router) dengan TypeScript, Turbopack, dan Tailwind CSS v4.
2. Implementasi modul autentikasi terpusat menggunakan **NextAuth.js (v4)** dengan Credentials Provider.
3. Desain antarmuka Login berkonsep modern *High-Tech Pitstop* dengan ambient dark glow, indikator visual status, dan tombol demo one-click.
4. Setup pipeline continuous integration & continuous deployment (CI/CD) ke Vercel Platform.

---

## 2. 🚀 Realisasi Capaian Pekerjaan

### A. Arsitektur & Antarmuka yang Dibangun
| Modul / Komponen | Path File | Deskripsi Fungsional |
| :--- | :--- | :--- |
| **Root Layout & Branding** | `app/layout.tsx` | Setup layout utama, metadata aplikasi "Bengkelku", konfigurasi font Geist Sans & Mono. |
| **Desain Sistem & Token** | `app/globals.css` | Konfigurasi Tailwind CSS v4 (`@import "tailwindcss";`), token palet Obsidian (`#0B0F17`), Sidebar (`#0F172A`), Card (`#131B2E`), Hyper Cyan (`#00D2FF`), Electric Blue (`#2563EB`). |
| **Halaman Login Interaktif** | `app/login/page.tsx` | Tampilan login *High-Tech Pitstop* dengan glassmorphism card, ambient neon orbs, icon inline email/password, dan tombol bypass kredensial demo (`admin22@gmail.com`). |
| **NextAuth Route Handler** | `app/api/auth/[...nextauth]/route.ts` | Konfigurasi sesi JWT, otorisasi credentials, penanganan error auth, dan callback sesi peran (`role: ADMIN / MECHANIC`). |
| **Sidebar & Header Shell** | `components/dashboard/sidebar.tsx`, `components/dashboard/header.tsx` | Navigasi vertikal dengan indikator left-bar aktif, logo BK glow, live status pulse, serta pemisah neon-line. |

### B. Konfigurasi Lingkungan & Keamanan
- Pengaturan variabel lingkungan (`.env` dan `.env.local`):
  - `NEXTAUTH_URL`: Konfigurasi host lokal (`http://localhost:3000`) dan production URL Vercel.
  - `NEXTAUTH_SECRET`: Kunci enkripsi token JWT sesi pengguna.
- Proteksi route berbasis sesi pada sub-folder `app/(dashboard)/*`.

---

## 3. 🛠️ Kendala Teknis & Solusi

| No | Kendala yang Dihadapi | Akar Masalah | Solusi & Penanganan |
| :---: | :--- | :--- | :--- |
| 1 | Sintaks Tailwind CSS v4 berbeda dengan versi 3 | `@tailwind base;` menghasilkan error pada Next.js 16 Turbopack | Migrasi penuh ke sintaks resmi v4 menggunakan directive `@import "tailwindcss";` dan konfigurasi PostCSS terstandarisasi. |
| 2 | Redireksi sesi login pada App Router | State sesi lambat tersinkronisasi saat push router | Menggunakan kombinasi `signIn("credentials", { redirect: false })` diikuti oleh `router.push("/dashboard")` dan `router.refresh()`. |
| 3 | Perbedaan penanganan variabel env di Vercel | Nilai `NEXTAUTH_URL` dan `NEXTAUTH_SECRET` belum terbaca otomatis | Menambahkan seluruh Environment Variables yang dipersyaratkan ke Dashboard Project Vercel Settings. |

---

## 4. ✅ Bukti Verifikasi & Pengujian Mutu

```bash
# 1. Verifikasi tipe TypeScript
$ npx tsc --noEmit
Exit Code: 0 (No type errors)

# 2. Pemeriksaan kaidah kode ESLint
$ npm run lint
Exit Code: 0 (Clean, no warnings/errors)

# 3. Kompilasi build Next.js (Turbopack)
$ npm run build
✓ Compiled successfully
✓ Generating static pages (11/11)
✓ Route (app):
  ┌ ○ /
  ├ ○ /_not-found
  ├ ƒ /api/auth/[...nextauth]
  └ ○ /login
Exit Code: 0 (Semua route siap produksi)
```

---

## 5. 📅 Rencana Kerja Milestone 2
- [x] Perancangan skema database relasional (PostgreSQL) menggunakan Prisma ORM.
- [x] Pembuatan relasi data Pelanggan (*Customer*), Armada Kendaraan (*Vehicle*), Jasa (*Service*), dan Suku Cadang (*Part*).
- [x] Pengembangan antarmuka CRUD Master Data & Inventaris Gudang.
