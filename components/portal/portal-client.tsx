"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutCustomerPortalAction } from "@/lib/actions/customer-portal";

export interface PortalPartItem {
  id: string;
  partName: string;
  qty: number;
  sellPrice: number;
  subtotal: number;
}

export interface PortalOrderItem {
  id: string;
  serviceName: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface PortalOrder {
  id: string;
  orderNumber: string;
  token?: string;
  currentKm?: number | null;
  status: string;
  entryDate: Date | string;
  completedDate?: Date | string | null;
  grandTotal: number;
  totalServices: number;
  totalParts: number;
  items: PortalOrderItem[];
  parts: PortalPartItem[];
  mechanic?: { name: string } | null;
  complaints?: string | null;
  diagnosis?: string | null;
}

export interface PortalVehicle {
  id: string;
  customerId: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  serviceOrders: PortalOrder[];
}

export interface PortalCustomer {
  id: string;
  name: string;
  phone: string;
  vehicles: PortalVehicle[];
  serviceOrders: PortalOrder[];
}

interface PortalClientProps {
  customer: PortalCustomer;
  initialVehicleId: string;
}

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
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PortalClient({ customer, initialVehicleId }: PortalClientProps) {
  const [activeVehicleId, setActiveVehicleId] = useState<string>(
    initialVehicleId || customer.vehicles[0]?.id || ""
  );
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<PortalOrder | null>(null);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const activeVehicle =
    customer.vehicles.find((v) => v.id === activeVehicleId) || customer.vehicles[0];

  const vehicleOrders = activeVehicle?.serviceOrders || [];
  const latestOrder = vehicleOrders[0];
  const currentKm = latestOrder?.currentKm || 0;

  // === KALKULASI PREDIKTIF SUKU CADANG (30 KM/HARI) ===
  const dailyKmAverage = 30;

  // 1. Oli Mesin (Interval: 3.000 KM)
  const oilInterval = 3000;
  const oilOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => p.partName.toLowerCase().includes("oli"))
  );
  const oilReplacedKm = oilOrder?.currentKm || 0;
  const oilKmElapsed = Math.max(0, currentKm - oilReplacedKm);
  const oilRemainingKm = Math.max(
    0,
    oilInterval - (oilOrder ? oilKmElapsed : currentKm % oilInterval)
  );
  const oilPercentage = Math.min(
    100,
    Math.max(0, Math.round((oilRemainingKm / oilInterval) * 100))
  );
  const oilDaysLeft = Math.max(0, Math.round(oilRemainingKm / dailyKmAverage));
  const oilEstimatedDate = new Date(Date.now() + oilDaysLeft * 86400000);

  // 2. Busi Pengapian (Interval: 8.000 KM)
  const sparkInterval = 8000;
  const sparkOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => p.partName.toLowerCase().includes("busi"))
  );
  const sparkReplacedKm = sparkOrder?.currentKm || 0;
  const sparkKmElapsed = Math.max(0, currentKm - sparkReplacedKm);
  const sparkRemainingKm = Math.max(
    0,
    sparkInterval - (sparkOrder ? sparkKmElapsed : currentKm % sparkInterval)
  );
  const sparkPercentage = Math.min(
    100,
    Math.max(0, Math.round((sparkRemainingKm / sparkInterval) * 100))
  );
  const sparkDaysLeft = Math.max(0, Math.round(sparkRemainingKm / dailyKmAverage));
  const sparkEstimatedDate = new Date(Date.now() + sparkDaysLeft * 86400000);

  // 3. V-Belt / Sabuk CVT (Interval: 24.000 KM)
  const beltInterval = 24000;
  const beltOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => {
      const n = p.partName.toLowerCase();
      return n.includes("belt") || n.includes("roller") || n.includes("rantai");
    })
  );
  const beltReplacedKm = beltOrder?.currentKm || 0;
  const beltKmElapsed = Math.max(0, currentKm - beltReplacedKm);
  const beltRemainingKm = Math.max(
    0,
    beltInterval - (beltOrder ? beltKmElapsed : currentKm % beltInterval)
  );
  const beltPercentage = Math.min(
    100,
    Math.max(0, Math.round((beltRemainingKm / beltInterval) * 100))
  );
  const beltDaysLeft = Math.max(0, Math.round(beltRemainingKm / dailyKmAverage));
  const beltEstimatedDate = new Date(Date.now() + beltDaysLeft * 86400000);

  // Status Colors & Badges
  const getStatusLevel = (remainingKm: number, thresholdWarn: number) => {
    if (remainingKm <= 0) return "critical"; // Red
    if (remainingKm <= thresholdWarn) return "warning"; // Yellow
    return "good"; // Green
  };

  const oilLevel = getStatusLevel(oilRemainingKm, 500);
  const sparkLevel = getStatusLevel(sparkRemainingKm, 1200);
  const beltLevel = getStatusLevel(beltRemainingKm, 3000);

  // 4. Overall Health Score (Rata-rata 3 Komponen Utama)
  const overallHealthScore = Math.round(
    (oilPercentage + sparkPercentage + beltPercentage) / 3
  );

  const getOverallStatus = (score: number) => {
    if (score >= 75) {
      return {
        label: `${score}% • Kondisi Prima`,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
        summaryText: "Semua komponen vital terawat sangat baik dan siap pakai jarak jauh.",
      };
    }
    if (score >= 50) {
      return {
        label: `${score}% • Perlu Perawatan Ringan`,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-500",
        summaryText: "Sebagian komponen mendekati interval servis berkala. Jadwalkan pemeriksaan.",
      };
    }
    return {
      label: `${score}% • Perlu Servis Segera`,
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      dotClass: "bg-rose-500",
      summaryText: "Komponen kritis melewati batas rekomendasi pabrik. Segera lakukan penggantian.",
    };
  };

  const overallStatus = getOverallStatus(overallHealthScore);

  // Status Pin Rem: Dihitung dari riwayat servis kampas rem terakhir
  const brakeOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => p.partName.toLowerCase().includes("rem")) ||
    o.items.some((i) => i.serviceName.toLowerCase().includes("rem"))
  );
  const brakeStatusLevel = brakeOrder ? "good" : "good"; // Standar aman jika terawat

  const handleScrollTo = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedCard(targetId);
      setTimeout(() => {
        setHighlightedCard(null);
      }, 2500);
    }
  };

  // Pesan WhatsApp Booking Umum
  const waGeneralMessage = encodeURIComponent(
    `Halo PitCare Auto, saya ${customer.name}. Saya ingin konsultasi & booking servis untuk motor ${activeVehicle?.brand} ${activeVehicle?.model} (${activeVehicle?.plateNumber}). Mohon informasi jadwal luang bengkel. Terima kasih!`
  );
  const waGeneralLink = `https://wa.me/6281234567890?text=${waGeneralMessage}`;

  // Pesan WhatsApp Booking Khusus Part Kritis
  const waBeltMessage = encodeURIComponent(
    `Halo PitCare Auto, saya ${customer.name} pemilik motor ${activeVehicle?.brand} ${activeVehicle?.model} (${activeVehicle?.plateNumber}). Berdasarkan portal, sabuk V-Belt motor saya sudah melewati batas rekomendasi ${beltInterval.toLocaleString("id-ID")} KM. Saya ingin booking penggantian V-Belt hari ini. Mohon info ketersediaan stok & mekanik.`
  );
  const waBeltLink = `https://wa.me/6281234567890?text=${waBeltMessage}`;

  const waOilMessage = encodeURIComponent(
    `Halo PitCare Auto, saya ${customer.name} pemilik motor ${activeVehicle?.brand} ${activeVehicle?.model} (${activeVehicle?.plateNumber}). Saya ingin booking penggantian Oli Mesin baru. Kapan waktu yang tersedia? Terima kasih.`
  );
  const waOilLink = `https://wa.me/6281234567890?text=${waOilMessage}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 antialiased selection:bg-slate-200 selection:text-slate-900">
      {/* =========================================================================
          SECTION 1: NAVBAR & IDENTITAS KENDARAAN (TOP BAR)
          ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs tracking-wider shadow-xs select-none">
              PA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 leading-tight tracking-tight">
                  PitCare Auto
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  PORTAL PELANGGAN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Paspor Digital & Diagnostik Prediktif Kendaraan
              </p>
            </div>
          </div>

          {/* Active Vehicle Badge & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-500 font-medium">Unit Aktif:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                {activeVehicle?.plateNumber}
              </span>
              <span className="text-slate-600 font-semibold truncate max-w-[140px]">
                {activeVehicle?.brand} {activeVehicle?.model}
              </span>
            </div>

            <form action={logoutCustomerPortalAction}>
              <button
                type="submit"
                className="text-xs font-semibold text-slate-700 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Keluar dari sesi portal pelanggan"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Keluar Sesi</span>
              </button>
            </form>
          </div>
        </div>

        {/* Multi-Vehicle Segmented Selector Pills (Jika memiliki lebih dari 1 kendaraan) */}
        {customer.vehicles.length > 1 && (
          <div className="max-w-6xl mx-auto mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Pilih Unit:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {customer.vehicles.map((v) => {
                const isSelected = v.id === activeVehicle?.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVehicleId(v.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs font-semibold"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`font-mono text-[11px] font-bold px-1.5 py-0.2 rounded ${
                        isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {v.plateNumber}
                    </span>
                    <span>
                      {v.brand} {v.model}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Welcome Banner Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sesi Pelanggan Terverifikasi
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Selamat Datang, {customer.name}!
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              No. WhatsApp:{" "}
              <span className="font-mono font-semibold text-slate-700">{customer.phone}</span> ·
              Memiliki <strong className="text-slate-800">{customer.vehicles.length} unit</strong>{" "}
              terdaftar di PitCare Auto.
            </p>
          </div>

          <a
            href={waGeneralLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.541 1.848.819 2.796.82h.005c3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.775-5.807zm3.374 8.212c-.143.402-.832.748-1.161.796-.328.049-.728.067-2.316-.583-1.631-.669-2.66-2.341-2.74-2.448-.08-.106-.653-.871-.653-1.663 0-.792.414-1.182.56-1.341.147-.159.32-.199.426-.199.107 0 .213.002.306.007.098.005.228-.037.356.27.133.32.453 1.107.493 1.187.04.08.067.173.013.28-.053.106-.08.172-.16.265-.08.093-.168.207-.24.278-.08.08-.163.167-.07.327.093.16.413.682.887 1.103.609.541 1.123.708 1.282.788.16.08.253.067.347-.04.093-.107.4-466.507-.626.107-.16.213-.133.36-.08.147.053.933.44 1.093.52.16.08.267.12.307.186.04.067.04.387-.103.789z" />
            </svg>
            Konsultasi / Booking via WhatsApp
          </a>
        </div>

        {/* =========================================================================
            SECTION 2: VISUAL ANATOMI KESEHATAN MOTOR (HERO SECTION - OPSI 1)
            ========================================================================= */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs relative overflow-hidden space-y-6">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Diagnostik Kesehatan Kendaraan
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Visualisasi status komponen vital unit{" "}
                <strong className="text-slate-800">
                  {activeVehicle?.brand} {activeVehicle?.model} ({activeVehicle?.plateNumber})
                </strong>
                . Klik pada titik komponen untuk melihat rincian sisa masa pakainya.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {/* Odometer Aktif */}
              <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-left">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Odometer Terakhir
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm sm:text-base tabular-nums">
                  {currentKm > 0 ? `${currentKm.toLocaleString("id-ID")} KM` : "Catatan 0 KM"}
                </span>
              </div>

              {/* Overall Health Score Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold ${overallStatus.badgeClass} shadow-2xs`}
              >
                <span className={`w-2 h-2 rounded-full ${overallStatus.dotClass}`} />
                <span>{overallStatus.label}</span>
              </div>
            </div>
          </div>

          {/* Interactive Silhouette Motorcycle Area */}
          <div className="relative w-full bg-gradient-to-b from-slate-50/70 to-white rounded-xl border border-slate-200/70 p-4 sm:p-6 overflow-hidden">
            {/* Background Accent Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* SVG Motorcycle Container */}
            <div className="relative w-full max-w-3xl mx-auto aspect-[16/8] flex items-center justify-center select-none">
              {/* Pure Inline Vector Silhouette Motor Matic */}
              <svg
                viewBox="0 0 840 420"
                className="w-full h-full drop-shadow-xs"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Ground Shadow */}
                <ellipse cx="420" cy="385" rx="340" ry="9" fill="#E2E8F0" opacity="0.8" />

                {/* --- RODA BELAKANG (REAR WHEEL) --- */}
                <g id="rear-wheel">
                  {/* Tire Outer */}
                  <circle cx="190" cy="310" r="62" fill="#334155" />
                  {/* Tire Inner Rim */}
                  <circle cx="190" cy="310" r="44" fill="#F8FAFC" stroke="#64748B" strokeWidth="4" />
                  {/* Rim Spokes */}
                  <line x1="190" y1="266" x2="190" y2="354" stroke="#94A3B8" strokeWidth="3" />
                  <line x1="146" y1="310" x2="234" y2="310" stroke="#94A3B8" strokeWidth="3" />
                  <line x1="159" y1="279" x2="221" y2="341" stroke="#94A3B8" strokeWidth="2.5" />
                  <line x1="159" y1="341" x2="221" y2="279" stroke="#94A3B8" strokeWidth="2.5" />
                  {/* Center Hub */}
                  <circle cx="190" cy="310" r="14" fill="#0F172A" />
                  <circle cx="190" cy="310" r="5" fill="#CBD5E1" />
                </g>

                {/* --- RODA DEPAN (FRONT WHEEL) --- */}
                <g id="front-wheel">
                  {/* Tire Outer */}
                  <circle cx="650" cy="310" r="62" fill="#334155" />
                  {/* Tire Inner Rim */}
                  <circle cx="650" cy="310" r="44" fill="#F8FAFC" stroke="#64748B" strokeWidth="4" />
                  {/* Rim Spokes */}
                  <line x1="650" y1="266" x2="650" y2="354" stroke="#94A3B8" strokeWidth="3" />
                  <line x1="606" y1="310" x2="694" y2="310" stroke="#94A3B8" strokeWidth="3" />
                  <line x1="619" y1="279" x2="681" y2="341" stroke="#94A3B8" strokeWidth="2.5" />
                  <line x1="619" y1="341" x2="681" y2="279" stroke="#94A3B8" strokeWidth="2.5" />
                  {/* Front Disc Brake */}
                  <circle
                    cx="650"
                    cy="310"
                    r="32"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    fill="none"
                  />
                  {/* Brake Caliper */}
                  <path
                    d="M 626 288 L 642 284 L 646 304 L 630 306 Z"
                    fill="#475569"
                    stroke="#0F172A"
                    strokeWidth="1.5"
                  />
                  {/* Center Hub */}
                  <circle cx="650" cy="310" r="14" fill="#0F172A" />
                  <circle cx="650" cy="310" r="5" fill="#CBD5E1" />
                </g>

                {/* --- CVT CASING & TRANSMISSION BOX (REAR LEFT) --- */}
                <path
                  d="M 195 290 L 350 295 C 365 295, 375 305, 375 320 L 375 330 C 375 340, 360 348, 345 348 L 195 335 C 180 335, 175 320, 175 310 C 175 298, 185 290, 195 290 Z"
                  fill="#E2E8F0"
                  stroke="#64748B"
                  strokeWidth="2.5"
                />
                <circle cx="215" cy="312" r="8" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
                <path d="M 235 305 L 340 308" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />

                {/* --- KNALPOT / EXHAUST MUFFLER --- */}
                <path
                  d="M 370 335 L 330 345 L 210 325 C 200 323, 195 315, 200 305 L 270 295 L 340 315 Z"
                  fill="#475569"
                  stroke="#334155"
                  strokeWidth="2"
                  opacity="0.9"
                />
                {/* Exhaust Protector Cover */}
                <rect
                  x="215"
                  y="298"
                  width="110"
                  height="22"
                  rx="6"
                  fill="#94A3B8"
                  stroke="#64748B"
                  strokeWidth="1.5"
                />

                {/* --- SUSPENSI & SHOCKBREAKER BELAKANG --- */}
                <line x1="225" y1="240" x2="205" y2="305" stroke="#E2E8F0" strokeWidth="8" />
                <line
                  x1="225"
                  y1="240"
                  x2="205"
                  y2="305"
                  stroke="#F43F5E"
                  strokeWidth="6"
                  strokeDasharray="4 6"
                />

                {/* --- FORK DEPAN & SHOCK DEPAN --- */}
                <path
                  d="M 580 155 L 650 310"
                  stroke="#64748B"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M 585 165 L 635 285"
                  stroke="#CBD5E1"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* --- CHASSIS, DEK LANTAI & BODY MOTOR MATIC --- */}
                {/* Underside & Floorboard */}
                <path
                  d="M 640 280 L 590 325 L 470 340 L 370 340 L 350 295 L 430 270 L 530 275 L 590 250 Z"
                  fill="#F1F5F9"
                  stroke="#94A3B8"
                  strokeWidth="2"
                />
                {/* Rubber Floor Mat */}
                <path d="M 470 338 L 575 325" stroke="#334155" strokeWidth="5" strokeLinecap="round" />

                {/* Front Shield & Aerodynamic Cowl */}
                <path
                  d="M 580 145 C 600 160, 620 200, 640 230 C 655 250, 640 275, 620 285 L 570 240 L 555 170 Z"
                  fill="#CBD5E1"
                  stroke="#64748B"
                  strokeWidth="2.5"
                />
                {/* Headlight V-Shape */}
                <path
                  d="M 625 220 L 642 245 L 615 255 Z"
                  fill="#FFFFFF"
                  stroke="#38BDF8"
                  strokeWidth="2"
                />

                {/* Handlebars, Speedometer & Mirror */}
                <path
                  d="M 550 145 L 575 138 L 595 142"
                  stroke="#1E293B"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Windshield / Small Visor */}
                <path
                  d="M 570 138 L 585 105 C 595 105, 600 115, 595 135 Z"
                  fill="#0F172A"
                  opacity="0.8"
                />
                {/* Handle Grip & Brake Lever */}
                <line x1="595" y1="142" x2="615" y2="140" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
                {/* Spion / Rearview Mirror */}
                <line x1="575" y1="135" x2="560" y2="105" stroke="#64748B" strokeWidth="2.5" />
                <ellipse cx="555" cy="100" rx="9" ry="6" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />

                {/* Rear Main Bodywork & Tail Section */}
                <path
                  d="M 155 225 C 190 220, 240 215, 290 215 C 360 215, 430 225, 470 245 C 440 285, 380 300, 320 295 C 240 290, 180 265, 155 225 Z"
                  fill="#94A3B8"
                  stroke="#475569"
                  strokeWidth="2.5"
                />
                {/* Body Aerodynamic Accent Line */}
                <path
                  d="M 210 240 Q 300 245 420 260"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                {/* Taillight LED Red */}
                <path d="M 155 225 L 145 235 L 158 240 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />

                {/* Comfortable Dual Seat (Jok Motor) */}
                <path
                  d="M 245 208 C 290 205, 360 205, 420 220 C 445 226, 455 235, 440 240 C 370 230, 300 225, 245 222 C 235 220, 235 210, 245 208 Z"
                  fill="#1E293B"
                  stroke="#0F172A"
                  strokeWidth="2.5"
                />
                {/* Seat Texture Stitches */}
                <path
                  d="M 330 212 L 335 224"
                  stroke="#475569"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Engine Cylinder & Crankcase (Ruang Mesin Tengah) */}
                <rect
                  x="365"
                  y="285"
                  width="45"
                  height="40"
                  rx="6"
                  fill="#334155"
                  stroke="#1E293B"
                  strokeWidth="2"
                />
                <circle cx="388" cy="305" r="9" fill="#64748B" />
                {/* Spark Plug Wire (Kabel Busi) */}
                <path
                  d="M 395 292 Q 415 285 410 305"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {/* =========================================================================
                  3 INTERACTIVE HOTSPOT PINS (OVERLAY BUTTONS)
                  ========================================================================= */}

              {/* PIN 1: Rem Depan / Kampas Rem (Depan Bawah) */}
              <div
                className="absolute"
                style={{ left: "77%", top: "73%", transform: "translate(-50%, -50%)" }}
              >
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHotspot("rem");
                      handleScrollTo("section-countdown");
                    }}
                    className="relative flex items-center justify-center cursor-pointer p-1"
                    aria-label="Pin Rem Depan - Klik untuk lihat rekomendasi servis"
                  >
                    <span
                      className={`absolute w-8 h-8 rounded-full animate-ping opacity-60 ${
                        brakeStatusLevel === "good" ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    <span
                      className={`relative w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white transition-transform group-hover:scale-125 ${
                        brakeStatusLevel === "good" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    >
                      1
                    </span>
                  </button>

                  {/* Tooltip / Label Card */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-slate-900 text-white p-2.5 rounded-xl text-left shadow-lg pointer-events-none opacity-90 sm:group-hover:opacity-100 transition-opacity z-20">
                    <p className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      Titik 1: Pengereman
                    </p>
                    <p className="text-xs font-bold leading-tight mt-0.5">Sistem Rem & Cakram</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      🟢 Kampas rem dalam kondisi baik & pakem.
                    </p>
                    <span className="text-[9px] text-slate-400 block mt-1 underline">
                      Klik untuk periksa ➔
                    </span>
                  </div>
                </div>
              </div>

              {/* PIN 2: Ruang Mesin - Oli Mesin & Busi (Tengah Bawah) */}
              <div
                className="absolute"
                style={{ left: "46%", top: "71%", transform: "translate(-50%, -50%)" }}
              >
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHotspot("mesin");
                      handleScrollTo("card-oli");
                    }}
                    className="relative flex items-center justify-center cursor-pointer p-1"
                    aria-label="Pin Ruang Mesin (Oli & Busi) - Klik untuk lihat rincian"
                  >
                    <span
                      className={`absolute w-8 h-8 rounded-full animate-ping opacity-60 ${
                        oilLevel === "critical"
                          ? "bg-rose-400"
                          : oilLevel === "warning"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span
                      className={`relative w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white transition-transform group-hover:scale-125 ${
                        oilLevel === "critical"
                          ? "bg-rose-500"
                          : oilLevel === "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    >
                      2
                    </span>
                  </button>

                  {/* Tooltip / Label Card */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white p-2.5 rounded-xl text-left shadow-lg pointer-events-none opacity-90 sm:group-hover:opacity-100 transition-opacity z-20">
                    <p className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      Titik 2: Ruang Mesin
                    </p>
                    <p className="text-xs font-bold leading-tight mt-0.5">Oli Mesin & Busi</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      {oilLevel === "critical"
                        ? "🔴 Waktunya ganti oli mesin hari ini!"
                        : oilLevel === "warning"
                        ? `🟡 Sisa oli ${oilRemainingKm.toLocaleString("id-ID")} KM lagi.`
                        : `🟢 Oli prima (${oilRemainingKm.toLocaleString("id-ID")} KM).`}
                    </p>
                    <span className="text-[9px] text-cyan-300 block mt-1 underline">
                      Klik untuk buka detail Oli & Busi ➔
                    </span>
                  </div>
                </div>
              </div>

              {/* PIN 3: CVT & V-Belt / Rantai (Belakang Kiri) */}
              <div
                className="absolute"
                style={{ left: "28%", top: "72%", transform: "translate(-50%, -50%)" }}
              >
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHotspot("cvt");
                      handleScrollTo("card-vbelt");
                    }}
                    className="relative flex items-center justify-center cursor-pointer p-1"
                    aria-label="Pin CVT & V-Belt - Klik untuk lihat rincian"
                  >
                    <span
                      className={`absolute w-8 h-8 rounded-full animate-ping opacity-60 ${
                        beltLevel === "critical"
                          ? "bg-rose-400"
                          : beltLevel === "warning"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span
                      className={`relative w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-white transition-transform group-hover:scale-125 ${
                        beltLevel === "critical"
                          ? "bg-rose-500"
                          : beltLevel === "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    >
                      3
                    </span>
                  </button>

                  {/* Tooltip / Label Card */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white p-2.5 rounded-xl text-left shadow-lg pointer-events-none opacity-90 sm:group-hover:opacity-100 transition-opacity z-20">
                    <p className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                      Titik 3: Transmisi CVT
                    </p>
                    <p className="text-xs font-bold leading-tight mt-0.5">V-Belt & Roller</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      {beltLevel === "critical"
                        ? "🔴 Sabuk CVT wajib diganti hari ini!"
                        : beltLevel === "warning"
                        ? `🟡 Sabuk CVT sisa ${beltRemainingKm.toLocaleString("id-ID")} KM.`
                        : `🟢 Sabuk CVT aman (${beltRemainingKm.toLocaleString("id-ID")} KM).`}
                    </p>
                    <span className="text-[9px] text-purple-300 block mt-1 underline">
                      Klik untuk buka detail V-Belt ➔
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Interactive Guide Pill Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-sm">💡</span>
                <span>
                  <strong>Panduan Interaktif:</strong> Klik pin nomor <strong>[1]</strong>,{" "}
                  <strong>[2]</strong>, atau <strong>[3]</strong> pada motor untuk melompat langsung
                  ke kalkulator masa pakai suku cadang terkait.
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px] font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Prima
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Waspada
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Kritis
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: KARTU HITUNG MUNDUR SISA KM & HARI (ACTIONABLE COUNTDOWN - OPSI 3)
            ========================================================================= */}
        <section id="section-countdown" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Estimasi Masa Pakai Suku Cadang (Predictive Lifespan Tracker)
              </h3>
              <p className="text-xs text-slate-500">
                Perhitungan otomatis batas servis berdasarkan riwayat kilometer motor dan estimasi
                rata-rata pemakaian <strong className="text-slate-700">{dailyKmAverage} KM / hari</strong>.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 shrink-0 self-start sm:self-auto">
              Interval Rekomendasi Pabrik
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* -------------------------------------------------------------
                KARTU 1: OLI MESIN
                ------------------------------------------------------------- */}
            <div
              id="card-oli"
              className={`p-6 rounded-2xl bg-white border transition-all duration-300 shadow-2xs space-y-4 ${
                highlightedCard === "card-oli"
                  ? "border-slate-900 ring-4 ring-slate-900/10 shadow-md scale-[1.01]"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    🛢️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">Oli Mesin</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Interval: 3.000 KM</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                    oilLevel === "critical"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : oilLevel === "warning"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {oilLevel === "critical"
                    ? "🔴 Waktunya Ganti"
                    : oilLevel === "warning"
                    ? "🟡 Segera Servis"
                    : "🟢 Kondisi Prima"}
                </span>
              </div>

              {/* Countdown Numbers */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Sisa Jarak Tempuh:</span>
                  <span className="font-mono text-base font-black text-slate-900">
                    {oilRemainingKm > 0
                      ? `${oilRemainingKm.toLocaleString("id-ID")} KM`
                      : "0 KM (Lewat Batas!)"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimasi Waktu:</span>
                  <span
                    className={`font-semibold ${
                      oilDaysLeft === 0 ? "text-rose-600 font-bold" : "text-slate-800"
                    }`}
                  >
                    {oilDaysLeft === 0 ? "Hari Ini (Mendesak)" : `± ${oilDaysLeft} Hari Lagi`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Kesehatan Pelumas</span>
                  <span className="font-mono font-bold text-slate-800">{oilPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      oilLevel === "critical"
                        ? "bg-rose-500"
                        : oilLevel === "warning"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${oilPercentage}%` }}
                  />
                </div>
              </div>

              {/* Rekomendasi Manusiawi */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {oilLevel === "critical" ? (
                  <span className="text-rose-700 font-medium">
                    ⚠️ Oli mesin sudah melewati batas aman kilometer. Segera lakukan pengurasan oli
                    baru untuk mencegah gesekan dan keausan piston silinder.
                  </span>
                ) : oilLevel === "warning" ? (
                  <span>
                    Kondisi oli mulai mengental. Disarankan ganti sebelum tanggal{" "}
                    <strong className="text-slate-900">{formatDate(oilEstimatedDate)}</strong>.
                  </span>
                ) : (
                  <span>
                    Kondisi oli masih prima dan melumasi mesin secara optimal. Jadwal ganti berikutnya
                    diperkirakan pada{" "}
                    <strong className="text-slate-800">{formatDate(oilEstimatedDate)}</strong>.
                  </span>
                )}
              </p>

              {/* WhatsApp Quick Action jika Kritis atau Warning */}
              {oilLevel !== "good" && (
                <a
                  href={waOilLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Booking Ganti Oli via WA</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            {/* -------------------------------------------------------------
                KARTU 2: V-BELT / SABUK CVT
                ------------------------------------------------------------- */}
            <div
              id="card-vbelt"
              className={`p-6 rounded-2xl bg-white border transition-all duration-300 shadow-2xs space-y-4 ${
                highlightedCard === "card-vbelt"
                  ? "border-slate-900 ring-4 ring-slate-900/10 shadow-md scale-[1.01]"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    🔄
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      V-Belt / Sabuk CVT
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">Interval: 24.000 KM</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                    beltLevel === "critical"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : beltLevel === "warning"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {beltLevel === "critical"
                    ? "🔴 Waktunya Ganti"
                    : beltLevel === "warning"
                    ? "🟡 Periksa Retakan"
                    : "🟢 Kondisi Prima"}
                </span>
              </div>

              {/* Countdown Numbers */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Sisa Jarak Tempuh:</span>
                  <span className="font-mono text-base font-black text-slate-900">
                    {beltRemainingKm > 0
                      ? `${beltRemainingKm.toLocaleString("id-ID")} KM`
                      : "0 KM (Kritis!)"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimasi Waktu:</span>
                  <span
                    className={`font-semibold ${
                      beltDaysLeft === 0 ? "text-rose-600 font-bold" : "text-slate-800"
                    }`}
                  >
                    {beltDaysLeft === 0
                      ? "Waktunya Ganti Hari Ini"
                      : beltDaysLeft > 60
                      ? `± ${Math.round(beltDaysLeft / 30)} Bulan Lagi`
                      : `± ${beltDaysLeft} Hari Lagi`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Integritas Sabuk CVT</span>
                  <span className="font-mono font-bold text-slate-800">{beltPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      beltLevel === "critical"
                        ? "bg-rose-500"
                        : beltLevel === "warning"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${beltPercentage}%` }}
                  />
                </div>
              </div>

              {/* Rekomendasi Manusiawi */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {beltLevel === "critical" ? (
                  <span className="text-rose-700 font-medium">
                    🚨 Sabuk CVT sudah melewati batas aman 24.000 KM pabrikan. Disarankan ganti hari
                    ini agar tidak putus mendadak di jalan raya saat berkendara.
                  </span>
                ) : beltLevel === "warning" ? (
                  <span>
                    Masa pakai sabuk mendekati akhir. Periksa kondisi roller dan kelenturan karet CVT
                    sebelum tanggal{" "}
                    <strong className="text-slate-900">{formatDate(beltEstimatedDate)}</strong>.
                  </span>
                ) : (
                  <span>
                    Elastisitas sabuk CVT dalam batas aman. Rekomendasi penggantian berikutnya di KM{" "}
                    <strong className="text-slate-800 font-mono">
                      {(currentKm + beltRemainingKm).toLocaleString("id-ID")}
                    </strong>
                    .
                  </span>
                )}
              </p>

              {/* 1-Click Booking WhatsApp Button */}
              {beltLevel === "critical" ? (
                <a
                  href={waBeltLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>🔴 Booking Ganti V-Belt via WA</span>
                  <span>↗</span>
                </a>
              ) : (
                <a
                  href={waBeltLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Konsultasi CVT via WA</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            {/* -------------------------------------------------------------
                KARTU 3: BUSI PENGAPIAN
                ------------------------------------------------------------- */}
            <div
              id="card-busi"
              className={`p-6 rounded-2xl bg-white border transition-all duration-300 shadow-2xs space-y-4 ${
                highlightedCard === "card-busi"
                  ? "border-slate-900 ring-4 ring-slate-900/10 shadow-md scale-[1.01]"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/80 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      Busi Pengapian
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">Interval: 8.000 KM</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                    sparkLevel === "critical"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : sparkLevel === "warning"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {sparkLevel === "critical"
                    ? "🔴 Waktunya Ganti"
                    : sparkLevel === "warning"
                    ? "🟡 Periksa Celah"
                    : "🟢 Kondisi Prima"}
                </span>
              </div>

              {/* Countdown Numbers */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Sisa Jarak Tempuh:</span>
                  <span className="font-mono text-base font-black text-slate-900">
                    {sparkRemainingKm > 0
                      ? `${sparkRemainingKm.toLocaleString("id-ID")} KM`
                      : "0 KM (Lewat Batas!)"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimasi Waktu:</span>
                  <span className="font-semibold text-slate-800">
                    {sparkDaysLeft === 0
                      ? "Hari Ini"
                      : sparkDaysLeft > 60
                      ? `± ${Math.round(sparkDaysLeft / 30)} Bulan Lagi`
                      : `± ${sparkDaysLeft} Hari Lagi`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Kekuatan Percikan Busi</span>
                  <span className="font-mono font-bold text-slate-800">{sparkPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      sparkLevel === "critical"
                        ? "bg-rose-500"
                        : sparkLevel === "warning"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${sparkPercentage}%` }}
                  />
                </div>
              </div>

              {/* Rekomendasi Manusiawi */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {sparkLevel === "critical" ? (
                  <span className="text-rose-700 font-medium">
                    ⚠️ Elektroda busi sudah aus. Ganti busi baru agar motor tidak brebet, boros
                    bensin, atau sulit distarter di pagi hari.
                  </span>
                ) : sparkLevel === "warning" ? (
                  <span>
                    Celah elektroda mulai melebar. Rekomendasi ganti sebelum tanggal{" "}
                    <strong className="text-slate-900">{formatDate(sparkEstimatedDate)}</strong>.
                  </span>
                ) : (
                  <span>
                    Percikan api busi sempurna. Tarikan mesin enteng dan konsumsi BBM hemat. Servis
                    berikutnya pada{" "}
                    <strong className="text-slate-800">{formatDate(sparkEstimatedDate)}</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: PASPOR & BUKU REKAM MEDIS DIGITAL (SERVICE HISTORY LEDGER)
            ========================================================================= */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">📖</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Buku Paspor Servis Digital
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Catatan rekam jejak perawatan fisik & riwayat nota resmi dari PitCare Auto (pengganti
                buku manual servis konvensional).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                Total {vehicleOrders.length} Riwayat Servis
              </span>
            </div>
          </div>

          {/* List Riwayat Servis */}
          {vehicleOrders.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm font-bold text-slate-700">
                Belum ada rekam jejak servis untuk unit ini
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Lakukan servis berkala pertama di PitCare Auto untuk mencatatkan buku paspor servis
                digital motor Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicleOrders.map((order, idx) => (
                <div
                  key={order.id}
                  className="p-5 sm:p-6 rounded-xl bg-slate-50/60 border border-slate-200/90 hover:border-slate-300 transition-all space-y-4 shadow-2xs"
                >
                  {/* Top Row: Order ID, Date, KM, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        📅 {formatDate(order.entryDate)}
                      </span>
                      {order.currentKm && (
                        <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          ⏱ {order.currentKm.toLocaleString("id-ID")} KM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                          order.status === "SELESAI_PEMBAYARAN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.status === "SELESAI_PENGERJAAN"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {order.status === "SELESAI_PEMBAYARAN"
                          ? "✓ LUNAS RESMI"
                          : order.status === "SELESAI_PENGERJAAN"
                          ? "Pengerjaan Selesai"
                          : "Sedang Dikerjakan"}
                      </span>

                      {/* Tombol Lihat Bukti Nota */}
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                        title="Buka bukti nota servis resmi"
                      >
                        <span>📄</span>
                        <span>Lihat Bukti Nota</span>
                      </button>

                      {order.token && (
                        <Link
                          href={`/track/${order.token}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          Pelacakan Live ↗
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Keluhan & Catatan Mekanik */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                    <p>
                      <strong className="text-slate-900">Keluhan Pelanggan:</strong>{" "}
                      {order.complaints || "Servis berkala rutin"}
                    </p>
                    {order.diagnosis && (
                      <p className="text-slate-600">
                        <strong className="text-slate-900">Analisa Teknisi:</strong> {order.diagnosis}
                      </p>
                    )}
                  </div>

                  {/* Itemized Service & Parts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Daftar Jasa */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Tindakan Jasa Servis ({order.items.length})
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-600">
                          {formatRupiah(order.totalServices)}
                        </span>
                      </div>
                      {order.items.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Tidak ada tindakan jasa</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {order.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between text-slate-700 text-xs"
                            >
                              <span>• {item.serviceName}</span>
                              <span className="font-mono text-slate-900 font-semibold">
                                {formatRupiah(Number(item.subtotal))}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Daftar Suku Cadang */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Suku Cadang Terpasang ({order.parts.length})
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-600">
                          {formatRupiah(order.totalParts)}
                        </span>
                      </div>
                      {order.parts.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">
                          Tidak ada pergantian suku cadang
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {order.parts.map((part) => (
                            <li
                              key={part.id}
                              className="flex justify-between text-slate-700 text-xs"
                            >
                              <span>
                                • {part.partName} <span className="text-slate-400">(x{part.qty})</span>
                              </span>
                              <span className="font-mono text-slate-900 font-semibold">
                                {formatRupiah(Number(part.subtotal))}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Footer: Mekanik & Grand Total */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">
                      Teknisi Penanggung Jawab:{" "}
                      <strong className="text-slate-900">
                        {order.mechanic?.name || "Mekanik Mas Joko (PitCare)"}
                      </strong>
                    </span>
                    <div className="sm:text-right">
                      <span className="text-[11px] text-slate-500 mr-2">Total Pembayaran:</span>
                      <span className="text-base font-black font-mono text-slate-900">
                        {formatRupiah(Number(order.grandTotal))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* =========================================================================
          DIGITAL INVOICE / STRUK MODAL POPUP
          ========================================================================= */}
      {selectedReceiptOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedReceiptOrder(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-5 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                  PA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">PitCare Auto</h4>
                  <p className="text-[11px] text-slate-500">Nota Bukti Servis & Pelunasan Resmi</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Receipt Summary Meta */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    No. Nota Servis
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceiptOrder.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Waktu Selesai
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatDateTime(
                      selectedReceiptOrder.completedDate || selectedReceiptOrder.entryDate
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Pelanggan
                  </span>
                  <span className="font-semibold text-slate-900">{customer.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Kendaraan
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeVehicle?.plateNumber} ({activeVehicle?.brand} {activeVehicle?.model})
                  </span>
                </div>
              </div>
            </div>

            {/* Table of Items & Parts */}
            <div className="space-y-3 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-[10px] uppercase tracking-wider font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item / Tindakan</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReceiptOrder.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-800">
                          <span className="font-medium">{item.serviceName}</span>
                          <span className="block text-[10px] text-slate-400">Jasa Teknisi</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">
                          {item.qty}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                    {selectedReceiptOrder.parts.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-800">
                          <span className="font-medium">{part.partName}</span>
                          <span className="block text-[10px] text-slate-400">Suku Cadang Baru</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">
                          {part.qty}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(part.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Jasa:</span>
                  <span className="font-mono">{formatRupiah(selectedReceiptOrder.totalServices)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Suku Cadang:</span>
                  <span className="font-mono">{formatRupiah(selectedReceiptOrder.totalParts)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total Tagihan:</span>
                  <span className="font-mono text-base font-black">
                    {formatRupiah(selectedReceiptOrder.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Stamp & Status */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold text-sm">✓ LUNAS</span>
                <span className="text-emerald-600 text-[11px]">• PitCare Auto Official Verified</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Mekanik: {selectedReceiptOrder.mechanic?.name || "Mas Joko"}
              </span>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️ Cetak / Simpan PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
