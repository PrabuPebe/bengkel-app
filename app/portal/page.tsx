import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCustomerPortalSession, logoutCustomerPortalAction } from "@/lib/actions/customer-portal";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CustomerPortalPage() {
  const session = await getCustomerPortalSession();

  if (!session) {
    redirect("/login");
  }

  // Ambil data pelanggan lengkap dari Supabase
  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    include: {
      vehicles: {
        include: {
          serviceOrders: {
            include: {
              items: true,
              parts: true,
              mechanic: true,
            },
            orderBy: { entryDate: "desc" },
          },
        },
      },
      serviceOrders: {
        include: {
          vehicle: true,
          items: true,
          parts: true,
          mechanic: true,
        },
        orderBy: { entryDate: "desc" },
      },
    },
  });

  if (!customer) {
    redirect("/login");
  }

  // Pilih kendaraan yang sedang aktif (default yang ada di sesi)
  const activeVehicle =
    customer.vehicles.find((v) => v.id === session.vehicleId) || customer.vehicles[0];

  const vehicleOrders = activeVehicle?.serviceOrders || [];
  const latestOrder = vehicleOrders[0];
  const currentKm = latestOrder?.currentKm || 0;

  // === KALKULASI PREDICTIVE PART LIFESPAN TRACKER ===
  // 1. Oli Mesin (Interval: 3.000 KM)
  const oilInterval = 3000;
  const oilOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => p.partName.toLowerCase().includes("oli"))
  );
  const oilReplacedKm = oilOrder?.currentKm || 0;
  const oilKmElapsed = Math.max(0, currentKm - oilReplacedKm);
  const oilRemainingKm = Math.max(0, oilInterval - (oilOrder ? oilKmElapsed : currentKm % oilInterval));
  const oilPercentage = Math.min(100, Math.max(0, Math.round((oilRemainingKm / oilInterval) * 100)));
  const oilStatus =
    oilRemainingKm <= 0
      ? { label: "Wajib Ganti Sekarang", color: "rose", badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" }
      : oilRemainingKm <= 500
      ? { label: "Segera Ganti", color: "amber", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
      : { label: "Kondisi Aman", color: "emerald", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };

  // 2. Busi Pengapian (Interval: 8.000 KM)
  const sparkInterval = 8000;
  const sparkOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => p.partName.toLowerCase().includes("busi"))
  );
  const sparkReplacedKm = sparkOrder?.currentKm || 0;
  const sparkKmElapsed = Math.max(0, currentKm - sparkReplacedKm);
  const sparkRemainingKm = Math.max(0, sparkInterval - (sparkOrder ? sparkKmElapsed : currentKm % sparkInterval));
  const sparkPercentage = Math.min(100, Math.max(0, Math.round((sparkRemainingKm / sparkInterval) * 100)));
  const sparkStatus =
    sparkRemainingKm <= 0
      ? { label: "Wajib Ganti", color: "rose", badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" }
      : sparkRemainingKm <= 1200
      ? { label: "Perlu Periksa", color: "amber", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
      : { label: "Kondisi Prima", color: "emerald", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };

  // 3. V-Belt / Rantai CVT (Interval: 24.000 KM)
  const beltInterval = 24000;
  const beltOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => {
      const n = p.partName.toLowerCase();
      return n.includes("belt") || n.includes("roller") || n.includes("rantai");
    })
  );
  const beltReplacedKm = beltOrder?.currentKm || 0;
  const beltKmElapsed = Math.max(0, currentKm - beltReplacedKm);
  const beltRemainingKm = Math.max(0, beltInterval - (beltOrder ? beltKmElapsed : currentKm % beltInterval));
  const beltPercentage = Math.min(100, Math.max(0, Math.round((beltRemainingKm / beltInterval) * 100)));
  const beltStatus =
    beltRemainingKm <= 0
      ? { label: "Ganti Kritis", color: "rose", badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" }
      : beltRemainingKm <= 3000
      ? { label: "Mendekati Batas", color: "amber", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
      : { label: "Kondisi Prima", color: "emerald", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };

  // Pesan WhatsApp Booking
  const waMessage = encodeURIComponent(
    `Halo PitCare Auto, saya ${customer.name}. Saya ingin reservasi jadwal servis untuk kendaraan saya (${activeVehicle?.brand} ${activeVehicle?.model} - ${activeVehicle?.plateNumber}). Mohon informasi jadwal kosong teknisi. Terima kasih!`
  );
  const waLink = `https://wa.me/6281234567890?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-x-hidden pb-16">
      {/* Background patterns */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute top-0 right-1/4 w-[600px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,210,255,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#00D2FF] text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-[#00D2FF]/20">
            PA
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white leading-tight flex items-center gap-1.5">
              <span>PitCare Auto</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-[#00D2FF] border border-cyan-500/30">
                CLIENT PORTAL
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Layanan Digital & Riwayat Perawatan Unit</p>
          </div>
        </div>

        <form action={logoutCustomerPortalAction}>
          <button
            type="submit"
            className="text-xs font-bold text-slate-300 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar Sesi
          </button>
        </form>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 space-y-8 relative z-10">
        {/* Welcome Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900/95 via-[#121c32]/90 to-slate-900/95 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[#00D2FF] text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-ping" />
              Sesi Pelanggan Aktif
            </div>
            <h2 className="text-2xl font-black text-white">
              Selamat Datang, <span className="text-[#00D2FF]">{customer.name}</span>!
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              WhatsApp: <span className="font-mono text-slate-200">{customer.phone}</span> · Terdaftar memiliki{" "}
              <strong className="text-white">{customer.vehicles.length} armada kendaraan</strong>
            </p>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cyan px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.541 1.848.819 2.796.82h.005c3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.775-5.807zm3.374 8.212c-.143.402-.832.748-1.161.796-.328.049-.728.067-2.316-.583-1.631-.669-2.66-2.341-2.74-2.448-.08-.106-.653-.871-.653-1.663 0-.792.414-1.182.56-1.341.147-.159.32-.199.426-.199.107 0 .213.002.306.007.098.005.228-.037.356.27.133.32.453 1.107.493 1.187.04.08.067.173.013.28-.053.106-.08.172-.16.265-.08.093-.168.207-.24.278-.08.08-.163.167-.07.327.093.16.413.682.887 1.103.609.541 1.123.708 1.282.788.16.08.253.067.347-.04.093-.107.4-466.507-.626.107-.16.213-.133.36-.08.147.053.933.44 1.093.52.16.08.267.12.307.186.04.067.04.387-.103.789z" />
            </svg>
            Booking Servis via WhatsApp
          </a>
        </div>

        {/* Vehicle Tabs / Active Vehicle Badge */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Unit Kendaraan Anda
            </h3>
            <span className="text-xs text-slate-500">
              Pilih kendaraan untuk melihat riwayat & indikator kesehatan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.vehicles.map((v) => {
              const isSelected = v.id === activeVehicle?.id;
              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-gradient-to-b from-[#13223f] to-[#0f172a] border-cyan-400/40 shadow-lg shadow-cyan-950/40"
                      : "bg-[#0F172A]/80 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="plate-badge text-xs font-mono font-black">
                      {v.plateNumber}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#00D2FF]">
                        Aktif
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white leading-tight">
                    {v.brand} {v.model}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tahun {v.year || "-"} · Total {v.serviceOrders.length}x Servis
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Predictive Part Lifespan Tracker */}
        <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] animate-pulse" />
                <h3 className="text-base font-bold text-white">
                  Kartu Kesehatan Suku Cadang (Predictive Lifespan Tracker)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Estimasi otomatis masa pakai dan interval keausan komponen unit{" "}
                <strong className="text-white">{activeVehicle?.plateNumber}</strong> berdasarkan riwayat kilometer
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Odometer Terakhir:</span>
              <span className="font-mono font-bold text-[#00D2FF]">
                {currentKm > 0 ? `${currentKm.toLocaleString("id-ID")} KM` : "Belum Ada Catatan KM"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Oli Mesin */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[#00D2FF]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Oli Mesin</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Batas: 3.000 KM</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${oilStatus.badge}`}>
                  {oilStatus.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Sisa Umur KM:</span>
                  <span className="font-mono font-bold text-white">
                    {oilRemainingKm.toLocaleString("id-ID")} KM ({oilPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      oilPercentage > 40 ? "bg-emerald-400" : oilPercentage > 15 ? "bg-amber-400" : "bg-rose-500"
                    }`}
                    style={{ width: `${oilPercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                Ganti oli mesin secara berkala menjaga kompresi ruang bakar tetap optimal.
              </p>
            </div>

            {/* Card 2: Busi Pengapian */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Busi Pengapian</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Batas: 8.000 KM</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sparkStatus.badge}`}>
                  {sparkStatus.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Sisa Umur KM:</span>
                  <span className="font-mono font-bold text-white">
                    {sparkRemainingKm.toLocaleString("id-ID")} KM ({sparkPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      sparkPercentage > 40 ? "bg-emerald-400" : sparkPercentage > 15 ? "bg-amber-400" : "bg-rose-500"
                    }`}
                    style={{ width: `${sparkPercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                Elektroda busi yang bersih mencegah tarikan berat dan konsumsi bensin boros.
              </p>
            </div>

            {/* Card 3: V-Belt / CVT */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">V-Belt / CVT Kit</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Batas: 24.000 KM</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${beltStatus.badge}`}>
                  {beltStatus.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Sisa Umur KM:</span>
                  <span className="font-mono font-bold text-white">
                    {beltRemainingKm.toLocaleString("id-ID")} KM ({beltPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      beltPercentage > 40 ? "bg-emerald-400" : beltPercentage > 15 ? "bg-amber-400" : "bg-rose-500"
                    }`}
                    style={{ width: `${beltPercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                Pemeriksaan rutin v-belt mencegah risiko putus sabuk di jalan raya.
              </p>
            </div>
          </div>
        </div>

        {/* Riwayat Nota & Servis Transparan */}
        <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Riwayat Nota & Transaksi Servis</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar pengerjaan bengkel lengkap beserta suku cadang yang dipasang
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Total {vehicleOrders.length} Riwayat
            </span>
          </div>

          {vehicleOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs font-semibold">Belum ada riwayat pengerjaan untuk kendaraan ini.</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Kunjungi PitCare Auto untuk memulai servis pertama Anda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicleOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(order.entryDate)}
                      </span>
                      {order.currentKm && (
                        <span className="text-xs font-mono text-slate-300">
                          · {order.currentKm.toLocaleString("id-ID")} KM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          order.status === "SELESAI_PEMBAYARAN"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : order.status === "SELESAI_PENGERJAAN"
                            ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {order.status === "SELESAI_PEMBAYARAN"
                          ? "Lunas / Selesai"
                          : order.status === "SELESAI_PENGERJAAN"
                          ? "Siap Diambil"
                          : "Dalam Pengerjaan"}
                      </span>

                      <Link
                        href={`/track/${order.token}`}
                        target="_blank"
                        className="text-xs text-[#00D2FF] hover:underline font-bold flex items-center gap-1 ml-2"
                      >
                        Live Tracking ↗
                      </Link>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-400">Keluhan:</strong> {order.complaints}
                  </p>

                  {/* Rincian Parts & Services */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Jasa Servis ({order.items.length})
                      </p>
                      <ul className="space-y-0.5">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between text-slate-300 text-[11px]">
                            <span>• {item.serviceName}</span>
                            <span className="font-mono text-slate-400">{formatRupiah(Number(item.subtotal))}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Suku Cadang ({order.parts.length})
                      </p>
                      <ul className="space-y-0.5">
                        {order.parts.map((part) => (
                          <li key={part.id} className="flex justify-between text-slate-300 text-[11px]">
                            <span>• {part.partName} (x{part.qty})</span>
                            <span className="font-mono text-slate-400">{formatRupiah(Number(part.subtotal))}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Mekanik Bertugas: <strong className="text-white">{order.mechanic?.name || "Mekanik Pitstop"}</strong></span>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 mr-2">Total Biaya:</span>
                      <span className="text-sm font-black font-mono text-[#00D2FF]">
                        {formatRupiah(Number(order.grandTotal))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
