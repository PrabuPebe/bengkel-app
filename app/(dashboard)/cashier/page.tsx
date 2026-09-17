"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { ServiceOrder } from "@/lib/types/database";
import { getServiceOrdersAction } from "@/lib/actions/orders";

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

export default function CashierPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "PAID">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    getServiceOrdersAction().then((data) => {
      if (active) {
        setOrders(data);
        setIsLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const pendingOrders = orders.filter(
    (o) => o.status === "SELESAI_PENGERJAAN" || (o.paymentStatus === "PENDING" && o.status !== "DIBATALKAN")
  );
  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");
  const todayRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const displayedOrders = (activeTab === "PENDING" ? pendingOrders : paidOrders).filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer?.name.toLowerCase().includes(q) ||
      o.customer?.phone.toLowerCase().includes(q) ||
      o.vehicle?.plateNumber.toLowerCase().includes(q) ||
      o.vehicle?.model.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <Header
        title="Kasir & Billing Terminal"
        subtitle="Selesaikan pembayaran faktur servis PitCare Auto, berikan diskon, pilih metode bayar, dan cetak nota struk resmi."
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-floating p-5 group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#412D15]">Menunggu Kasir</span>
            <div className="w-10 h-10 rounded-xl stat-icon-cream flex items-center justify-center text-lg group-hover:scale-110 transition-transform">⏳</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-[#1F150C]">{pendingOrders.length}</span>
            <span className="badge-custom badge-cream">Siap Ditagih</span>
          </div>
          <p className="text-[11px] text-[#412D15] mt-2">Unit selesai servis menunggu pembayaran</p>
        </div>

        <div className="card-floating p-5 group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#412D15]">Faktur Lunas</span>
            <div className="w-10 h-10 rounded-xl stat-icon-steel flex items-center justify-center text-lg group-hover:scale-110 transition-transform">✓</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-[#1F150C]">{paidOrders.length}</span>
            <span className="badge-custom badge-steel">Terbayar</span>
          </div>
          <p className="text-[11px] text-[#412D15] mt-2">Total transaksi faktur berhasil dituntaskan</p>
        </div>

        <div className="card-floating p-5 group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#412D15]">Total Kas Terkumpul</span>
            <div className="w-10 h-10 rounded-xl stat-icon-sage flex items-center justify-center text-lg group-hover:scale-110 transition-transform">💰</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-[#1F150C]">{formatRupiah(todayRevenue)}</span>
            <span className="badge-custom badge-sage">Omzet</span>
          </div>
          <p className="text-[11px] text-[#412D15] mt-2">Pendapatan bersih kasir yang terealisasi</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white border border-[#412D15]/20 p-1 rounded-xl flex items-center gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-[#1F150C] text-[#E1DCC9] shadow-xs"
                : "text-[#412D15] hover:text-[#1F150C]"
            }`}
          >
            <span>Siap Ditagih</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "PENDING" ? "bg-[#412D15] text-[#1F150C]" : "bg-[#E1DCC9] text-[#1F150C]"}`}>
              {pendingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PAID"
                ? "bg-[#1F150C] text-[#E1DCC9] shadow-xs"
                : "text-[#412D15] hover:text-[#1F150C]"
            }`}
          >
            <span>Riwayat Faktur Lunas</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "PAID" ? "bg-[#412D15] text-[#1F150C]" : "bg-[#E1DCC9] text-[#1F150C]"}`}>
              {paidOrders.length}
            </span>
          </button>
        </div>

        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Cari faktur, plat, atau nama pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-custom w-full h-11 pl-10 pr-4 text-xs"
          />
          <svg className="w-4 h-4 text-[#412D15] absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-20 text-center text-[#412D15] text-sm card-floating">
          <div className="w-8 h-8 border-2 border-[#412D15] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat antrean kasir PitCare Auto...
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-16 text-center card-floating">
          <div className="w-14 h-14 rounded-2xl bg-[#E1DCC9] border border-[#412D15]/20 flex items-center justify-center text-2xl mx-auto mb-4">💳</div>
          <p className="text-sm font-bold text-[#1F150C] mb-1">
            {activeTab === "PENDING" ? "Tidak ada antrean pembayaran" : "Belum ada riwayat faktur lunas"}
          </p>
          <p className="text-xs text-[#412D15] max-w-md mx-auto">
            {activeTab === "PENDING"
              ? "Semua kendaraan yang selesai diservis telah ditagih."
              : "Riwayat pembayaran kasir yang lunas akan tercatat di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((order) => (
            <div key={order.id} className="card-floating p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#412D15]/15">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#1F150C] text-[#E1DCC9]">{order.orderNumber}</span>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#412D15]/25 text-[#1F150C] border border-[#412D15]/50">{order.vehicle?.plateNumber}</span>
                  <span className="text-sm font-bold text-[#1F150C]">
                    {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : ""}
                  </span>
                </div>
                <div>
                  {order.paymentStatus === "PAID" ? (
                    <span className="badge-custom badge-sage">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1F150C]" />
                      Lunas ({order.paymentMethod || "CASH"})
                    </span>
                  ) : (
                    <span className="badge-custom badge-cream">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#412D15] animate-pulse" />
                      Siap Bayar
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-[#412D15] uppercase tracking-wider mb-1.5">Pelanggan & Kontak</p>
                  <p className="font-bold text-[#1F150C] text-sm">{order.customer?.name}</p>
                  <a
                    href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#1F150C] font-semibold hover:underline mt-1 transition-colors"
                  >
                    📱 WA: {order.customer?.phone}
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-[#412D15] uppercase tracking-wider mb-1.5">Rincian Pengerjaan</p>
                  <p className="text-[#412D15] font-medium">{order.items.length} Tindakan Jasa Servis</p>
                  <p className="text-[#412D15] font-medium">{order.parts.length} Item Suku Cadang</p>
                  <p className="text-[11px] text-[#412D15] mt-1">
                    Teknisi: <span className="text-[#1F150C] font-bold">{order.mechanicName || "Mekanik Ahli"}</span>
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-[10px] font-bold text-[#412D15] uppercase tracking-wider mb-1.5">Total Tagihan Faktur</p>
                  <p className="text-2xl font-black font-mono text-[#1F150C]">{formatRupiah(order.grandTotal)}</p>
                  <p className="text-[11px] font-mono text-[#412D15] mt-1">
                    Jasa: {formatRupiah(order.totalServices)} • Part: {formatRupiah(order.totalParts)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#412D15]/15">
                <span className="text-[11px] text-[#412D15]">
                  {order.completedDate
                    ? `Selesai Servis: ${formatDate(order.completedDate)}`
                    : `Masuk Servis: ${formatDate(order.entryDate)}`}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/services/${order.id}`}
                    className="btn-outline-steel px-4 py-2 text-xs cursor-pointer"
                  >
                    Rincian SPK ↗
                  </Link>
                  <Link
                    href={`/cashier/${order.id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs cursor-pointer ${
                      order.paymentStatus === "PAID"
                        ? "btn-charcoal"
                        : "btn-sage"
                    }`}
                  >
                    {order.paymentStatus === "PAID" ? <>🖨️ Lihat / Cetak Faktur</> : <>💳 Proses Pembayaran →</>}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
