# 📋 Logbook Bimbingan Proyek — Bengkelku

| Informasi | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Bengkelku (Sistem Manajemen Operasional Bengkel Modern) |
| **Nama Mahasiswa** | Prabu Pebe |
| **NIM** | [NIM Mahasiswa] |
| **Dosen Pembimbing** | [Dosen Pembimbing] |
| **Periode / Milestone** | **Milestone 2**: Desain Basis Data Relasional, Skema Prisma PostgreSQL, & CRUD Master Data |
| **Status Milestone** | 🟢 **Selesai (Completed & 100% Tested)** |
| **Repositori & Deploy** | GitHub: `PrabuPebe/bengkel-app` \| Database: PostgreSQL (Supabase/Neon) |

---

## 1. 🎯 Tujuan & Target Milestone 2
Menyusun arsitektur basis data relasional yang skalabel dan mengimplementasikan modul pengelolaan data master (*Customer*, *Fleet Vehicles*, *Service Catalog*, dan *Inventory Parts*):
1. Merancang skema relasional terstandarisasi di Prisma ORM untuk engine database PostgreSQL.
2. Membangun modul manajemen Pelanggan & Relasi Kendaraan (*One-to-Many*: 1 Customer dapat memiliki banyak armada mobil/motor).
3. Membangun katalog layanan jasa servis dengan estimasi durasi dan kategori tindakan.
4. Membangun modul inventaris gudang suku cadang dengan sistem deteksi stok kritis otomatis (*Low Stock Warning Threshold*).
5. Memastikan seluruh Server Actions terintegrasi dengan validasi tipe TypeScript dan lolos pengujian build produksi 100%.

---

## 2. 🚀 Realisasi Capaian Pekerjaan

### A. Skema Basis Data (Prisma ORM)
Ditetapkan 7 entitas utama dengan integritas referensial:
- **`Customer`**: Menyimpan identitas pelanggan (Nama, Nomor WhatsApp aktif untuk notifikasi tracking, Alamat).
- **`Vehicle`**: Menyimpan armada (Nomor Polisi/Plat Nomor, Merek, Model, Tahun) berelasi dengan `Customer`.
- **`Service`**: Katalog paket jasa (Nama Tindakan, Kode, Kategori, Tarif/Harga, Estimasi Menit).
- **`Part`**: Inventaris suku cadang (Nama Part, SKU, Kategori, Harga Beli/Jual, Stok Saat Ini, `minStock` threshold, Satuan/Unit).
- **`ServiceOrder` & `OrderItem`**: Surat Perintah Kerja (SPK) dan rincian pemakaian jasa & suku cadang.
- **`Transaction`**: Bukti penagihan dan pencatatan pembayaran POS (Tunai, Transfer, QRIS).

### B. Modul & Antarmuka yang Diselesaikan
| Modul / Halaman | Path File | Fitur Utama |
| :--- | :--- | :--- |
| **Pelanggan & Armada** | `app/(dashboard)/customers/page.tsx` | Tabel data pelanggan, badge plat nomor `font-mono`, pencarian cepat, modal tambah pelanggan & kendaraan baru. |
| **Katalog Jasa Servis** | `app/(dashboard)/inventory/services/page.tsx` | Daftar paket jasa bengkel, kategori perbaikan, badge estimasi waktu, modal penambahan & edit tarif jasa. |
| **Stok Suku Cadang** | `app/(dashboard)/inventory/parts/page.tsx` | Katalog part gudang, indikator stok real-time, badge `.badge-stok-kritis animate-pulse` untuk part di bawah `minStock`. |
| **Dashboard Metrik Terpadu** | `app/(dashboard)/dashboard/page.tsx` | Counter dinamis total pelanggan, armada kendaraan, paket jasa, dan peringatan *Low Stock Alert Banner* di bagian atas. |
| **Server Actions & DB Layer** | `lib/db.ts`, `lib/actions/inventory.ts`, `lib/actions/customers.ts` | Operasi transactional aman Prisma, agregasi statistik, dan revalidasi cache Next.js (`revalidatePath`). |

---

## 3. 🛠️ Kendala Teknis & Solusi

| No | Kendala yang Dihadapi | Akar Masalah | Solusi & Penanganan |
| :---: | :--- | :--- | :--- |
| 1 | Koneksi Pooling PostgreSQL pada lingkungan serverless | Beban koneksi pool cepat habis saat multiple server action dieksekusi bersamaan | Menggunakan singleton pattern pada Prisma Client (`globalForPrisma.prisma`) di `lib/db.ts` dan konfigurasi PgBouncer connection string. |
| 2 | Deteksi Stok Kritis Suku Cadang | Stok habis sering tidak terpantau sebelum mekanik mengerjakan unit | Mengimplementasikan komparasi logis `stock <= minStock` di database layer dan merender alert banner khusus di dashboard dengan CTA langsung ke gudang. |
| 3 | Perbedaan penanganan input angka/mata uang | Format Rupiah rawan salah parsing saat submit form | Menggunakan normalisasi parsing `Number(price.replace(/[^0-9]/g, ""))` dan formatter terpusat `Intl.NumberFormat('id-ID', { currency: 'IDR' })`. |

---

## 4. ✅ Bukti Verifikasi & Pengujian Mutu

```bash
# 1. Generate Prisma Client
$ npx prisma generate
✔ Generated Prisma Client to ./node_modules/@prisma/client

# 2. Verifikasi tipe TypeScript antar-relasi Prisma
$ npx tsc --noEmit
Exit Code: 0 (0 errors, valid interface types)

# 3. Pengujian Build Produksi Next.js
$ npm run build
✓ Compiled successfully
✓ Generating static pages using 7 workers (11/11)
✓ Route (app):
  ├ ○ /customers
  ├ ƒ /dashboard
  ├ ○ /inventory/parts
  └ ○ /inventory/services
Exit Code: 0 (Semua modul terkompilasi optimal)
```

---

## 5. 📅 Rencana Kerja Milestone 3
- [ ] Implementasi alur Surat Perintah Kerja (SPK) Servis lengkap (`/services` & `/services/new`).
- [ ] Pipeline stepper status servis 4-tahap (Antrian ➔ Pengerjaan ➔ Selesai Servis ➔ Faktur Lunas).
- [ ] Modul Kasir POS (`/cashier` & `/cashier/[id]`) dengan hitung kembalian cepat dan cetak struk termal.
- [ ] Halaman Live Service Tracking publik berbasis token (`/track/[token]`) yang mobile-friendly bagi pemilik kendaraan.
