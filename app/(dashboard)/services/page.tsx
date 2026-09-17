"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { ServiceOrder, ServiceStatus } from "@/lib/types/database";
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

function getStatusBadge(status: ServiceStatus) {
  switch (status) {
    case "ANTRIAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Antrian Pit
        </span>
      );
    case "PENGERJAAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Sedang Dikerjakan
        </span>
      );
    case "MENUNGGU_PART":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-300 border border-orange-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          Menunggu Part
        </span>
      );
    case "SELESAI_PENGERJAAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Siap ke Kasir
        </span>
      );
    case "SELESAI_PEMBAYARAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          Faktur Lunas
        </span>
      );
    case "DIBATALKAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30">
          Dibatalkan
        </span>
      );
    default:
      return null;
  }
}

export default function ServicesPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadOrders(status?: string, query?: string) {
    setIsLoading(true);
    try {
      const data = await getServiceOrdersAction({
        status: status === "ALL" ? undefined : status,
        query,
      });
      setOrders(data);
    } catch {
      console.error("Gagal memuat daftar work order");
    } finally {
      setIsLoading(false);
    }
  }

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

  function handleFilterChange(status: string) {
    setSelectedStatus(status);
    loadOrders(status, searchQuery);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadOrders(selectedStatus, searchQuery);
  }

  const stats = {
    total: orders.length,
    antrian: orders.filter((o) => o.status === "ANTRIAN").length,
    pengerjaan: orders.filter((o) => o.status === "PENGERJAAN").length,
    siapBayar: orders.filter((o) => o.status === "SELESAI_PENGERJAAN").length,
    lunas: orders.filter((o) => o.status === "SELESAI_PEMBAYARAN").length,
  };

  const statusTabs = [
    { id: "ALL", label: "Semua SPK", count: stats.total },
    { id: "ANTRIAN", label: "Antrian Pit", count: stats.antrian },
    { id: "PENGERJAAN", label: "Sedang Dikerjakan", count: stats.pengerjaan },
    { id: "MENUNGGU_PART", label: "Menunggu Part" },
    { id: "SELESAI_PENGERJAAN", label: "Siap Bayar", count: stats.siapBayar },
    { id: "SELESAI_PEMBAYARAN", label: "Faktur Lunas", count: stats.lunas },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Work Order & Pengerjaan Servis"
        subtitle="Kelola antrian pit servis kendaraan, pengerjaan teknisi, pemakaian suku cadang otomatis, hingga kesiapan penagihan kasir."
        actionButton={
          <Link
            href="/services/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:brightness-110 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Terbitkan SPK Baru
          </Link>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/25"
                    : "bg-slate-900/60 backdrop-blur-md text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/5"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-950 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari nomor SPK (WO-...), plat nomor (B 4321 KAZ), nama pelanggan, atau merk kendaraan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
            />
            <svg
              className="w-4 h-4 text-slate-500 absolute left-4 top-3.5 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                loadOrders(selectedStatus, "");
              }}
              className="px-4 h-11 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-white/10 hover:bg-slate-800 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-20 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data Work Order PitCare Auto...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10">
          <p className="text-sm font-bold text-white mb-1">
            Tidak ada Work Order pada kategori ini
          </p>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            {searchQuery
              ? "Coba gunakan kata kunci pencarian lain atau pilih tab status lain."
              : "Belum ada SPK servis yang terdaftar untuk filter ini."}
          </p>
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all"
          >
            + Terbitkan SPK Baru
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10 shadow-sm"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-950 text-indigo-400 border border-white/5">
                    {order.orderNumber}
                  </span>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-indigo-500/10 text-white border border-indigo-500/20 tracking-wider">
                    {order.vehicle?.plateNumber || "NO-PLATE"}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : "Kendaraan Terhapus"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Body row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pemilik Kendaraan
                  </p>
                  <p className="font-bold text-white text-sm">
                    {order.customer?.name || "Pelanggan Terhapus"}
                  </p>
                  <a
                    href={`https://wa.me/${order.customer?.phone?.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 font-medium hover:underline mt-1"
                  >
                    <span>📱 WA: {order.customer?.phone || "-"}</span>
                  </a>
                  {order.currentKm && (
                    <p className="text-slate-400 mt-1">
                      KM Masuk: <span className="font-mono font-bold text-slate-200">{order.currentKm.toLocaleString("id-ID")} KM</span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Keluhan & Tindakan Servis
                  </p>
                  <p className="text-slate-300 line-clamp-2 leading-relaxed">
                    <span className="text-slate-500 font-medium">Keluhan: </span>
                    &quot;{order.complaints}&quot;
                  </p>
                  {order.diagnosis && (
                    <p className="text-indigo-300 line-clamp-1 mt-1 leading-relaxed">
                      <span className="text-slate-500 font-medium">Diagnosis: </span>
                      {order.diagnosis}
                    </p>
                  )}
                  <p className="text-slate-400 mt-1.5">
                    Teknisi: <span className="font-semibold text-white">{order.mechanicName || "Belum Ditugaskan"}</span>
                  </p>
                </div>

                <div className="md:text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Estimasi / Total Biaya
                    </p>
                    <p className="text-2xl font-black font-mono text-emerald-400">
                      {formatRupiah(order.grandTotal)}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      {order.items.length} Jasa • {order.parts.length} Sparepart
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Masuk: {formatDate(order.entryDate)}
                  </p>
                </div>
              </div>

              {/* Bottom footer row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <Link
                    href={`/track/${order.token}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 font-semibold transition-colors"
                  >
                    <span>📱 Live Tracking Pelanggan ↗</span>
                  </Link>
                  {order.notes && (
                    <span className="truncate max-w-xs text-slate-500">
                      • {order.notes}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/services/${order.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-950/80 border border-white/10 hover:bg-slate-800 transition-all duration-200"
                  >
                    Detail & Mekanik →
                  </Link>

                  {order.status === "SELESAI_PENGERJAAN" && (
                    <Link
                      href={`/cashier/${order.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      Bayar di Kasir 💳
                    </Link>
                  )}

                  {order.status === "SELESAI_PEMBAYARAN" && (
                    <Link
                      href={`/cashier/${order.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      Cetak Faktur 🖨️
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
