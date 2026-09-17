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
    return () => {
      active = false;
    };
  }, []);

  const pendingOrders = orders.filter(
    (o) => o.status === "SELESAI_PENGERJAAN" || (o.paymentStatus === "PENDING" && o.status !== "DIBATALKAN")
  );

  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");

  const todayRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Filter based on active tab and search query
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
        subtitle="Selesaikan pembayaran faktur servis PitCare Auto, berikan potongan diskon, pilih metode bayar, dan cetak nota struk resmi."
      />

      {/* Metrics Bar with Luxury Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card-hover p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Menunggu Kasir</span>
            <span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 font-bold text-sm">
              ⏳
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {pendingOrders.length}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
              Siap Ditagih
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Unit telah selesai inspeksi & servis teknisi</p>
        </div>

        <div className="glass-card-hover p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Faktur Lunas</span>
            <span className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm">
              ✓
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {paidOrders.length}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
              Terbayar
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Total transaksi faktur berhasil dituntaskan</p>
        </div>

        <div className="glass-card-hover p-6 rounded-2xl border border-white/10 relative overflow-hidden group glow-emerald">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Kas Terkumpul</span>
            <span className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-sm">
              💰
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl lg:text-3xl font-black font-mono text-emerald-400 tracking-tight">
              {formatRupiah(todayRevenue)}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
              Omzet
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Pendapatan bersih kasir yang telah terealisasi</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="glass-panel p-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Siap Ditagih</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "PENDING" ? "bg-amber-950/60 text-amber-200" : "bg-slate-800 text-slate-300"
            }`}>
              {pendingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PAID"
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Riwayat Faktur Lunas</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "PAID" ? "bg-indigo-950/60 text-indigo-200" : "bg-slate-800 text-slate-300"
            }`}>
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
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-20 text-center text-slate-400 text-sm glass-panel rounded-2xl border border-white/10">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat antrean kasir PitCare Auto...
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-16 text-center rounded-2xl glass-panel border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-white/10 flex items-center justify-center text-2xl mx-auto mb-4">
            💳
          </div>
          <p className="text-base font-bold text-white mb-1">
            {activeTab === "PENDING"
              ? "Tidak ada antrean pembayaran yang tertunda"
              : "Belum ada riwayat faktur yang lunas"}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === "PENDING"
              ? "Semua kendaraan yang selesai diservis telah ditagih atau belum ada SPK yang diselesaikan teknisi."
              : "Riwayat pembayaran kasir yang lunas akan tercatat rapi di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => (
            <div
              key={order.id}
              className="glass-card-hover p-6 rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-0.5 group shadow-xl shadow-black/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950/80 text-indigo-300 border border-indigo-500/20 shadow-inner">
                    {order.orderNumber}
                  </span>
                  <span className="font-mono text-xs font-black px-3 py-1.5 rounded-xl bg-indigo-600/15 text-white border border-indigo-500/30">
                    {order.vehicle?.plateNumber}
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {order.paymentStatus === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Lunas ({order.paymentMethod || "CASH"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Siap Bayar
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-5 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Pelanggan & Kontak
                  </p>
                  <p className="font-bold text-white text-sm">{order.customer?.name}</p>
                  <a
                    href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium mt-1.5 transition-colors"
                  >
                    <span>📱 WA: {order.customer?.phone}</span>
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Rincian Pengerjaan
                  </p>
                  <p className="text-slate-300 font-medium">
                    {order.items.length} Tindakan Jasa Servis
                  </p>
                  <p className="text-slate-300 font-medium">
                    {order.parts.length} Item Suku Cadang Terpakai
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Teknisi: <span className="text-white font-semibold">{order.mechanicName || "Mekanik Ahli"}</span>
                  </p>
                </div>

                <div className="md:text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Total Tagihan Faktur
                    </p>
                    <p className="text-2xl lg:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                      {formatRupiah(order.grandTotal)}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Jasa: {formatRupiah(order.totalServices)} • Part: {formatRupiah(order.totalParts)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
                <span className="text-[11px] text-slate-400">
                  {order.completedDate
                    ? `Selesai Servis: ${formatDate(order.completedDate)}`
                    : `Masuk Servis: ${formatDate(order.entryDate)}`}
                </span>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/services/${order.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-white/10 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Rincian SPK ↗
                  </Link>

                  <Link
                    href={`/cashier/${order.id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                      order.paymentStatus === "PAID"
                        ? "bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 active:scale-95"
                    }`}
                  >
                    {order.paymentStatus === "PAID" ? (
                      <>🖨️ Lihat / Cetak Faktur Struk</>
                    ) : (
                      <>💳 Proses Pembayaran Kasir →</>
                    )}
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
