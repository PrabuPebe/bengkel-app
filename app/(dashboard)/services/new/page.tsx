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
  { id: "usr-3", name: "Budi Santoso", role: "Kepala Mekanik" },
  { id: "usr-4", name: "Agus Pratama", role: "Teknisi Mesin & CVT" },
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

  // Update vehicle options when customer changes
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
      if (part.stock < 1) {
        alert("Suku cadang ini sedang habis di gudang!");
        return;
      }
      setSelectedParts((prev) => [...prev, { partId, qty: 1 }]);
    }
  }

  function updatePartQty(partId: string, delta: number) {
    const part = availableParts.find((p) => p.id === partId);
    if (!part) return;

    setSelectedParts((prev) =>
      prev
        .map((p) => {
          if (p.partId === partId) {
            const newQty = p.qty + delta;
            if (newQty > part.stock) {
              alert(`Maksimal stok tersedia hanya ${part.stock} ${part.unit}`);
              return p;
            }
            return { ...p, qty: newQty };
          }
          return p;
        })
        .filter((p) => p.qty > 0)
    );
  }

  // Cost estimates calculation
  const totalServiceEst = selectedServiceIds.reduce((sum, sId) => {
    const s = availableServices.find((x) => x.id === sId);
    return sum + (s?.price || 0);
  }, 0);

  const totalPartsEst = selectedParts.reduce((sum, pItem) => {
    const part = availableParts.find((x) => x.id === pItem.partId);
    return sum + (part?.sellPrice || 0) * pItem.qty;
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
      setErrorMessage("Silakan pilih kendaraan yang akan diservis.");
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
      <div className="p-16 text-center text-[#817797] text-sm">
        <div className="w-8 h-8 border-2 border-[#9b6cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Memuat form penerimaan unit...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="p-2 rounded-xl bg-[#221939] border border-[#d2b8ff]/15 text-[#b5abc9] hover:text-[#f6f2ff] hover:bg-[#2e2150] transition-colors"
            title="Kembali ke Daftar Work Order"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#f6f2ff] tracking-tight">
              Penerimaan Unit & Penerbitan SPK Baru
            </h1>
            <p className="text-xs text-[#b5abc9]">
              Formulir Surat Perintah Kerja (SPK) untuk memasukkan kendaraan pelanggan ke antrian servis pit.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#3a1525] border border-[#ffaeae]/30 text-[#ffaeae] text-xs font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Pelanggan & Kendaraan */}
        <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#d2b8ff]/10">
            <h2 className="text-sm font-bold text-[#c49eff] uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8f63ec] text-white flex items-center justify-center text-xs">
                1
              </span>
              Pilih Pelanggan & Unit Kendaraan
            </h2>
            <Link
              href="/customers"
              target="_blank"
              className="text-xs text-[#9b6cff] hover:underline font-semibold"
            >
              + Daftar Pelanggan Baru ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
                Nama Pelanggan (Pemilik) *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
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
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
                Kendaraan yang Diservis *
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                disabled={!selectedCustomerId || customerVehicles.length === 0}
                className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff] disabled:opacity-50"
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
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
                Kilometer Odometer Masuk (KM)
              </label>
              <input
                type="number"
                value={currentKm}
                onChange={(e) => setCurrentKm(e.target.value)}
                placeholder="Contoh: 14200"
                className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
                Tugaskan Teknisi / Mekanik
              </label>
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
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

        {/* Section 2: Keluhan & Catatan Servis */}
        <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 shadow-xl shadow-black/20">
          <h2 className="text-sm font-bold text-[#c49eff] uppercase tracking-wider mb-4 pb-3 border-b border-[#d2b8ff]/10 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#8f63ec] text-white flex items-center justify-center text-xs">
              2
            </span>
            Keluhan Pelanggan & Catatan Khusus
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
                Keluhan Utama Kendaraan (Ditanyakan ke Pelanggan) *
              </label>
              <textarea
                value={complaints}
                onChange={(e) => setComplaints(e.target.value)}
                required
                rows={3}
                placeholder="Contoh: Mesin brebet saat gas dibuka mendadak, rem depan bunyi mendecit, minta ganti oli mesin."
                className="w-full p-3 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1.5">
                Catatan Tambahan / Status Fisik Unit (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Bodi lecet halus samping kiri, spion kiri agak kendor, pelanggan menunggu di lounge."
                className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Estimasi Tindakan & Sparepart Awal */}
        <div className="p-6 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 shadow-xl shadow-black/20">
          <h2 className="text-sm font-bold text-[#c49eff] uppercase tracking-wider mb-4 pb-3 border-b border-[#d2b8ff]/10 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#8f63ec] text-white flex items-center justify-center text-xs">
              3
            </span>
            Tindakan Jasa & Estimasi Suku Cadang Awal
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daftar Jasa Servis */}
            <div>
              <p className="text-xs font-bold text-[#d9d0eb] mb-2.5">
                Pilih Tindakan Jasa Servis:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableServices.map((srv) => {
                  const isChecked = selectedServiceIds.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? "bg-[#2e2150] border-[#9b6cff] text-[#f6f2ff]"
                          : "bg-[#17122b] border-[#d2b8ff]/10 text-[#b5abc9] hover:border-[#d2b8ff]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-[#d2b8ff]/30 text-[#8f63ec] focus:ring-0"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#f6f2ff]">{srv.name}</p>
                          <p className="text-[10px] text-[#817797]">
                            {srv.code} • ~{srv.duration || 30} mnt
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#34d399]">
                        {formatRupiah(srv.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suku Cadang Awal */}
            <div>
              <p className="text-xs font-bold text-[#d9d0eb] mb-2.5">
                Pilih Sparepart yang Akan Digunakan:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableParts.map((part) => {
                  const currentInOrder = selectedParts.find((p) => p.partId === part.id);
                  const isOutOfStock = part.stock <= 0;

                  return (
                    <div
                      key={part.id}
                      className="p-3 rounded-xl bg-[#17122b] border border-[#d2b8ff]/10 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-bold text-[#f6f2ff] truncate">
                          {part.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-[#817797]">
                          <span>{part.sku}</span>
                          <span>•</span>
                          <span
                            className={part.stock <= part.minStock ? "text-amber-400 font-bold" : "text-[#b5abc9]"}
                          >
                            Stok: {part.stock} {part.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-[#34d399]">
                          {formatRupiah(part.sellPrice)}
                        </span>

                        {currentInOrder ? (
                          <div className="flex items-center gap-1.5 bg-[#2e2150] rounded-lg px-2 py-1">
                            <button
                              type="button"
                              onClick={() => updatePartQty(part.id, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-[#ffaeae] hover:bg-[#3a1525]"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-[#f6f2ff] min-w-4 text-center">
                              {currentInOrder.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePartQty(part.id, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-[#34d399] hover:bg-[#1c3a28]"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => addPartToOrder(part.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Estimasi Ringkasan Biaya */}
          <div className="mt-6 pt-4 border-t border-[#d2b8ff]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#17122b]/60 p-4 rounded-xl">
            <div className="flex flex-wrap items-center gap-6 text-xs text-[#b5abc9]">
              <div>
                <span>Jasa ({selectedServiceIds.length}): </span>
                <span className="font-bold text-[#f6f2ff]">{formatRupiah(totalServiceEst)}</span>
              </div>
              <div>
                <span>Part ({selectedParts.reduce((acc, p) => acc + p.qty, 0)} pcs): </span>
                <span className="font-bold text-[#f6f2ff]">{formatRupiah(totalPartsEst)}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xs text-[#817797] uppercase tracking-wider font-bold">
                Estimasi Awal:
              </span>
              <span className="text-xl font-black text-emerald-400">
                {formatRupiah(grandTotalEst)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pb-8">
          <Link
            href="/services"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#817797] hover:text-[#f6f2ff] transition-colors"
          >
            Batalkan
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-lg shadow-[#8f63ec]/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menerbitkan SPK...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Terbitkan SPK & Masukkan Antrian
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
