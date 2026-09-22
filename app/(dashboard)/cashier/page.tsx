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
        <div className="card-pitstop p-5 group hover:border-amber-500/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400">Menunggu Kasir</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">⏳</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">{pendingOrders.length}</span>
            <span className="badge-antrian">Siap Ditagih</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Unit selesai servis menunggu pembayaran</p>
        </div>

        <div className="card-pitstop p-5 group hover:border-teal-500/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400">Faktur Lunas</span>
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">✓</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-teal-400 drop-shadow-[0_0_10px_rgba(20,184,166,0.2)]">{paidOrders.length}</span>
            <span className="badge-selesai-pembayaran">Terbayar</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Total transaksi faktur berhasil dituntaskan</p>
        </div>

        <div className="card-pitstop p-5 group hover:border-cyan-500/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400">Total Kas Terkumpul</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">💰</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-cyan-400 drop-shadow-[0_0_12px_rgba(0,210,255,0.2)]">{formatRupiah(todayRevenue)}</span>
            <span className="badge-selesai-pengerjaan">Omzet</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Pendapatan bersih kasir yang terealisasi</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-[#0F172A] border border-slate-800 p-1.5 rounded-xl flex items-center gap-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Siap Ditagih</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === "PENDING" ? "bg-black/30 text-white" : "bg-[#1E293B] text-slate-300"}`}>
              {pendingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PAID"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Riwayat Faktur Lunas</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === "PAID" ? "bg-black/30 text-white" : "bg-[#1E293B] text-slate-300"}`}>
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
            className="input-custom w-full h-11 pl-10 pr-4 text-xs placeholder:text-slate-500"
          />
          <svg className="w-4 h-4 text-cyan-400/80 absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-20 text-center text-slate-400 text-sm card-pitstop">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat antrean kasir PitCare Auto...
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-16 text-center card-pitstop">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl mx-auto mb-4 text-cyan-400">💳</div>
          <p className="text-sm font-bold text-slate-200 mb-1">
            {activeTab === "PENDING" ? "Tidak ada antrean pembayaran" : "Belum ada riwayat faktur lunas"}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === "PENDING"
              ? "Semua kendaraan yang selesai diservis telah ditagih."
              : "Riwayat pembayaran kasir yang lunas akan tercatat di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => (
            <div key={order.id} className="card-pitstop p-5 sm:p-6 group hover:border-cyan-500/50 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#0F172A] text-slate-300 border border-slate-700">{order.orderNumber}</span>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-[#0B0F17] text-cyan-400 border border-cyan-500/30 tracking-wider shadow-inner">{order.vehicle?.plateNumber}</span>
                  <span className="text-sm font-bold text-slate-200">
                    {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : ""}
                  </span>
                </div>
                <div>
                  {order.paymentStatus === "PAID" ? (
                    <span className="badge-selesai-pembayaran">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Lunas ({order.paymentMethod || "CASH"})
                    </span>
                  ) : (
                    <span className="badge-antrian">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Siap Bayar
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pelanggan & Kontak</p>
                  <p className="font-bold text-slate-100 text-sm">{order.customer?.name}</p>
                  <a
                    href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold hover:text-cyan-300 hover:underline mt-1 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    WA: {order.customer?.phone}
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rincian Pengerjaan</p>
                  <p className="text-slate-300 font-medium">{order.items.length} Tindakan Jasa Servis</p>
                  <p className="text-slate-300 font-medium">{order.parts.length} Item Suku Cadang</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Teknisi: <span className="text-slate-200 font-bold">{order.mechanicName || "Mekanik Ahli"}</span>
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Tagihan Faktur</p>
                  <p className="text-2xl font-black font-mono text-cyan-400 drop-shadow-[0_0_12px_rgba(0,210,255,0.2)]">{formatRupiah(order.grandTotal)}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    Jasa: {formatRupiah(order.totalServices)} • Part: {formatRupiah(order.totalParts)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono">
                  {order.completedDate
                    ? `Selesai Servis: ${formatDate(order.completedDate)}`
                    : `Masuk Servis: ${formatDate(order.entryDate)}`}
                </span>
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/services/${order.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-[#0F172A] border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                  >
                    Rincian SPK ↗
                  </Link>
                  <Link
                    href={`/cashier/${order.id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      order.paymentStatus === "PAID"
                        ? "btn-electric"
                        : "btn-cyan shadow-lg shadow-cyan-500/20"
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
