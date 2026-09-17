"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Customer, Vehicle, ServicesCatalog, PartsInventory } from "@/lib/types/database";
import { getCustomersAction } from "@/lib/actions/customers";
import { getServicesAction } from "@/lib/actions/services";
import { getPartsAction } from "@/lib/actions/parts";
import { createServiceOrderAction } from "@/lib/actions/orders";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const AVAILABLE_MECHANICS = [
  { id: "usr-3", name: "Budi Santoso", role: "Kepala Mekanik Pit 1" },
  { id: "usr-4", name: "Agus Pratama", role: "Teknisi Mesin & Transmisi" },
  { id: "usr-5", name: "Rian Hidayat", role: "Teknisi Kelistrikan & Injeksi" },
];

export default function NewServiceOrderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Data sources
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableServices, setAvailableServices] = useState<ServicesCatalog[]>([]);
  const [availableParts, setAvailableParts] = useState<PartsInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form selections
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedMechanicId, setSelectedMechanicId] = useState("usr-3");
  const [currentKm, setCurrentKm] = useState<string>("");
  const [complaints, setComplaints] = useState("");
  const [notes, setNotes] = useState("");

  // Selected Services & Parts
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; qty: number }[]>([]);

  // Feedback error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getCustomersAction(),
      getServicesAction(),
      getPartsAction(),
    ]).then(([custData, servData, partData]) => {
      if (active) {
        setCustomers(custData);
        setAvailableServices(servData.filter((s) => s.isActive));
        setAvailableParts(partData);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerVehicles: Vehicle[] = selectedCustomer?.vehicles || [];

  function handleCustomerChange(custId: string) {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (cust && cust.vehicles.length > 0) {
      setSelectedVehicleId(cust.vehicles[0].id);
    } else {
      setSelectedVehicleId("");
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  function addPartToOrder(partId: string) {
    const existing = selectedParts.find((p) => p.partId === partId);
    const part = availableParts.find((p) => p.id === partId);
    if (!part) return;

    if (existing) {
      if (existing.qty >= part.stock) {
        alert(`Maksimal stok tersedia hanya ${part.stock} ${part.unit}`);
        return;
      }
      setSelectedParts((prev) =>
        prev.map((p) => (p.partId === partId ? { ...p, qty: p.qty + 1 } : p))
      );
    } else {
      setSelectedParts((prev) => [...prev, { partId, qty: 1 }]);
    }
  }

  function updatePartQty(partId: string, delta: number) {
    const part = availableParts.find((p) => p.id === partId);
    if (!part) return;

    setSelectedParts((prev) => {
      const existing = prev.find((p) => p.partId === partId);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        return prev.filter((p) => p.partId !== partId);
      }
      if (newQty > part.stock) {
        alert(`Maksimal stok tersedia hanya ${part.stock} ${part.unit}`);
        return prev;
      }
      return prev.map((p) => (p.partId === partId ? { ...p, qty: newQty } : p));
    });
  }

  // Calculate live estimate
  const totalServiceEst = selectedServiceIds.reduce((sum, sId) => {
    const s = availableServices.find((srv) => srv.id === sId);
    return sum + (s?.price || 0);
  }, 0);

  const totalPartsEst = selectedParts.reduce((sum, item) => {
    const p = availableParts.find((part) => part.id === item.partId);
    return sum + (p?.sellPrice || 0) * item.qty;
  }, 0);

  const grandTotalEst = totalServiceEst + totalPartsEst;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedCustomerId) {
      setErrorMessage("Silakan pilih pelanggan terlebih dahulu.");
      return;
    }
    if (!selectedVehicleId) {
      setErrorMessage("Silakan pilih unit kendaraan yang akan diservis.");
      return;
    }
    if (!complaints.trim()) {
      setErrorMessage("Keluhan utama kendaraan wajib diisi.");
      return;
    }

    const mechanic = AVAILABLE_MECHANICS.find((m) => m.id === selectedMechanicId);

    startTransition(async () => {
      const result = await createServiceOrderAction({
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        mechanicId: selectedMechanicId,
        mechanicName: mechanic?.name || "Budi Santoso",
        currentKm: currentKm ? parseInt(currentKm, 10) : undefined,
        complaints: complaints.trim(),
        notes: notes.trim() || undefined,
        initialServiceIds: selectedServiceIds,
        initialPartIds: selectedParts,
      });

      if (result.success && result.data) {
        router.push(`/services/${result.data.id}`);
      } else {
        setErrorMessage(result.error || "Gagal menerbitkan Work Order.");
      }
    });
  }

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Memuat formulir penerimaan unit PitCare Auto...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/services"
          className="p-2.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Kembali ke Daftar SPK"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Penerimaan Unit & SPK Baru
          </h1>
          <p className="text-xs text-slate-400">
            Catat data masuk unit kendaraan, keluhan pelanggan, dan tugaskan teknisi pit PitCare Auto.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Pelanggan & Kendaraan */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-slate-950/40">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center text-[10px] font-black">
                1
              </span>
              Identitas Pemilik & Unit Kendaraan
            </h2>
            <Link
              href="/customers"
              target="_blank"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              + Daftar Pelanggan Baru ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Pelanggan (Pemilik) *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Pilih Pelanggan Terdaftar --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.vehicles.length} Kendaraan
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kendaraan yang Diservis *
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                disabled={!selectedCustomerId || customerVehicles.length === 0}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40"
              >
                {customerVehicles.length === 0 ? (
                  <option value="">-- Pilih pelanggan terlebih dahulu --</option>
                ) : (
                  customerVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} • {v.brand} {v.model} {v.year ? `(${v.year})` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kilometer Spidometer Masuk (KM)
              </label>
              <input
                type="number"
                value={currentKm}
                onChange={(e) => setCurrentKm(e.target.value)}
                placeholder="Contoh: 14200"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Teknisi / Mekanik Penanggung Jawab
              </label>
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {AVAILABLE_MECHANICS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Keluhan & Catatan Khusus */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-slate-950/40">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4 pb-3 border-b border-white/5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center text-[10px] font-black">
              2
            </span>
            Keluhan Masuk & Catatan Kondisi Fisik
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Keluhan Utama Kendaraan (Ditanyakan ke Pemilik) *
              </label>
              <textarea
                value={complaints}
                onChange={(e) => setComplaints(e.target.value)}
                required
                rows={3}
                placeholder="Contoh: Mesin brebet saat akselerasi awal, rem depan bunyi mendecit, ganti oli mesin rutin..."
                className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Catatan Fisik Kendaraan / Permintaan Khusus (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Bodi kiri ada goresan halus, helm ditinggal di bagasi, pelanggan menunggu di lounge."
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Estimasi Tindakan Awal */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-slate-950/40">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4 pb-3 border-b border-white/5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center text-[10px] font-black">
              3
            </span>
            Tindakan Jasa & Estimasi Suku Cadang Awal
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jasa Servis */}
            <div>
              <p className="text-xs font-bold text-slate-300 mb-2">Pilih Paket Tindakan Jasa:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-none">
                {availableServices.map((srv) => {
                  const isChecked = selectedServiceIds.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        isChecked
                          ? "bg-indigo-600/15 border-indigo-500 text-white shadow-sm"
                          : "bg-slate-950/80 border-white/5 text-slate-300 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">{srv.name}</p>
                          <p className="text-[10px] text-slate-400">{srv.code} • ~{srv.duration || 30} mnt</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {formatRupiah(srv.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suku Cadang */}
            <div>
              <p className="text-xs font-bold text-slate-300 mb-2">Pilih Suku Cadang yang Digunakan:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-none">
                {availableParts.map((part) => {
                  const inOrder = selectedParts.find((p) => p.partId === part.id);
                  return (
                    <div
                      key={part.id}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-semibold text-white truncate">{part.name}</p>
                        <p className="text-[10px] text-slate-400">
                          Stok: <span className={part.stock <= part.minStock ? "text-amber-400 font-bold" : "text-slate-300"}>{part.stock} {part.unit}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {formatRupiah(part.sellPrice)}
                        </span>

                        {inOrder ? (
                          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1">
                            <button
                              type="button"
                              onClick={() => updatePartQty(part.id, -1)}
                              className="text-xs font-bold text-rose-400 hover:text-white px-1 transition-colors"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold font-mono text-white min-w-3 text-center">
                              {inOrder.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePartQty(part.id, 1)}
                              className="text-xs font-bold text-emerald-400 hover:text-white px-1 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={part.stock <= 0}
                            onClick={() => addPartToOrder(part.id)}
                            className="px-3 py-1 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all duration-200 disabled:opacity-30"
                          >
                            + Ambil
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Running total estimate banner */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-950/90 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-4">
              <span>Jasa ({selectedServiceIds.length}): <strong className="text-white font-mono">{formatRupiah(totalServiceEst)}</strong></span>
              <span>•</span>
              <span>Sparepart ({selectedParts.reduce((acc, p) => acc + p.qty, 0)} pcs): <strong className="text-white font-mono">{formatRupiah(totalPartsEst)}</strong></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Estimasi Awal:</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatRupiah(grandTotalEst)}
              </span>
            </div>
          </div>
        </div>

        {/* Action submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/services"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:brightness-110 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Menerbitkan SPK..." : "✓ Terbitkan SPK & Masukkan Antrian Pit"}
          </button>
        </div>
      </form>
    </div>
  );
}
