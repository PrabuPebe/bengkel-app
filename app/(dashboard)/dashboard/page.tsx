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
        title="Dashboard Operasional"
        subtitle="Pantau kapasitas pit servis, status pengerjaan teknisi, antrean billing kasir, dan ketersediaan stok suku cadang secara real-time."
        actionButton={
          <Link
            href="/services/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Buat SPK Baru
          </Link>
        }
      />

      {/* Low Stock Alert Banner */}
      {stats.lowStockCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-800">
                Peringatan Gudang: {stats.lowStockCount} suku cadang di bawah batas aman
              </h3>
              <p className="text-xs text-rose-600 mt-0.5">
                Segera lakukan restock agar tidak menghambat pengerjaan servis.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {stats.lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-rose-700 border border-rose-200 font-medium"
                  >
                    {item.name}: sisa <strong className="font-mono">{item.stock}</strong> {item.unit}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/inventory/parts"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shrink-0 text-center cursor-pointer"
          >
            Kelola Stok →
          </Link>
        </div>
      )}

      {/* 1. Operational Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operasional Servis & Kasir Real-time
            </h2>
          </div>
          <Link
            href="/services"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Lihat Semua SPK ↗
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Antrian Pit */}
          <Link
            href="/services"
            className="card card-hover p-5 block group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500">Antrian Pit</span>
              <div className="w-10 h-10 rounded-xl stat-icon-amber flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black font-mono text-slate-900">{stats.activeQueueCount}</p>
              <span className="badge badge-warning">Menunggu</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Unit di area registrasi pit</p>
          </Link>

          {/* Sedang Dikerjakan */}
          <Link
            href="/services"
            className="card card-hover p-5 block group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500">Sedang Dikerjakan</span>
              <div className="w-10 h-10 rounded-xl stat-icon-indigo flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black font-mono text-slate-900">{stats.inProgressCount}</p>
              <span className="badge badge-info">Aktif Pit</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Dalam penanganan teknisi</p>
          </Link>

          {/* Siap ke Kasir */}
          <Link
            href="/cashier"
            className="card card-hover p-5 block group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500">Siap Ditagih Kasir</span>
              <div className="w-10 h-10 rounded-xl stat-icon-emerald flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black font-mono text-emerald-700">{stats.readyForCashierCount}</p>
              <span className="badge badge-success">Selesai Servis</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Siap proses pembayaran</p>
          </Link>

          {/* Omzet */}
          <Link
            href="/cashier"
            className="card card-hover p-5 block group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500">Omzet Kasir</span>
              <div className="w-10 h-10 rounded-xl stat-icon-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-black font-mono text-slate-900 leading-tight">{formatRupiah(stats.todayRevenue)}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-slate-400">{stats.completedOrdersCount} faktur lunas</p>
              <span className="badge badge-success">100% Lunas</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 2. Master Data Metrics */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Master Data & Inventaris Gudang
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/customers" className="card card-hover p-5 block cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Pelanggan</span>
              <span className="badge badge-slate">Aktif</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-slate-900">{stats.totalCustomers}</p>
            <p className="text-[11px] text-slate-400 mt-1">Pemilik terdata di sistem</p>
          </Link>

          <Link href="/customers" className="card card-hover p-5 block cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Unit Kendaraan</span>
              <span className="badge badge-slate">Terdaftar</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-slate-900">{stats.totalVehicles}</p>
            <p className="text-[11px] text-slate-400 mt-1">Armada motor & mobil</p>
          </Link>

          <Link href="/inventory/services" className="card card-hover p-5 block cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Katalog Jasa</span>
              <span className="badge badge-slate">Paket</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-slate-900">{stats.totalServices}</p>
            <p className="text-[11px] text-slate-400 mt-1">Paket tindakan & standar tarif</p>
          </Link>

          <Link
            href="/inventory/parts"
            className={`card card-hover p-5 block cursor-pointer ${
              stats.lowStockCount > 0 ? "!border-rose-200 !bg-rose-50/50" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${stats.lowStockCount > 0 ? "text-rose-600" : "text-slate-500"}`}>
                Stok Suku Cadang
              </span>
              {stats.lowStockCount > 0 && (
                <span className="badge badge-danger animate-pulse">{stats.lowStockCount} Kritis</span>
              )}
            </div>
            <p className={`text-2xl font-extrabold font-mono ${stats.lowStockCount > 0 ? "text-rose-700" : "text-slate-900"}`}>
              {stats.totalParts} <span className="text-sm font-normal text-slate-400">SKU</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.lowStockCount > 0 ? "Perlu restock segera" : "Semua stok dalam batas aman"}
            </p>
          </Link>
        </div>
      </div>

      {/* 3. Quick Access Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            num: "01", color: "indigo",
            title: "Work Order Servis",
            desc: "Terbitkan SPK baru, perbarui status pengerjaan mekanik, dan kurangi stok suku cadang otomatis.",
            href: "/services",
            label: "Buka Modul Servis",
            iconBg: "bg-indigo-50 text-indigo-600",
          },
          {
            num: "02", color: "emerald",
            title: "Kasir & Billing",
            desc: "Penerimaan pembayaran tunai, transfer, dan QRIS, hitung diskon & kembalian, serta cetak nota struk resmi.",
            href: "/cashier",
            label: "Buka Modul Kasir",
            iconBg: "bg-emerald-50 text-emerald-600",
          },
          {
            num: "03", color: "blue",
            title: "Pelanggan & Unit",
            desc: "Database nomor kontak WhatsApp pelanggan dan relasi kepemilikan banyak armada kendaraan.",
            href: "/customers",
            label: "Buka Data Pelanggan",
            iconBg: "bg-blue-50 text-blue-600",
          },
          {
            num: "04", color: "purple",
            title: "Live Service Tracking",
            desc: "Halaman publik mobile tanpa login bagi pelanggan untuk melacak transparansi servis kendaraannya secara live.",
            href: "/track/trk-vario160-budi",
            label: "Buka Tracking Publik",
            iconBg: "bg-violet-50 text-violet-600",
          },
        ].map((mod) => (
          <div key={mod.num} className="card p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
            <div>
              <div className={`w-9 h-9 rounded-xl ${mod.iconBg} flex items-center justify-center font-black text-xs mb-3`}>
                {mod.num}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{mod.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{mod.desc}</p>
            </div>
            <Link
              href={mod.href}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold text-${mod.color}-600 hover:text-${mod.color}-700 transition-colors cursor-pointer`}
            >
              {mod.label} <span>→</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
