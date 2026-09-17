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
        <div className="card p-5 group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500">Menunggu Kasir</span>
            <div className="w-10 h-10 rounded-xl stat-icon-amber flex items-center justify-center text-lg group-hover:scale-110 transition-transform">⏳</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900">{pendingOrders.length}</span>
            <span className="badge badge-warning">Siap Ditagih</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Unit selesai servis menunggu pembayaran</p>
        </div>

        <div className="card p-5 group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500">Faktur Lunas</span>
            <div className="w-10 h-10 rounded-xl stat-icon-indigo flex items-center justify-center text-lg group-hover:scale-110 transition-transform">✓</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900">{paidOrders.length}</span>
            <span className="badge badge-info">Terbayar</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Total transaksi faktur berhasil dituntaskan</p>
        </div>

        <div className="card p-5 group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500">Total Kas Terkumpul</span>
            <div className="w-10 h-10 rounded-xl stat-icon-emerald flex items-center justify-center text-lg group-hover:scale-110 transition-transform">💰</div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-emerald-700">{formatRupiah(todayRevenue)}</span>
            <span className="badge badge-success">Omzet</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Pendapatan bersih kasir yang terealisasi</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Siap Ditagih</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "PENDING" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-500"}`}>
              {pendingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "PAID"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Riwayat Faktur Lunas</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "PAID" ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-500"}`}>
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
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-20 text-center text-slate-400 text-sm card">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat antrean kasir PitCare Auto...
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-16 text-center card">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-4">💳</div>
          <p className="text-sm font-bold text-slate-800 mb-1">
            {activeTab === "PENDING" ? "Tidak ada antrean pembayaran" : "Belum ada riwayat faktur lunas"}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === "PENDING"
              ? "Semua kendaraan yang selesai diservis telah ditagih."
              : "Riwayat pembayaran kasir yang lunas akan tercatat di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((order) => (
            <div key={order.id} className="card card-hover p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{order.orderNumber}</span>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">{order.vehicle?.plateNumber}</span>
                  <span className="text-sm font-bold text-slate-800">
                    {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : ""}
                  </span>
                </div>
                <div>
                  {order.paymentStatus === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Lunas ({order.paymentMethod || "CASH"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Siap Bayar
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pelanggan & Kontak</p>
                  <p className="font-bold text-slate-900 text-sm">{order.customer?.name}</p>
                  <a
                    href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-medium mt-1 transition-colors"
                  >
                    📱 WA: {order.customer?.phone}
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rincian Pengerjaan</p>
                  <p className="text-slate-600 font-medium">{order.items.length} Tindakan Jasa Servis</p>
                  <p className="text-slate-600 font-medium">{order.parts.length} Item Suku Cadang</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Teknisi: <span className="text-slate-700 font-semibold">{order.mechanicName || "Mekanik Ahli"}</span>
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Tagihan Faktur</p>
                  <p className="text-2xl font-black font-mono text-emerald-700">{formatRupiah(order.grandTotal)}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    Jasa: {formatRupiah(order.totalServices)} • Part: {formatRupiah(order.totalParts)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {order.completedDate
                    ? `Selesai Servis: ${formatDate(order.completedDate)}`
                    : `Masuk Servis: ${formatDate(order.entryDate)}`}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/services/${order.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Rincian SPK ↗
                  </Link>
                  <Link
                    href={`/cashier/${order.id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                      order.paymentStatus === "PAID"
                        ? "bg-slate-600 hover:bg-slate-700 shadow-sm"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 active:scale-95"
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
