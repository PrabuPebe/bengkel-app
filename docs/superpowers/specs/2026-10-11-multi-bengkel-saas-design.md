# Spesifikasi Desain: PitCare Auto Multi-Bengkel (Multi-Tenant SaaS) & Pembersihan Demo Akun

**Tanggal:** 11 Oktober 2026  
**Status:** Menunggu Review Pengguna (Design Review Gate)  
**Dokumen Referensi:** Superpowers Architectural Spec  

---

## 1. Latar Belakang & Tujuan
PitCare Auto bertransformasi dari aplikasi bengkel tunggal dengan akun demo menjadi **Platform Sistem Informasi Manajemen Servis Bengkel Multi-Tenant (Multi-Bengkel SaaS)** yang siap digunakan oleh berbagai bengkel secara mandiri di dunia nyata.

### Sasaran Utama:
1. **Pembersihan Total Elemen Dummy & Demo**:
   - Menghapus seluruh tombol demo ("Pak Joko", "Budi Santoso", "Coba Akun Demo Pelanggan") pada halaman login.
   - Menghapus ketergantungan kredensial hardcoded; autentikasi murni menggunakan data riil di database Supabase PostgreSQL (dengan fallback in-memory yang tersinkronisasi per bengkel).
2. **Arsitektur Multi-Bengkel (Multi-Tenant Shared Database)**:
   - Setiap bengkel memiliki identitas terpisah (`Workshop`).
   - Suku cadang (`PartsInventory`), katalog jasa (`ServicesCatalog`), SPK servis (`ServiceOrder`), dan staf (`User`) terisolasi per `workshopId`.
   - Data kendaraan (`Vehicle`) dan pelanggan (`Customer`) bersifat terbuka dalam ekosistem agar riwayat servis tetap bersambung jika pelanggan melakukan servis di bengkel rekanan yang berbeda.
3. **Pendaftaran Mandiri Pemilik Bengkel (Self-Service Onboarding)**:
   - Sediakan halaman pendaftaran bengkel baru (`/register/workshop`).
   - Sekali mendaftar, sistem otomatis membuat bengkel, akun Owner, serta menginisialisasi paket servis dasar dan suku cadang awal.
4. **Desain UI Profesional & User-Friendly (Linear.app Style)**:
   - Header dan Sidebar dinamis menampilkan nama bengkel aktif (`PitCare Auto • [Nama Bengkel Anda]`).
   - Tampilan bersih, kontras tinggi, hairline border, tanpa elemen mainan/dummy.

---

## 2. Model Data & Skema Database (`schema.prisma`)

### A. Model Baru: `Workshop`
```prisma
model Workshop {
  id        String   @id @default(cuid())
  name      String   // e.g. "Bengkel Maju Motor", "PitCare Auto Sleman"
  slug      String   @unique // e.g. "maju-motor"
  address   String?  // Alamat lengkap bengkel
  city      String?  // Kota/Kabupaten
  phone     String   // Nomor WhatsApp / kontak bengkel
  logoUrl   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users          User[]
  services       ServicesCatalog[]
  parts          PartsInventory[]
  serviceOrders  ServiceOrder[]

  @@map("workshops")
}
```

### B. Pembaruan Model Terkait:
- **`UserRole` Enum**: Ditambahkan `OWNER` (`OWNER`, `ADMIN`, `CASHIER`, `MECHANIC`).
- **`User` Model**:
  - Ditambahkan `workshopId String?` (Foreign key ke `Workshop`).
  - Relasi ke `Workshop`.
- **`PartsInventory` Model**:
  - Ditambahkan `workshopId String?` (Foreign key ke `Workshop`).
- **`ServicesCatalog` Model**:
  - Ditambahkan `workshopId String?` (Foreign key ke `Workshop`).
- **`ServiceOrder` Model**:
  - Ditambahkan `workshopId String?` (Foreign key ke `Workshop`).
- **`Customer` & `Vehicle`**:
  - Tetap terpusat dengan relasi ke `ServiceOrder`, sehingga saat pelanggan membuka portal `/portal`, pelanggan dapat melihat riwayat lengkap servis beserta label nama bengkel tempat pengerjaan.

---

## 3. Alur Autentikasi & Registrasi Multi-Bengkel

### A. Halaman `/login` (Tanpa Tombol Demo):
1. **Tab 1: Masuk Staf Bengkel**:
   - Input: Email & Password.
   - Tombol: "Masuk ke Sistem Bengkel".
   - Link Bawah: *"Pemilik Bengkel Baru? Daftarkan Bengkel Anda Sekarang"*.
2. **Tab 2: Cek Motor Saya (Portal Publik)**:
   - Input: No. WhatsApp & Plat Nomor Motor.
   - Tombol: "Cek Status & Riwayat Servis".
   - Keterangan: Pelanggan tidak memerlukan password.

### B. Halaman Baru: `/register/workshop` (Onboarding Bengkel Mandiri):
Formulir terbagi menjadi 2 bagian yang jelas:
1. **Informasi Bengkel**:
   - Nama Bengkel (contoh: "Bengkel Berkah Motor")
   - Kota / Wilayah (contoh: "Sleman, Yogyakarta")
   - Alamat Lengkap
   - Nomor WhatsApp Bengkel (untuk komunikasi pelanggan / cetak struk)
2. **Akun Pemilik (Owner)**:
   - Nama Lengkap Pemilik
   - Email Login Pemilik
   - Password (minimal 6 karakter)
3. **Inisialisasi Otomatis (Starter Pack)**:
   Saat registrasi berhasil, server action otomatis menyuntikkan template layanan dasar untuk bengkel baru tersebut:
   - Servis Rutin Ringan (Rp 45.000)
   - Servis CVT Lengkap (Rp 65.000)
   - Servis Sistem Pengereman (Rp 35.000)
   - Serta template stok suku cadang awal (Oli Mesin, Busi, Kampas Rem) agar bengkel bisa langsung beroperasi tanpa harus input dari nol.

### C. Manajemen Staf Bengkel (`/settings/staff` atau di Dashboard):
- Pemilik bengkel (Owner) dapat menambahkan akun untuk Mekanik dan Kasir khusus bengkel mereka dengan menentukan:
  - Nama Staf
  - Email Staf
  - Password
  - Peran (`MECHANIC` atau `CASHIER`)

---

## 4. Isolasi Data Sesi (Tenant Context)

1. **NextAuth Session & JWT**:
   - Menyimpan `workshopId`, `workshopName`, `workshopSlug`, dan `role`.
   - Mengambil data sesuai bengkel pengguna yang sedang login.
2. **Server Actions & Database Queries**:
   - Seluruh pemanggilan `db.partsInventory.findMany()`, `db.serviceOrder.findMany()`, dan `db.servicesCatalog.findMany()` otomatis menerapkan filter `workshopId` dari sesi pengguna aktif.
   - Mekanik atau Kasir dari Bengkel A tidak akan bisa melihat inventaris atau SPK milik Bengkel B.

---

## 5. Rencana Pengujian & Kriteria Keberhasilan (Acceptance Criteria)

1. **Verifikasi Bebas Demo**:
   - Halaman `/login` bersih 100% dari tombol-tombol demo.
2. **Pengujian Pendaftaran Bengkel Baru**:
   - Mendaftarkan bengkel baru (misal: "Bengkel Nusantara Motor") via `/register/workshop`.
   - Berhasil login sebagai Owner bengkel baru tersebut.
   - Dashboard menampilkan nama "Bengkel Nusantara Motor".
3. **Pengujian Isolasi Multi-Tenant**:
   - Tambah stok suku cadang di Bengkel A, pastikan Bengkel B tidak melihat stok tersebut.
   - Tambah SPK servis di Bengkel A, pastikan Bengkel B tidak melihat SPK tersebut.
4. **Pengujian Portal Pelanggan Publik**:
   - Masukkan Plat Motor dan WhatsApp, portal menampilkan riwayat servis lengkap dengan jelas mencantumkan nama bengkel tempat servis dilakukan.
5. **Kompilasi & Tipe Data**:
   - `npx.cmd tsc --noEmit` lolos 0 error.
   - `npm.cmd run build` lolos 100%.
