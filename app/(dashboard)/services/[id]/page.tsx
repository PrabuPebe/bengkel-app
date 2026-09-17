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
        // Refresh available parts stock
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

  if (isLoading) {
    return (
      <div className="p-16 text-center text-[#817797] text-sm">
        <div className="w-8 h-8 border-2 border-[#9b6cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Memuat rincian Work Order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#221939]/40 border border-[#d2b8ff]/10">
        <p className="text-base font-bold text-[#f6f2ff] mb-2">Work Order Tidak Ditemukan</p>
        <p className="text-xs text-[#817797] mb-4">
          Nomor SPK atau ID yang Anda cari tidak tersedia dalam database.
        </p>
        <Link
          href="/services"
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8f63ec]"
        >
          Kembali ke Daftar Servis
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
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="p-2.5 rounded-xl bg-[#221939] border border-[#d2b8ff]/15 text-[#b5abc9] hover:text-[#f6f2ff] hover:bg-[#2e2150] transition-colors"
            title="Kembali ke Daftar Work Order"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#f6f2ff] tracking-tight">
                {order.orderNumber}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#2e2150] text-[#c49eff] border border-[#9b6cff]/30">
                {order.vehicle?.plateNumber}
              </span>
            </div>
            <p className="text-xs text-[#b5abc9] mt-0.5">
              Token Pelacakan: <span className="font-mono text-[#f6f2ff]">{order.token}</span> • Diterima: {formatDate(order.entryDate)}
            </p>
          </div>
        </div>

        {/* Quick Route to Cashier */}
        <div className="flex items-center gap-3">
          {order.status === "SELESAI_PENGERJAAN" && (
            <Link
              href={`/cashier/${order.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-all"
            >
              Proses Bayar di Kasir 💰
            </Link>
          )}

          {order.status === "SELESAI_PEMBAYARAN" && (
            <Link
              href={`/cashier/${order.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 transition-all"
            >
              Lihat Faktur Kasir 🖨️
            </Link>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-[#3a1525] border border-[#ffaeae]/30 text-[#ffaeae] text-xs font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-[#ffaeae] hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Visual Workflow Pipeline Stepper */}
      <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 shadow-xl shadow-black/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((s, idx) => {
            const st = getStepStatus(s.key);
            return (
              <div
                key={s.key}
                className={`p-3.5 rounded-xl border relative transition-all ${
                  st === "current"
                    ? "bg-[#2e2150] border-[#9b6cff] shadow-md shadow-[#9b6cff]/20"
                    : st === "completed"
                      ? "bg-[#17122b] border-[#34d399]/40 text-[#34d399]"
                      : "bg-[#17122b]/60 border-[#d2b8ff]/10 text-[#817797]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    Tahap {idx + 1}
                  </span>
                  {st === "completed" && (
                    <span className="text-xs font-bold text-[#34d399]">✓ Selesai</span>
                  )}
                  {st === "current" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8f63ec] text-white">
                      {order.status === "MENUNGGU_PART" ? "Menunggu Part" : "Sedang Aktif"}
                    </span>
                  )}
                </div>
                <p className={`text-xs font-bold ${st === "current" ? "text-[#f6f2ff]" : ""}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-[#817797] mt-0.5">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Operational Action Controls for Mechanic / Admin */}
        <div className="mt-5 pt-4 border-t border-[#d2b8ff]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#b5abc9]">
            <span>Status Saat Ini: </span>
            <span className="font-bold text-[#c49eff] uppercase tracking-wider">
              {order.status.replace("_", " ")}
            </span>
            <span>• Ditangani oleh: </span>
            <span className="font-bold text-[#f6f2ff]">{order.mechanicName || "Teknisi"}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {order.status === "ANTRIAN" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-md shadow-[#8f63ec]/20"
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
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-900/30 border border-amber-500/30 hover:bg-amber-900/50"
                >
                  ⏸️ Tunda: Menunggu Part
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25"
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110"
              >
                ▶️ Part Tersedia: Lanjutkan Pengerjaan
              </button>
            )}

            {order.status === "SELESAI_PENGERJAAN" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("PENGERJAAN")}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#b5abc9] hover:text-[#f6f2ff] bg-[#17122b]"
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
        <div className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 space-y-4 shadow-xl shadow-black/20">
          <h2 className="text-xs font-bold text-[#c49eff] uppercase tracking-wider pb-2 border-b border-[#d2b8ff]/10">
            Identitas Pelanggan & Unit
          </h2>

          <div>
            <p className="text-[11px] text-[#817797]">Pemilik Kendaraan</p>
            <p className="text-sm font-bold text-[#f6f2ff]">{order.customer?.name}</p>
            <a
              href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#34d399] font-medium hover:underline mt-0.5"
            >
              <span>📱 WhatsApp: {order.customer?.phone}</span>
            </a>
          </div>

          <div className="pt-2 border-t border-[#d2b8ff]/10">
            <p className="text-[11px] text-[#817797]">Kendaraan</p>
            <p className="text-sm font-bold text-[#f6f2ff]">
              {order.vehicle?.brand} {order.vehicle?.model}
            </p>
            <p className="font-mono text-xs font-black text-[#c49eff] mt-0.5">
              {order.vehicle?.plateNumber}
            </p>
            {order.currentKm && (
              <p className="text-xs text-[#b5abc9] mt-1">
                Kilometer: <span className="font-mono font-bold text-[#f6f2ff]">{order.currentKm.toLocaleString("id-ID")} KM</span>
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-[#d2b8ff]/10">
            <p className="text-[11px] text-[#817797]">Keluhan Masuk</p>
            <p className="text-xs text-[#d9d0eb] mt-1 italic">
              &quot;{order.complaints}&quot;
            </p>
          </div>
        </div>

        {/* Diagnosis & Technical Inspection Notes (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 flex flex-col justify-between shadow-xl shadow-black/20">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#d2b8ff]/10 mb-3">
              <h2 className="text-xs font-bold text-[#c49eff] uppercase tracking-wider">
                Catatan Pemeriksaan & Diagnosis Teknisi
              </h2>
              <span className="text-[11px] text-[#817797]">
                Mekanik: {order.mechanicName}
              </span>
            </div>

            <p className="text-xs text-[#817797] mb-2">
              Tuliskan temuan masalah teknis, rekomendasi servis, atau hasil uji jalan kendaraan:
            </p>

            <textarea
              rows={4}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              placeholder="Contoh: Busi aus renggang, seal shock kanan bocor oli, v-belt sudah mulai retak rambut. Direkomendasikan ganti oli dan servis injeksi."
              className="w-full p-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-xs focus:outline-none focus:border-[#9b6cff] transition-all"
            />
          </div>

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#d2b8ff]/10">
            <span className="text-[11px] text-[#817797]">
              {order.diagnosis ? "Terakhir diperbarui" : "Belum disimpan"}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveDiagnosis}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] transition-colors"
            >
              Simpan Catatan Diagnosis
            </button>
          </div>
        </div>
      </div>

      {/* Items Section: Tindakan Jasa Servis */}
      <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 shadow-xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#d2b8ff]/10">
          <div>
            <h2 className="text-sm font-bold text-[#f6f2ff] flex items-center gap-2">
              <span>🔧 Tindakan Jasa Servis</span>
              <span className="text-xs font-normal text-[#817797]">
                ({order.items.length} tindakan)
              </span>
            </h2>
            <p className="text-xs text-[#817797]">
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
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-sm"
            >
              + Tambah Jasa Servis
            </button>
          )}
        </div>

        {order.items.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#817797]">
            Belum ada tindakan jasa yang dicatat. Klik tombol di atas untuk menambah.
          </p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#817797] border-b border-[#d2b8ff]/10">
                  <th className="pb-2.5 font-bold uppercase tracking-wider">Nama Jasa Servis</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-right">Biaya Satuan</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-center">Qty</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-right">Subtotal</th>
                  {order.status !== "SELESAI_PEMBAYARAN" && (
                    <th className="pb-2.5 text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d2b8ff]/10">
                {order.items.map((item) => (
                  <tr key={item.id} className="text-[#f6f2ff] hover:bg-[#17122b]/40">
                    <td className="py-3 font-semibold">{item.serviceName}</td>
                    <td className="py-3 text-right text-[#b5abc9]">{formatRupiah(item.price)}</td>
                    <td className="py-3 text-center font-mono">{item.qty}</td>
                    <td className="py-3 text-right font-bold text-[#34d399]">
                      {formatRupiah(item.subtotal)}
                    </td>
                    {order.status !== "SELESAI_PEMBAYARAN" && (
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveService(item.id)}
                          className="text-[#ffaeae] hover:text-white hover:bg-[#3a1525] p-1 rounded transition-colors"
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

        <div className="mt-4 pt-3 border-t border-[#d2b8ff]/10 flex justify-end">
          <p className="text-xs text-[#b5abc9]">
            Subtotal Jasa: <span className="font-bold text-[#f6f2ff] ml-1">{formatRupiah(order.totalServices)}</span>
          </p>
        </div>
      </div>

      {/* Parts Section: Pemakaian Suku Cadang & Sinkronisasi Stok */}
      <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 shadow-xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#d2b8ff]/10">
          <div>
            <h2 className="text-sm font-bold text-[#f6f2ff] flex items-center gap-2">
              <span>📦 Suku Cadang Digunakan</span>
              <span className="text-xs font-normal text-[#817797]">
                ({order.parts.length} part terpakai)
              </span>
            </h2>
            <p className="text-xs text-[#817797]">
              Suku cadang otomatis memotong stok gudang saat ditambahkan, dan mengembalikan stok jika dihapus.
            </p>
          </div>

          {order.status !== "SELESAI_PEMBAYARAN" && (
            <button
              type="button"
              onClick={() => {
                setActionError("");
                setIsAddPartModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-sm"
            >
              + Ambil Suku Cadang
            </button>
          )}
        </div>

        {order.parts.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#817797]">
            Belum ada pemakaian suku cadang / sparepart pada SPK ini.
          </p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#817797] border-b border-[#d2b8ff]/10">
                  <th className="pb-2.5 font-bold uppercase tracking-wider">Nama Suku Cadang</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-right">Harga Satuan</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-center">Jumlah (Qty)</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-right">Subtotal</th>
                  {order.status !== "SELESAI_PEMBAYARAN" && (
                    <th className="pb-2.5 text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d2b8ff]/10">
                {order.parts.map((p) => (
                  <tr key={p.id} className="text-[#f6f2ff] hover:bg-[#17122b]/40">
                    <td className="py-3 font-semibold">{p.partName}</td>
                    <td className="py-3 text-right text-[#b5abc9]">{formatRupiah(p.sellPrice)}</td>
                    <td className="py-3 text-center font-mono">{p.qty}</td>
                    <td className="py-3 text-right font-bold text-[#34d399]">
                      {formatRupiah(p.subtotal)}
                    </td>
                    {order.status !== "SELESAI_PEMBAYARAN" && (
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePart(p.id)}
                          className="text-[#ffaeae] hover:text-white hover:bg-[#3a1525] p-1 rounded transition-colors"
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

        <div className="mt-4 pt-3 border-t border-[#d2b8ff]/10 flex justify-end">
          <p className="text-xs text-[#b5abc9]">
            Subtotal Suku Cadang: <span className="font-bold text-[#f6f2ff] ml-1">{formatRupiah(order.totalParts)}</span>
          </p>
        </div>
      </div>

      {/* Financial Breakdown Total Card */}
      <div className="p-6 rounded-2xl bg-[#17122b] border border-[#d2b8ff]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#c49eff] uppercase tracking-wider">
            Total Rekapitulasi Biaya SPK
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#b5abc9] pt-1">
            <span>Jasa: <strong className="text-[#f6f2ff]">{formatRupiah(order.totalServices)}</strong></span>
            <span>•</span>
            <span>Sparepart: <strong className="text-[#f6f2ff]">{formatRupiah(order.totalParts)}</strong></span>
            {order.discount > 0 && (
              <>
                <span>•</span>
                <span className="text-[#ffaeae]">Diskon: -{formatRupiah(order.discount)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-xs font-bold text-[#817797] uppercase">Grand Total:</span>
          <span className="text-2xl font-black text-emerald-400">
            {formatRupiah(order.grandTotal)}
          </span>
        </div>
      </div>

      {/* Modal Tambah Jasa Servis */}
      <Modal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        title="Tambahkan Tindakan Jasa Servis"
        description="Pilih jenis pekerjaan servis dari katalog bengkel."
      >
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
              Pilih Jasa Servis *
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
            >
              <option value="">-- Pilih dari Katalog Jasa --</option>
              {availableServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {formatRupiah(s.price)} (~{s.duration || 30} mnt)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d2b8ff]/10">
            <button
              type="button"
              onClick={() => setIsAddServiceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#817797] hover:text-[#f6f2ff]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedServiceId}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8f63ec] hover:bg-[#7b4fd4]"
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
        description="Stok gudang akan otomatis dipotong sesuai jumlah yang Anda masukkan."
      >
        <form onSubmit={handleAddPart} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
              Pilih Sparepart *
            </label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
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
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
              Jumlah Pemakaian (Qty) *
            </label>
            <input
              type="number"
              min={1}
              value={partQty}
              onChange={(e) => setPartQty(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d2b8ff]/10">
            <button
              type="button"
              onClick={() => setIsAddPartModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#817797] hover:text-[#f6f2ff]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedPartId}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8f63ec] hover:bg-[#7b4fd4]"
            >
              {isPending ? "Memproses Stok..." : "Ambil & Tambahkan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Selesaikan Pengerjaan Servis */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Konfirmasi Pengerjaan Selesai"
        description="Unit kendaraan akan ditandai selesai pengerjaan pit dan masuk ke antrean kasir untuk penagihan."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
              Hasil Akhir Pemeriksaan / Diagnosis Teknisi *
            </label>
            <textarea
              rows={3}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              placeholder="Contoh: Seluruh pengerjaan tuntas, oli dan roller baru terpasang, mesin halus dan tarikan responsif saat ditest drive."
              className="w-full p-3 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-xs focus:outline-none focus:border-[#9b6cff]"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
            💡 Setelah diselesaikan, pesanan ini akan langsung muncul di halaman <strong>Kasir & Billing</strong> siap untuk dicetak fakturnya.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#d2b8ff]/10">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#817797] hover:text-[#f6f2ff]"
            >
              Kembali
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("SELESAI_PENGERJAAN", diagnosisInput)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
            >
              {isPending ? "Memproses..." : "Konfirmasi Selesai Servis"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
