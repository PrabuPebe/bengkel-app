"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ServiceOrder } from "@/lib/types/database";
import { getServiceOrderByTokenAction } from "@/lib/actions/orders";

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
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PublicServiceTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    let active = true;

    getServiceOrderByTokenAction(resolvedParams.token).then((data) => {
      if (active) {
        setOrder(data);
        setIsLoading(false);
      }
    });

    const interval = setInterval(() => {
      getServiceOrderByTokenAction(resolvedParams.token).then((data) => {
        if (active) {
          setOrder(data);
          setLastRefreshed(new Date());
        }
      });
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [resolvedParams.token]);

  async function handleManualRefresh() {
    setIsRefreshing(true);
    try {
      const data = await getServiceOrderByTokenAction(resolvedParams.token);
      setOrder(data);
      setLastRefreshed(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }

  const steps = [
    { key: "ANTRIAN", label: "Antrian Pit", desc: "Menunggu giliran teknisi" },
    { key: "PENGERJAAN", label: "Pengerjaan", desc: "Tindakan perbaikan & pasang part" },
    { key: "SELESAI_PENGERJAAN", label: "Selesai Pengerjaan", desc: "Uji jalan & siap billing" },
    { key: "SELESAI_PEMBAYARAN", label: "Siap Diambil", desc: "Unit siap serah terima" },
  ];

  const getStepStatus = (stepKey: string) => {
    if (!order) return "upcoming";
    const orderIndexMap: Record<string, number> = {
      ANTRIAN: 1,
      PENGERJAAN: 2,
      MENUNGGU_PART: 2,
      SELESAI_PENGERJAAN: 3,
      SELESAI_PEMBAYARAN: 4,
    };
    const currentIdx = orderIndexMap[order.status] || 0;
    const thisIdx = orderIndexMap[stepKey] || 0;

    if (currentIdx > thisIdx) return "completed";
    if (Math.floor(currentIdx) === Math.floor(thisIdx)) return "current";
    return "upcoming";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-300 font-medium">Menghubungkan ke PitCare Auto Live Tracker...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl glass-panel border border-white/10 flex items-center justify-center text-rose-400 text-2xl font-bold mb-4">
          !
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Token Pelacakan Tidak Ditemukan</h1>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          Link pelacakan atau nomor token yang Anda masukkan tidak terdaftar dalam sistem PitCare Auto. Pastikan Anda mengklik link resmi dari pesan WhatsApp kami.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/25 transition-all"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const waMessage = encodeURIComponent(
    `Halo PitCare Auto, saya ingin menanyakan perkembangan servis kendaraan saya:\n- No. SPK: ${order.orderNumber}\n- Plat Nomor: ${order.vehicle?.plateNumber || "-"}\n- Pemilik: ${order.customer?.name || "-"}\nMohon informasinya. Terima kasih!`
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        {/* Top Branding Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              PA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">PITCARE AUTO</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Live Tracker
                </span>
              </div>
              <p className="text-xs text-slate-400">Portal Transparan Pelacakan Progres Servis</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 glass-panel border border-white/10 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
            title="Muat ulang status terbaru"
          >
            <span className={`inline-block ${isRefreshing ? "animate-spin" : ""}`}>🔄</span>
            <span className="hidden sm:inline">{isRefreshing ? "Memperbarui..." : "Segarkan"}</span>
          </button>
        </div>

        {/* Live Status Hero Banner */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-white/10 shadow-2xl shadow-black/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950/80 text-indigo-300 border border-indigo-500/20 shadow-inner">
                  {order.orderNumber}
                </span>
                <span className="font-mono text-xs font-black px-3 py-1.5 rounded-xl bg-indigo-600/20 text-white border border-indigo-500/30">
                  {order.vehicle?.plateNumber}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {order.vehicle?.brand} {order.vehicle?.model}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pemilik: <strong className="text-slate-200">{order.customer?.name}</strong> • Masuk: {formatDate(order.entryDate)}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Status Operasional
              </span>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-600/10">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                <span>
                  {order.status === "ANTRIAN" && "Dalam Antrian Pit"}
                  {order.status === "PENGERJAAN" && "Sedang Dalam Pengerjaan"}
                  {order.status === "MENUNGGU_PART" && "Menunggu Suku Cadang"}
                  {order.status === "SELESAI_PENGERJAAN" && "Pengerjaan Selesai (Siap Ditagih)"}
                  {order.status === "SELESAI_PEMBAYARAN" && "Selesai & Lunas (Siap Diambil)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Step Progress Pipeline */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-white/10 shadow-2xl shadow-black/40">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 pb-3 border-b border-white/5">
            Tahapan Pengerjaan Unit Kendaraan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {steps.map((s, idx) => {
              const st = getStepStatus(s.key);
              return (
                <div
                  key={s.key}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    st === "current"
                      ? "bg-indigo-600/15 border-indigo-500/60 shadow-xl shadow-indigo-600/15 ring-1 ring-indigo-500/30"
                      : st === "completed"
                        ? "bg-slate-950/80 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-950/40 border-white/5 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                      Langkah {idx + 1}
                    </span>
                    {st === "completed" && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        ✓ Selesai
                      </span>
                    )}
                    {st === "current" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                        Berjalan
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold ${st === "current" ? "text-white" : ""}`}>
                    {s.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Teknisi Ahli: <strong className="text-slate-200">{order.mechanicName || "Teknisi PitCare Auto"}</strong>
            </span>
            <span>Update Real-time: {lastRefreshed.toLocaleTimeString("id-ID")}</span>
          </div>
        </div>

        {/* Diagnosis & Mechanic Findings */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-white/10 shadow-2xl shadow-black/40 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-white/5">
            Catatan Keluhan & Hasil Pemeriksaan Teknisi
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5">
              <span className="text-slate-400 font-semibold block text-[11px] mb-1">
                Keluhan Awal Saat Masuk:
              </span>
              <p className="text-slate-200 italic leading-relaxed">
                &quot;{order.complaints}&quot;
              </p>
            </div>

            {order.diagnosis ? (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/25">
                <span className="text-indigo-400 font-semibold block text-[11px] mb-1">
                  Hasil Analisis / Diagnosis Teknisi:
                </span>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {order.diagnosis}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-1">
                Teknisi sedang melakukan inspeksi menyeluruh pada unit kendaraan Anda.
              </p>
            )}
          </div>
        </div>

        {/* Itemized Services & Spareparts Breakdown */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-white/10 shadow-2xl shadow-black/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rincian Pekerjaan & Biaya Transparan
            </h3>
            <span className="text-xs text-slate-400 font-mono">PitCare Auto Guarantee</span>
          </div>

          <div className="space-y-4">
            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🔧 Tindakan Jasa Servis</span>
                </p>
                <span className="font-mono text-emerald-400 font-bold text-xs">
                  {formatRupiah(order.totalServices)}
                </span>
              </div>
              {order.items.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">Belum ada item jasa servis.</p>
              ) : (
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950/60 border border-white/5"
                    >
                      <span className="text-slate-200 font-medium">{item.serviceName}</span>
                      <span className="font-mono font-bold text-white">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spareparts */}
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>📦 Suku Cadang Terpakai</span>
                </p>
                <span className="font-mono text-emerald-400 font-bold text-xs">
                  {formatRupiah(order.totalParts)}
                </span>
              </div>
              {order.parts.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">Belum ada suku cadang terpakai.</p>
              ) : (
                <div className="space-y-2">
                  {order.parts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950/60 border border-white/5"
                    >
                      <span className="text-slate-200">
                        {p.partName}{" "}
                        <span className="text-slate-400 font-mono text-[11px]">({p.qty}x)</span>
                      </span>
                      <span className="font-mono font-bold text-white">{formatRupiah(p.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between bg-slate-950/80 p-5 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Estimasi Biaya
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
                  {formatRupiah(order.grandTotal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block mb-1">
                  Status Pembayaran:
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      order.paymentStatus === "PAID" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  {order.paymentStatus === "PAID" ? "LUNAS" : "Menunggu Pembayaran"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Assistance Button & Workshop Guarantee */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-indigo-500/25 text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <h4 className="text-sm font-bold text-white">Butuh Informasi Tambahan Mengenai Pengerjaan?</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Tim teknisi dan service advisor PitCare Auto siap memberikan rincian progres atau konsultasi suku cadang.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/6281234567890?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
            >
              <span>📱 Hubungi Tim PitCare Auto via WhatsApp</span>
            </a>
          </div>
          <p className="text-[10px] text-slate-400 pt-2">
            Garansi servis resmi PitCare Auto: 7 hari / 500 KM untuk kenyamanan dan kepuasan berkendara Anda.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-slate-500 border-t border-white/5">
          <p>© {new Date().getFullYear()} PitCare Auto — Platform Manajemen & Pelacakan Bengkel Modern</p>
        </div>
      </div>
    </div>
  );
}
