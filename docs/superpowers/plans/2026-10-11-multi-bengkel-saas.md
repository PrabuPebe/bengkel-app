# PitCare Auto Multi-Bengkel (Multi-Tenant SaaS) & Pembersihan Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah PitCare Auto menjadi platform SaaS multi-bengkel yang siap produksi dengan menghapus seluruh akun dan tombol demo, menyediakan onboarding pendaftaran bengkel mandiri, serta mengisolasi data operasional per bengkel.

**Architecture:** Shared Database Multi-Tenancy dengan Workshop ID scoping pada model `User`, `PartsInventory`, `ServicesCatalog`, dan `ServiceOrder`. Autentikasi real database via NextAuth yang mengaitkan sesi pengguna dengan `workshopId`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Prisma ORM 6, NextAuth.js.

**Spec:** `docs/superpowers/specs/2026-10-11-multi-bengkel-saas-design.md`

## Global Constraints
- Nama aplikasi konsisten "PitCare Auto".
- Dilarang menginstal library eksternal UI/icon baru (gunakan inline SVG murni dan class utility Tailwind CSS v4).
- Pertahankan kemampuan dual-mode database (Prisma Supabase PostgreSQL dan fallback in-memory) agar aplikasi tetap berjalan aman baik saat online maupun offline.
- TypeScript strict checking wajib 0 error (`npx.cmd tsc --noEmit`).
- Produksi build Next.js wajib exit code 0 (`npm.cmd run build`).

---

### Task 1: Skema Database & Dual-Mode Repositori Workshop
**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/db.ts`
- Modify: `lib/types/database.ts`

**Interfaces:**
- Produces: `Workshop` type, `db.workshop` methods (`create`, `findById`, `findBySlug`, `findMany`), `workshopId` on `User`, `PartsInventory`, `ServicesCatalog`, `ServiceOrder`.

- [ ] **Step 1: Update schema.prisma & types**
  Tambahkan model `Workshop`, perbarui `UserRole` dengan `OWNER`, dan tambahkan foreign key `workshopId` ke `User`, `PartsInventory`, `ServicesCatalog`, dan `ServiceOrder`.
- [ ] **Step 2: Generate Prisma Client**
  Jalankan `npx.cmd prisma generate` untuk memperbarui types.
- [ ] **Step 3: Update lib/types/database.ts & lib/db.ts**
  Tambahkan antarmuka `Workshop` dan implementasi `db.workshop` serta filter `workshopId` pada fungsi-fungsi repositori.
- [ ] **Step 4: Verifikasi kompilasi types**
  Jalankan `npx.cmd tsc --noEmit` untuk memastikan tidak ada type mismatch.
- [ ] **Step 5: Commit**
  `git add prisma/schema.prisma lib/types/database.ts lib/db.ts; git commit -m "feat(db): add Workshop model and tenant scoping to schema"`

---

### Task 2: Tindakan Server Registrasi Bengkel Baru & Template Layanan
**Files:**
- Create: `lib/actions/workshop.ts`
- Modify: `lib/db.ts`

**Interfaces:**
- Produces: `registerWorkshopAction(data: { workshopName, address, city, phone, ownerName, email, password })` yang membuat bengkel, akun owner, dan inisialisasi starter pack jasa/part.

- [ ] **Step 1: Buat lib/actions/workshop.ts**
  Implementasikan fungsi `registerWorkshopAction` lengkap dengan validasi input, pencegahan email ganda, pembentukan slug bengkel, dan inisialisasi paket servis dasar.
- [ ] **Step 2: Verifikasi eksekusi pendaftaran via tsx**
  Uji registrasi bengkel baru dengan script uji singkat untuk memastikan bengkel, user, dan catalog terbuat secara atomik.
- [ ] **Step 3: Commit**
  `git add lib/actions/workshop.ts; git commit -m "feat(actions): implement registerWorkshopAction with starter pack"`

---

### Task 3: Halaman Pendaftaran Bengkel Mandiri (`/register/workshop`)
**Files:**
- Create: `app/register/workshop/page.tsx`

**Interfaces:**
- Consumes: `registerWorkshopAction` dari `lib/actions/workshop.ts`
- Produces: UI formulir registrasi bengkel baru bergaya Linear.app dengan validasi interaktif.

- [ ] **Step 1: Buat UI app/register/workshop/page.tsx**
  Bangun halaman form yang bersih, memisahkan bagian Informasi Bengkel dan Akun Pemilik, lengkap dengan status loading dan pesan error/sukses.
- [ ] **Step 2: Hubungkan ke registerWorkshopAction**
  Saat pendaftaran berhasil, arahkan pengguna ke `/login` dengan notifikasi siap login.
- [ ] **Step 3: Commit**
  `git add app/register/workshop/page.tsx; git commit -m "feat(ui): add self-service workshop registration page"`

---

### Task 4: Pembersihan Total Halaman Login dari Akun Demo
**Files:**
- Modify: `app/login/page.tsx`
- Modify: `lib/auth.ts`

**Interfaces:**
- Consumes: Autentikasi real database
- Produces: Halaman login murni tanpa tombol dummy/demo.

- [ ] **Step 1: Bersihkan app/login/page.tsx**
  Hapus tombol-tombol demo ("Pak Joko", "Budi Santoso", "Coba Akun Demo Pelanggan") dan fungsi-fungsi `fillStaffAdmin`, `fillStaffMechanic`, `fillCustomerDemo`.
  Tambahkan tautan navigasi *"Pemilik Bengkel Baru? Daftarkan Bengkel Anda Sekarang"* menuju `/register/workshop`.
- [ ] **Step 2: Bersihkan lib/auth.ts**
  Pastikan autentikasi membaca akun riil dari database (termasuk role `OWNER`), dan sertakan `workshopId` serta `workshopName` ke dalam token JWT & NextAuth session.
- [ ] **Step 3: Commit**
  `git add app/login/page.tsx lib/auth.ts; git commit -m "refactor(auth): remove demo credentials and bind workshop session context"`

---

### Task 5: Dinamisasi Header, Sidebar, dan Konteks Bengkel Aktif
**Files:**
- Modify: `components/dashboard/header.tsx`
- Modify: `components/dashboard/sidebar.tsx`
- Modify: `app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `session.user.workshopName`, `session.user.role`
- Produces: Label identitas bengkel aktif di sidebar dan header ("PitCare Auto • [Nama Bengkel]").

- [ ] **Step 1: Perbarui components/dashboard/header.tsx & sidebar.tsx**
  Tampilkan nama bengkel spesifik yang sedang aktif serta role pengguna (Owner / Admin / Mekanik / Kasir).
- [ ] **Step 2: Tambahkan menu Kelola Staf Bengkel khusus Owner/Admin**
  Tambahkan navigasi menuju pengelolaan staf bengkel.
- [ ] **Step 3: Commit**
  `git add components/dashboard/header.tsx components/dashboard/sidebar.tsx app/(dashboard)/layout.tsx; git commit -m "feat(ui): display active workshop identity in dashboard layout"`

---

### Task 6: Manajemen Staf Khusus Bengkel Aktif (`/settings/staff`)
**Files:**
- Create: `app/(dashboard)/settings/staff/page.tsx`
- Modify: `lib/actions/auth.ts`

**Interfaces:**
- Produces: Halaman bagi Owner/Admin untuk menambah dan melihat staf (Mekanik & Kasir) yang terikat khusus ke bengkelnya.

- [ ] **Step 1: Perbarui lib/actions/auth.ts**
  Tambahkan fungsi `getWorkshopStaffAction(workshopId)` dan `createStaffMemberAction(data)` yang mengaitkan staf baru ke `workshopId`.
- [ ] **Step 2: Buat app/(dashboard)/settings/staff/page.tsx**
  Tabel daftar staf aktif dan modal "Tambah Staf Baru (Mekanik/Kasir)".
- [ ] **Step 3: Commit**
  `git add app/(dashboard)/settings/staff/page.tsx lib/actions/auth.ts; git commit -m "feat(staff): add workshop-scoped staff management"`

---

### Task 7: Verifikasi Menyeluruh & Build Produksi
**Files:**
- Seluruh file proyek

- [ ] **Step 1: Jalankan static check TypeScript**
  `npx.cmd tsc --noEmit` ➔ Wajib 0 error.
- [ ] **Step 2: Jalankan build produksi Next.js**
  `npm.cmd run build` ➔ Wajib exit code 0.
- [ ] **Step 3: Commit akhir dan Push ke GitHub**
  `git push origin main`
