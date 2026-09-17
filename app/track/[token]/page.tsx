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
    { key: "ANTRIAN", label: "Antrian Pit", desc: "Menunggu giliran mekanik" },
    { key: "PENGERJAAN", label: "Pengerjaan", desc: "Tindakan perbaikan & ganti part" },
    { key: "SELESAI_PENGERJAAN", label: "Selesai Pengerjaan", desc: "Siap uji jalan & penagihan" },
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Menghubungkan ke PitCare Auto Live Tracker...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 text-2xl font-bold mb-4">
          !
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Token Pelacakan Tidak Ditemukan</h1>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          Link pelacakan atau nomor token yang Anda masukkan tidak terdaftar dalam sistem PitCare Auto. Pastikan Anda mengklik link yang benar dari pesan WhatsApp resmi kami.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const waMessage = encodeURIComponent(
    `Halo PitCare Auto, saya ingin menanyakan status pengerjaan kendaraan saya:\n- No. SPK: ${order.orderNumber}\n- Plat Nomor: ${order.vehicle?.plateNumber || "-"}\n- Pemilik: ${order.customer?.name || "-"}\nMohon informasi terbarunya. Terima kasih!`
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Branding Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/20">
              PA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">PITCARE AUTO</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Live Tracker
                </span>
              </div>
              <p className="text-xs text-slate-400">Portal Pelacakan Progres Servis Pelanggan</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Muat ulang status terbaru"
          >
            <span className={`inline-block ${isRefreshing ? "animate-spin" : ""}`}>🔄</span>
            <span className="hidden sm:inline">{isRefreshing ? "Memperbarui..." : "Segarkan"}</span>
          </button>
        </div>

        {/* Live Status Hero Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-2xl shadow-slate-950/60 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {order.orderNumber}
                </span>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-800 text-white border border-slate-700">
                  {order.vehicle?.plateNumber}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {order.vehicle?.brand} {order.vehicle?.model}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pemilik: <strong className="text-slate-200">{order.customer?.name}</strong> • Masuk: {formatDate(order.entryDate)}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Status Terkini
              </span>
              <div className="inline-flex items-center gap-2 mt-1 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-indigo-600/15 text-indigo-400 border border-indigo-500/30">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
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
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
            Tahapan Pengerjaan Unit
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((s, idx) => {
              const st = getStepStatus(s.key);
              return (
                <div
                  key={s.key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    st === "current"
                      ? "bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                      : st === "completed"
                        ? "bg-slate-950 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase">
                      Langkah {idx + 1}
                    </span>
                    {st === "completed" && (
                      <span className="text-xs font-bold text-emerald-400">✓ Selesai</span>
                    )}
                    {st === "current" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                        Sedang Berjalan
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold ${st === "current" ? "text-white" : ""}`}>
                    {s.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Mekanik Teknisi: <strong className="text-slate-200">{order.mechanicName || "Teknisi PitCare Auto"}</strong>
            </span>
            <span>Update: {lastRefreshed.toLocaleTimeString("id-ID")}</span>
          </div>
        </div>

        {/* Diagnosis & Mechanic Findings */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            Catatan Keluhan & Hasil Pemeriksaan Teknisi
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 font-semibold block text-[11px] mb-1">
                Keluhan Awal Saat Masuk:
              </span>
              <p className="text-slate-300 italic leading-relaxed">
                &quot;{order.complaints}&quot;
              </p>
            </div>

            {order.diagnosis ? (
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                <span className="text-indigo-400 font-semibold block text-[11px] mb-1">
                  Hasil Analisis / Diagnosis Teknisi:
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {order.diagnosis}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-1">
                Teknisi sedang melakukan inspeksi awal pada unit kendaraan Anda.
              </p>
            )}
          </div>
        </div>

        {/* Itemized Services & Spareparts Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rincian Pekerjaan & Biaya Transparan
            </h3>
            <span className="text-xs text-slate-500">PitCare Auto Guarantee</span>
          </div>

          <div className="space-y-3">
            {/* Services */}
            <div>
              <p className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
                <span>🔧 Jasa Servis</span>
                <span className="font-mono text-emerald-400">{formatRupiah(order.totalServices)}</span>
              </p>
              {order.items.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">Belum ada item jasa servis.</p>
              ) : (
                <div className="space-y-1.5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                    >
                      <span className="text-slate-300">{item.serviceName}</span>
                      <span className="font-mono font-bold text-white">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spareparts */}
            <div className="pt-3 border-t border-slate-800">
              <p className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
                <span>📦 Suku Cadang Terpakai</span>
                <span className="font-mono text-emerald-400">{formatRupiah(order.totalParts)}</span>
              </p>
              {order.parts.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">Belum ada suku cadang terpakai.</p>
              ) : (
                <div className="space-y-1.5">
                  {order.parts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                    >
                      <span className="text-slate-300">
                        {p.partName} <span className="text-slate-500 font-mono">({p.qty}x)</span>
                      </span>
                      <span className="font-mono font-bold text-white">{formatRupiah(p.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between bg-slate-950 p-4 rounded-xl">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Estimasi Biaya
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatRupiah(order.grandTotal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">
                  Status Pembayaran:
                </span>
                <span className={`text-xs font-bold ${order.paymentStatus === "PAID" ? "text-emerald-400" : "text-amber-400"}`}>
                  {order.paymentStatus === "PAID" ? "✓ LUNAS" : "⏳ Menunggu Pembayaran"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Assistance Button & Workshop Guarantee */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 text-center space-y-3">
          <h4 className="text-sm font-bold text-white">Butuh Konfirmasi atau Pertanyaan Servis?</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Tim teknisi dan penasihat servis PitCare Auto siap membantu pertanyaan seputar estimasi waktu dan suku cadang.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/6281234567890?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all"
            >
              <span>📱 Hubungi Tim PitCare Auto via WhatsApp</span>
            </a>
          </div>
          <p className="text-[10px] text-slate-500 pt-2">
            Garansi servis resmi PitCare Auto berlaku 7 hari / 500 KM setelah pengerjaan selesai.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-slate-500 border-t border-slate-850">
          <p>© {new Date().getFullYear()} PitCare Auto — Sistem Manajemen Bengkel Modern</p>
        </div>
      </div>
    </div>
  );
}
