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
  const [quickPayAmounts, setQuickPayAmounts] = useState<Record<string, string>>({});

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
        title="Kasir & Pembayaran"
        subtitle="Rincian biaya jasa servis & suku cadang terpisah jelas, dilengkapi kalkulator kembalian instan."
      />

      {/* Top 3 Linear Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Menunggu Pembayaran</span>
            <span className="badge-antrian">Siap Ditagih</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{pendingOrders.length}</p>
          <p className="text-xs text-slate-500 mt-1.5">Motor selesai diservis siap dibayar di kasir</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Nota Servis Lunas</span>
            <span className="badge-selesai-pembayaran">Lunas</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{paidOrders.length}</p>
          <p className="text-xs text-slate-500 mt-1.5">Transaksi pembayaran yang telah diselesaikan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Pendapatan Kasir</span>
            <span className="badge-selesai-pengerjaan">Terkumpul</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatRupiah(todayRevenue)}</p>
          <p className="text-xs text-slate-500 mt-1.5">Total uang masuk dari nota servis yang lunas</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="bg-slate-100 border border-slate-200 p-1 rounded-lg inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Belum Dibayar</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono tabular-nums">
              {pendingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "PAID"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Riwayat Nota Lunas</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono tabular-nums">
              {paidOrders.length}
            </span>
          </button>
        </div>

        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Cari plat motor, nama pelanggan, atau nomor nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark w-full pl-9 pr-3.5 text-xs"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Invoice Cards */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 text-sm bg-white border border-slate-200 rounded-xl shadow-xs">
          Memuat daftar tagihan kasir PitCare Auto...
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-14 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-sm font-semibold text-slate-900 mb-1">
            {activeTab === "PENDING" ? "Tidak ada antrean pembayaran" : "Belum ada riwayat nota lunas"}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === "PENDING"
              ? "Semua kendaraan yang selesai diservis sudah lunas dibayar."
              : "Nota pembayaran yang telah diselesaikan akan tersimpan rapi di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const quickPaid = parseFloat(quickPayAmounts[order.id] || "") || 0;
            const quickChange = Math.max(0, quickPaid - order.grandTotal);

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-200">
                      {order.vehicle?.plateNumber}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {order.customer?.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : ""}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">#{order.orderNumber}</span>
                  </div>

                  <div>
                    {order.paymentStatus === "PAID" ? (
                      <span className="badge-selesai-pembayaran">
                        Lunas ({order.paymentMethod || "CASH"})
                      </span>
                    ) : (
                      <span className="badge-antrian">Menunggu Pembayaran</span>
                    )}
                  </div>
                </div>

                {/* Clear Cost Separation: [Total Biaya Jasa] vs [Total Harga Suku Cadang] + Instant Calculator */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-4 items-center">
                  {/* Breakdown Boxes (7 cols) */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <p className="text-[11px] font-medium text-slate-500">Total Biaya Jasa</p>
                      <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
                        {formatRupiah(order.totalServices)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.items.length} layanan servis
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <p className="text-[11px] font-medium text-slate-500">Total Harga Suku Cadang</p>
                      <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
                        {formatRupiah(order.totalParts)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.parts.length} item suku cadang
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-900 text-white">
                      <p className="text-[11px] font-medium text-slate-300">Total Tagihan Nota</p>
                      <p className="text-lg font-bold text-white font-mono tabular-nums mt-1">
                        {formatRupiah(order.grandTotal)}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Mekanik: {order.mechanicName || "Budi S."}
                      </p>
                    </div>
                  </div>

                  {/* Instant Change Calculator Simulator (5 cols) */}
                  <div className="lg:col-span-5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    {order.paymentStatus === "PAID" ? (
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-slate-500 font-medium">Uang Diterima</p>
                          <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                            {formatRupiah(order.paidAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 font-medium">Kembalian Pelanggan</p>
                          <p className="text-base font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
                            {formatRupiah(order.changeAmount)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-700">
                            Simulasi Uang Tunai Diterima (Rp)
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setQuickPayAmounts((prev) => ({
                                ...prev,
                                [order.id]: String(order.grandTotal),
                              }))
                            }
                            className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            Uang Pas
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 items-center">
                          <input
                            type="number"
                            placeholder="Contoh: 200000"
                            value={quickPayAmounts[order.id] || ""}
                            onChange={(e) =>
                              setQuickPayAmounts((prev) => ({
                                ...prev,
                                [order.id]: e.target.value,
                              }))
                            }
                            className="h-9 px-3 rounded-md bg-white border border-slate-300 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                              Kembalian Instan
                            </span>
                            <span
                              className={`text-base font-bold font-mono tabular-nums ${
                                quickPaid >= order.grandTotal ? "text-emerald-700" : "text-slate-400"
                              }`}
                            >
                              {formatRupiah(quickChange)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {order.completedDate
                      ? `Selesai Servis: ${formatDate(order.completedDate)}`
                      : `Waktu Masuk: ${formatDate(order.entryDate)}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/services/${order.id}`}
                      className="btn-ghost text-xs px-3.5 py-2"
                    >
                      Lihat Rincian Servis
                    </Link>
                    <Link
                      href={`/cashier/${order.id}`}
                      className="btn-primary text-xs px-4 py-2"
                    >
                      {order.paymentStatus === "PAID"
                        ? "Lihat & Cetak Nota Resmi"
                        : "Buka Kasir & Bayar Sekarang →"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
