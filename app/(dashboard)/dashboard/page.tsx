import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { db } from "@/lib/db";
import { ServiceStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: ServiceStatus | string) {
  switch (status) {
    case "ANTRIAN":
      return (
        <span className="badge-custom badge-antrian text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Antrian Pit
        </span>
      );
    case "PENGERJAAN":
      return (
        <span className="badge-custom badge-pengerjaan text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Dikerjakan
        </span>
      );
    case "MENUNGGU_PART":
      return (
        <span className="badge-custom badge-menunggu-part text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Tunggu Part
        </span>
      );
    case "SELESAI_PENGERJAAN":
      return (
        <span className="badge-custom badge-selesai-pengerjaan text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Siap Kasir
        </span>
      );
    case "SELESAI_PEMBAYARAN":
      return (
        <span className="badge-custom badge-selesai-pembayaran text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          Faktur Lunas
        </span>
      );
    case "DIBATALKAN":
      return <span className="badge-custom badge-danger text-[10px]">Dibatalkan</span>;
    default:
      return <span className="badge-custom badge-steel text-[10px]">{status}</span>;
  }
}

export default async function DashboardOverviewPage() {
  const stats = await db.getStats();
  const recentOrders = await db.serviceOrder.findMany();
  const feedOrders = recentOrders.slice(0, 6);

  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Status Strip */}
      <Header
        title="PitCare Auto • Command Center"
        subtitle={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bengkel Beroperasi Normal
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 font-medium text-xs">{todayFormatted}</span>
          </div>
        }
        actionButton={
          <Link
            href="/services/new"
            className="btn-cyan flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold cursor-pointer shadow-lg shadow-cyan-500/25 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Buat SPK Baru</span>
          </Link>
        }
      />

      {/* 2. THE COCKPIT COMMAND CENTER: SPLIT LAYOUT (70% : 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================
            KOLOM KIRI (70% — JANTUNG OPERASIONAL SERVIS)
            ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. Strip 3 Metrik Inti Alur Servis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Antrian Pit */}
            <Link
              href="/services"
              className="card-pitstop p-4.5 block group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-4 w-10 h-0.5 rounded-full bg-amber-500/70 group-hover:w-20 transition-all duration-300" />
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-400">Antrian Pit</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-[#F59E0B] border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-black font-mono text-white tracking-tight">
                  {stats.activeQueueCount}
                </p>
                <span className="badge-custom badge-antrian text-[10px]">Menunggu</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Registrasi & antrian masuk</p>
            </Link>

            {/* Sedang Dikerjakan */}
            <Link
              href="/services"
              className="card-pitstop p-4.5 block group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-4 w-10 h-0.5 rounded-full bg-sky-500/70 group-hover:w-20 transition-all duration-300" />
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-400">Sedang Dikerjakan</span>
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-[#0284C7] border border-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-black font-mono text-[#00D2FF] tracking-tight">
                  {stats.inProgressCount}
                </p>
                <span className="badge-custom badge-pengerjaan text-[10px]">Aktif Pit</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Dalam penanganan mekanik</p>
            </Link>

            {/* Siap ke Kasir */}
            <Link
              href="/cashier"
              className="card-pitstop p-4.5 block group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-4 w-10 h-0.5 rounded-full bg-emerald-500/70 group-hover:w-20 transition-all duration-300" />
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-400">Siap ke Kasir</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#10B981] border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-black font-mono text-[#10B981] tracking-tight">
                  {stats.readyForCashierCount}
                </p>
                <span className="badge-custom badge-selesai-pengerjaan text-[10px]">Selesai Servis</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Menunggu pembayaran faktur</p>
            </Link>
          </div>

          {/* B. Tabel / Feed "Unit Aktif di Pit Hari Ini" (Live Pitstop Feed) */}
          <div className="card-cockpit">
            {/* Table Header Strip */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#0F172A]/50">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] shadow-[0_0_8px_#00D2FF] animate-pulse" />
                <div>
                  <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Unit Aktif di Pit Hari Ini</span>
                    <span className="pill-live">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse" />
                      Live Pit Feed
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Monitoring kendaraan yang sedang dalam alur servis, inspeksi, dan penagihan
                  </p>
                </div>
              </div>

              <Link
                href="/services"
                className="text-xs font-bold text-[#00D2FF] hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors self-start sm:self-auto"
              >
                <span>Lihat Semua SPK</span>
                <span>↗</span>
              </Link>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-[#0c1322]/60">
                    <th className="py-3 px-4">Plat & Kendaraan</th>
                    <th className="py-3 px-4">Pemilik & Kontak</th>
                    <th className="py-3 px-4">Keluhan / Layanan</th>
                    <th className="py-3 px-4">Teknisi</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {feedOrders.length > 0 ? (
                    feedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-800/35 transition-colors group"
                      >
                        {/* 1. Plat Nomor Otentik + Kendaraan */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <span className="plate-badge">
                              {order.vehicle?.plateNumber || "B ---- XXX"}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-300">
                              {order.vehicle?.brand || ""} {order.vehicle?.model || "Unit Kendaraan"}
                            </span>
                          </div>
                        </td>

                        {/* 2. Pemilik & No. WhatsApp */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white text-xs truncate max-w-[140px]">
                            {order.customer?.name || "Pelanggan Umum"}
                          </p>
                          {order.customer?.phone ? (
                            <a
                              href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono hover:underline inline-flex items-center gap-1 mt-0.5"
                              title="Chat WhatsApp"
                            >
                              <span>{order.customer.phone}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500">-</span>
                          )}
                        </td>

                        {/* 3. Keluhan & Tindakan Servis */}
                        <td className="py-3.5 px-4">
                          <p
                            className="text-xs text-slate-300 line-clamp-1 max-w-[200px]"
                            title={order.complaints}
                          >
                            {order.complaints || "-"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[200px]">
                            {order.items && order.items.length > 0
                              ? order.items.map((i) => i.serviceName).join(", ")
                              : "Pemeriksaan Umum"}
                          </p>
                        </td>

                        {/* 4. Teknisi */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-[#00D2FF] text-[10px] font-bold flex items-center justify-center">
                              {(order.mechanicName || "TK").substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-300 font-medium">
                              {order.mechanicName || "Budi Santoso"}
                            </span>
                          </div>
                        </td>

                        {/* 5. Status Servis Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* 6. Aksi */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/services/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#00D2FF] hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer"
                          >
                            <span>Lihat SPK</span>
                            <span className="text-[10px]">↗</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-xs font-medium">Belum ada unit servis yang aktif di pit hari ini.</p>
                          <Link
                            href="/services/new"
                            className="text-xs font-bold text-[#00D2FF] hover:underline mt-1"
                          >
                            + Daftarkan SPK Baru Sekarang
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* C. Master Data Mini-Pill Bar (Di Bawah Tabel) */}
            <div className="p-3.5 border-t border-slate-800/80 bg-[#090d16]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Master Data Terkini:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Link
                  href="/customers"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0F172A] hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all text-xs"
                >
                  <span className="font-mono font-bold text-[#00D2FF]">{stats.totalCustomers}</span>
                  <span className="text-slate-400">Pelanggan</span>
                </Link>
                <Link
                  href="/customers"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0F172A] hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all text-xs"
                >
                  <span className="font-mono font-bold text-blue-400">{stats.totalVehicles}</span>
                  <span className="text-slate-400">Armada Unit</span>
                </Link>
                <Link
                  href="/inventory/services"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0F172A] hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all text-xs"
                >
                  <span className="font-mono font-bold text-emerald-400">{stats.totalServices}</span>
                  <span className="text-slate-400">Paket Jasa</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            KOLOM KANAN (30% — PANEL FINANSIAL, TOP 5 PART & GUDANG)
            ======================================================== */}
        <div className="lg:col-span-4 space-y-5">
          {/* A. Kartu Ringkasan Eksekutif: Pendapatan Hari Ini & Total Servis Hari Ini */}
          <div
            className="card-pitstop p-5 border-cyan-500/30 relative overflow-hidden group"
            style={{
              boxShadow:
                "0 4px 24px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,210,255,0.15), 0 0 24px -4px rgba(0,210,255,0.08)",
            }}
          >
            {/* Ambient background glow inside card */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-cyan-500/10 to-blue-600/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-4 w-12 h-0.5 rounded-full bg-gradient-to-r from-[#00D2FF] to-[#2563EB] group-hover:w-24 transition-all duration-300" />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-[#00D2FF] border border-cyan-500/30 flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Pendapatan Hari Ini</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Realisasi kasir & total servis</p>
                </div>
              </div>
              <span className="badge-custom badge-selesai-pembayaran text-[10px]">Live POS</span>
            </div>

            <div className="my-3 relative z-10">
              <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight leading-none">
                {formatRupiah(stats.todayRevenue)}
              </p>

              {/* Ringkasan Total Servis Hari Ini vs Lunas */}
              <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-800/90">
                <div className="p-2.5 rounded-xl bg-[#0B0F19]/90 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold">Total Servis Hari Ini</p>
                  <p className="text-base font-black font-mono text-[#00D2FF] mt-0.5">
                    {stats.todayServicesCount} Unit
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0B0F19]/90 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold">Faktur Selesai Lunas</p>
                  <p className="text-base font-black font-mono text-emerald-400 mt-0.5">
                    {stats.completedOrdersCount} Nota
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-3 font-medium">
                <span className="text-[11px] text-slate-400">Sinkronisasi Supabase Aktif</span>
                <Link
                  href="/cashier"
                  className="text-[#00D2FF] hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  <span>Buka Kasir</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* B. WIDGET: FAST / SLOW MOVING ANALYTICS & TOP 5 SUKU CADANG */}
          <div className="card-pitstop p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white">
                    Fast / Slow Moving Analytics (Top 5 Part)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Analitik perputaran suku cadang level Manajer / Owner
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0">
                Owner Analytics
              </span>
            </div>

            <div className="space-y-2.5">
              {stats.topUsedParts && stats.topUsedParts.map((part, index) => {
                const maxQty = Math.max(...stats.topUsedParts.map((x) => x.totalQty), 1);
                const barWidth = Math.max(18, Math.round((part.totalQty / maxQty) * 100));
                const isFastMoving = index < 3 || part.totalQty >= 4;

                return (
                  <div
                    key={part.partId}
                    className="p-2.5 rounded-xl bg-[#0B0F19]/90 border border-slate-800/90 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                            index === 0
                              ? "bg-amber-400 text-slate-950"
                              : index === 1
                              ? "bg-slate-300 text-slate-950"
                              : index === 2
                              ? "bg-amber-700 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-100 truncate">{part.name}</p>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                                isFastMoving
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {isFastMoving ? "🔥 Fast Moving" : "⏳ Slow Moving"}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-500">
                            {part.category} • Omset: {formatRupiah(part.totalRevenue)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[#00D2FF] font-mono text-[11px] font-extrabold">
                          {part.totalQty}x Pakai
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFastMoving
                            ? "bg-gradient-to-r from-emerald-400 to-[#00D2FF]"
                            : "bg-gradient-to-r from-amber-400 to-orange-500"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 <strong className="text-slate-200">Insight Pemilik Bengkel:</strong> Item berlabel{" "}
              <span className="text-emerald-400 font-bold">Fast Moving</span> menyumbang perputaran kas tertinggi pada SPK harian, sedangkan{" "}
              <span className="text-amber-300 font-bold">Slow Moving</span> bersifat penggantian berkala jangka panjang.
            </div>
          </div>

          {/* C. Aksi Cepat Staf (Quick Launchpad) */}
          <div className="card-cockpit p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Aksi Cepat Staf
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Launchpad</span>
            </div>

            <Link
              href="/services/new"
              className="btn-cyan w-full p-3 flex items-center justify-between text-xs font-bold shadow-md shadow-cyan-500/20 group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Pendaftaran Servis Baru</span>
              </div>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            <Link
              href="/cashier"
              className="w-full p-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-cyan-500/40 flex items-center justify-between text-xs font-bold transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#00D2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Kasir & Billing POS</span>
              </div>
              <span className="group-hover:translate-x-1 transition-transform text-slate-400">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
