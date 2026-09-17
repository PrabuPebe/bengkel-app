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
            className="btn-cyan flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            + Buat SPK Baru
          </Link>
        }
      />

      {/* Low Stock Alert Banner */}
      {stats.lowStockCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 shadow-xl shadow-rose-950/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-200 flex items-center gap-2">
                <span>Peringatan Gudang:</span>
                <span className="font-mono text-rose-400">{stats.lowStockCount} Suku Cadang Kritis</span>
              </h3>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Segera lakukan restock agar tidak menghambat alur pengerjaan servis di pit.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {stats.lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-900/60 text-rose-200 border border-rose-500/40 font-medium"
                  >
                    {item.name}: sisa <strong className="font-mono font-bold text-rose-400">{item.stock}</strong> {item.unit}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/inventory/parts"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shrink-0 text-center cursor-pointer shadow-lg shadow-rose-900/40"
          >
            Kelola Stok Gudang →
          </Link>
        </div>
      )}

      {/* 1. Operational Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] shadow-[0_0_8px_#00D2FF] animate-pulse" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Operasional Servis & Kasir Real-time
            </h2>
          </div>
          <Link
            href="/services"
            className="text-xs font-bold text-[#00D2FF] hover:text-cyan-300 hover:underline transition-colors flex items-center gap-1"
          >
            <span>Semua SPK Servis</span>
            <span>↗</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Antrian Pit */}
          <Link
            href="/services"
            className="card-pitstop p-5 block group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400">Antrian Pit</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-[#F59E0B] border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black font-mono text-white">{stats.activeQueueCount}</p>
              <span className="badge-custom badge-antrian">Menunggu</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Unit di area registrasi pit</p>
          </Link>

          {/* Sedang Dikerjakan */}
          <Link
            href="/services"
            className="card-pitstop p-5 block group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400">Sedang Dikerjakan</span>
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-[#0284C7] border border-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black font-mono text-[#00D2FF]">{stats.inProgressCount}</p>
              <span className="badge-custom badge-pengerjaan">Aktif Pit</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Dalam penanganan teknisi</p>
          </Link>

          {/* Siap ke Kasir */}
          <Link
            href="/cashier"
            className="card-pitstop p-5 block group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400">Siap Ditagih Kasir</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-[#10B981] border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black font-mono text-[#10B981]">{stats.readyForCashierCount}</p>
              <span className="badge-custom badge-selesai-pengerjaan">Selesai Servis</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Menunggu pembayaran faktur</p>
          </Link>

          {/* Omzet */}
          <Link
            href="/cashier"
            className="card-pitstop p-5 block group cursor-pointer border-cyan-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400">Omzet Kasir</span>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-[#00D2FF] border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-[0_0_10px_rgba(0,210,255,0.15)]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-black font-mono text-white leading-tight">{formatRupiah(stats.todayRevenue)}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-slate-400 font-mono">{stats.completedOrdersCount} faktur lunas</p>
              <span className="badge-custom badge-selesai-pembayaran">100% Lunas</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 2. Master Data Metrics */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-4">
          Master Data & Inventaris Gudang
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/customers" className="card-pitstop p-5 block cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Total Pelanggan</span>
              <span className="badge-custom badge-steel">Aktif</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">{stats.totalCustomers}</p>
            <p className="text-[11px] text-slate-400 mt-1">Pemilik terdata di sistem</p>
          </Link>

          <Link href="/customers" className="card-pitstop p-5 block cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Unit Kendaraan</span>
              <span className="badge-custom badge-steel">Terdaftar</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">{stats.totalVehicles}</p>
            <p className="text-[11px] text-slate-400 mt-1">Armada motor & mobil</p>
          </Link>

          <Link href="/inventory/services" className="card-pitstop p-5 block cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Katalog Jasa</span>
              <span className="badge-custom badge-cream">Paket</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">{stats.totalServices}</p>
            <p className="text-[11px] text-slate-400 mt-1">Paket tindakan & tarif bengkel</p>
          </Link>

          <Link
            href="/inventory/parts"
            className={`card-pitstop p-5 block cursor-pointer ${
              stats.lowStockCount > 0 ? "!border-rose-500/60 !bg-rose-950/30" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${stats.lowStockCount > 0 ? "text-rose-300" : "text-slate-400"}`}>
                Stok Suku Cadang
              </span>
              {stats.lowStockCount > 0 && (
                <span className="badge-custom badge-stok-kritis animate-pulse">{stats.lowStockCount} Kritis</span>
              )}
            </div>
            <p className={`text-2xl font-extrabold font-mono ${stats.lowStockCount > 0 ? "text-rose-400" : "text-white"}`}>
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
            num: "01",
            title: "Work Order Servis",
            desc: "Terbitkan SPK baru, perbarui status pengerjaan mekanik, dan kurangi stok suku cadang otomatis.",
            href: "/services",
            label: "Buka Modul Servis",
            accent: "from-[#00D2FF] to-[#2563EB]",
          },
          {
            num: "02",
            title: "Kasir & Billing",
            desc: "Penerimaan pembayaran tunai, transfer, dan QRIS, hitung diskon & kembalian, serta cetak nota struk resmi.",
            href: "/cashier",
            label: "Buka Modul Kasir",
            accent: "from-[#2563EB] to-[#1D4ED8]",
          },
          {
            num: "03",
            title: "Pelanggan & Armada",
            desc: "Database kontak WhatsApp pelanggan dan relasi kepemilikan banyak armada unit kendaraan.",
            href: "/customers",
            label: "Buka Data Pelanggan",
            accent: "from-[#F59E0B] to-[#D97706]",
          },
          {
            num: "04",
            title: "Live Service Tracking",
            desc: "Halaman publik mobile tanpa login bagi pelanggan untuk melacak transparansi servis kendaraannya secara live.",
            href: "/track/trk-vario160-budi",
            label: "Buka Tracking Publik",
            accent: "from-[#10B981] to-[#059669]",
          },
        ].map((mod) => (
          <div key={mod.num} className="card-pitstop p-5 flex flex-col justify-between">
            <div>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${mod.accent} text-slate-950 flex items-center justify-center font-black text-xs mb-3 shadow-md`}>
                {mod.num}
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{mod.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{mod.desc}</p>
            </div>
            <Link
              href={mod.href}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00D2FF] hover:text-cyan-300 hover:translate-x-0.5 transition-all cursor-pointer"
            >
              {mod.label} <span>→</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
