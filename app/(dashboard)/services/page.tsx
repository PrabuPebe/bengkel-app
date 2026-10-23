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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
          Antrean Servis
        </span>
      );
    case "PENGERJAAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          Sedang Dikerjakan
        </span>
      );
    case "MENUNGGU_PART":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Menunggu Part
        </span>
      );
    case "SELESAI_PENGERJAAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Siap ke Kasir
        </span>
      );
    case "SELESAI_PEMBAYARAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Faktur Lunas
        </span>
      );
    case "DIBATALKAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
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
      console.error("Gagal memuat daftar tiket servis");
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
    { id: "ALL", label: "Semua Tiket", count: stats.total },
    { id: "ANTRIAN", label: "Antrean Servis", count: stats.antrian },
    { id: "PENGERJAAN", label: "Sedang Dikerjakan", count: stats.pengerjaan },
    { id: "MENUNGGU_PART", label: "Menunggu Part" },
    { id: "SELESAI_PENGERJAAN", label: "Siap Kasir", count: stats.siapBayar },
    { id: "SELESAI_PEMBAYARAN", label: "Faktur Lunas", count: stats.lunas },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Tiket Servis & Antrean Bengkel"
        subtitle="Kelola antrean servis motor, pengerjaan teknisi mekanik, pemakaian suku cadang otomatis, hingga kesiapan penagihan kasir."
        actionButton={
          <Link
            href="/services/new"
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Buat Tiket Servis
          </Link>
        }
      />

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari nomor tiket, plat nomor motor, nama pelanggan, atau keluhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark w-full h-11 pl-11 pr-4 text-xs"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="btn-ghost px-4 h-11 text-xs font-semibold cursor-pointer shadow-2xs"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs shadow-xs">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data Tiket Servis PitCare Auto...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-700">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">Tidak ada Tiket Servis</p>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            {searchQuery ? "Coba gunakan kata kunci lain atau pilih tab status lain." : "Belum ada tiket servis yang terdaftar untuk filter ini."}
          </p>
          <Link
            href="/services/new"
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer shadow-xs"
          >
            + Buat Tiket Servis Baru
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-colors"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {order.orderNumber}
                  </span>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white tracking-wider">
                    {order.vehicle?.plateNumber || "NO-PLATE"}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">
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
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Pemilik Kendaraan
                  </p>
                  <p className="font-semibold text-slate-900 text-sm">
                    {order.customer?.name || "Pelanggan Terhapus"}
                  </p>
                  <a
                    href={`https://wa.me/${order.customer?.phone?.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:underline mt-1.5 font-mono"
                  >
                    <span>WA: {order.customer?.phone || "-"}</span>
                  </a>
                  {order.currentKm && (
                    <p className="text-slate-600 mt-1 font-medium">
                      Kilometer Masuk: <span className="font-mono font-bold text-slate-900">{order.currentKm.toLocaleString("id-ID")} KM</span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Keluhan & Catatan Servis
                  </p>
                  <p className="text-slate-700 line-clamp-2 leading-relaxed">
                    <span className="text-slate-500 font-medium">Keluhan: </span>
                    &quot;{order.complaints}&quot;
                  </p>
                  {order.diagnosis && (
                    <p className="text-slate-700 line-clamp-1 mt-1 leading-relaxed font-medium">
                      <span className="text-slate-500 font-medium">Catatan Mekanik: </span>
                      {order.diagnosis}
                    </p>
                  )}
                  <p className="text-slate-500 mt-1.5">
                    Teknisi: <span className="font-semibold text-slate-800">{order.mechanicName || "Mekanik PitCare"}</span>
                  </p>
                </div>

                <div className="md:text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Estimasi / Total Biaya
                    </p>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                      {formatRupiah(order.grandTotal)}
                    </p>
                    <p className="text-xs font-mono text-slate-500 mt-1 font-medium">
                      {order.items.length} Jasa • {order.parts.length} Suku Cadang
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 font-mono">
                    Waktu Masuk: {formatDate(order.entryDate)}
                  </p>
                </div>
              </div>

              {/* Footer row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs">
                  <Link
                    href={`/track/${order.token}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors text-xs cursor-pointer shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Buka Pelacakan HP ↗
                  </Link>
                  {order.notes && (
                    <span className="truncate max-w-xs text-slate-500 font-medium">• {order.notes}</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/services/${order.id}`}
                    className="btn-ghost px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    Rincian Servis →
                  </Link>

                  {order.status === "SELESAI_PENGERJAAN" && (
                    <Link
                      href={`/cashier/${order.id}`}
                      className="btn-primary px-3.5 py-2 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Bayar di Kasir 💳
                    </Link>
                  )}

                  {order.status === "SELESAI_PEMBAYARAN" && (
                    <Link
                      href={`/cashier/${order.id}`}
                      className="btn-primary px-3.5 py-2 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Lihat Faktur 🖨️
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
