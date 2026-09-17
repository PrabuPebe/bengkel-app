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
        title="Kasir, Billing & Penagihan Faktur"
        subtitle="Selesaikan pembayaran faktur servis PitCare Auto, berikan potongan diskon, pilih metode bayar, dan cetak nota struk resmi."
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menunggu Kasir
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black font-mono text-amber-400">
              {pendingOrders.length}
            </span>
            <span className="text-xs text-slate-400">Unit siap ditagih</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Faktur Lunas
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black font-mono text-indigo-400">
              {paidOrders.length}
            </span>
            <span className="text-xs text-slate-400">Transaksi tuntas</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-slate-950/40">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Kas Masuk Terkumpul
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {formatRupiah(todayRevenue)}
            </span>
            <span className="text-xs text-slate-400">Pendapatan lunas</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "PENDING"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Siap Ditagih</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950 text-amber-400 font-black">
                {pendingOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PAID")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "PAID"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Riwayat Faktur Lunas</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 font-black">
                {paidOrders.length}
              </span>
            </button>
          </div>

          <div className="w-full sm:w-80 relative">
            <input
              type="text"
              placeholder="Cari faktur, plat, atau pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
            <svg
              className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-20 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat antrean kasir PitCare Auto...
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-base font-bold text-white mb-1">
            {activeTab === "PENDING"
              ? "Tidak ada antrean pembayaran yang tertunda"
              : "Belum ada riwayat faktur yang lunas"}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === "PENDING"
              ? "Semua kendaraan yang selesai diservis telah ditagih atau belum ada SPK yang diselesaikan mekanik."
              : "Riwayat pembayaran kasir yang lunas akan tercatat rapi di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl shadow-slate-950/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-indigo-400 border border-indigo-500/20">
                    {order.orderNumber}
                  </span>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-500/10 text-white border border-indigo-500/20">
                    {order.vehicle?.plateNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {order.paymentStatus === "PAID" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ Lunas ({order.paymentMethod || "CASH"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      ⏳ Siap Bayar
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 text-xs">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Pelanggan & Kontak
                  </p>
                  <p className="font-bold text-white text-sm">{order.customer?.name}</p>
                  <a
                    href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:underline mt-1"
                  >
                    <span>📱 WA: {order.customer?.phone}</span>
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Rincian Item Pengerjaan
                  </p>
                  <p className="text-slate-300">
                    {order.items.length} Tindakan Jasa Servis
                  </p>
                  <p className="text-slate-300">
                    {order.parts.length} Item Suku Cadang Terpakai
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mekanik: <span className="text-white">{order.mechanicName || "Teknisi"}</span>
                  </p>
                </div>

                <div className="md:text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Total Tagihan Faktur
                    </p>
                    <p className="text-2xl font-black font-mono text-emerald-400">
                      {formatRupiah(order.grandTotal)}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Jasa: {formatRupiah(order.totalServices)} • Part: {formatRupiah(order.totalParts)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  {order.completedDate
                    ? `Selesai Servis: ${formatDate(order.completedDate)}`
                    : `Masuk Servis: ${formatDate(order.entryDate)}`}
                </span>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/services/${order.id}`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    Rincian SPK ↗
                  </Link>

                  <Link
                    href={`/cashier/${order.id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                      order.paymentStatus === "PAID"
                        ? "bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
                        : "bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
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
