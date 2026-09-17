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
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Menghubungkan ke Bengkelku Live Tracker...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400 text-2xl font-bold mb-4 shadow-lg">
          !
        </div>
        <h1 className="text-xl font-bold text-slate-100 mb-2">Token Pelacakan Tidak Ditemukan</h1>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          Link pelacakan atau nomor token yang Anda masukkan tidak terdaftar dalam sistem Bengkelku. Pastikan Anda mengklik tautan resmi dari pesan WhatsApp kami.
        </p>
        <Link
          href="/"
          className="btn-cyan px-5 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const waMessage = encodeURIComponent(
    `Halo Bengkelku, saya ingin menanyakan perkembangan servis kendaraan saya:\n- No. SPK: ${order.orderNumber}\n- Plat Nomor: ${order.vehicle?.plateNumber || "-"}\n- Pemilik: ${order.customer?.name || "-"}\nMohon informasinya. Terima kasih!`
  );

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 antialiased py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Branding Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-black text-base shadow-lg shadow-cyan-500/20">
              BK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">BENGKELKU</h1>
                <span className="badge-selesai-pengerjaan">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-[#0F172A] border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Muat ulang status terbaru"
          >
            <span className={`inline-block ${isRefreshing ? "animate-spin" : ""}`}>🔄</span>
            <span className="hidden sm:inline">{isRefreshing ? "Memperbarui..." : "Segarkan"}</span>
          </button>
        </div>

        {/* Live Status Hero Card */}
        <div className="card-pitstop p-6 sm:p-7 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-[#0F172A] text-slate-300 border border-slate-700">
                  {order.orderNumber}
                </span>
                <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-[#0B0F17] text-cyan-400 border border-cyan-500/30 tracking-wider shadow-inner">
                  {order.vehicle?.plateNumber}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-[#0B0F17] border border-cyan-500/40 text-cyan-300 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
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
        <div className="card-pitstop p-6 sm:p-7">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 pb-3 border-b border-slate-800">
            Tahapan Pengerjaan Unit Kendaraan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {steps.map((s, idx) => {
              const st = getStepStatus(s.key);
              return (
                <div
                  key={s.key}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    st === "current"
                      ? "bg-gradient-to-b from-cyan-950/50 to-blue-950/40 border-cyan-500 shadow-md shadow-cyan-500/20"
                      : st === "completed"
                        ? "bg-blue-950/30 text-slate-200 border-blue-600/50"
                        : "bg-[#0B0F17]/50 border-slate-800 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      st === "completed" ? "text-cyan-400" : st === "current" ? "text-cyan-300" : "text-slate-500"
                    }`}>
                      Langkah {idx + 1}
                    </span>
                    {st === "completed" && (
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                        ✓ Selesai
                      </span>
                    )}
                    {st === "current" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-black">
                        Berjalan
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold ${
                    st === "completed" ? "text-slate-200" : st === "current" ? "text-white" : "text-slate-400"
                  }`}>
                    {s.label}
                  </p>
                  <p className={`text-[11px] mt-1 leading-snug ${
                    st === "completed" ? "text-slate-400" : st === "current" ? "text-slate-300" : "text-slate-600"
                  }`}>{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Teknisi Ahli: <strong className="text-slate-200">{order.mechanicName || "Teknisi Bengkelku"}</strong>
            </span>
            <span className="font-mono">Update Real-time: {lastRefreshed.toLocaleTimeString("id-ID")}</span>
          </div>
        </div>

        {/* Diagnosis & Mechanic Findings */}
        <div className="card-pitstop p-6 sm:p-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800">
            Catatan Keluhan & Hasil Pemeriksaan Teknisi
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800">
              <span className="text-slate-400 font-semibold block text-[11px] mb-1">
                Keluhan Awal Saat Masuk:
              </span>
              <p className="text-slate-200 italic leading-relaxed">
                &quot;{order.complaints}&quot;
              </p>
            </div>

            {order.diagnosis ? (
              <div className="p-4 rounded-xl bg-[#0B0F17] border border-cyan-500/30">
                <span className="text-cyan-400 font-bold block text-[11px] mb-1">
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
        <div className="card-pitstop p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rincian Pekerjaan & Biaya Transparan
            </h3>
            <span className="text-xs text-cyan-400 font-mono">Bengkelku Guarantee</span>
          </div>

          <div className="space-y-4">
            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span>🔧 Tindakan Jasa Servis</span>
                </p>
                <span className="font-mono font-black text-cyan-400 text-xs">
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
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#0F172A] border border-slate-800"
                    >
                      <span className="text-slate-200 font-semibold">{item.serviceName}</span>
                      <span className="font-mono font-black text-cyan-400">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spareparts */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span>📦 Suku Cadang Terpakai</span>
                </p>
                <span className="font-mono font-black text-cyan-400 text-xs">
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
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#0F172A] border border-slate-800"
                    >
                      <span className="text-slate-200">
                        <strong className="font-bold">{p.partName}</strong>{" "}
                        <span className="text-slate-400 font-mono text-[11px]">({p.qty}x)</span>
                      </span>
                      <span className="font-mono font-black text-cyan-400">{formatRupiah(p.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between bg-[#0B0F17] p-5 rounded-2xl border border-cyan-500/30 shadow-inner">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Estimasi Biaya
                </span>
                <span className="text-2xl font-black font-mono text-cyan-400 drop-shadow-[0_0_12px_rgba(0,210,255,0.3)] mt-0.5 block">
                  {formatRupiah(order.grandTotal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block mb-1 font-medium">
                  Status Pembayaran:
                </span>
                <span
                  className={order.paymentStatus === "PAID" ? "badge-selesai-pembayaran" : "badge-antrian"}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      order.paymentStatus === "PAID" ? "bg-teal-400" : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  {order.paymentStatus === "PAID" ? "LUNAS" : "Menunggu Pembayaran"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Assistance Button */}
        <div className="card-pitstop p-6 sm:p-7 text-center space-y-3">
          <h4 className="text-sm font-bold text-slate-100">Butuh Informasi Tambahan Mengenai Pengerjaan?</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Tim teknisi dan service advisor Bengkelku siap memberikan rincian progres atau konsultasi suku cadang.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/6281234567890?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-98"
            >
              <span>📱 Hubungi Tim Bengkelku via WhatsApp</span>
            </a>
          </div>
          <p className="text-[10px] text-slate-500 pt-2">
            Garansi servis resmi Bengkelku: 7 hari / 500 KM untuk kenyamanan dan kepuasan berkendara Anda.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-slate-500 border-t border-slate-800">
          <p>© {new Date().getFullYear()} Bengkelku — Platform Manajemen & Pelacakan Otomotif Modern</p>
        </div>
      </div>
    </div>
  );
}
