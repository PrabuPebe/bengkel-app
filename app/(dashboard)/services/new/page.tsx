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

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableServices, setAvailableServices] = useState<ServicesCatalog[]>([]);
  const [availableParts, setAvailableParts] = useState<PartsInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedMechanicId, setSelectedMechanicId] = useState("usr-3");
  const [currentKm, setCurrentKm] = useState<string>("");
  const [complaints, setComplaints] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; qty: number }[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getCustomersAction(), getServicesAction(), getPartsAction()]).then(
      ([custData, servData, partData]) => {
        if (active) {
          setCustomers(custData);
          setAvailableServices(servData.filter((s) => s.isActive));
          setAvailableParts(partData);
          setIsLoading(false);
        }
      }
    );
    return () => { active = false; };
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerVehicles: Vehicle[] = selectedCustomer?.vehicles || [];

  function handleCustomerChange(custId: string) {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (cust && cust.vehicles.length > 0) setSelectedVehicleId(cust.vehicles[0].id);
    else setSelectedVehicleId("");
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  function addPartToOrder(partId: string) {
    const existing = selectedParts.find((p) => p.partId === partId);
    const part = availableParts.find((p) => p.id === partId);
    if (!part) return;
    if (existing) {
      if (existing.qty >= part.stock) { alert(`Maksimal stok: ${part.stock} ${part.unit}`); return; }
      setSelectedParts((prev) => prev.map((p) => (p.partId === partId ? { ...p, qty: p.qty + 1 } : p)));
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
      if (newQty <= 0) return prev.filter((p) => p.partId !== partId);
      if (newQty > part.stock) { alert(`Maksimal stok: ${part.stock} ${part.unit}`); return prev; }
      return prev.map((p) => (p.partId === partId ? { ...p, qty: newQty } : p));
    });
  }

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
    if (!selectedCustomerId) { setErrorMessage("Silakan pilih pelanggan terlebih dahulu."); return; }
    if (!selectedVehicleId) { setErrorMessage("Silakan pilih unit kendaraan."); return; }
    if (!complaints.trim()) { setErrorMessage("Keluhan utama kendaraan wajib diisi."); return; }

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
      <div className="p-20 text-center text-[#435663] text-xs card-floating">
        <div className="w-8 h-8 border-2 border-[#A3B087] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
          className="btn-outline-steel p-2.5 cursor-pointer"
          title="Kembali ke Daftar SPK"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#313647] tracking-tight">
            Penerimaan Unit & SPK Baru
          </h1>
          <p className="text-xs text-[#435663] mt-0.5">
            Catat data masuk unit kendaraan, keluhan pelanggan, dan tugaskan teknisi pit.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Pelanggan & Kendaraan */}
        <div className="card-floating p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#435663]/15">
            <h2 className="text-sm font-bold text-[#313647] flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#313647] text-[#FFF8D4] flex items-center justify-center text-[11px] font-black">1</span>
              Identitas Pemilik & Unit Kendaraan
            </h2>
            <Link href="/customers" target="_blank" className="text-xs text-[#313647] hover:underline font-bold transition-colors">
              + Daftar Pelanggan Baru ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#313647] mb-1.5">Nama Pelanggan *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="input-custom w-full h-11 px-3.5 text-xs"
              >
                <option value="">-- Pilih Pelanggan Terdaftar --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — {c.vehicles.length} Kendaraan
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#313647] mb-1.5">Kendaraan yang Diservis *</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                disabled={!selectedCustomerId || customerVehicles.length === 0}
                className="input-custom w-full h-11 px-3.5 text-xs disabled:opacity-50 disabled:bg-slate-100"
              >
                {customerVehicles.length === 0 ? (
                  <option value="">-- Pilih pelanggan dahulu --</option>
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
              <label className="block text-xs font-semibold text-[#313647] mb-1.5">KM Spidometer Masuk</label>
              <input
                type="number"
                value={currentKm}
                onChange={(e) => setCurrentKm(e.target.value)}
                placeholder="Contoh: 14200"
                className="input-custom w-full h-11 px-3.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#313647] mb-1.5">Teknisi Penanggung Jawab</label>
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="input-custom w-full h-11 px-3.5 text-xs"
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

        {/* Section 2: Keluhan */}
        <div className="card-floating p-6 sm:p-7">
          <h2 className="text-sm font-bold text-[#313647] mb-5 pb-4 border-b border-[#435663]/15 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#313647] text-[#FFF8D4] flex items-center justify-center text-[11px] font-black">2</span>
            Keluhan Masuk & Catatan Kondisi Fisik
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#313647] mb-1.5">Keluhan Utama Kendaraan *</label>
              <textarea
                value={complaints}
                onChange={(e) => setComplaints(e.target.value)}
                required
                rows={3}
                placeholder="Contoh: Mesin brebet saat akselerasi awal, rem depan bunyi mendecit, ganti oli mesin rutin..."
                className="input-custom w-full p-3.5 text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#313647] mb-1.5">Catatan / Permintaan Khusus (Opsional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Bodi kiri ada goresan halus, pelanggan menunggu di lounge."
                className="input-custom w-full h-11 px-3.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Tindakan & Sparepart */}
        <div className="card-floating p-6 sm:p-7">
          <h2 className="text-sm font-bold text-[#313647] mb-5 pb-4 border-b border-[#435663]/15 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#313647] text-[#FFF8D4] flex items-center justify-center text-[11px] font-black">3</span>
            Tindakan Jasa & Estimasi Suku Cadang Awal
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jasa */}
            <div>
              <p className="text-xs font-bold text-[#313647] mb-2">Pilih Paket Tindakan Jasa:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableServices.map((srv) => {
                  const isChecked = selectedServiceIds.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        isChecked
                          ? "bg-[#FFF8D4] border-[#A3B087] shadow-xs"
                          : "bg-white border-[#435663]/20 hover:border-[#435663]/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-[#435663]/40 text-[#313647] focus:ring-0"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#313647]">{srv.name}</p>
                          <p className="text-[10px] text-[#435663]">{srv.code} • ~{srv.duration || 30} mnt</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#313647] font-mono">{formatRupiah(srv.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suku Cadang */}
            <div>
              <p className="text-xs font-bold text-[#313647] mb-2">Pilih Suku Cadang:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableParts.map((part) => {
                  const inOrder = selectedParts.find((p) => p.partId === part.id);
                  return (
                    <div key={part.id} className="p-3 rounded-xl bg-white border border-[#435663]/20 flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-bold text-[#313647] truncate">{part.name}</p>
                        <p className="text-[10px] text-[#435663]">
                          Stok:{" "}
                          <span className={part.stock <= part.minStock ? "text-amber-700 font-bold" : "text-[#435663]"}>
                            {part.stock} {part.unit}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-black text-[#313647] font-mono">{formatRupiah(part.sellPrice)}</span>
                        {inOrder ? (
                          <div className="flex items-center gap-1 bg-[#FFF8D4] border border-[#A3B087]/50 rounded-lg px-2.5 py-1">
                            <button type="button" onClick={() => updatePartQty(part.id, -1)} className="text-xs font-bold text-rose-600 px-0.5 cursor-pointer">-</button>
                            <span className="text-xs font-bold font-mono text-[#313647] min-w-4 text-center">{inOrder.qty}</span>
                            <button type="button" onClick={() => updatePartQty(part.id, 1)} className="text-xs font-bold text-[#313647] px-0.5 cursor-pointer">+</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={part.stock <= 0}
                            onClick={() => addPartToOrder(part.id)}
                            className="btn-sage px-3 py-1 text-xs cursor-pointer disabled:opacity-30"
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

          {/* Running total estimate */}
          <div className="mt-5 p-4 rounded-xl bg-[#FFF8D4] border border-[#A3B087]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#435663] flex items-center gap-4 font-medium">
              <span>Jasa ({selectedServiceIds.length}): <strong className="text-[#313647] font-mono">{formatRupiah(totalServiceEst)}</strong></span>
              <span>•</span>
              <span>Sparepart ({selectedParts.reduce((acc, p) => acc + p.qty, 0)} pcs): <strong className="text-[#313647] font-mono">{formatRupiah(totalPartsEst)}</strong></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-bold text-[#435663] uppercase tracking-wider">Estimasi Awal:</span>
              <span className="text-xl font-black text-[#313647] font-mono">{formatRupiah(grandTotalEst)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/services" className="btn-outline-steel px-4 py-2.5 text-xs cursor-pointer">
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="btn-sage px-6 py-2.5 text-xs cursor-pointer disabled:opacity-60"
          >
            {isPending ? "Menerbitkan SPK..." : "✓ Terbitkan SPK & Masukkan Antrian Pit"}
          </button>
        </div>
      </form>
    </div>
  );
}
