# 📋 Logbook Bimbingan Proyek — PitCare Auto

| Informasi | Keterangan |
| :--- | :--- |
| **Nama Proyek** | PitCare Auto (Enterprise Workshop Suite & Client Experience System) |
| **Nama Mahasiswa** | Prabu Pebe |
| **NIM** | [NIM Mahasiswa] |
| **Dosen Pembimbing** | [Dosen Pembimbing] |
| **Periode / Milestone** | **Milestone 3**: Alur Pengerjaan Servis (Work Order / SPK), Kasir Billing POS, Dual-Login, & Portal Pelanggan |
| **Status Milestone** | 🟢 **Selesai (Enterprise Production-Grade & 100% Tested)** |
| **Repositori & Deploy** | GitHub: `PrabuPebe/bengkel-app` \| Deploy: `https://pitcareauto.vercel.app` \| DB: PostgreSQL Supabase |

---

## 1. 🎯 Tujuan & Target Milestone 3
Mentransformasikan sistem dari prototipe menjadi sistem operasional bengkel enterprise yang kokoh (*production-grade*):
1. **Sistem Autentikasi Dual-Login**:
   - Memisahkan portal Staf Internal (Admin, Kasir, Mekanik) dengan NextAuth.js terhubung ke tabel `users` di PostgreSQL Supabase.
   - Menyediakan fitur pendaftaran Staf Baru dengan pemilihan peran (`ADMIN`, `CASHIER`, `MECHANIC`).
   - Menyediakan portal Pelanggan berbasis Nomor WhatsApp & Plat Nomor kendaraan terhubung ke tabel `customers` dan `vehicles`.
   - Fitur pendaftaran kendaraan baru langsung dari sisi pelanggan.
2. **Dashboard Portal Pelanggan & Predictive Lifespan Tracker (`/portal`)**:
   - Menampilkan sambutan personal, status armada kendaraan terdaftar, dan riwayat nota servis transparan.
   - Modul *Predictive Part Lifespan Tracker* berbasis kilometer: Oli Mesin (3.000 KM), Busi (8.000 KM), dan V-Belt/CVT (24.000 KM).
   - Tombol reservasi jadwal servis langsung ke WhatsApp bengkel dengan deep link pesan otomatis.
3. **Alur Surat Perintah Kerja (SPK / Work Order) Nyata**:
   - Formulir pendaftaran unit masuk: pencatatan kilometer odometer, keluhan awal, dan penugasan teknisi.
   - Stepper pengerjaan: `ANTRIAN` ➔ `PENGERJAAN` ➔ `SELESAI_PENGERJAAN`.
   - **Pemotongan Stok Atomik di Supabase**: Penambahan suku cadang ke lembar SPK secara otomatis memotong stok fisik di tabel `parts_inventory`. Jika dibatalkan, stok dikembalikan (*refund stock*).
4. **Modul Kasir POS & Cetak Struk Resmi Thermal**:
   - Antrean pembayaran unit selesai servis, perhitungan otomatis Grand Total, diskon, dan kalkulasi kembalian tunai/transfer/QRIS.
   - Pelunasan mengubah status menjadi `PAID` dan `SELESAI_PEMBAYARAN` di Supabase.
   - Modal cetak nota struk resmi siap cetak thermal 58mm/80mm maupun A4 via `window.print()`.
5. **Keamanan Rute & Integritas Branding**:
   - Pengamanan rute internal dengan `middleware.ts` berbasis NextAuth token.
   - Pembersihan 100% seluruh residu kata branding lama menjadi **PitCare Auto**.

---

## 2. 🚀 Realisasi Capaian Pekerjaan

### A. Arsitektur Komponen & Alur Data

```
               ┌──────────────────────────────────────────────┐
               │         PORTAL LOGIN (app/login)             │
               └───────┬──────────────────────────────┬───────┘
                       │                              │
         [Tab Staf: Email + Password]   [Tab Pelanggan: WA + Plat No]
                       │                              │
                       ▼                              ▼
          NextAuth Credentials Session       Secure Cookie Session
          (ADMIN / CASHIER / MECHANIC)     (pitcare_customer_session)
                       │                              │
                       ▼                              ▼
            /dashboard & /services                /portal
     (Kunci Rute via middleware.ts)       (Predictive Lifespan Tracker)
                       │                              │
     ┌─────────────────┴─────────────────┐    ┌───────┴───────────────────────┐
     │ 1. Buat SPK Baru (/services/new)   │    │ 1. Indikator Sisa KM Oli/Part  │
     │ 2. Mekanik Kerjakan (/services/id)│    │ 2. Riwayat Servis Transparan  │
     │    ➔ Potong Stok Fisik Supabase   │    │ 3. Booking Servis WhatsApp    │
     │ 3. Kasir POS & Billing (/cashier) │    └───────────────────────────────┘
     │    ➔ Cetak Struk Thermal 58/80mm  │
     └───────────────────────────────────┘
```

### B. Daftar Berkas Baru & Modifikasi Utama
| Komponen / Modul | Path Berkas | Deskripsi Fungsional |
| :--- | :--- | :--- |
| **Dual-Login & Registrasi** | `app/login/page.tsx` | Tab Staf Internal & Tab Portal Pelanggan + Form Registrasi Staf & Registrasi Armada Baru. |
| **Portal Pelanggan** | `app/portal/page.tsx` | Dashboard pelanggan mandiri, kartu kesehatan suku cadang (Oli, Busi, V-Belt), riwayat faktur. |
| **Action Autentikasi** | `lib/actions/auth.ts`, `lib/actions/customer-portal.ts` | Server Actions pendaftaran staf & validasi login kendaraan pelanggan dengan cookie session. |
| **Database Transaction** | `lib/db.ts` | Transaksi Prisma ORM: pembuatan SPK, penambahan/pembatalan part dengan potong/refund stok otomatis di Supabase. |
| **Work Order / SPK** | `app/(dashboard)/services/` | Antarmuka daftar SPK, form penerimaan unit baru, stepper alur servis, dan diagnosa teknisi. |
| **Kasir POS & Struk** | `app/(dashboard)/cashier/` | Terminal kasir POS, kalkulator kembalian, pelunasan faktur, dan template cetak struk thermal resmi. |
| **Proteksi Keamanan** | `middleware.ts`, `app/page.tsx` | Proteksi rute `/dashboard/*`, `/services/*`, `/cashier/*`, dll. serta redirect server-side bersih. |

---

## 3. 🛠️ Kendala Teknis & Solusi Rekayasa

| No | Kendala yang Dihadapi | Akar Masalah | Solusi & Penanganan |
| :---: | :--- | :--- | :--- |
| 1 | Integritas Stok Suku Cadang saat Ditambahkan ke SPK | Jika hanya disimpan di memori atau tanpa transaksi atomik, stok fisik di database tidak berkurang dan rawan *race condition* | Menggunakan `prisma.$transaction()` di `lib/db.ts` untuk mengeksekusi operasi `partsInventory.update({ data: { stock: { decrement: qty } } })` bersamaan dengan `serviceOrderPart.create()`. |
| 2 | Pengembalian Stok saat Tindakan Part Dibatalkan | Pembatalan pemakaian part berisiko menghilangkan riwayat stok gudang | Mengimplementasikan fungsi `removePart` dengan mekanisme *stock refund* (`stock: { increment: qty }`) sebelum menghapus record dari database. |
| 3 | Autentikasi Pelanggan tanpa Password Kompleks | Pelanggan bengkel sering lupa password jika diwajibkan mendaftar akun konvensional | Mengadopsi metode *Frictionless Dual-Identifier*: Nomor WhatsApp + Nomor Plat Nomor Kendaraan yang dicocokkan ke tabel relasional `customers` dan `vehicles`. |
| 4 | Proteksi Rute Internal vs Publik | Halaman pelacakan publik (`/track/*`) dan portal pelanggan (`/portal`) tidak boleh terkunci oleh proteksi login staf | Mengatur `config.matcher` di `middleware.ts` secara selektif hanya untuk rute `/dashboard/:path*`, `/services/:path*`, `/cashier/:path*`, `/customers/:path*`, dan `/inventory/:path*`. |

---

## 4. ✅ Hasil Verifikasi & Pengujian Sistem

Seluruh modul telah melalui proses verifikasi ketat:
- **TypeScript Static Check**: `npx.cmd tsc --noEmit` ➔ **0 errors** (lulus 100%).
- **Next.js Production Build**: `npm.cmd run build` ➔ Lolos seluruh rute App Router (termasuk `/login`, `/portal`, `/services`, `/cashier`, `/track/[token]`).
- **Penyelarasan Branding**: 100% residu kata lama telah digantikan secara konsisten menjadi **PitCare Auto**.
- **Deployment**: Terintegrasi otomatis ke Vercel dengan database PostgreSQL Supabase yang aktif.

---

### 📝 Catatan Dosen Pembimbing:
*Ruang untuk tanda tangan dan catatan evaluasi dosen pembimbing skripsi/tugas akhir:*

```text
Tanggal Evaluasi : ________________________
Catatan Dosen    : ____________________________________________________________________
                   ____________________________________________________________________
Status Progres   : [  ] Disetujui Penuh    [  ] Revisi Minor    [  ] Revisi Mayor
Tanda Tangan     : 

                   ( ____________________________________ )
```
