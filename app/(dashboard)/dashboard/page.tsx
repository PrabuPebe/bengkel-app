import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardOverviewPage() {
  const stats = await db.getStats();

  return (
    <div>
      <Header
        title="Ringkasan Operasional Bengkel"
        subtitle="Pantau kapasitas bengkel, alur kerja pit servis, antrean kasir & billing, serta ketersediaan stok inventaris."
      />

      {/* Operasional Servis & Kasir (Milestone 3 Live Metrics) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#c49eff] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Operasional Servis & Kasir Hari Ini
          </h2>
          <Link
            href="/services/new"
            className="text-xs font-bold text-[#8f63ec] hover:text-[#a477f3] transition-colors"
          >
            + Buat SPK Baru ↗
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Antrian Pit */}
          <Link
            href="/services"
            className="p-5 rounded-2xl bg-[#221939]/90 border border-[#d2b8ff]/15 hover:border-amber-500/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Antrian Servis Pit
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-400">{stats.activeQueueCount}</p>
            <p className="text-xs text-[#817797] mt-1">Kendaraan menunggu giliran</p>
          </Link>

          {/* Sedang Dikerjakan */}
          <Link
            href="/services"
            className="p-5 rounded-2xl bg-[#221939]/90 border border-[#d2b8ff]/15 hover:border-sky-500/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                Sedang Dikerjakan
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-black transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-sky-400">{stats.inProgressCount}</p>
            <p className="text-xs text-[#817797] mt-1">Aktif diperbaiki mekanik</p>
          </Link>

          {/* Siap Bayar di Kasir */}
          <Link
            href="/cashier"
            className="p-5 rounded-2xl bg-[#221939]/90 border border-[#d2b8ff]/15 hover:border-emerald-500/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Siap ke Kasir
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">{stats.readyForCashierCount}</p>
            <p className="text-xs text-[#817797] mt-1">Servis tuntas & menunggu bayar</p>
          </Link>

          {/* Omzet Transaksi Kasir */}
          <Link
            href="/cashier"
            className="p-5 rounded-2xl bg-[#221939]/90 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c49eff]">
                Omzet Terkumpul
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#2e2150] text-[#a477f3] flex items-center justify-center group-hover:bg-[#9b6cff] group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#f6f2ff]">{formatRupiah(stats.todayRevenue)}</p>
            <p className="text-xs text-[#817797] mt-1">{stats.completedOrdersCount} transaksi faktur lunas</p>
          </Link>
        </div>
      </div>

      {/* Master Data Metrics Grid */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#817797] mb-3">
          Master Data & Inventaris
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pelanggan */}
          <Link
            href="/customers"
            className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c49eff]">
                Pelanggan
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#2e2150] text-[#a477f3] flex items-center justify-center group-hover:bg-[#9b6cff] group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#f6f2ff]">{stats.totalCustomers}</p>
            <p className="text-xs text-[#817797] mt-1">Pelanggan terdaftar aktif</p>
          </Link>

          {/* Total Kendaraan */}
          <Link
            href="/customers"
            className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c49eff]">
                Kendaraan
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#2e2150] text-[#a477f3] flex items-center justify-center group-hover:bg-[#9b6cff] group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#f6f2ff]">{stats.totalVehicles}</p>
            <p className="text-xs text-[#817797] mt-1">Unit motor & mobil terdata</p>
          </Link>

          {/* Katalog Jasa */}
          <Link
            href="/inventory/services"
            className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c49eff]">
                Katalog Jasa
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#2e2150] text-[#a477f3] flex items-center justify-center group-hover:bg-[#9b6cff] group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#f6f2ff]">{stats.totalServices}</p>
            <p className="text-xs text-[#817797] mt-1">Paket servis siap dipilih</p>
          </Link>

          {/* Peringatan Stok Menipis */}
          <Link
            href="/inventory/parts"
            className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block ${
              stats.lowStockCount > 0
                ? "bg-[#381624]/80 border-[#ff7b92]/40 hover:border-[#ff4d6d]"
                : "bg-[#221939]/80 border-[#d2b8ff]/15 hover:border-[#9b6cff]/50"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${stats.lowStockCount > 0 ? "text-[#ff8da1]" : "text-[#c49eff]"}`}>
                Stok Menipis
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                stats.lowStockCount > 0
                  ? "bg-[#5e1d34] text-[#ff8da1] group-hover:bg-[#ff4d6d] group-hover:text-white"
                  : "bg-[#2e2150] text-[#a477f3]"
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <p className={`text-3xl font-extrabold ${stats.lowStockCount > 0 ? "text-[#ff8da1]" : "text-[#f6f2ff]"}`}>
              {stats.lowStockCount}
            </p>
            <p className="text-xs text-[#817797] mt-1">
              {stats.lowStockCount > 0 ? "Suku cadang butuh restock" : "Semua stok di atas batas minimum"}
            </p>
          </Link>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {stats.lowStockCount > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-[#2a1322] border border-[#ff7b92]/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#5e1d34] text-[#ff8da1] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f6f2ff]">
                Peringatan Inventaris: Ada {stats.lowStockCount} suku cadang yang stoknya berada di bawah batas minimum!
              </h3>
              <p className="text-xs text-[#d8c2ce] mt-0.5">
                Segera lakukan pemesanan ulang (restock) agar proses pengerjaan servis tidak terhambat.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {stats.lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-[#42162a] text-[#ffb0c0] border border-[#ff7b92]/30 font-medium"
                  >
                    {item.name}: Sisa {item.stock} {item.unit} (Min: {item.minStock})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/inventory/parts"
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#fff] bg-[#9b2c4d] hover:bg-[#b8355c] transition-colors shrink-0 text-center"
          >
            Kelola Stok Suku Cadang →
          </Link>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-[#2e2150] text-[#c49eff] flex items-center justify-center font-bold text-xs mb-3">
              01
            </div>
            <h3 className="text-base font-bold text-[#f6f2ff] mb-1">
              Work Order Servis
            </h3>
            <p className="text-xs text-[#b5abc9] mb-4 leading-relaxed">
              Pantau antrian pit, perbarui status pengerjaan mekanik, dan catat pemakaian sparepart otomatis.
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c49eff] hover:text-white transition-colors"
          >
            Buka Work Order <span>→</span>
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-[#2e2150] text-[#c49eff] flex items-center justify-center font-bold text-xs mb-3">
              02
            </div>
            <h3 className="text-base font-bold text-[#f6f2ff] mb-1">
              Kasir & Billing
            </h3>
            <p className="text-xs text-[#b5abc9] mb-4 leading-relaxed">
              Proses pembayaran tunai, transfer, dan QRIS, hitung kembalian, serta cetak struk nota resmi.
            </p>
          </div>
          <Link
            href="/cashier"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c49eff] hover:text-white transition-colors"
          >
            Buka Kasir & Billing <span>→</span>
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-[#2e2150] text-[#c49eff] flex items-center justify-center font-bold text-xs mb-3">
              03
            </div>
            <h3 className="text-base font-bold text-[#f6f2ff] mb-1">
              Pelanggan & Kendaraan
            </h3>
            <p className="text-xs text-[#b5abc9] mb-4 leading-relaxed">
              Database nomor kontak WhatsApp pelanggan dan relasi kepemilikan banyak armada kendaraan.
            </p>
          </div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c49eff] hover:text-white transition-colors"
          >
            Buka Data Pelanggan <span>→</span>
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-[#2e2150] text-[#c49eff] flex items-center justify-center font-bold text-xs mb-3">
              04
            </div>
            <h3 className="text-base font-bold text-[#f6f2ff] mb-1">
              Katalog & Suku Cadang
            </h3>
            <p className="text-xs text-[#b5abc9] mb-4 leading-relaxed">
              Daftar tarif jasa bengkel, stok barang gudang, dan sistem peringatan stok kritis otomatis.
            </p>
          </div>
          <Link
            href="/inventory/parts"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c49eff] hover:text-white transition-colors"
          >
            Buka Inventaris <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
