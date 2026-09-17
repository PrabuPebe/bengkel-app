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
    <div>
      <Header
        title="Kasir, Billing & Penagihan Faktur"
        subtitle="Selesaikan pembayaran faktur servis, berikan potongan diskon, pilih metode bayar, dan cetak nota struk resmi bengkel."
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider">
            Menunggu Pembayaran Kasir
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-400">
              {pendingOrders.length}
            </span>
            <span className="text-xs text-[#b5abc9]">Unit siap bayar</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider">
            Faktur Lunas
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#c49eff]">
              {paidOrders.length}
            </span>
            <span className="text-xs text-[#b5abc9]">Transaksi tuntas</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider">
            Total Kas Masuk Terkumpul
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-400">
              {formatRupiah(todayRevenue)}
            </span>
            <span className="text-xs text-[#b5abc9]">Pendapatan lunas</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-[#221939] p-1 rounded-xl border border-[#d2b8ff]/15">
            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "PENDING"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-600/30"
                  : "text-[#b5abc9] hover:text-[#f6f2ff]"
              }`}
            >
              <span>Siap Ditagih (Menunggu Pembayaran)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-black">
                {pendingOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PAID")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "PAID"
                  ? "bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] text-white shadow-md shadow-[#8f63ec]/30"
                  : "text-[#b5abc9] hover:text-[#f6f2ff]"
              }`}
            >
              <span>Riwayat Faktur Lunas</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-black">
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
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#221939]/90 border border-[#d2b8ff]/15 text-[#f6f2ff] placeholder-[#817797] text-xs focus:outline-none focus:border-[#9b6cff]"
            />
            <svg
              className="w-4 h-4 text-[#817797] absolute left-3.5 top-3 pointer-events-none"
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
        <div className="p-16 text-center text-[#817797] text-sm">
          <div className="w-8 h-8 border-2 border-[#9b6cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat antrean kasir...
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#221939]/40 border border-[#d2b8ff]/10">
          <p className="text-base font-bold text-[#f6f2ff] mb-1">
            {activeTab === "PENDING"
              ? "Tidak ada antrean pembayaran yang tertunda"
              : "Belum ada riwayat faktur yang lunas"}
          </p>
          <p className="text-xs text-[#817797]">
            {activeTab === "PENDING"
              ? "Semua kendaraan yang selesai diservis telah ditagih atau belum ada SPK yang diselesaikan mekanik."
              : "Riwayat pembayaran kasir akan dicatat di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/40 transition-all shadow-lg shadow-black/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#d2b8ff]/10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#17122b] text-[#c49eff] border border-[#9b6cff]/30">
                    {order.orderNumber}
                  </span>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#2e2150] text-[#f6f2ff] border border-[#d2b8ff]/20">
                    {order.vehicle?.plateNumber}
                  </span>
                  <span className="text-xs font-bold text-[#d9d0eb]">
                    {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {order.paymentStatus === "PAID" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      ✓ Lunas ({order.paymentMethod || "CASH"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      ⏳ Siap Bayar
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3.5 text-xs">
                <div>
                  <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider mb-1">
                    Pelanggan & Kontak
                  </p>
                  <p className="font-bold text-[#f6f2ff] text-sm">{order.customer?.name}</p>
                  <p className="text-[#34d399] font-medium mt-0.5">WA: {order.customer?.phone}</p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider mb-1">
                    Rincian Item Pengerjaan
                  </p>
                  <p className="text-[#b5abc9]">
                    {order.items.length} Tindakan Jasa Servis
                  </p>
                  <p className="text-[#b5abc9]">
                    {order.parts.length} Item Suku Cadang Terpakai
                  </p>
                  <p className="text-[11px] text-[#817797] mt-1">
                    Mekanik: <span className="text-[#d9d0eb]">{order.mechanicName || "Teknisi"}</span>
                  </p>
                </div>

                <div className="md:text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider mb-1">
                      Total Tagihan Faktur
                    </p>
                    <p className="text-xl font-black text-[#f6f2ff]">
                      {formatRupiah(order.grandTotal)}
                    </p>
                    <p className="text-[11px] text-[#817797] mt-0.5">
                      Jasa: {formatRupiah(order.totalServices)} • Part: {formatRupiah(order.totalParts)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#d2b8ff]/10">
                <span className="text-[11px] text-[#817797]">
                  {order.completedDate
                    ? `Selesai Servis: ${formatDate(order.completedDate)}`
                    : `Masuk Servis: ${formatDate(order.entryDate)}`}
                </span>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/services/${order.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#b5abc9] hover:text-[#f6f2ff] bg-[#17122b] hover:bg-[#221939] transition-colors"
                  >
                    Rincian SPK ↗
                  </Link>

                  <Link
                    href={`/cashier/${order.id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                      order.paymentStatus === "PAID"
                        ? "bg-[#2e2150] hover:bg-[#382666] border border-[#d2b8ff]/20 text-[#c49eff]"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-md shadow-emerald-500/25"
                    }`}
                  >
                    {order.paymentStatus === "PAID" ? (
                      <>🖨️ Lihat / Cetak Faktur Struk</>
                    ) : (
                      <>💰 Proses Pembayaran Kasir →</>
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
