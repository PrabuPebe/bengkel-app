"use client";

import { use, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import {
  ServiceOrder,
  ServicesCatalog,
  PartsInventory,
  ServiceStatus,
} from "@/lib/types/database";
import {
  getServiceOrderByIdAction,
  updateServiceStatusAction,
  addServiceOrderItemAction,
  removeServiceOrderItemAction,
  addServiceOrderPartAction,
  removeServiceOrderPartAction,
} from "@/lib/actions/orders";
import { getServicesAction } from "@/lib/actions/services";
import { getPartsAction } from "@/lib/actions/parts";

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
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ServiceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [copiedLink, setCopiedLink] = useState(false);

  const [availableServices, setAvailableServices] = useState<ServicesCatalog[]>([]);
  const [availableParts, setAvailableParts] = useState<PartsInventory[]>([]);

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQty, setPartQty] = useState(1);
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getServiceOrderByIdAction(resolvedParams.id),
      getServicesAction(),
      getPartsAction(),
    ]).then(([orderData, servicesData, partsData]) => {
      if (active) {
        if (orderData) {
          setOrder(orderData);
          setDiagnosisInput(orderData.diagnosis || "");
        }
        setAvailableServices(servicesData.filter((s) => s.isActive));
        setAvailableParts(partsData);
        setIsLoading(false);
      }
    });
    return () => { active = false; };
  }, [resolvedParams.id]);

  function handleStatusChange(newStatus: ServiceStatus, finalDiagnosis?: string) {
    if (!order) return;
    setActionError("");
    startTransition(async () => {
      const res = await updateServiceStatusAction(order.id, newStatus, finalDiagnosis ?? diagnosisInput);
      if (res.success && res.data) {
        setOrder(res.data);
        setIsCompleteModalOpen(false);
        router.refresh();
      } else {
        setActionError(res.error || "Gagal mengubah status servis.");
      }
    });
  }

  function handleSaveDiagnosis() {
    if (!order) return;
    handleStatusChange(order.status, diagnosisInput);
  }

  function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !selectedServiceId) return;
    setActionError("");
    startTransition(async () => {
      const res = await addServiceOrderItemAction(order.id, selectedServiceId);
      if (res.success && res.data) {
        setOrder(res.data);
        setIsAddServiceModalOpen(false);
        setSelectedServiceId("");
      } else {
        setActionError(res.error || "Gagal menambahkan jasa.");
      }
    });
  }

  function handleRemoveService(itemId: string) {
    if (!order || !confirm("Hapus tindakan jasa servis ini?")) return;
    startTransition(async () => {
      const res = await removeServiceOrderItemAction(order.id, itemId);
      if (res.success && res.data) setOrder(res.data);
    });
  }

  function handleAddPart(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !selectedPartId) return;
    setActionError("");
    const part = availableParts.find((p) => p.id === selectedPartId);
    if (!part || part.stock < partQty) {
      setActionError(`Stok tidak mencukupi! Stok saat ini: ${part?.stock || 0}`);
      return;
    }
    startTransition(async () => {
      const res = await addServiceOrderPartAction(order.id, selectedPartId, partQty);
      if (res.success && res.data) {
        setOrder(res.data);
        setIsAddPartModalOpen(false);
        setSelectedPartId("");
        setPartQty(1);
        getPartsAction().then(setAvailableParts);
      } else {
        setActionError(res.error || "Gagal menambahkan suku cadang.");
      }
    });
  }

  function handleRemovePart(partItemId: string) {
    if (!order || !confirm("Hapus pemakaian suku cadang ini? Stok akan dikembalikan ke gudang.")) return;
    startTransition(async () => {
      const res = await removeServiceOrderPartAction(order.id, partItemId);
      if (res.success && res.data) {
        setOrder(res.data);
        getPartsAction().then(setAvailableParts);
      }
    });
  }

  function handleQuickAddPart(partId: string) {
    if (!order) return;
    setActionError("");
    const part = availableParts.find((p) => p.id === partId);
    if (!part || part.stock < 1) {
      setActionError(`Stok ${part?.name || "part"} tidak mencukupi!`);
      return;
    }
    startTransition(async () => {
      const res = await addServiceOrderPartAction(order.id, partId, 1);
      if (res.success && res.data) {
        setOrder(res.data);
        getPartsAction().then(setAvailableParts);
      } else {
        setActionError(res.error || "Gagal menambahkan suku cadang rekomendasi.");
      }
    });
  }

  function handleCopyTrackingLink() {
    if (!order) return;
    const trackingUrl = `${window.location.origin}/track/${order.token}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  if (isLoading) {
    return (
      <div className="p-24 text-center text-slate-400 card-pitstop">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Memuat rincian Work Order PitCare Auto...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-16 text-center card-pitstop max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-xl bg-rose-950/40 text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold border border-rose-500/40">
          !
        </div>
        <h2 className="text-base font-bold text-slate-100 mb-2">Work Order Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400 mb-6">
          Nomor SPK atau ID yang dicari tidak tersedia dalam database PitCare Auto.
        </p>
        <Link href="/services" className="btn-cyan inline-flex items-center px-5 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20">
          ← Kembali ke Daftar SPK
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "ANTRIAN", label: "1. Antrian Pit", desc: "Menunggu giliran mekanik" },
    { key: "PENGERJAAN", label: "2. Pengerjaan Pit", desc: "Tindakan & perbaikan" },
    { key: "SELESAI_PENGERJAAN", label: "3. Siap Kasir", desc: "Pengerjaan tuntas" },
    { key: "SELESAI_PEMBAYARAN", label: "4. Faktur Lunas", desc: "Selesai di kasir" },
  ];

  const getStepStatus = (stepKey: string) => {
    const orderIndexMap: Record<string, number> = {
      ANTRIAN: 1, PENGERJAAN: 2, MENUNGGU_PART: 2.5, SELESAI_PENGERJAAN: 3, SELESAI_PEMBAYARAN: 4,
    };
    const currentIdx = orderIndexMap[order.status] || 0;
    const thisIdx = orderIndexMap[stepKey] || 0;
    if (currentIdx > thisIdx) return "completed";
    if (Math.floor(currentIdx) === Math.floor(thisIdx)) return "current";
    return "upcoming";
  };

  // Odometer & Smart Recommendation Calculation for Mechanic
  const currentKmNum = order.currentKm || 0;
  const isEditableOrder = order.status !== "SELESAI_PEMBAYARAN" && order.status !== "DIBATALKAN";
  const recommendedSmartParts = availableParts.filter((p) => {
    const text = `${order.complaints} ${order.items.map((i) => i.serviceName).join(" ")}`.toLowerCase();
    const partText = `${p.name} ${p.category}`.toLowerCase();
    if (currentKmNum >= 24000 && (partText.includes("belt") || partText.includes("oli") || partText.includes("roller"))) return true;
    if (currentKmNum >= 3000 && (partText.includes("oli") || partText.includes("busi"))) return true;
    if (text.includes("cvt") && (partText.includes("cvt") || partText.includes("roller") || partText.includes("belt"))) return true;
    if (text.includes("rem") && (partText.includes("rem") || partText.includes("kampas"))) return true;
    if (text.includes("oli") && partText.includes("oli")) return true;
    return false;
  }).slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ODOMETER LIFESPAN ALERT & SMART RECOMMENDATION PANEL */}
      {isEditableOrder && (currentKmNum >= 3000 || recommendedSmartParts.length > 0) && (
        <div
          className={`p-4 rounded-2xl border ${
            currentKmNum >= 24000
              ? "bg-rose-950/35 border-rose-500/50"
              : "bg-amber-950/30 border-amber-500/40"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    currentKmNum >= 24000 ? "bg-rose-500 text-white" : "bg-amber-400 text-slate-950"
                  }`}
                >
                  {currentKmNum >= 24000 ? "⚠️ Odometer Critical Alert" : "💡 Smart Service Recommendation"}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {currentKmNum >= 24000
                    ? `Perhatian: Odometer telah mencapai ${currentKmNum.toLocaleString("id-ID")} KM. Direkomendasikan ganti V-Belt & Oli hari ini!`
                    : currentKmNum >= 3000
                    ? `Perhatian: Odometer telah mencapai ${currentKmNum.toLocaleString("id-ID")} KM. Direkomendasikan ganti Oli Mesin & Busi hari ini!`
                    : "Rekomendasi Suku Cadang Cerdas Berdasarkan Keluhan & Paket Servis"}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Klik tombol 1-Klik di bawah untuk langsung memasukkan komponen rekomendasi ke rincian SPK ini:
              </p>
            </div>
          </div>

          {recommendedSmartParts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
              {recommendedSmartParts.map((rp) => {
                const inOrder = order.parts.find((op) => op.partId === rp.id);
                return (
                  <div
                    key={rp.id}
                    className="p-2.5 rounded-xl bg-[#0B0F19]/90 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{rp.name}</p>
                      <p className="text-[10px] font-mono text-cyan-400">
                        {formatRupiah(rp.sellPrice)} • {rp.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickAddPart(rp.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold shrink-0 cursor-pointer transition-all ${
                        inOrder
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-400 hover:bg-amber-300 text-slate-950"
                      }`}
                    >
                      {inOrder ? `✓ Ada (${inOrder.qty})` : "+ 1-Klik Pakai"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="p-2.5 rounded-xl bg-[#0F172A] border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-all cursor-pointer"
            title="Kembali ke Daftar SPK"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                {order.orderNumber}
              </h1>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#0B0F17] text-cyan-400 border border-cyan-500/30 font-black tracking-wider shadow-inner">
                {order.vehicle?.plateNumber}
              </span>
              <span className="text-xs text-slate-300 font-bold">
                ({order.vehicle?.brand} {order.vehicle?.model})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Token: <span className="font-mono text-cyan-400 font-bold">{order.token}</span></span>
              <span className="text-slate-700">•</span>
              <span>Diterima: {formatDate(order.entryDate)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyTrackingLink}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-[#0F172A] border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? "✓ Tersalin!" : "🔗 Salin Link Tracking"}
          </button>

          <Link
            href={`/track/${order.token}`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-400 bg-[#0F172A] border border-cyan-500/30 hover:bg-cyan-500/15 hover:border-cyan-500 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Buka Pelacakan ↗
          </Link>

          {order.status === "SELESAI_PENGERJAAN" && (
            <Link
              href={`/cashier/${order.id}`}
              className="btn-cyan flex items-center gap-2 px-4 py-2 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              Proses Bayar Kasir 💳
            </Link>
          )}

          {order.status === "SELESAI_PEMBAYARAN" && (
            <Link
              href={`/cashier/${order.id}`}
              className="btn-electric flex items-center gap-2 px-4 py-2 text-xs cursor-pointer"
            >
              Cetak Faktur Kasir 🖨️
            </Link>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError("")} className="text-rose-400 hover:text-rose-200 ml-4 cursor-pointer font-bold">✕</button>
        </div>
      )}

      {/* Pipeline Stepper */}
      <div className="card-pitstop p-6 sm:p-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    st === "completed" ? "text-cyan-400" : st === "current" ? "text-cyan-300" : "text-slate-500"
                  }`}>
                    Tahap {idx + 1}
                  </span>
                  {st === "completed" && <span className="text-xs font-bold text-cyan-400">✓</span>}
                  {st === "current" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500 text-black">
                      {order.status === "MENUNGGU_PART" ? "Tunda" : "Aktif"}
                    </span>
                  )}
                </div>
                <p className={`text-xs font-bold ${
                  st === "completed" ? "text-slate-200" : st === "current" ? "text-white" : "text-slate-400"
                }`}>
                  {s.label}
                </p>
                <p className={`text-[11px] mt-0.5 leading-snug ${
                  st === "completed" ? "text-slate-400" : st === "current" ? "text-slate-300" : "text-slate-600"
                }`}>{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Status Controls */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Status: <span className="font-bold text-slate-200">{order.status.replace("_", " ")}</span></span>
            <span className="text-slate-700">•</span>
            <span>Teknisi: <span className="font-bold text-slate-200">{order.mechanicName || "Teknisi PitCare Auto"}</span></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {order.status === "ANTRIAN" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="btn-cyan flex items-center gap-2 px-5 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                🚀 Mulai Pengerjaan Pit
              </button>
            )}

            {order.status === "PENGERJAAN" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleStatusChange("MENUNGGU_PART")}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-950/40 border border-purple-500/40 hover:bg-purple-900/40 transition-all cursor-pointer"
                >
                  ⏸️ Tunda: Menunggu Part
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="btn-cyan flex items-center gap-2 px-5 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  ✅ Selesaikan Pengerjaan
                </button>
              </>
            )}

            {order.status === "MENUNGGU_PART" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="btn-cyan flex items-center gap-2 px-5 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                ▶️ Part Siap: Lanjutkan
              </button>
            )}

            {order.status === "SELESAI_PENGERJAAN" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-[#0F172A] border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
              >
                ↩️ Kembalikan ke Pit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer & Vehicle Card */}
        <div className="card-pitstop p-6 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800">
            Identitas Pelanggan & Unit
          </h2>
          <div>
            <p className="text-[11px] text-slate-400">Pemilik Kendaraan</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">{order.customer?.name}</p>
            <a
              href={`https://wa.me/${order.customer?.phone?.replace(/^0/, "62")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:underline mt-1"
            >
              📱 WhatsApp: {order.customer?.phone}
            </a>
          </div>
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[11px] text-slate-400">Kendaraan</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">
              {order.vehicle?.brand} {order.vehicle?.model}
            </p>
            <p className="font-mono text-xs font-bold text-cyan-400 mt-0.5">{order.vehicle?.plateNumber}</p>
            {order.currentKm && (
              <p className="text-xs text-slate-400 mt-1">
                KM: <span className="font-mono font-bold text-slate-200">{order.currentKm.toLocaleString("id-ID")} KM</span>
              </p>
            )}
          </div>
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[11px] text-slate-400">Keluhan Masuk</p>
            <p className="text-xs text-slate-300 mt-1 italic leading-relaxed">
              &quot;{order.complaints}&quot;
            </p>
          </div>
        </div>

        {/* Diagnosis Card */}
        <div className="lg:col-span-2 card-pitstop p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Catatan Pemeriksaan & Diagnosis
              </h2>
              <span className="text-[11px] text-slate-400">
                Mekanik: <strong className="text-slate-200">{order.mechanicName}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Tuliskan temuan masalah teknis, rekomendasi perbaikan, atau kondisi hasil uji jalan:
            </p>
            <textarea
              rows={4}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              placeholder="Contoh: Busi aus renggang, seal shock kanan rembes oli, v-belt mulai retak rambut..."
              className="input-custom w-full p-3.5 text-xs leading-relaxed"
            />
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              {order.diagnosis ? "✓ Catatan tersimpan" : "Belum ada catatan diagnosis"}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveDiagnosis}
              className="btn-cyan px-4 py-2 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              Simpan Catatan
            </button>
          </div>
        </div>
      </div>

      {/* Tindakan Jasa */}
      <div className="card-pitstop p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              🔧 Tindakan Jasa Servis
              <span className="text-xs font-normal text-slate-400">({order.items.length} tindakan)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Pekerjaan jasa yang dikerjakan teknisi pada unit ini.</p>
          </div>
          {order.status !== "SELESAI_PEMBAYARAN" && (
            <button
              type="button"
              onClick={() => { setActionError(""); setIsAddServiceModalOpen(true); }}
              className="btn-cyan px-4 py-2 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              + Tambah Jasa Servis
            </button>
          )}
        </div>

        {order.items.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">Belum ada tindakan jasa yang dicatat.</p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Nama Jasa Servis</th>
                  <th className="py-3 px-3 text-right">Biaya Satuan</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  {order.status !== "SELESAI_PEMBAYARAN" && <th className="py-3 px-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {order.items.map((item) => (
                  <tr key={item.id} className="text-slate-200 hover:bg-cyan-500/5 transition-colors">
                    <td className="py-3.5 px-3 font-bold">{item.serviceName}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">{formatRupiah(item.price)}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-cyan-300">{item.qty}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-cyan-400">{formatRupiah(item.subtotal)}</td>
                    {order.status !== "SELESAI_PEMBAYARAN" && (
                      <td className="py-3.5 px-3 text-right">
                        <button type="button" onClick={() => handleRemoveService(item.id)} className="text-rose-400 hover:bg-rose-500/20 p-1.5 rounded-lg transition-colors cursor-pointer" title="Hapus Jasa">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <p className="text-xs text-slate-400">
            Subtotal Jasa: <span className="font-mono font-black text-cyan-400 ml-1.5">{formatRupiah(order.totalServices)}</span>
          </p>
        </div>
      </div>

      {/* Suku Cadang */}
      <div className="card-pitstop p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              📦 Suku Cadang Terpakai
              <span className="text-xs font-normal text-slate-400">({order.parts.length} part)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Stok gudang dipotong otomatis dan dikembalikan jika dibatalkan.</p>
          </div>
          {order.status !== "SELESAI_PEMBAYARAN" && (
            <button
              type="button"
              onClick={() => { setActionError(""); setIsAddPartModalOpen(true); }}
              className="btn-cyan px-4 py-2 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              + Ambil Suku Cadang
            </button>
          )}
        </div>

        {order.parts.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">Belum ada pemakaian suku cadang.</p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Nama Suku Cadang</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  {order.status !== "SELESAI_PEMBAYARAN" && <th className="py-3 px-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {order.parts.map((p) => (
                  <tr key={p.id} className="text-slate-200 hover:bg-cyan-500/5 transition-colors">
                    <td className="py-3.5 px-3 font-bold">{p.partName}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">{formatRupiah(p.sellPrice)}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-cyan-300">{p.qty}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-cyan-400">{formatRupiah(p.subtotal)}</td>
                    {order.status !== "SELESAI_PEMBAYARAN" && (
                      <td className="py-3.5 px-3 text-right">
                        <button type="button" onClick={() => handleRemovePart(p.id)} className="text-rose-400 hover:bg-rose-500/20 p-1.5 rounded-lg transition-colors cursor-pointer" title="Kembalikan Part">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <p className="text-xs text-slate-400">
            Subtotal Suku Cadang: <span className="font-mono font-black text-cyan-400 ml-1.5">{formatRupiah(order.totalParts)}</span>
          </p>
        </div>
      </div>

      {/* Grand Total */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#0B0F17] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-inner">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rekapitulasi SPK</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span>Jasa: <strong className="font-mono text-cyan-400">{formatRupiah(order.totalServices)}</strong></span>
            <span className="text-slate-700">•</span>
            <span>Sparepart: <strong className="font-mono text-cyan-400">{formatRupiah(order.totalParts)}</strong></span>
            {order.discount > 0 && (
              <>
                <span className="text-slate-700">•</span>
                <span className="text-rose-400 font-mono">Diskon: -{formatRupiah(order.discount)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase">Grand Total:</span>
          <span className="text-3xl font-black font-mono text-cyan-400 drop-shadow-[0_0_15px_rgba(0,210,255,0.4)]">{formatRupiah(order.grandTotal)}</span>
        </div>
      </div>

      {/* Modal Tambah Jasa */}
      <Modal isOpen={isAddServiceModalOpen} onClose={() => setIsAddServiceModalOpen(false)} title="Tambahkan Tindakan Jasa" description="Pilih jenis pekerjaan dari katalog bengkel PitCare Auto.">
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pilih Jasa Servis *</label>
            <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} required className="input-custom w-full h-11 px-3.5 text-xs cursor-pointer">
              <option value="">-- Pilih dari Katalog Jasa --</option>
              {availableServices.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {formatRupiah(s.price)} (~{s.duration || 30} mnt)</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsAddServiceModalOpen(false)} className="px-4 py-2 text-xs rounded-xl bg-[#0F172A] text-slate-300 border border-slate-700 hover:border-slate-600 cursor-pointer">Batal</button>
            <button type="submit" disabled={isPending || !selectedServiceId} className="btn-cyan px-5 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-60">
              {isPending ? "Menambahkan..." : "Tambah ke SPK"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ambil Suku Cadang */}
      <Modal isOpen={isAddPartModalOpen} onClose={() => setIsAddPartModalOpen(false)} title="Ambil Suku Cadang dari Gudang" description="Stok gudang akan otomatis dipotong sesuai kuantitas pemakaian.">
        <form onSubmit={handleAddPart} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pilih Suku Cadang *</label>
            <select value={selectedPartId} onChange={(e) => setSelectedPartId(e.target.value)} required className="input-custom w-full h-11 px-3.5 text-xs cursor-pointer">
              <option value="">-- Pilih Suku Cadang --</option>
              {availableParts.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} ({p.sku}) — {formatRupiah(p.sellPrice)} [Stok: {p.stock} {p.unit}]
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jumlah Pemakaian (Qty) *</label>
            <input type="number" min={1} value={partQty} onChange={(e) => setPartQty(parseInt(e.target.value, 10) || 1)} required className="input-custom w-full h-11 px-3.5 text-xs font-mono" />
          </div>
          {actionError && <p className="text-xs text-rose-400 font-medium">{actionError}</p>}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsAddPartModalOpen(false)} className="px-4 py-2 text-xs rounded-xl bg-[#0F172A] text-slate-300 border border-slate-700 hover:border-slate-600 cursor-pointer">Batal</button>
            <button type="submit" disabled={isPending || !selectedPartId} className="btn-cyan px-5 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-60">
              {isPending ? "Memproses..." : "Ambil & Pasang"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Selesai */}
      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Konfirmasi Pengerjaan Selesai" description="Unit kendaraan akan ditandai selesai dan siap ditagih di terminal kasir.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hasil Akhir Pemeriksaan *</label>
            <textarea
              rows={3}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              placeholder="Contoh: Seluruh pengerjaan tuntas, oli mesin dan filter baru, mesin ditest normal dan responsif."
              className="input-custom w-full p-3.5 text-xs leading-relaxed"
            />
          </div>
          <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-cyan-500/30 text-slate-300 text-xs shadow-inner">
            💡 Setelah diselesaikan, SPK ini langsung muncul di <strong>Kasir & Billing</strong> siap untuk ditagih.
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="px-4 py-2 text-xs rounded-xl bg-[#0F172A] text-slate-300 border border-slate-700 hover:border-slate-600 cursor-pointer">Batal</button>
            <button type="button" disabled={isPending} onClick={() => handleStatusChange("SELESAI_PENGERJAAN", diagnosisInput)} className="btn-cyan px-5 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-60">
              {isPending ? "Memproses..." : "Konfirmasi Selesai Servis"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
