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

  // Reference Catalogs
  const [availableServices, setAvailableServices] = useState<ServicesCatalog[]>([]);
  const [availableParts, setAvailableParts] = useState<PartsInventory[]>([]);

  // Modals state
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Form states in modals
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
      if (res.success && res.data) {
        setOrder(res.data);
      }
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

  function handleCopyTrackingLink() {
    if (!order) return;
    const trackingUrl = `${window.location.origin}/track/${order.token}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Memuat rincian Work Order PitCare Auto...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
          !
        </div>
        <h2 className="text-base font-bold text-white mb-1">Work Order Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400 mb-6">
          Nomor SPK atau ID yang dicari tidak tersedia dalam database PitCare Auto.
        </p>
        <Link
          href="/services"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
        >
          ← Kembali ke Daftar SPK
        </Link>
      </div>
    );
  }

  // Pipeline Stepper configuration
  const steps = [
    { key: "ANTRIAN", label: "1. Antrian Pit", desc: "Menunggu giliran mekanik" },
    { key: "PENGERJAAN", label: "2. Pengerjaan Pit", desc: "Tindakan & perbaikan" },
    { key: "SELESAI_PENGERJAAN", label: "3. Siap Kasir", desc: "Pengerjaan tuntas" },
    { key: "SELESAI_PEMBAYARAN", label: "4. Faktur Lunas", desc: "Selesai di kasir" },
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Kembali ke Daftar SPK"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {order.orderNumber}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                {order.vehicle?.plateNumber}
              </span>
              <span className="text-xs text-slate-400">
                ({order.vehicle?.brand} {order.vehicle?.model})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Token: <span className="font-mono text-slate-200">{order.token}</span></span>
              <span>•</span>
              <span>Diterima: {formatDate(order.entryDate)}</span>
            </p>
          </div>
        </div>

        {/* Action Button Slots */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyTrackingLink}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1.5"
            title="Salin link live tracking untuk dikirim ke pelanggan"
          >
            <span>{copiedLink ? "✓ Tersalin!" : "🔗 Salin Link Tracking"}</span>
          </button>

          <Link
            href={`/track/${order.token}`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Buka Pelacakan ↗</span>
          </Link>

          {order.status === "SELESAI_PENGERJAAN" && (
            <Link
              href={`/cashier/${order.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all"
            >
              Proses Bayar Kasir 💳
            </Link>
          )}

          {order.status === "SELESAI_PEMBAYARAN" && (
            <Link
              href={`/cashier/${order.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
            >
              Cetak Faktur Kasir 🖨️
            </Link>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-rose-400 hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Visual Workflow Pipeline Stepper */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {steps.map((s, idx) => {
            const st = getStepStatus(s.key);
            return (
              <div
                key={s.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  st === "current"
                    ? "bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                    : st === "completed"
                      ? "bg-slate-950/60 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    Tahap {idx + 1}
                  </span>
                  {st === "completed" && (
                    <span className="text-xs font-bold text-emerald-400">✓ Selesai</span>
                  )}
                  {st === "current" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      {order.status === "MENUNGGU_PART" ? "Tunda Part" : "Sedang Aktif"}
                    </span>
                  )}
                </div>
                <p className={`text-xs font-bold ${st === "current" ? "text-white" : ""}`}>
                  {s.label}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Operational Action Controls for Mechanic / Admin */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Status SPK: </span>
            <span className="font-bold text-indigo-400 uppercase tracking-wider">
              {order.status.replace("_", " ")}
            </span>
            <span>• Teknisi Penanggung Jawab: </span>
            <span className="font-bold text-white">{order.mechanicName || "Teknisi"}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {order.status === "ANTRIAN" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
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
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                >
                  ⏸️ Tunda: Menunggu Part
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
              >
                ▶️ Part Siap: Lanjutkan Pengerjaan
              </button>
            )}

            {order.status === "SELESAI_PENGERJAAN" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition-colors"
              >
                ↩️ Kembalikan ke Pit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Unit Info & Keluhan / Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Vehicle Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl shadow-slate-950/40">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            Identitas Pelanggan & Unit
          </h2>

          <div>
            <p className="text-[11px] text-slate-500">Pemilik Kendaraan</p>
            <p className="text-sm font-bold text-white mt-0.5">{order.customer?.name}</p>
            <a
              href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium hover:underline mt-1"
            >
              <span>📱 WhatsApp: {order.customer?.phone}</span>
            </a>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <p className="text-[11px] text-slate-500">Kendaraan</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {order.vehicle?.brand} {order.vehicle?.model}
            </p>
            <p className="font-mono text-xs font-bold text-indigo-400 mt-0.5">
              {order.vehicle?.plateNumber}
            </p>
            {order.currentKm && (
              <p className="text-xs text-slate-400 mt-1">
                Kilometer: <span className="font-mono font-bold text-slate-200">{order.currentKm.toLocaleString("id-ID")} KM</span>
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <p className="text-[11px] text-slate-500">Keluhan Masuk</p>
            <p className="text-xs text-slate-300 mt-1 italic leading-relaxed">
              &quot;{order.complaints}&quot;
            </p>
          </div>
        </div>

        {/* Diagnosis & Technical Inspection Notes */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-xl shadow-slate-950/40">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Catatan Pemeriksaan & Diagnosis Teknisi
              </h2>
              <span className="text-[11px] text-slate-400">
                Mekanik: <strong className="text-slate-200">{order.mechanicName}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-2">
              Tuliskan temuan masalah teknis, rekomendasi perbaikan, atau kondisi hasil uji jalan kendaraan:
            </p>

            <textarea
              rows={4}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              placeholder="Contoh: Busi aus renggang, seal shock kanan rembes oli, v-belt sudah mulai retak rambut. Direkomendasikan servis injeksi & tune up."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              {order.diagnosis ? "Status: Tersimpan" : "Belum ada catatan"}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveDiagnosis}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
            >
              Simpan Catatan Diagnosis
            </button>
          </div>
        </div>
      </div>

      {/* Items Section: Tindakan Jasa Servis */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🔧 Tindakan Jasa Servis</span>
              <span className="text-xs font-normal text-slate-400">
                ({order.items.length} tindakan)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pekerjaan jasa yang dikerjakan oleh teknisi pada unit ini.
            </p>
          </div>

          {order.status !== "SELESAI_PEMBAYARAN" && (
            <button
              type="button"
              onClick={() => {
                setActionError("");
                setIsAddServiceModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
            >
              + Tambah Jasa Servis
            </button>
          )}
        </div>

        {order.items.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            Belum ada tindakan jasa yang dicatat pada SPK ini.
          </p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2.5 font-semibold uppercase tracking-wider">Nama Jasa Servis</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Biaya Satuan</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-center">Qty</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Subtotal</th>
                  {order.status !== "SELESAI_PEMBAYARAN" && (
                    <th className="pb-2.5 text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {order.items.map((item) => (
                  <tr key={item.id} className="text-slate-200 hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-white">{item.serviceName}</td>
                    <td className="py-3 text-right font-mono text-slate-400">{formatRupiah(item.price)}</td>
                    <td className="py-3 text-center font-mono">{item.qty}</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-400">
                      {formatRupiah(item.subtotal)}
                    </td>
                    {order.status !== "SELESAI_PEMBAYARAN" && (
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveService(item.id)}
                          className="text-rose-400 hover:text-white hover:bg-rose-500/20 p-1 rounded-lg transition-colors"
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

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <p className="text-xs text-slate-400">
            Subtotal Jasa: <span className="font-mono font-bold text-white ml-1.5">{formatRupiah(order.totalServices)}</span>
          </p>
        </div>
      </div>

      {/* Parts Section: Pemakaian Suku Cadang & Sinkronisasi Stok */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📦 Suku Cadang Terpakai</span>
              <span className="text-xs font-normal text-slate-400">
                ({order.parts.length} part terpakai)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Suku cadang otomatis memotong stok gudang saat ditambahkan dan dikembalikan jika dihapus.
            </p>
          </div>

          {order.status !== "SELESAI_PEMBAYARAN" && (
            <button
              type="button"
              onClick={() => {
                setActionError("");
                setIsAddPartModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
            >
              + Ambil Suku Cadang
            </button>
          )}
        </div>

        {order.parts.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            Belum ada pemakaian suku cadang pada SPK ini.
          </p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2.5 font-semibold uppercase tracking-wider">Nama Suku Cadang</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Harga Satuan</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-center">Jumlah (Qty)</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Subtotal</th>
                  {order.status !== "SELESAI_PEMBAYARAN" && (
                    <th className="pb-2.5 text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {order.parts.map((p) => (
                  <tr key={p.id} className="text-slate-200 hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-white">{p.partName}</td>
                    <td className="py-3 text-right font-mono text-slate-400">{formatRupiah(p.sellPrice)}</td>
                    <td className="py-3 text-center font-mono">{p.qty}</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-400">
                      {formatRupiah(p.subtotal)}
                    </td>
                    {order.status !== "SELESAI_PEMBAYARAN" && (
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePart(p.id)}
                          className="text-rose-400 hover:text-white hover:bg-rose-500/20 p-1 rounded-lg transition-colors"
                          title="Kembalikan Part ke Stok"
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

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <p className="text-xs text-slate-400">
            Subtotal Suku Cadang: <span className="font-mono font-bold text-white ml-1.5">{formatRupiah(order.totalParts)}</span>
          </p>
        </div>
      </div>

      {/* Financial Breakdown Total Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl shadow-slate-950/40">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Rekapitulasi SPK
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span>Jasa: <strong className="font-mono text-white">{formatRupiah(order.totalServices)}</strong></span>
            <span>•</span>
            <span>Sparepart: <strong className="font-mono text-white">{formatRupiah(order.totalParts)}</strong></span>
            {order.discount > 0 && (
              <>
                <span>•</span>
                <span className="text-rose-400">Diskon: -{formatRupiah(order.discount)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase">Grand Total:</span>
          <span className="text-2xl font-black font-mono text-emerald-400">
            {formatRupiah(order.grandTotal)}
          </span>
        </div>
      </div>

      {/* Modal Tambah Jasa Servis */}
      <Modal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        title="Tambahkan Tindakan Jasa Servis"
        description="Pilih jenis pekerjaan servis dari katalog bengkel PitCare Auto."
      >
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Jasa Servis *
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Pilih dari Katalog Jasa --</option>
              {availableServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {formatRupiah(s.price)} (~{s.duration || 30} mnt)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddServiceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedServiceId}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
            >
              {isPending ? "Menambahkan..." : "Tambah ke SPK"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Suku Cadang */}
      <Modal
        isOpen={isAddPartModalOpen}
        onClose={() => setIsAddPartModalOpen(false)}
        title="Ambil Suku Cadang dari Gudang"
        description="Stok gudang PitCare Auto akan otomatis dipotong sesuai kuantitas."
      >
        <form onSubmit={handleAddPart} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Suku Cadang *
            </label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Pilih Suku Cadang --</option>
              {availableParts.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} ({p.sku}) - {formatRupiah(p.sellPrice)} [Stok: {p.stock} {p.unit}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Jumlah Pemakaian (Qty) *
            </label>
            <input
              type="number"
              min={1}
              value={partQty}
              onChange={(e) => setPartQty(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddPartModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedPartId}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
            >
              {isPending ? "Memproses..." : "Ambil & Pasang"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Selesaikan Pengerjaan Servis */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Konfirmasi Pengerjaan Selesai"
        description="Unit kendaraan akan ditandai selesai pengerjaan pit dan siap ditagih di terminal kasir."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Hasil Akhir Pemeriksaan / Diagnosis Teknisi *
            </label>
            <textarea
              rows={3}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              placeholder="Contoh: Seluruh pengerjaan tuntas, oli mesin dan filter baru, mesin telah ditest normal dan responsif."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            💡 Setelah diselesaikan, pesanan ini akan langsung muncul di halaman <strong>Kasir & Billing</strong> siap untuk ditagih dan dicetak fakturnya.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("SELESAI_PENGERJAAN", diagnosisInput)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            >
              {isPending ? "Memproses..." : "Konfirmasi Selesai Servis"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
