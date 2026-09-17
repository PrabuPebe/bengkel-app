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
    <div className="space-y-8">
      <Header
        title="Ringkasan Operasional Bengkel"
        subtitle="Pantau kapasitas pit servis, status pengerjaan teknisi, antrean billing kasir, dan ketersediaan stok suku cadang secara terpadu."
        actionButton={
          <Link
            href="/services/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Buat SPK Baru
          </Link>
        }
      />

      {/* 1. Operational Real-time Pit & Cashier Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Operasional Servis & Kasir Real-time
            </h2>
          </div>
          <Link
            href="/services"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Lihat Semua SPK ↗
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Antrian Pit */}
          <Link
            href="/services"
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">Antrian Pit</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.activeQueueCount}</p>
            <p className="text-[11px] text-amber-400/90 mt-1 font-medium">Unit menunggu giliran pit</p>
          </Link>

          {/* Sedang Dikerjakan */}
          <Link
            href="/services"
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">Sedang Dikerjakan</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.inProgressCount}</p>
            <p className="text-[11px] text-blue-400/90 mt-1 font-medium">Aktif ditangani teknisi</p>
          </Link>

          {/* Siap ke Kasir */}
          <Link
            href="/cashier"
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">Siap ke Kasir</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-400">{stats.readyForCashierCount}</p>
            <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">Servis tuntas & siap bayar</p>
          </Link>

          {/* Omzet Transaksi */}
          <Link
            href="/cashier"
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">Omzet Transaksi</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-black text-white">{formatRupiah(stats.todayRevenue)}</p>
            <p className="text-[11px] text-indigo-300 mt-1 font-medium">{stats.completedOrdersCount} transaksi faktur lunas</p>
          </Link>
        </div>
      </div>

      {/* 2. Master Data & Inventory Metrics */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Master Data & Inventaris Gudang
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/customers"
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all block group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Total Pelanggan</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">Aktif</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{stats.totalCustomers}</p>
            <p className="text-[11px] text-slate-400 mt-1">Pemilik terdata di sistem</p>
          </Link>

          <Link
            href="/customers"
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all block group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Unit Kendaraan</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">Terdaftar</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{stats.totalVehicles}</p>
            <p className="text-[11px] text-slate-400 mt-1">Motor & mobil pelanggan</p>
          </Link>

          <Link
            href="/inventory/services"
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all block group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Katalog Jasa</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">Paket</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{stats.totalServices}</p>
            <p className="text-[11px] text-slate-400 mt-1">Paket tindakan & tarif</p>
          </Link>

          <Link
            href="/inventory/parts"
            className={`p-5 rounded-2xl border transition-all block group ${
              stats.lowStockCount > 0
                ? "bg-rose-950/20 border-rose-800/40 hover:border-rose-700"
                : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${stats.lowStockCount > 0 ? "text-rose-300" : "text-slate-400"}`}>
                Stok Suku Cadang
              </span>
              {stats.lowStockCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 font-bold">
                  {stats.lowStockCount} Kritis
                </span>
              )}
            </div>
            <p className={`text-2xl font-extrabold ${stats.lowStockCount > 0 ? "text-rose-300" : "text-white"}`}>
              {stats.totalParts} <span className="text-sm font-normal text-slate-400">SKU</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.lowStockCount > 0 ? "Perlu segera restock gudang" : "Semua stok aman"}
            </p>
          </Link>
        </div>
      </div>

      {/* 3. Low Stock Alert Banner */}
      {stats.lowStockCount > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-800/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-900/50 border border-rose-700/50 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Peringatan Gudang: Ada {stats.lowStockCount} suku cadang yang stoknya berada di bawah batas aman!
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Segera lakukan pengadaan kembali (restock) agar tidak menghambat pengerjaan servis pit pelanggan.
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {stats.lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-rose-300 border border-rose-800/40 font-medium"
                  >
                    {item.name}: sisa <strong className="text-white">{item.stock}</strong> {item.unit} (Min: {item.minStock})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/inventory/parts"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-all shrink-0 text-center"
          >
            Kelola Stok Suku Cadang →
          </Link>
        </div>
      )}

      {/* 4. Quick Access Module Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs mb-3">
              01
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Work Order Servis
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Terbitkan SPK baru, perbarui status pengerjaan mekanik, dan kurangi stok suku cadang otomatis.
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Buka Modul Servis <span>→</span>
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
              02
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Kasir & Billing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Penerimaan pembayaran tunai, transfer, dan QRIS, hitung diskon & kembalian, serta cetak nota struk resmi.
            </p>
          </div>
          <Link
            href="/cashier"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Buka Modul Kasir <span>→</span>
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-3">
              03
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Pelanggan & Unit
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Database nomor kontak WhatsApp pelanggan dan relasi kepemilikan banyak armada kendaraan.
            </p>
          </div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Buka Data Pelanggan <span>→</span>
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-3">
              04
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Live Service Tracking
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Halaman publik mobile tanpa login bagi pelanggan untuk melacak transparansi servis kendaraannya secara live.
            </p>
          </div>
          <Link
            href="/track/trk-vario160-budi"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Buka Tracking Publik <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
