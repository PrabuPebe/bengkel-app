import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const stats = await db.getStats();

  return (
    <div>
      <Header
        title="Ringkasan Operasional Bengkel"
        subtitle="Pantau kapasitas master data pelanggan, armada kendaraan, katalog jasa, dan ketersediaan suku cadang."
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Pelanggan */}
        <Link
          href="/customers"
          className="p-5 rounded-2xl bg-[#221939]/90 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
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
          className="p-5 rounded-2xl bg-[#221939]/90 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
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
          className="p-5 rounded-2xl bg-[#221939]/90 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/30 group block"
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
              : "bg-[#221939]/90 border-[#d2b8ff]/15 hover:border-[#9b6cff]/50"
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

      {/* Low Stock Alert Banner (jika ada part di bawah minStock) */}
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
                Segera lakukan pemesanan ulang (restock) agar proses servis di Milestone 3 tidak terhambat.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <div className="w-10 h-10 rounded-xl bg-[#2e2150] text-[#c49eff] flex items-center justify-center font-bold text-sm mb-4">
            01
          </div>
          <h2 className="text-lg font-bold text-[#f6f2ff] mb-1">
            Master Pelanggan & Kendaraan
          </h2>
          <p className="text-xs text-[#b5abc9] mb-4 leading-relaxed">
            Kelola buku data pelanggan tetap, nomor kontak WhatsApp, dan hubungan relasi kepemilikan banyak kendaraan.
          </p>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c49eff] hover:text-white transition-colors"
          >
            Buka Modul Pelanggan <span>→</span>
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <div className="w-10 h-10 rounded-xl bg-[#2e2150] text-[#c49eff] flex items-center justify-center font-bold text-sm mb-4">
            02
          </div>
          <h2 className="text-lg font-bold text-[#f6f2ff] mb-1">
            Katalog Jasa & Tarif Servis
          </h2>
          <p className="text-xs text-[#b5abc9] mb-4 leading-relaxed">
            Daftar paket perbaikan, tune up, ganti oli, pembersihan CVT, beserta durasi pengerjaan dan harga standar bengkel.
          </p>
          <Link
            href="/inventory/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c49eff] hover:text-white transition-colors"
          >
            Buka Katalog Jasa <span>→</span>
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <div className="w-10 h-10 rounded-xl bg-[#2e2150] text-[#c49eff] flex items-center justify-center font-bold text-sm mb-4">
            03
          </div>
          <h2 className="text-lg font-bold text-[#f6f2ff] mb-1">
            Inventaris Suku Cadang (Part)
          </h2>
          <p className="text-xs text-[#b5abc9] mb-4 leading-relaxed">
            Kontrol stok barang, HPP, harga jual, margin keuntungan, dan sistem deteksi peringatan stok kritis otomatis.
          </p>
          <Link
            href="/inventory/parts"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c49eff] hover:text-white transition-colors"
          >
            Buka Stok Suku Cadang <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
