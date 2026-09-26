# PitCare Auto — Enterprise Workshop Suite & Client Experience System

**PitCare Auto** adalah Sistem Informasi Manajemen Operasional Servis Bengkel & Portal Pelanggan Terintegrasi berbasis **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Prisma ORM**, dan **PostgreSQL Supabase**.

🌐 **Live Production URL:** [https://pitcareauto.vercel.app](https://pitcareauto.vercel.app)

---

## ✨ Fitur Utama Sistem

1. **Smart Service-to-Parts Recommendation & Odometer Lifespan Trigger**:
   - Rekomendasi otomatis komponen berdasarkan pemilihan paket servis (*Servis Rutin Ringan*, *Servis CVT*, *Servis Pengereman*).
   - Deteksi cerdas interval Odometer (`KM >= 24.000` untuk V-Belt & Oli, `KM >= 3.000` untuk Oli Mesin) disertai tombol **1-Klik Tambah ke SPK**.
2. **Dual-Portal Authentication (`/login`)**:
   - **Tab Masuk Staff Bengkel**: Login & registrasi staf internal (*Owner/Admin*, *Mekanik*, *Kasir*) via NextAuth & Supabase.
   - **Tab Cek Motor Saya (Portal Pelanggan)**: Login cepat tanpa password cukup dengan **Nomor WhatsApp + Nomor Plat Motor** menuju `/portal`.
3. **Fast / Slow Moving Analytics (Executive Dashboard)**:
   - Analisis tingkat perputaran pemakaian komponen (*Fast Moving* vs *Slow Moving*) beserta kontribusi omset pada Dashboard Manajer/Owner (`/dashboard`).
4. **Kasir POS & Cetak Struk Thermal (`/cashier`)**:
   - Perhitungan tagihan otomatis, diskon, kembalian, dan cetak struk thermal (58mm/80mm) maupun faktur A4.
5. **Automated WhatsApp Service Reminder (`/reminders`) & Live Service Tracking (`/track/[token]`)**:
   - Pengingat servis berkala 1-klik via WhatsApp Deep-Link dan pelacakan progres pengerjaan secara *real-time* bagi pelanggan.

---

## 📂 Struktur Folder Proyek (Clean Modular Architecture)

```text
pitcare-auto/
├── app/                          # Next.js 16 App Router
│   ├── (dashboard)/              # Rute Back-Office Internal Staf (Dilindungi Middleware)
│   │   ├── dashboard/            # Command Center, Omset & Fast/Slow Moving Analytics
│   │   ├── services/             # Daftar SPK, Form SPK Baru (/new) & Detail Pengerjaan (/[id])
│   │   ├── cashier/              # Kasir POS & Cetak Struk Thermal
│   │   ├── customers/            # Master Data Pelanggan & Armada Kendaraan
│   │   ├── inventory/services/   # Master Katalog Paket & Tindakan Jasa Servis
│   │   ├── reminders/            # Pengingat Servis Berkala via WhatsApp Deep-Link
│   │   └── layout.tsx            # Shell Navigasi Sidebar & Topbar Staf
│   ├── login/                    # Halaman Dual-Portal Login (Staf vs Cek Motor Saya)
│   ├── portal/                   # Portal Mandiri Pelanggan & Predictive Lifespan Tracker
│   ├── track/[token]/            # Live Service Tracking Publik Tanpa Login
│   ├── api/auth/[...nextauth]/   # Endpoint Autentikasi NextAuth.js
│   ├── globals.css               # Design System Tokens & Tailwind CSS v4
│   └── layout.tsx                # Root Layout Aplikasi
├── components/                   # Komponen UI Modular
│   ├── dashboard/                # Sidebar Navigasi & Header Halaman
│   └── ui/                       # Modal & Komponen Atomik
├── lib/                          # Business Logic & Data Access Layer
│   ├── actions/                  # Next.js Server Actions (Auth, Orders, Customers, Services)
│   ├── types/                    # Definisi Tipe Data TypeScript Strict
│   ├── auth.ts                   # Konfigurasi NextAuth.js & Supabase Authorize
│   ├── db.ts                     # Hybrid Data Layer (Prisma PostgreSQL Supabase)
│   └── prisma.ts                 # Singleton Prisma Client
├── prisma/                       # Skema & Seeder Database
│   ├── schema.prisma             # Skema Tabel Relasional PostgreSQL Supabase
│   └── seed.ts                   # Data Awal Operasional Bengkel
└── docs/                         # Dokumentasi Akademik, PRD, Logbook & Materi Presentasi
    ├── PRD.md                    # Product Requirement Document (v2.0.0)
    ├── logbook/                  # Logbook Progres Pengembangan Milestone 1–3
    ├── presentasi/               # Dokumen Laporan Bimbingan & Slide Presentasi
    └── assets/                   # Diagram Arsitektur & Flowchart SVG PitCare Auto
```

---

## 🚀 Cara Menjalankan secara Lokal

```bash
# 1. Install dependensi
npm install

# 2. Jalankan server development
npm run dev

# 3. Verifikasi tipe data TypeScript
npx tsc --noEmit
```
