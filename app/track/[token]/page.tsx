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
    { key: "ANTRIAN", label: "Antrean Servis", desc: "Menunggu giliran mekanik" },
    { key: "PENGERJAAN", label: "Sedang Dikerjakan", desc: "Tindakan perbaikan & penggantian part" },
    { key: "SELESAI_PENGERJAAN", label: "Selesai Pengerjaan", desc: "Uji coba motor & siap ke kasir" },
    { key: "SELESAI_PEMBAYARAN", label: "Siap Diambil", desc: "Faktur lunas & siap serah terima" },
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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-9 h-9 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Menghubungkan ke PitCare Auto Live Tracker...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 text-2xl font-bold mb-4 shadow-xs">
          !
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1.5">Token Pelacakan Tidak Ditemukan</h1>
        <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
          Tautan pelacakan atau nomor token yang Anda akses tidak terdaftar dalam sistem PitCare Auto. Pastikan Anda mengklik tautan resmi yang dikirimkan melalui WhatsApp bengkel.
        </p>
        <Link
          href="/"
          className="btn-primary px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const waMessage = encodeURIComponent(
    `Halo PitCare Auto, saya ingin menanyakan perkembangan servis kendaraan saya:\n- No. Tiket: ${order.orderNumber}\n- Plat Nomor: ${order.vehicle?.plateNumber || "-"}\n- Pemilik: ${order.customer?.name || "-"}\nMohon informasinya. Terima kasih!`
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Branding Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
              PA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">PitCare Auto</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Tracking
                </span>
              </div>
              <p className="text-xs text-slate-500">Pelacakan Transparan Status Servis Kendaraan</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn-ghost px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Muat ulang status terbaru"
          >
            <span className={`inline-block ${isRefreshing ? "animate-spin" : ""}`}>🔄</span>
            <span className="hidden sm:inline">{isRefreshing ? "Memperbarui..." : "Segarkan"}</span>
          </button>
        </div>

        {/* Live Status Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {order.orderNumber}
                </span>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white tracking-wider">
                  {order.vehicle?.plateNumber}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {order.vehicle?.brand} {order.vehicle?.model}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pemilik: <strong className="text-slate-800">{order.customer?.name}</strong> • Masuk: {formatDate(order.entryDate)}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Status Saat Ini
              </span>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold text-xs bg-slate-100 border border-slate-200 text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {order.status === "ANTRIAN" && "Menunggu Antrean"}
                  {order.status === "PENGERJAAN" && "Sedang Dikerjakan"}
                  {order.status === "MENUNGGU_PART" && "Menunggu Suku Cadang"}
                  {order.status === "SELESAI_PENGERJAAN" && "Pengerjaan Selesai (Siap Kasir)"}
                  {order.status === "SELESAI_PEMBAYARAN" && "Lunas / Siap Diambil"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Step Progress Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
            Tahapan Pengerjaan Motor
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((s, idx) => {
              const st = getStepStatus(s.key);
              return (
                <div
                  key={s.key}
                  className={`p-4 rounded-xl border transition-all ${
                    st === "current"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : st === "completed"
                      ? "bg-slate-50 text-slate-800 border-slate-200"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        st === "completed"
                          ? "text-emerald-600"
                          : st === "current"
                          ? "text-slate-300"
                          : "text-slate-400"
                      }`}
                    >
                      Tahap {idx + 1}
                    </span>
                    {st === "completed" && (
                      <span className="text-xs font-bold text-emerald-600">✓ Selesai</span>
                    )}
                    {st === "current" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-900">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs font-bold ${
                      st === "current" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p
                    className={`text-[11px] mt-1 leading-snug ${
                      st === "current" ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Mekanik Bertugas: <strong className="text-slate-800">{order.mechanicName || "Mekanik PitCare Auto"}</strong>
            </span>
            <span className="font-mono text-[11px]">Update: {lastRefreshed.toLocaleTimeString("id-ID")}</span>
          </div>
        </div>

        {/* Diagnosis & Mechanic Findings */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
            Catatan Keluhan & Hasil Pemeriksaan Mekanik
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[11px] mb-1">
                Keluhan Awal Saat Masuk:
              </span>
              <p className="text-slate-800 italic leading-relaxed">
                &quot;{order.complaints}&quot;
              </p>
            </div>

            {order.diagnosis ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-900 font-bold block text-[11px] mb-1">
                  Catatan Tindakan & Pemeriksaan Mekanik:
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {order.diagnosis}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">
                Mekanik sedang melakukan inspeksi menyeluruh pada unit motor Anda.
              </p>
            )}
          </div>
        </div>

        {/* Itemized Services & Spareparts Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rincian Pekerjaan & Biaya Transparan
            </h3>
            <span className="text-xs text-emerald-700 font-semibold">Garansi Resmi PitCare</span>
          </div>

          <div className="space-y-4">
            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <span>🔧 Tindakan Jasa Servis</span>
                </p>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {formatRupiah(order.totalServices)}
                </span>
              </div>
              {order.items.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Belum ada item tindakan jasa.</p>
              ) : (
                <div className="space-y-1.5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border border-slate-200"
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
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <span>📦 Suku Cadang Terpakai</span>
                </p>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {formatRupiah(order.totalParts)}
                </span>
              </div>
              {order.parts.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Belum ada pemakaian suku cadang.</p>
              ) : (
                <div className="space-y-1.5">
                  {order.parts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <span className="text-slate-800">
                        <strong className="font-semibold">{p.partName}</strong>{" "}
                        <span className="text-slate-500 font-mono text-[11px]">({p.qty}x)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(p.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Grand Card */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-900 text-white p-5 sm:p-6 rounded-xl shadow-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Biaya Servis
                </span>
                <span className="text-2xl font-bold font-mono text-white mt-0.5 block">
                  {formatRupiah(order.grandTotal)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block mb-1 font-medium">
                  Status Pembayaran:
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-400 text-slate-950"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {order.paymentStatus === "PAID" ? "LUNAS" : "Menunggu Pembayaran"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Assistance Button */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 text-center space-y-3 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900">Butuh Informasi Tambahan Mengenai Pengerjaan?</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tim teknisi dan service advisor PitCare Auto siap memberikan informasi progres atau konsultasi suku cadang kendaraan Anda.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/6281234567890?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <span>📱 Hubungi Bengkel via WhatsApp</span>
            </a>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Garansi servis resmi PitCare Auto: 7 hari / 500 KM untuk kenyamanan dan keamanan berkendara Anda.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-slate-400 border-t border-slate-200">
          <p>© {new Date().getFullYear()} PitCare Auto — Sistem Operasional & Pelacakan Bengkel Modern</p>
        </div>
      </div>
    </div>
  );
}
