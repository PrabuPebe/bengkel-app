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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-600 font-medium">Menghubungkan ke PitCare Auto Live Tracker...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-rose-500 text-2xl font-bold mb-4">
          !
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Token Pelacakan Tidak Ditemukan</h1>
        <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
          Link pelacakan atau nomor token yang Anda masukkan tidak terdaftar dalam sistem PitCare Auto. Pastikan Anda mengklik tautan resmi dari pesan WhatsApp kami.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer"
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
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Branding Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-200">
              PA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">PITCARE AUTO</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Live Tracker
                </span>
              </div>
              <p className="text-xs text-slate-500">Portal Transparan Pelacakan Progres Servis</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            title="Muat ulang status terbaru"
          >
            <span className={`inline-block ${isRefreshing ? "animate-spin" : ""}`}>🔄</span>
            <span className="hidden sm:inline">{isRefreshing ? "Memperbarui..." : "Segarkan"}</span>
          </button>
        </div>

        {/* Live Status Hero Card */}
        <div className="card p-6 sm:p-7 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  {order.orderNumber}
                </span>
                <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {order.vehicle?.plateNumber}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {order.vehicle?.brand} {order.vehicle?.model}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pemilik: <strong className="text-slate-700">{order.customer?.name}</strong> • Masuk: {formatDate(order.entryDate)}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Status Operasional
              </span>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
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
        <div className="card p-6 sm:p-7">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100">
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
                      ? "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200"
                      : st === "completed"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                      Langkah {idx + 1}
                    </span>
                    {st === "completed" && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        ✓ Selesai
                      </span>
                    )}
                    {st === "current" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                        Berjalan
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold ${st === "current" ? "text-indigo-900" : ""}`}>
                    {s.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Teknisi Ahli: <strong className="text-slate-800">{order.mechanicName || "Teknisi PitCare Auto"}</strong>
            </span>
            <span>Update Real-time: {lastRefreshed.toLocaleTimeString("id-ID")}</span>
          </div>
        </div>

        {/* Diagnosis & Mechanic Findings */}
        <div className="card p-6 sm:p-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
            Catatan Keluhan & Hasil Pemeriksaan Teknisi
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-semibold block text-[11px] mb-1">
                Keluhan Awal Saat Masuk:
              </span>
              <p className="text-slate-800 italic leading-relaxed">
                &quot;{order.complaints}&quot;
              </p>
            </div>

            {order.diagnosis ? (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-indigo-700 font-semibold block text-[11px] mb-1">
                  Hasil Analisis / Diagnosis Teknisi:
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {order.diagnosis}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">
                Teknisi sedang melakukan inspeksi menyeluruh pada unit kendaraan Anda.
              </p>
            )}
          </div>
        </div>

        {/* Itemized Services & Spareparts Breakdown */}
        <div className="card p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rincian Pekerjaan & Biaya Transparan
            </h3>
            <span className="text-xs text-slate-400 font-mono">PitCare Auto Guarantee</span>
          </div>

          <div className="space-y-4">
            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🔧 Tindakan Jasa Servis</span>
                </p>
                <span className="font-mono text-emerald-700 font-bold text-xs">
                  {formatRupiah(order.totalServices)}
                </span>
              </div>
              {order.items.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Belum ada item jasa servis.</p>
              ) : (
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="text-slate-800 font-medium">{item.serviceName}</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spareparts */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📦 Suku Cadang Terpakai</span>
                </p>
                <span className="font-mono text-emerald-700 font-bold text-xs">
                  {formatRupiah(order.totalParts)}
                </span>
              </div>
              {order.parts.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Belum ada suku cadang terpakai.</p>
              ) : (
                <div className="space-y-2">
                  {order.parts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="text-slate-800">
                        {p.partName}{" "}
                        <span className="text-slate-400 font-mono text-[11px]">({p.qty}x)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(p.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Estimasi Biaya
                </span>
                <span className="text-2xl font-black font-mono text-emerald-700 mt-0.5 block">
                  {formatRupiah(order.grandTotal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block mb-1">
                  Status Pembayaran:
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      order.paymentStatus === "PAID" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  {order.paymentStatus === "PAID" ? "LUNAS" : "Menunggu Pembayaran"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Assistance Button */}
        <div className="card p-6 sm:p-7 text-center space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Butuh Informasi Tambahan Mengenai Pengerjaan?</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tim teknisi dan service advisor PitCare Auto siap memberikan rincian progres atau konsultasi suku cadang.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/6281234567890?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all cursor-pointer active:scale-95"
            >
              <span>📱 Hubungi Tim PitCare Auto via WhatsApp</span>
            </a>
          </div>
          <p className="text-[10px] text-slate-400 pt-2">
            Garansi servis resmi PitCare Auto: 7 hari / 500 KM untuk kenyamanan dan kepuasan berkendara Anda.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-slate-400 border-t border-slate-200">
          <p>© {new Date().getFullYear()} PitCare Auto — Platform Manajemen & Pelacakan Otomotif Modern</p>
        </div>
      </div>
    </div>
  );
}
