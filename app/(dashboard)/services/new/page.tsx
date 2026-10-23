"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Customer, Vehicle, ServicesCatalog, PartsInventory } from "@/lib/types/database";
import { getCustomersAction, createCustomerAction } from "@/lib/actions/customers";
import { getServicesAction } from "@/lib/actions/services";
import { getPartsAction } from "@/lib/actions/parts";
import { createServiceOrderAction } from "@/lib/actions/orders";
import { getMechanicsAction } from "@/lib/actions/auth";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface MechanicOption {
  id: string;
  name: string;
  role?: string;
}

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
    subtitle: "Ganti oli mesin, bersihkan busi & cek mesin harian",
    badge: "Rekomendasi: Oli Mesin (0.8L/1L) & Busi",
    defaultComplaint: "Servis rutin berkala, ganti oli mesin dan pengecekan busi.",
    serviceKeywords: ["oli", "tune", "servis", "ringan", "rutin"],
    partKeywords: ["oli", "mpx", "yamalube", "shell", "busi", "ngk", "denso"],
    recommendedLabels: ["Oli Mesin (0.8L/1L)", "Busi"],
  },
  {
    key: "SERVIS_CVT",
    title: "Servis CVT",
    subtitle: "Bersihkan rumah CVT, cek tarikan gredek, roller & vanbelt",
    badge: "Rekomendasi: Grease CVT & Roller Set",
    defaultComplaint: "Servis CVT, tarikan awal terasa gredek dan cek roller/v-belt.",
    serviceKeywords: ["cvt", "gardan", "transmisi", "vanbelt", "v-belt"],
    partKeywords: ["cvt", "grease", "roller", "belt", "vanbelt", "v-belt", "gardan"],
    recommendedLabels: ["Grease CVT", "Roller Set", "V-Belt"],
  },
  {
    key: "SERVIS_PENGEREMAN",
    title: "Servis Pengereman",
    subtitle: "Cek pengereman depan/belakang, ganti kampas & minyak rem",
    badge: "Rekomendasi: Kampas Rem & Minyak Rem",
    defaultComplaint: "Servis pengereman, rem terasa kurang pakem atau berbunyi.",
    serviceKeywords: ["rem", "kampas", "kaliper"],
    partKeywords: ["rem", "kampas", "dispad", "brake", "minyak"],
    recommendedLabels: ["Kampas Rem", "Minyak Rem"],
  },
];

export default function NewServiceOrderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableServices, setAvailableServices] = useState<ServicesCatalog[]>([]);
  const [availableParts, setAvailableParts] = useState<PartsInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mode Pelanggan: "walkin" (default ramah awam) | "existing"
  const [customerInputMode, setCustomerInputMode] = useState<"walkin" | "existing">("walkin");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  // Walk-in Input
  const [walkinPlate, setWalkinPlate] = useState("");
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinBrand, setWalkinBrand] = useState("Honda");
  const [walkinModel, setWalkinModel] = useState("Vario 160");

  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState("");
  const [currentKm, setCurrentKm] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<ServicePackageKey>("SERVIS_RUTIN");
  const [complaints, setComplaints] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; qty: number }[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [quickActionToast, setQuickActionToast] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getCustomersAction(),
      getServicesAction(),
      getPartsAction(),
      getMechanicsAction(),
    ]).then(([custData, servData, partData, mechData]) => {
      if (active) {
        setCustomers(custData);
        const activeSrvs = servData.filter((s) => s.isActive);
        setAvailableServices(activeSrvs);
        setAvailableParts(partData);
        if (custData.length > 0) {
          setSelectedCustomerId(custData[0].id);
          if (custData[0].vehicles.length > 0) {
            setSelectedVehicleId(custData[0].vehicles[0].id);
          }
        }
        if (mechData && mechData.length > 0) {
          setMechanics(mechData);
          setSelectedMechanicId(mechData[0].id);
        } else {
          // Fallback cerdas jika belum ada akun mekanik di database
          const fallback: MechanicOption[] = [
            { id: "default-mechanic", name: "Mekanik Umum", role: "Teknisi" },
          ];
          setMechanics(fallback);
          setSelectedMechanicId("default-mechanic");
        }
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function showToast(msg: string) {
    setQuickActionToast(msg);
    setTimeout(() => setQuickActionToast(""), 3000);
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
    if (existing) {
      setSelectedParts((prev) =>
        prev.map((p) => (p.partId === partId ? { ...p, qty: p.qty + 1 } : p))
      );
    } else {
      setSelectedParts((prev) => [...prev, { partId, qty: 1 }]);
    }
    if (!silent) {
      showToast(`✓ ${part.name} ditambahkan ke daftar servis.`);
    }
  }

  function updatePartQty(partId: string, delta: number) {
    setSelectedParts((prev) => {
      const existing = prev.find((p) => p.partId === partId);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) return prev.filter((p) => p.partId !== partId);
      return prev.map((p) => (p.partId === partId ? { ...p, qty: newQty } : p));
    });
  }

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
      if (!selectedParts.some((sp) => sp.partId === part.id)) {
        addPartToOrder(part.id, true);
        addedCount++;
      }
    }
    showToast(`✓ ${addedCount || 1} suku cadang rekomendasi berhasil dimasukkan!`);
  }

  // Odometer Lifespan Trigger
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
        return name.includes("belt") || name.includes("vanbelt") || name.includes("oli") || name.includes("mpx") || name.includes("roller");
      });
      return {
        level: "CRITICAL",
        title: `Perhatian: Odometer telah mencapai ${numericKm.toLocaleString("id-ID")} KM. Direkomendasikan ganti V-Belt & Oli hari ini!`,
        message: `Motor sudah mencapai batas pemakaian 24.000 KM. Disarankan mengganti V-Belt dan Oli Mesin agar sabuk tidak putus di jalan.`,
        recommendedParts: vbeltAndOilParts.length > 0 ? vbeltAndOilParts.slice(0, 3) : availableParts.slice(0, 2),
      };
    }

    if (numericKm >= 3000) {
      const oilParts = availableParts.filter((p) => {
        const name = `${p.name} ${p.category}`.toLowerCase();
        return name.includes("oli") || name.includes("mpx") || name.includes("busi");
      });
      return {
        level: "WARNING",
        title: `Perhatian: Odometer telah mencapai ${numericKm.toLocaleString("id-ID")} KM. Direkomendasikan ganti Oli hari ini!`,
        message: `Motor sudah menempuh jarak >= 3.000 KM. Disarankan mengganti Oli Mesin dan mengecek Busi agar tarikan tetap enteng.`,
        recommendedParts: oilParts.length > 0 ? oilParts.slice(0, 2) : availableParts.slice(0, 1),
      };
    }

    return null;
  }

  const odometerAlert = getOdometerAlert();

  function handleOneClickOdometerParts() {
    if (!odometerAlert) return;
    for (const part of odometerAlert.recommendedParts) {
      if (!selectedParts.some((sp) => sp.partId === part.id)) {
        addPartToOrder(part.id, true);
      }
    }
    showToast(`✓ Suku cadang rekomendasi KM ${numericKm.toLocaleString("id-ID")} berhasil dimasukkan!`);
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
        setErrorMessage("Mohon lengkapi Plat Nomor, Nama Pelanggan, dan Nomor WhatsApp.");
        return;
      }
    } else {
      if (!selectedCustomerId || !selectedVehicleId) {
        setErrorMessage("Mohon pilih pelanggan dan motor terlebih dahulu.");
        return;
      }
    }

    if (!complaints.trim()) {
      setErrorMessage("Mohon tuliskan keluhan atau paket servis yang diminta pelanggan.");
      return;
    }

    // TUGAS 2: Ambil mekanik dari state dinamis dengan fallback cerdas
    const selectedMechanic = mechanics.find((m) => m.id === selectedMechanicId);
    const finalMechanicName = selectedMechanic?.name || "Mekanik Umum";
    const finalMechanicId =
      selectedMechanic && selectedMechanic.id !== "default-mechanic"
        ? selectedMechanic.id
        : undefined;

    // TUGAS 5: Sanitasi murni integer positif untuk odometer (mencegah bug NaN)
    const cleanOdometerDigits = currentKm.toString().replace(/[^0-9]/g, "");
    const parsedKm = parseInt(cleanOdometerDigits, 10);
    const sanitizedKm = !isNaN(parsedKm) && parsedKm > 0 ? Math.floor(parsedKm) : undefined;

    startTransition(async () => {
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
          setErrorMessage(custRes.error || "Gagal menyimpan data pelanggan baru.");
          return;
        }
        finalCustomerId = custRes.data.id;
        finalVehicleId = custRes.data.vehicles[0]?.id || "";
      }

      const result = await createServiceOrderAction({
        customerId: finalCustomerId,
        vehicleId: finalVehicleId,
        mechanicId: finalMechanicId,
        mechanicName: finalMechanicName,
        currentKm: sanitizedKm,
        complaints: complaints.trim(),
        notes: notes.trim() || undefined,
        initialServiceIds: selectedServiceIds,
        initialPartIds: selectedParts,
      });
      if (result.success && result.data) {
        router.push(`/services/${result.data.id}`);
      } else {
        setErrorMessage(result.error || "Gagal menyimpan data servis.");
      }
    });
  }

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
        Memuat halaman tambah servis baru...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 mb-1.5"
          >
            <span>←</span> Kembali ke Daftar Antrean
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
            Tambah Servis Baru
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Catat data motor yang masuk dan pilih paket servis untuk melihat rekomendasi suku cadang otomatis.
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {quickActionToast && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{quickActionToast}</span>
          <button
            type="button"
            onClick={() => setQuickActionToast("")}
            className="text-emerald-700 hover:text-emerald-900 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* 2 KOLOM RAPI SESUAI SPESIFIKASI LINEAR.APP */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
            KOLOM KIRI (6 KOLOM): DATA MOTOR & PEMILIK (PLAT, KM, KELUHAN)
            ============================================================ */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  1. Data Motor & Pemilik
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan nomor plat motor, kilometer saat ini, dan keluhan
                </p>
              </div>

              {/* Pilihan Pelanggan Baru vs Terdaftar */}
              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCustomerInputMode("walkin")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    customerInputMode === "walkin"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pelanggan Baru (Cepat)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerInputMode("existing")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    customerInputMode === "existing"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pelanggan Lama ({customers.length})
                </button>
              </div>
            </div>

            {customerInputMode === "walkin" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-dark">Plat Nomor Motor *</label>
                    <input
                      type="text"
                      value={walkinPlate}
                      onChange={(e) => setWalkinPlate(e.target.value.toUpperCase())}
                      placeholder="Contoh: AB 1234 XY"
                      className="input-dark font-mono uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-dark">Merk & Tipe Motor</label>
                    <input
                      type="text"
                      value={walkinModel}
                      onChange={(e) => setWalkinModel(e.target.value)}
                      placeholder="Contoh: Honda Vario 160"
                      className="input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-dark">Nama Pelanggan *</label>
                    <input
                      type="text"
                      value={walkinName}
                      onChange={(e) => setWalkinName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="input-dark"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-dark">No. WhatsApp Pelanggan *</label>
                    <input
                      type="text"
                      value={walkinPhone}
                      onChange={(e) => setWalkinPhone(e.target.value)}
                      placeholder="0812xxxxxxx"
                      className="input-dark font-mono tabular-nums"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label-dark">Pilih Pelanggan Terdaftar *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="input-dark"
                    required
                  >
                    <option value="">-- Pilih Nama Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-dark">Pilih Plat Nomor Motor *</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="input-dark font-mono"
                    required
                  >
                    {customerVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        [{v.plateNumber}] {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Odometer (KM Saat Ini) */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-dark mb-0">Odometer (Kilometer Saat Ini) *</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">Contoh cepat:</span>
                    <button
                      type="button"
                      onClick={() => setCurrentKm("3500")}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono tabular-nums cursor-pointer"
                    >
                      3.500 KM
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentKm("24500")}
                      className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-mono tabular-nums cursor-pointer"
                    >
                      24.500 KM
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Kilometer saat ini, contoh: 24500"
                  value={currentKm}
                  onChange={(e) => {
                    // Sanitasi instan: hapus titik, koma, spasi, huruf
                    const clean = e.target.value.replace(/[^0-9]/g, "");
                    setCurrentKm(clean);
                  }}
                  className="input-dark font-mono tabular-nums"
                  required
                />
              </div>

              {/* ODOMETER LIFESPAN TRIGGER (PERMINTAAN DOSEN) */}
              {odometerAlert && (
                <div
                  className={`p-4 rounded-xl border ${
                    odometerAlert.level === "CRITICAL"
                      ? "bg-rose-50/80 border-rose-200 text-rose-900"
                      : "bg-amber-50/80 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          odometerAlert.level === "CRITICAL" ? "bg-rose-600" : "bg-amber-600"
                        }`}
                      />
                      <div>
                        <p className="text-xs font-semibold leading-snug">
                          {odometerAlert.title}
                        </p>
                        <p className="text-xs opacity-85 mt-1 leading-relaxed">
                          {odometerAlert.message}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOneClickOdometerParts}
                      className={`w-full py-2.5 px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        odometerAlert.level === "CRITICAL"
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-amber-600 hover:bg-amber-700 text-white"
                      }`}
                    >
                      + Masukkan Suku Cadang Rekomendasi ke Daftar Servis (1-Klik)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Keluhan & Pilih Mekanik */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="label-dark">Keluhan Motor / Permintaan Pelanggan *</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Tarikan awal gredek, ganti oli mesin rutin, rem belakang kurang pakem..."
                  value={complaints}
                  onChange={(e) => setComplaints(e.target.value)}
                  className="input-dark resize-none py-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-dark">Mekanik yang Menangani</label>
                  <select
                    value={selectedMechanicId}
                    onChange={(e) => setSelectedMechanicId(e.target.value)}
                    className="input-dark"
                  >
                    {mechanics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.role ? `(${m.role})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-dark">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ditunggu pelanggan"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-dark"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            KOLOM KANAN (6 KOLOM): PILIHAN PAKET SERVIS & KOTAK REKOMENDASI SUKU CADANG CERDAS
            ============================================================ */}
        <div className="lg:col-span-6 space-y-6">
          {/* 2. Pilihan Paket Servis & Smart Recommendation Panel */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">
                2. Pilih Paket Servis & Rekomendasi Suku Cadang
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik salah satu paket di bawah untuk menampilkan suku cadang yang disarankan
              </p>
            </div>

            {/* 3 Pilihan Paket Servis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SMART_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage === pkg.key;
                return (
                  <button
                    key={pkg.key}
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold">{pkg.title}</span>
                        {isSelected && <span className="text-xs">✓</span>}
                      </div>
                      <p
                        className={`text-[11px] leading-snug ${
                          isSelected ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {pkg.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Kotak Rekomendasi Suku Cadang Cerdas */}
            {activePackageConfig && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Rekomendasi Suku Cadang Cerdas
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Paket {activePackageConfig.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Disarankan: {activePackageConfig.recommendedLabels.join(" + ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAllPackageParts}
                    className="btn-primary text-xs px-3 py-2 shrink-0"
                  >
                    + Masukkan Semua Rekomendasi
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {recommendedPackageParts.map((part) => {
                    const alreadyInOrder = selectedParts.find((sp) => sp.partId === part.id);
                    return (
                      <div
                        key={part.id}
                        className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {part.name}
                          </p>
                          <p className="text-xs text-slate-500 font-medium tabular-nums">
                            {formatRupiah(part.sellPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addPartToOrder(part.id)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                            alreadyInOrder
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                          }`}
                        >
                          {alreadyInOrder ? `✓ Dipilih (${alreadyInOrder.qty})` : "+ Pilih"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daftar Tambahan Jasa Servis */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Pilih Tindakan Jasa Servis:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {availableServices.map((srv) => {
                  const isChecked = selectedServiceIds.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isChecked
                          ? "bg-slate-900 text-white border-slate-900 font-medium"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate pr-2">{srv.name}</span>
                      <span className="tabular-nums font-semibold shrink-0">
                        {formatRupiah(srv.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Ringkasan Biaya & Tombol Simpan */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
              3. Ringkasan Rincian Servis
            </h3>

            {/* Suku cadang terpilih */}
            {selectedParts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  Suku Cadang yang Dipilih ({selectedParts.reduce((a, b) => a + b.qty, 0)} item):
                </p>
                {selectedParts.map((item) => {
                  const part = availableParts.find((p) => p.id === item.partId);
                  if (!part) return null;
                  return (
                    <div
                      key={item.partId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{part.name}</p>
                        <p className="text-slate-500 tabular-nums">
                          {formatRupiah(part.sellPrice)} × {item.qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updatePartQty(item.partId, -1)}
                          className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-semibold tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updatePartQty(item.partId, 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Total Biaya Jasa ({selectedServiceIds.length} tindakan)</span>
                <span className="font-medium tabular-nums text-slate-900">
                  {formatRupiah(totalServiceEst)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Harga Suku Cadang</span>
                <span className="font-medium tabular-nums text-slate-900">
                  {formatRupiah(totalPartsEst)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-slate-900 pt-2.5 border-t border-slate-200">
                <span>Estimasi Total Biaya</span>
                <span className="tabular-nums">{formatRupiah(grandTotalEst)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full py-3 text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Menyimpan Servis..." : "Simpan & Masukkan ke Antrean Servis"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
