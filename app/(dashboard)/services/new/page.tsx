"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Customer, Vehicle, ServicesCatalog, PartsInventory } from "@/lib/types/database";
import { getCustomersAction, createCustomerAction } from "@/lib/actions/customers";
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

type ServicePackageKey = "NONE" | "SERVIS_RUTIN" | "SERVIS_CVT" | "SERVIS_PENGEREMAN";

interface SmartPackageConfig {
  key: ServicePackageKey;
  title: string;
  subtitle: string;
  badge: string;
  defaultComplaint: string;
  serviceKeywords: string[];
  partKeywords: string[];
  recommendedLabels: string[];
}

const SMART_PACKAGES: SmartPackageConfig[] = [
  {
    key: "SERVIS_RUTIN",
    title: "Servis Rutin Ringan",
    subtitle: "Tune-up berkala, cek injeksi, pelumasan & pengapian",
    badge: "Rekomendasi: Oli Mesin (0.8L/1L) & Busi",
    defaultComplaint: "Servis rutin berkala, ganti oli mesin dan pengecekan busi/pengapian.",
    serviceKeywords: ["oli", "tune", "servis", "ringan", "rutin"],
    partKeywords: ["oli", "mpx", "yamalube", "shell", "busi", "ngk", "denso"],
    recommendedLabels: ["Oli Mesin (0.8L/1L)", "Busi Pengapian"],
  },
  {
    key: "SERVIS_CVT",
    title: "Servis CVT & Transmisi",
    subtitle: "Pembersihan ruang CVT, cek pulley, roller & vanbelt",
    badge: "Rekomendasi: Grease CVT & Roller Set / V-Belt",
    defaultComplaint: "Servis CVT, tarikan awal terasa gredek dan pengecekan roller/v-belt.",
    serviceKeywords: ["cvt", "gardan", "transmisi", "vanbelt", "v-belt"],
    partKeywords: ["cvt", "grease", "roller", "belt", "vanbelt", "v-belt", "gardan"],
    recommendedLabels: ["Grease CVT", "Roller Set", "V-Belt / Drive Belt"],
  },
  {
    key: "SERVIS_PENGEREMAN",
    title: "Servis Pengereman",
    subtitle: "Inspeksi kaliper, ganti kampas & kuras minyak rem",
    badge: "Rekomendasi: Kampas Rem & Minyak Rem",
    defaultComplaint: "Servis pengereman, rem terasa kurang pakem/berdecit.",
    serviceKeywords: ["rem", "kampas", "kaliper"],
    partKeywords: ["rem", "kampas", "dispad", "brake", "minyak"],
    recommendedLabels: ["Kampas Rem (Depan/Belakang)", "Minyak Rem DOT 3/4"],
  },
];

export default function NewServiceOrderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableServices, setAvailableServices] = useState<ServicesCatalog[]>([]);
  const [availableParts, setAvailableParts] = useState<PartsInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mode Pelanggan: "existing" | "walkin"
  const [customerInputMode, setCustomerInputMode] = useState<"existing" | "walkin">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  // Walk-in Quick Input (Plat Nomor, Nama, No HP, Tipe Motor)
  const [walkinPlate, setWalkinPlate] = useState("");
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinBrand, setWalkinBrand] = useState("Honda");
  const [walkinModel, setWalkinModel] = useState("Vario 160");

  const [selectedMechanicId, setSelectedMechanicId] = useState("usr-3");
  const [currentKm, setCurrentKm] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<ServicePackageKey>("NONE");
  const [complaints, setComplaints] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; qty: number }[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [quickActionToast, setQuickActionToast] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getCustomersAction(), getServicesAction(), getPartsAction()]).then(
      ([custData, servData, partData]) => {
        if (active) {
          setCustomers(custData);
          setAvailableServices(servData.filter((s) => s.isActive));
          setAvailableParts(partData);
          if (custData.length > 0) {
            setSelectedCustomerId(custData[0].id);
            if (custData[0].vehicles.length > 0) {
              setSelectedVehicleId(custData[0].vehicles[0].id);
            }
          }
          setIsLoading(false);
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  function showToast(msg: string) {
    setQuickActionToast(msg);
    setTimeout(() => setQuickActionToast(""), 3500);
  }

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

  function addPartToOrder(partId: string, silent = false) {
    const existing = selectedParts.find((p) => p.partId === partId);
    const part = availableParts.find((p) => p.id === partId);
    if (!part) return;
    if (part.stock <= 0) {
      if (!silent) alert(`Stok ${part.name} sedang habis.`);
      return;
    }
    if (existing) {
      if (existing.qty >= part.stock) {
        if (!silent) alert(`Maksimal stok tersedia: ${part.stock} ${part.unit}`);
        return;
      }
      setSelectedParts((prev) =>
        prev.map((p) => (p.partId === partId ? { ...p, qty: p.qty + 1 } : p))
      );
    } else {
      setSelectedParts((prev) => [...prev, { partId, qty: 1 }]);
    }
    if (!silent) {
      showToast(`✓ ${part.name} ditambahkan ke rincian servis.`);
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
      if (newQty > part.stock) {
        alert(`Maksimal stok: ${part.stock} ${part.unit}`);
        return prev;
      }
      return prev.map((p) => (p.partId === partId ? { ...p, qty: newQty } : p));
    });
  }

  // === LOGIKA SMART PACKAGE RECOMMENDATION ===
  const activePackageConfig = SMART_PACKAGES.find((p) => p.key === selectedPackage);

  const recommendedPackageParts: PartsInventory[] = activePackageConfig
    ? availableParts.filter((part) => {
        const hay = `${part.name} ${part.category} ${part.sku}`.toLowerCase();
        return activePackageConfig.partKeywords.some((kw) => hay.includes(kw));
      })
    : [];

  function handleSelectPackage(pkg: SmartPackageConfig) {
    setSelectedPackage(pkg.key);
    if (!complaints.trim()) {
      setComplaints(pkg.defaultComplaint);
    }
    // Otomatis centang jasa yang sesuai paket
    const matchedServices = availableServices.filter((s) => {
      const nameLower = s.name.toLowerCase();
      return pkg.serviceKeywords.some((kw) => nameLower.includes(kw));
    });
    if (matchedServices.length > 0) {
      const idsToAdd = matchedServices.slice(0, 2).map((s) => s.id);
      setSelectedServiceIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
    }
  }

  function handleApplyAllPackageParts() {
    if (recommendedPackageParts.length === 0) return;
    let addedCount = 0;
    for (const part of recommendedPackageParts.slice(0, 3)) {
      if (part.stock > 0 && !selectedParts.some((sp) => sp.partId === part.id)) {
        addPartToOrder(part.id, true);
        addedCount++;
      }
    }
    showToast(`✓ ${addedCount || 1} suku cadang rekomendasi paket berhasil dimasukkan ke SPK!`);
  }

  // === LOGIKA ODOMETER LIFESPAN TRIGGER (PERMINTAAN DOSEN) ===
  const numericKm = parseInt(currentKm.replace(/[^0-9]/g, ""), 10) || 0;

  interface OdometerAlertInfo {
    level: "CRITICAL" | "WARNING";
    title: string;
    message: string;
    recommendedParts: PartsInventory[];
  }

  function getOdometerAlert(): OdometerAlertInfo | null {
    if (numericKm <= 0) return null;

    if (numericKm >= 24000) {
      const vbeltAndOilParts = availableParts.filter((p) => {
        const name = `${p.name} ${p.category}`.toLowerCase();
        return (
          name.includes("belt") ||
          name.includes("vanbelt") ||
          name.includes("oli") ||
          name.includes("mpx") ||
          name.includes("roller")
        );
      });
      return {
        level: "CRITICAL",
        title: `Perhatian: Odometer telah mencapai ${numericKm.toLocaleString("id-ID")} KM!`,
        message: `Direkomendasikan ganti V-Belt & Oli Mesin hari ini! Interval batas aman V-Belt (24.000 KM) dan Oli Mesin (3.000 KM) telah tercapai untuk mencegah putus sabuk CVT di jalan.`,
        recommendedParts: vbeltAndOilParts.length > 0 ? vbeltAndOilParts.slice(0, 3) : availableParts.slice(0, 2),
      };
    }

    if (numericKm >= 8000) {
      const sparkAndOilParts = availableParts.filter((p) => {
        const name = `${p.name} ${p.category}`.toLowerCase();
        return name.includes("busi") || name.includes("oli") || name.includes("filter") || name.includes("mpx");
      });
      return {
        level: "WARNING",
        title: `Perhatian: Odometer telah mencapai ${numericKm.toLocaleString("id-ID")} KM!`,
        message: `Direkomendasikan ganti Busi, Filter Udara & Oli Mesin hari ini! Kendaraan telah melewati siklus servis menengah 8.000 KM.`,
        recommendedParts: sparkAndOilParts.length > 0 ? sparkAndOilParts.slice(0, 3) : availableParts.slice(0, 2),
      };
    }

    if (numericKm >= 3000) {
      const oilParts = availableParts.filter((p) => {
        const name = `${p.name} ${p.category}`.toLowerCase();
        return name.includes("oli") || name.includes("mpx") || name.includes("pelumas");
      });
      return {
        level: "WARNING",
        title: `Perhatian: Odometer telah mencapai ${numericKm.toLocaleString("id-ID")} KM!`,
        message: `Direkomendasikan ganti Oli Mesin hari ini! Interval pemakaian oli (>= 3.000 KM) telah tercapai agar suhu dan gesekan mesin tetap terjaga.`,
        recommendedParts: oilParts.length > 0 ? oilParts.slice(0, 2) : availableParts.slice(0, 1),
      };
    }

    return null;
  }

  const odometerAlert = getOdometerAlert();

  function handleOneClickOdometerParts() {
    if (!odometerAlert) return;
    let added = 0;
    for (const part of odometerAlert.recommendedParts) {
      if (part.stock > 0 && !selectedParts.some((sp) => sp.partId === part.id)) {
        addPartToOrder(part.id, true);
        added++;
      }
    }
    showToast(`✓ ${added || 1} suku cadang rekomendasi Odometer (${numericKm.toLocaleString("id-ID")} KM) ditambahkan ke SPK!`);
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

    let finalCustomerId = selectedCustomerId;
    let finalVehicleId = selectedVehicleId;

    if (customerInputMode === "walkin") {
      if (!walkinPlate.trim() || !walkinName.trim() || !walkinPhone.trim()) {
        setErrorMessage("Untuk pelanggan baru/walk-in, Plat Nomor, Nama, dan No. HP wajib diisi.");
        return;
      }
    } else {
      if (!selectedCustomerId) {
        setErrorMessage("Silakan pilih pelanggan terlebih dahulu.");
        return;
      }
      if (!selectedVehicleId) {
        setErrorMessage("Silakan pilih unit kendaraan.");
        return;
      }
    }

    if (!complaints.trim()) {
      setErrorMessage("Keluhan utama kendaraan wajib diisi.");
      return;
    }

    const mechanic = AVAILABLE_MECHANICS.find((m) => m.id === selectedMechanicId);
    startTransition(async () => {
      // Jika mode walk-in, daftarkan pelanggan & kendaraan terlebih dahulu ke Supabase
      if (customerInputMode === "walkin") {
        const fd = new FormData();
        fd.set("name", walkinName.trim());
        fd.set("phone", walkinPhone.trim());
        fd.set("plateNumber", walkinPlate.trim().toUpperCase());
        fd.set("brand", walkinBrand.trim() || "Honda");
        fd.set("model", walkinModel.trim() || "Matic");
        fd.set("year", new Date().getFullYear().toString());
        const custRes = await createCustomerAction(fd);
        if (!custRes.success || !custRes.data) {
          setErrorMessage(custRes.error || "Gagal menyimpan data pelanggan walk-in.");
          return;
        }
        finalCustomerId = custRes.data.id;
        finalVehicleId = custRes.data.vehicles[0]?.id || "";
      }

      const result = await createServiceOrderAction({
        customerId: finalCustomerId,
        vehicleId: finalVehicleId,
        mechanicId: selectedMechanicId,
        mechanicName: mechanic?.name || "Budi Santoso",
        currentKm: numericKm > 0 ? numericKm : undefined,
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
      <div className="p-20 text-center text-slate-400 text-xs card-pitstop">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Memuat formulir penerimaan unit PitCare Auto...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#00D2FF] mb-1">
            <Link href="/services" className="hover:underline flex items-center gap-1">
              <span>←</span> Kembali ke Antrian Servis
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Pendaftaran Servis Baru & Smart Recommendation (SPK)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PitCare Auto • Sistem Rekomendasi Suku Cadang Cerdas & Deteksi Interval Odometer Otomatis
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {quickActionToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg">
          <span>{quickActionToast}</span>
          <button
            type="button"
            onClick={() => setQuickActionToast("")}
            className="text-emerald-400 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI (8 KOLOM) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. IDENTITAS PELANGGAN, PLAT NOMOR & ODOMETER */}
          <div className="card-pitstop p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/15 text-[#00D2FF] border border-cyan-500/30 flex items-center justify-center font-mono text-xs font-extrabold">
                  1
                </span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Data Kendaraan, Pelanggan & Odometer (KM)
                </h2>
              </div>

              {/* Toggle Pilih Pelanggan Lama vs Input Cepat Walk-in */}
              <div className="inline-flex rounded-xl bg-[#0B0F19] p-1 border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCustomerInputMode("existing")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    customerInputMode === "existing"
                      ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pilih Terdaftar ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerInputMode("walkin")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    customerInputMode === "walkin"
                      ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  + Input Cepat Plat / Pelanggan Baru
                </button>
              </div>
            </div>

            {customerInputMode === "existing" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Nama / No. HP Pelanggan *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="input-dark"
                    required
                  >
                    <option value="">-- Pilih Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-dark">Plat Nomor & Unit Kendaraan *</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="input-dark font-mono"
                    disabled={!selectedCustomerId || customerVehicles.length === 0}
                    required
                  >
                    <option value="">
                      {selectedCustomerId
                        ? customerVehicles.length > 0
                          ? "-- Pilih Plat Nomor Kendaraan --"
                          : "Pelanggan belum memiliki kendaraan"
                        : "-- Pilih Pelanggan Dahulu --"}
                    </option>
                    {customerVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        [{v.plateNumber}] {v.brand} {v.model} ({v.year || "-"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0B0F19]/90 border border-cyan-500/30">
                <div>
                  <label className="label-dark">Plat Nomor Kendaraan *</label>
                  <input
                    type="text"
                    value={walkinPlate}
                    onChange={(e) => setWalkinPlate(e.target.value.toUpperCase())}
                    placeholder="Contoh: B 4567 XYZ"
                    className="input-dark font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="label-dark">Nama Pelanggan *</label>
                  <input
                    type="text"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    placeholder="Contoh: Hendra Wijaya"
                    className="input-dark"
                    required
                  />
                </div>
                <div>
                  <label className="label-dark">Nomor WhatsApp / HP *</label>
                  <input
                    type="text"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="input-dark font-mono"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label-dark">Merk</label>
                    <input
                      type="text"
                      value={walkinBrand}
                      onChange={(e) => setWalkinBrand(e.target.value)}
                      placeholder="Honda"
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="label-dark">Tipe Motor</label>
                    <input
                      type="text"
                      value={walkinModel}
                      onChange={(e) => setWalkinModel(e.target.value)}
                      placeholder="Vario 160"
                      className="input-dark"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Odometer Input & Mekanik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label-dark mb-0">Odometer Saat Ini (KM) *</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">Simulasi KM:</span>
                    <button
                      type="button"
                      onClick={() => setCurrentKm("3500")}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-amber-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                    >
                      3.500
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentKm("12000")}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-amber-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                    >
                      12.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentKm("24500")}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                    >
                      24.500
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Ketik angka KM (misal: 24500)"
                  value={currentKm}
                  onChange={(e) => setCurrentKm(e.target.value)}
                  className="input-dark font-mono text-base font-bold text-cyan-300"
                  required
                />
              </div>

              <div>
                <label className="label-dark">Tugaskan Mekanik Pit *</label>
                <select
                  value={selectedMechanicId}
                  onChange={(e) => setSelectedMechanicId(e.target.value)}
                  className="input-dark"
                >
                  {AVAILABLE_MECHANICS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BANNER PERINGATAN ODOMETER LIFESPAN TRIGGER (PERMINTAAN DOSEN) */}
            {odometerAlert && (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  odometerAlert.level === "CRITICAL"
                    ? "bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/30"
                    : "bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          odometerAlert.level === "CRITICAL"
                            ? "bg-rose-500 text-white"
                            : "bg-amber-400 text-slate-950"
                        }`}
                      >
                        {odometerAlert.level === "CRITICAL" ? "⚠️ Lifespan Alert Kritis" : "⚡ Lifespan Alert Interval"}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-extrabold ${
                          odometerAlert.level === "CRITICAL" ? "text-rose-200" : "text-amber-200"
                        }`}
                      >
                        {odometerAlert.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{odometerAlert.message}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Suku Cadang Terkait:</span>
                      {odometerAlert.recommendedParts.map((rp) => (
                        <span
                          key={rp.id}
                          className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-cyan-300"
                        >
                          {rp.name} ({formatRupiah(rp.sellPrice)})
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOneClickOdometerParts}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shrink-0 cursor-pointer transition-all shadow-md ${
                      odometerAlert.level === "CRITICAL"
                        ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25"
                        : "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/25"
                    }`}
                  >
                    + Masukkan Rekomendasi (1-Klik)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. PILIH PAKET SERVIS & SMART RECOMMENDATION PANEL */}
          <div className="card-pitstop p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/15 text-[#00D2FF] border border-cyan-500/30 flex items-center justify-center font-mono text-xs font-extrabold">
                  2
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Pilih Paket Servis & Smart Recommendation Panel
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Pilih paket servis untuk memunculkan rekomendasi suku cadang otomatis
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Kartu Paket Servis Utama */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {SMART_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage === pkg.key;
                return (
                  <div
                    key={pkg.key}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-cyan-500/15 border-[#00D2FF] shadow-[0_0_20px_rgba(0,210,255,0.15)]"
                        : "bg-[#0B0F19]/90 border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-white">{pkg.title}</span>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                            isSelected
                              ? "bg-[#00D2FF] border-[#00D2FF] text-slate-950 font-bold"
                              : "border-slate-600"
                          }`}
                        >
                          {isSelected && "✓"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{pkg.subtitle}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-cyan-300">
                      💡 {pkg.badge}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SMART RECOMMENDATION PANEL (Tampil Otomatis Saat Paket Dipilih) */}
            {activePackageConfig && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-blue-950/30 border border-cyan-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-[#00D2FF] text-[10px] font-extrabold uppercase">
                        Smart Recommendation Active
                      </span>
                      <h3 className="text-xs font-extrabold text-white">
                        Rekomendasi Suku Cadang — {activePackageConfig.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Komponen wajib cek/ganti: {activePackageConfig.recommendedLabels.join(" + ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAllPackageParts}
                    className="btn-cyan px-3.5 py-2 text-xs font-extrabold shrink-0 cursor-pointer shadow-md"
                  >
                    + Masukkan Semua Paket (1-Klik)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recommendedPackageParts.map((part) => {
                    const alreadyInOrder = selectedParts.find((sp) => sp.partId === part.id);
                    return (
                      <div
                        key={part.id}
                        className="p-3 rounded-xl bg-[#0B0F19]/90 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{part.name}</p>
                          <p className="text-[11px] font-mono text-cyan-400 font-semibold">
                            {formatRupiah(part.sellPrice)}{" "}
                            <span className="text-slate-500">• {part.category}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addPartToOrder(part.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                            alreadyInOrder
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00D2FF] border border-cyan-500/40"
                          }`}
                        >
                          {alreadyInOrder ? `✓ Terpilih (${alreadyInOrder.qty})` : "+ Tambah"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Keluhan & Catatan */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="label-dark">Keluhan Utama / Instruksi Pengerjaan *</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Tarikan gas awal berat/gredek, ganti oli mesin rutin, rem belakang kurang pakem..."
                  value={complaints}
                  onChange={(e) => setComplaints(e.target.value)}
                  className="input-dark resize-none"
                  required
                />
              </div>

              <div>
                <label className="label-dark">Catatan Tambahan Front-Desk (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Pelanggan menunggu di ruang tunggu VIP, minta part bekas disimpan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-dark"
                />
              </div>
            </div>
          </div>

          {/* 3. KATALOG LENGKAP JASA & SUKU CADANG */}
          <div className="card-pitstop p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/15 text-[#00D2FF] border border-cyan-500/30 flex items-center justify-center font-mono text-xs font-extrabold">
                3
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Daftar Katalog Jasa Servis & Komponen Pendukung
              </h2>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2.5">Pilih Tindakan Jasa Servis:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableServices.map((srv) => {
                  const isChecked = selectedServiceIds.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "bg-cyan-500/12 border-cyan-500/50 text-white"
                          : "bg-[#0B0F19]/80 border-slate-800/80 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border ${
                            isChecked
                              ? "bg-[#00D2FF] border-[#00D2FF] text-slate-950"
                              : "border-slate-600 bg-slate-900"
                          }`}
                        >
                          {isChecked && "✓"}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold truncate">{srv.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">{srv.code}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400 shrink-0 ml-2">
                        {formatRupiah(srv.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <p className="text-xs font-semibold text-slate-400 mb-2.5">
                Tambah Komponen / Suku Cadang Pendukung Servis:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {availableParts.map((part) => (
                  <div
                    key={part.id}
                    className="p-2.5 rounded-xl bg-[#0B0F19]/70 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-200 truncate">{part.name}</p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span className="text-amber-400 font-semibold">{formatRupiah(part.sellPrice)}</span>
                        <span>•</span>
                        <span>{part.category}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addPartToOrder(part.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      + Tambah
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: RINGKASAN SPK (4 KOLOM) */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          <div className="card-pitstop p-6 space-y-5 border-cyan-500/30">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00D2FF] font-bold">
                PITCARE AUTO • WORK ORDER SUMMARY
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">Ringkasan Penerimaan Servis</h3>
            </div>

            {/* Selected Services */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Jasa Servis ({selectedServiceIds.length})
              </p>
              {selectedServiceIds.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Belum ada tindakan jasa dipilih</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedServiceIds.map((id) => {
                    const srv = availableServices.find((s) => s.id === id);
                    if (!srv) return null;
                    return (
                      <div key={id} className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-300 truncate pr-2">{srv.name}</span>
                        <span className="font-mono font-semibold text-white shrink-0">
                          {formatRupiah(srv.price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Parts */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Suku Cadang ({selectedParts.reduce((a, b) => a + b.qty, 0)})
              </p>
              {selectedParts.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Belum ada suku cadang dipilih</p>
              ) : (
                <div className="space-y-2">
                  {selectedParts.map((item) => {
                    const part = availableParts.find((p) => p.id === item.partId);
                    if (!part) return null;
                    return (
                      <div
                        key={item.partId}
                        className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{part.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {formatRupiah(part.sellPrice)} x {item.qty}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updatePartQty(item.partId, -1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-white w-5 text-center">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updatePartQty(item.partId, 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Subtotal Calculation */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Estimasi Jasa</span>
                <span className="font-mono text-slate-200">{formatRupiah(totalServiceEst)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Estimasi Suku Cadang</span>
                <span className="font-mono text-slate-200">{formatRupiah(totalPartsEst)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800/80">
                <span>Total Estimasi Awal</span>
                <span className="font-mono text-[#00D2FF] text-base">{formatRupiah(grandTotalEst)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-cyan w-full py-3.5 text-xs sm:text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isPending ? "Menerbitkan SPK & Potong Stok..." : "🚀 Terbitkan SPK & Masuk Antrian Pit"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
