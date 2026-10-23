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
    return () => {
      active = false;
    };
  }, [resolvedParams.id]);

  function handleStatusChange(newStatus: ServiceStatus, finalDiagnosis?: string) {
    if (!order) return;
    setActionError("");
    startTransition(async () => {
      const res = await updateServiceStatusAction(
        order.id,
        newStatus,
        finalDiagnosis ?? diagnosisInput
      );
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
      setActionError(`Stok ${part?.name || "suku cadang"} tidak mencukupi!`);
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
      <div className="p-20 text-center bg-white rounded-xl border border-slate-200 text-slate-500 shadow-xs">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-900">Memuat rincian Tiket Servis PitCare Auto...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 max-w-lg mx-auto shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold border border-rose-200">
          !
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-2">Tiket Servis Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mb-6">
          Nomor Tiket atau ID yang dicari tidak tersedia dalam database PitCare Auto.
        </p>
        <Link
          href="/services"
          className="btn-primary inline-flex items-center px-4 py-2.5 text-xs font-semibold"
        >
          ← Kembali ke Antrean Servis
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "ANTRIAN", label: "1. Antrean Servis", desc: "Menunggu giliran mekanik" },
    { key: "PENGERJAAN", label: "2. Sedang Dikerjakan", desc: "Tindakan & perbaikan mekanik" },
    { key: "SELESAI_PENGERJAAN", label: "3. Siap Kasir", desc: "Pengerjaan tuntas, siap ditagih" },
    { key: "SELESAI_PEMBAYARAN", label: "4. Faktur Lunas", desc: "Pembayaran tuntas di kasir" },
  ];

  const getStepStatus = (stepKey: string) => {
    const orderIndexMap: Record<string, number> = {
      ANTRIAN: 1,
      PENGERJAAN: 2,
      MENUNGGU_PART: 2.5,
      SELESAI_PENGERJAAN: 3,
      SELESAI_PEMBAYARAN: 4,
    };
    const currentIdx = orderIndexMap[order.status] || 0;
    const thisIdx = orderIndexMap[stepKey] || 0;
    if (currentIdx > thisIdx) return "completed";
    if (Math.floor(currentIdx) === Math.floor(thisIdx)) return "current";
    return "upcoming";
  };

  const currentKmNum = order.currentKm || 0;
  const isEditableOrder = order.status !== "SELESAI_PEMBAYARAN" && order.status !== "DIBATALKAN";
  const recommendedSmartParts = availableParts
    .filter((p) => {
      const text = `${order.complaints} ${order.items.map((i) => i.serviceName).join(" ")}`.toLowerCase();
      const partText = `${p.name} ${p.category}`.toLowerCase();
      if (currentKmNum >= 24000 && (partText.includes("belt") || partText.includes("oli") || partText.includes("roller"))) return true;
      if (currentKmNum >= 3000 && (partText.includes("oli") || partText.includes("busi"))) return true;
      if (text.includes("cvt") && (partText.includes("cvt") || partText.includes("roller") || partText.includes("belt"))) return true;
      if (text.includes("rem") && (partText.includes("rem") || partText.includes("kampas"))) return true;
      if (text.includes("oli") && partText.includes("oli")) return true;
      return false;
    })
    .slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ODOMETER LIFESPAN ALERT & SMART RECOMMENDATION PANEL (DESAIN ELEGAN LINEAR) */}
      {isEditableOrder && (currentKmNum >= 3000 || recommendedSmartParts.length > 0) && (
        <div
          className={`p-5 rounded-xl border shadow-xs ${
            currentKmNum >= 24000
              ? "bg-rose-50/90 border-rose-200 text-rose-950"
              : "bg-amber-50/90 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase ${
                    currentKmNum >= 24000
                      ? "bg-rose-600 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {currentKmNum >= 24000 ? "⚠️ Peringatan Odometer Kritis" : "💡 Rekomendasi Servis Cerdas"}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {currentKmNum >= 24000
                    ? `Perhatian: Odometer mencapai ${currentKmNum.toLocaleString("id-ID")} KM. Sangat disarankan ganti V-Belt & Oli mesin hari ini!`
                    : currentKmNum >= 3000
                    ? `Perhatian: Odometer mencapai ${currentKmNum.toLocaleString("id-ID")} KM. Direkomendasikan ganti Oli Mesin & pengecekan Busi!`
                    : "Rekomendasi Suku Cadang Cerdas Berdasarkan Keluhan Motor"}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Pilih suku cadang di bawah untuk langsung memasukkannya ke rincian tiket servis ini:
              </p>
            </div>
          </div>

          {recommendedSmartParts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-200/80">
              {recommendedSmartParts.map((rp) => {
                const inOrder = order.parts.find((op) => op.partId === rp.id);
                return (
                  <div
                    key={rp.id}
                    className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{rp.name}</p>
                      <p className="text-xs font-mono text-slate-600">
                        {formatRupiah(rp.sellPrice)} • <span className="text-slate-500">{rp.category}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickAddPart(rp.id)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                        inOrder
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : currentKmNum >= 24000
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {inOrder ? `✓ Dipakai (${inOrder.qty})` : "+ 1-Klik"}
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
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Kembali ke Daftar Antrean Servis"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {order.orderNumber}
              </h1>
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-300 font-bold tracking-wider">
                {order.vehicle?.plateNumber}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                ({order.vehicle?.brand} {order.vehicle?.model})
              </span>
              {order.status === "MENUNGGU_PART" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  Menunggu Suku Cadang
                </span>
              )}
              {order.status === "PENGERJAAN" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  Sedang Dikerjakan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>Kode Pelacakan: <span className="font-mono font-semibold text-slate-800">{order.token}</span></span>
              <span className="text-slate-300">•</span>
              <span>Waktu Masuk: {formatDate(order.entryDate)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyTrackingLink}
            className="btn-ghost px-3.5 py-2 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            {copiedLink ? "✓ Link Tersalin!" : "🔗 Salin Link Pelacakan"}
          </button>

          <Link
            href={`/track/${order.token}`}
            target="_blank"
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Buka Pelacakan HP ↗
          </Link>

          {order.status === "SELESAI_PENGERJAAN" && (
            <Link
              href={`/cashier/${order.id}`}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Proses Bayar di Kasir 💳
            </Link>
          )}

          {order.status === "SELESAI_PEMBAYARAN" && (
            <Link
              href={`/cashier/${order.id}`}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Lihat Faktur Lunas 🖨️
            </Link>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-rose-600 hover:text-rose-900 ml-4 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stepper Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        {order.status === "MENUNGGU_PART" && (
          <div className="mb-5 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
              <div>
                <span className="font-bold text-sm text-purple-950">Status: Menunggu Suku Cadang (Dijeda)</span>
                <p className="text-xs text-purple-800 mt-0.5">
                  Pengerjaan servis dijeda sementara hingga suku cadang tersedia dari gudang atau distributor.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("PENGERJAAN")}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer shrink-0 shadow-xs"
            >
              ▶️ Lanjutkan Pengerjaan (Part Sudah Ada)
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((s, idx) => {
            const st = getStepStatus(s.key);
            return (
              <div
                key={s.key}
                className={`p-4 rounded-xl border transition-all ${
                  st === "current"
                    ? order.status === "MENUNGGU_PART"
                      ? "bg-purple-50 border-purple-300 text-purple-950"
                      : "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : st === "completed"
                    ? "bg-slate-50 text-slate-800 border-slate-200"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      st === "completed"
                        ? "text-emerald-600"
                        : st === "current"
                        ? order.status === "MENUNGGU_PART"
                          ? "text-purple-700"
                          : "text-slate-300"
                        : "text-slate-400"
                    }`}
                  >
                    Tahap {idx + 1}
                  </span>
                  {st === "completed" && <span className="text-xs font-bold text-emerald-600">✓</span>}
                  {st === "current" && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        order.status === "MENUNGGU_PART"
                          ? "bg-purple-200 text-purple-900"
                          : "bg-white text-slate-900"
                      }`}
                    >
                      {order.status === "MENUNGGU_PART" ? "Tertunda" : "Aktif"}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs font-bold ${
                    st === "current" && order.status !== "MENUNGGU_PART" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {s.label}
                </p>
                <p
                  className={`text-[11px] mt-0.5 leading-snug ${
                    st === "current" && order.status !== "MENUNGGU_PART" ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Status Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              Status Saat Ini:{" "}
              <span className="font-semibold text-slate-900">
                {order.status === "MENUNGGU_PART"
                  ? "Menunggu Suku Cadang"
                  : order.status === "PENGERJAAN"
                  ? "Sedang Dikerjakan"
                  : order.status === "ANTRIAN"
                  ? "Antrean Servis"
                  : order.status === "SELESAI_PENGERJAAN"
                  ? "Siap Bayar di Kasir"
                  : order.status === "SELESAI_PEMBAYARAN"
                  ? "Faktur Lunas"
                  : order.status}
              </span>
            </span>
            <span>•</span>
            <span>
              Teknisi / Mekanik:{" "}
              <strong className="text-slate-800">{order.mechanicName || "Mekanik PitCare"}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {order.status === "ANTRIAN" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer shadow-xs"
              >
                🚀 Mulai Pengerjaan
              </button>
            )}

            {order.status === "PENGERJAAN" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleStatusChange("MENUNGGU_PART")}
                  className="px-3.5 py-2.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  ⏸️ Tunda: Tunggu Suku Cadang
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer shadow-xs"
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
                className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer shadow-xs"
              >
                ▶️ Lanjutkan Pengerjaan (Part Sudah Ada)
              </button>
            )}

            {order.status === "SELESAI_PENGERJAAN" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="btn-ghost px-3.5 py-2 text-xs font-semibold cursor-pointer"
              >
                ↩️ Kembalikan ke Proses Pengerjaan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer & Vehicle Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100">
            Identitas Pelanggan & Kendaraan
          </h2>
          <div>
            <p className="text-[11px] text-slate-500">Pemilik Kendaraan</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{order.customer?.name}</p>
            <a
              href={`https://wa.me/${order.customer?.phone?.replace(/^0/, "62")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline mt-1 font-mono"
            >
              📱 WhatsApp: {order.customer?.phone}
            </a>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500">Kendaraan</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {order.vehicle?.brand} {order.vehicle?.model}
            </p>
            <p className="font-mono text-xs font-bold text-slate-800 mt-0.5">{order.vehicle?.plateNumber}</p>
            {order.currentKm && (
              <p className="text-xs text-slate-600 mt-1">
                Kilometer: <span className="font-mono font-bold text-slate-900">{order.currentKm.toLocaleString("id-ID")} KM</span>
              </p>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500">Keluhan Pelanggan</p>
            <p className="text-xs text-slate-700 mt-1 italic leading-relaxed">
              &quot;{order.complaints}&quot;
            </p>
          </div>
        </div>

        {/* Diagnosis / Catatan Perbaikan Mekanik */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Catatan Perbaikan Mekanik
              </h2>
              <span className="text-xs text-slate-500">
                Mekanik: <strong className="text-slate-800">{order.mechanicName || "Mekanik PitCare"}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Tuliskan temuan masalah teknis, catatan perbaikan, atau kondisi hasil uji coba jalan motor:
            </p>
            <textarea
              rows={4}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              placeholder="Contoh: Busi aus renggang, seal shock kanan rembes oli, v-belt mulai retak rambut..."
              className="input-dark w-full p-3.5 text-xs leading-relaxed"
            />
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {order.diagnosis ? "✓ Catatan tersimpan" : "Belum ada catatan perbaikan"}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveDiagnosis}
              className="btn-primary px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Simpan Catatan
            </button>
          </div>
        </div>
      </div>

      {/* Tindakan Jasa Servis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              🔧 Tindakan Jasa Servis
              <span className="text-xs font-normal text-slate-500">({order.items.length} tindakan)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Pekerjaan jasa servis yang dikerjakan mekanik pada unit motor ini.</p>
          </div>
          {order.status !== "SELESAI_PEMBAYARAN" && (
            <button
              type="button"
              onClick={() => {
                setActionError("");
                setIsAddServiceModalOpen(true);
              }}
              className="btn-primary px-3.5 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              + Tambah Jasa Servis
            </button>
          )}
        </div>

        {order.items.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">Belum ada tindakan jasa yang dicatat.</p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Nama Jasa Servis</th>
                  <th className="py-3 px-3 text-right">Biaya Satuan</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  {order.status !== "SELESAI_PEMBAYARAN" && <th className="py-3 px-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <tr key={item.id} className="text-slate-800 hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{item.serviceName}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">{formatRupiah(item.price)}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-800 font-semibold">{item.qty}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(item.subtotal)}</td>
                    {order.status !== "SELESAI_PEMBAYARAN" && (
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveService(item.id)}
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors cursor-pointer"
                          title="Hapus Jasa"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <p className="text-xs text-slate-600 font-medium">
            Subtotal Biaya Jasa: <span className="font-mono font-bold text-slate-900 ml-1.5">{formatRupiah(order.totalServices)}</span>
          </p>
        </div>
      </div>

      {/* Suku Cadang */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              📦 Suku Cadang Terpakai
              <span className="text-xs font-normal text-slate-500">({order.parts.length} part)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Stok gudang otomatis terpotong dan dikembalikan jika dibatalkan.</p>
          </div>
          {order.status !== "SELESAI_PEMBAYARAN" && (
            <button
              type="button"
              onClick={() => {
                setActionError("");
                setIsAddPartModalOpen(true);
              }}
              className="btn-primary px-3.5 py-2 text-xs font-semibold cursor-pointer shadow-xs"
            >
              + Ambil Suku Cadang
            </button>
          )}
        </div>

        {order.parts.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">Belum ada pemakaian suku cadang.</p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Nama Suku Cadang</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  {order.status !== "SELESAI_PEMBAYARAN" && <th className="py-3 px-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.parts.map((p) => (
                  <tr key={p.id} className="text-slate-800 hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{p.partName}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">{formatRupiah(p.sellPrice)}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-800 font-semibold">{p.qty}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(p.subtotal)}</td>
                    {order.status !== "SELESAI_PEMBAYARAN" && (
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePart(p.id)}
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors cursor-pointer"
                          title="Kembalikan Part"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <p className="text-xs text-slate-600 font-medium">
            Subtotal Suku Cadang: <span className="font-mono font-bold text-slate-900 ml-1.5">{formatRupiah(order.totalParts)}</span>
          </p>
        </div>
      </div>

      {/* Grand Total Card (Linear High Contrast) */}
      <div className="p-6 sm:p-7 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Rekapitulasi Tiket Servis</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span>Jasa: <strong className="font-mono text-white">{formatRupiah(order.totalServices)}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Sparepart: <strong className="font-mono text-white">{formatRupiah(order.totalParts)}</strong></span>
            {order.discount > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400 font-mono">Diskon: -{formatRupiah(order.discount)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase">Grand Total:</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">{formatRupiah(order.grandTotal)}</span>
        </div>
      </div>

      {/* Modal Tambah Jasa */}
      <Modal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        title="Tambahkan Tindakan Jasa Servis"
        description="Pilih jenis pekerjaan dari katalog bengkel PitCare Auto."
      >
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="label-dark">Pilih Jasa Servis *</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              className="input-dark w-full h-11 px-3.5 text-xs cursor-pointer"
            >
              <option value="">-- Pilih dari Katalog Jasa --</option>
              {availableServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatRupiah(s.price)} (~{s.duration || 30} mnt)
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddServiceModalOpen(false)}
              className="btn-ghost px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedServiceId}
              className="btn-primary px-5 py-2.5 text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {isPending ? "Menambahkan..." : "Tambah ke Tiket Servis"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ambil Suku Cadang */}
      <Modal
        isOpen={isAddPartModalOpen}
        onClose={() => setIsAddPartModalOpen(false)}
        title="Ambil Suku Cadang dari Gudang"
        description="Stok gudang akan otomatis dipotong sesuai kuantitas pemakaian."
      >
        <form onSubmit={handleAddPart} className="space-y-4">
          <div>
            <label className="label-dark">Pilih Suku Cadang *</label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              required
              className="input-dark w-full h-11 px-3.5 text-xs cursor-pointer"
            >
              <option value="">-- Pilih Suku Cadang --</option>
              {availableParts.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} ({p.sku}) — {formatRupiah(p.sellPrice)} [Stok: {p.stock} {p.unit}]
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-dark">Jumlah Pemakaian (Qty) *</label>
            <input
              type="number"
              min={1}
              value={partQty}
              onChange={(e) => setPartQty(parseInt(e.target.value, 10) || 1)}
              required
              className="input-dark w-full h-11 px-3.5 text-xs font-mono"
            />
          </div>
          {actionError && <p className="text-xs text-rose-600 font-semibold">{actionError}</p>}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddPartModalOpen(false)}
              className="btn-ghost px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedPartId}
              className="btn-primary px-5 py-2.5 text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {isPending ? "Memproses..." : "Ambil & Pasang"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Selesai */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Konfirmasi Pengerjaan Selesai"
        description="Unit kendaraan akan ditandai selesai dan siap ditagih di terminal kasir."
      >
        <div className="space-y-4">
          <div>
            <label className="label-dark">Hasil Akhir Pemeriksaan / Catatan Mekanik *</label>
            <textarea
              rows={3}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              placeholder="Contoh: Seluruh pengerjaan tuntas, oli mesin dan filter baru, mesin ditest normal dan responsif."
              className="input-dark w-full p-3.5 text-xs leading-relaxed"
            />
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
            💡 Setelah diselesaikan, tiket servis ini akan langsung siap ditagih di terminal <strong>Kasir & Billing</strong>.
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="btn-ghost px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("SELESAI_PENGERJAAN", diagnosisInput)}
              className="btn-primary px-5 py-2.5 text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {isPending ? "Memproses..." : "Konfirmasi Selesai Servis"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
