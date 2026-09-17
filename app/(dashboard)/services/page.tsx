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
        <span className="badge-custom badge-cream">
          <span className="w-1.5 h-1.5 rounded-full bg-[#412D15] animate-pulse" />
          Antrian Pit
        </span>
      );
    case "PENGERJAAN":
      return (
        <span className="badge-custom badge-steel">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1F150C] animate-pulse" />
          Sedang Dikerjakan
        </span>
      );
    case "MENUNGGU_PART":
      return (
        <span className="badge-custom bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Menunggu Part
        </span>
      );
    case "SELESAI_PENGERJAAN":
      return (
        <span className="badge-custom badge-sage">
          <span className="w-1.5 h-1.5 rounded-full bg-[#412D15]" />
          Siap ke Kasir
        </span>
      );
    case "SELESAI_PEMBAYARAN":
      return (
        <span className="badge-custom bg-[#1F150C] text-[#E1DCC9] border border-[#1F150C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E1DCC9]" />
          Faktur Lunas
        </span>
      );
    case "DIBATALKAN":
      return (
        <span className="badge-custom badge-danger">
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
            className="btn-sage flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            + Terbitkan SPK Baru
          </Link>
        }
      />

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-[#1F150C] text-[#E1DCC9] shadow-md shadow-[#000000]/20"
                    : "bg-white text-[#412D15] hover:bg-[#E1DCC9]/50 border border-[#412D15]/20"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? "bg-[#412D15] text-[#E1DCC9]" : "bg-[#E1DCC9] text-[#1F150C]"
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
              placeholder="Cari nomor SPK, plat nomor, nama pelanggan, atau merk kendaraan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-custom w-full h-11 pl-11 pr-4 text-xs placeholder:text-[#412D15]/60"
            />
            <svg className="w-4 h-4 text-[#412D15] absolute left-4 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); loadOrders(selectedStatus, ""); }}
              className="btn-outline-steel px-4 h-11 text-xs cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-20 text-center text-[#412D15] text-xs card-floating">
          <div className="w-8 h-8 border-2 border-[#412D15] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data Work Order PitCare Auto...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center card-floating">
          <div className="w-14 h-14 rounded-2xl bg-[#E1DCC9] border border-[#412D15]/20 flex items-center justify-center mx-auto mb-4 text-[#1F150C]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1F150C] mb-1">Tidak ada Work Order</p>
          <p className="text-xs text-[#412D15] mb-6 max-w-sm mx-auto">
            {searchQuery ? "Coba gunakan kata kunci lain atau pilih tab status lain." : "Belum ada SPK yang terdaftar untuk filter ini."}
          </p>
          <Link
            href="/services/new"
            className="btn-sage inline-flex items-center gap-2 px-5 py-2.5 text-xs cursor-pointer"
          >
            + Terbitkan SPK Baru
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="card-floating p-5 sm:p-6"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#412D15]/15">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#1F150C] text-[#E1DCC9]">
                    {order.orderNumber}
                  </span>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#412D15]/15 text-[#1F150C] border border-[#412D15]/30 tracking-wider">
                    {order.vehicle?.plateNumber || "NO-PLATE"}
                  </span>
                  <span className="text-xs font-bold text-[#1F150C]">
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
                  <p className="text-[10px] font-bold text-[#412D15] uppercase tracking-wider mb-1.5">
                    Pemilik Kendaraan
                  </p>
                  <p className="font-bold text-[#1F150C] text-sm">
                    {order.customer?.name || "Pelanggan Terhapus"}
                  </p>
                  <a
                    href={`https://wa.me/${order.customer?.phone?.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#1F150C] font-semibold hover:underline mt-1"
                  >
                    📱 WA: {order.customer?.phone || "-"}
                  </a>
                  {order.currentKm && (
                    <p className="text-[#412D15] mt-1 font-medium">
                      KM Masuk: <span className="font-mono font-bold text-[#1F150C]">{order.currentKm.toLocaleString("id-ID")} KM</span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-[#412D15] uppercase tracking-wider mb-1.5">
                    Keluhan & Tindakan
                  </p>
                  <p className="text-[#412D15] line-clamp-2 leading-relaxed">
                    <span className="text-[#1F150C] font-semibold">Keluhan: </span>
                    &quot;{order.complaints}&quot;
                  </p>
                  {order.diagnosis && (
                    <p className="text-[#1F150C] line-clamp-1 mt-1 leading-relaxed font-medium">
                      <span className="text-[#412D15] font-semibold">Diagnosis: </span>
                      {order.diagnosis}
                    </p>
                  )}
                  <p className="text-[#412D15] mt-1.5">
                    Teknisi: <span className="font-bold text-[#1F150C]">{order.mechanicName || "Belum Ditugaskan"}</span>
                  </p>
                </div>

                <div className="md:text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#412D15] uppercase tracking-wider mb-1.5">
                      Estimasi / Total Biaya
                    </p>
                    <p className="text-2xl font-black font-mono text-[#1F150C]">
                      {formatRupiah(order.grandTotal)}
                    </p>
                    <p className="text-[11px] font-mono text-[#412D15] mt-1 font-medium">
                      {order.items.length} Jasa • {order.parts.length} Sparepart
                    </p>
                  </div>
                  <p className="text-[10px] text-[#412D15] mt-2">
                    Masuk: {formatDate(order.entryDate)}
                  </p>
                </div>
              </div>

              {/* Footer row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#412D15]/15">
                <div className="flex items-center gap-3 text-[11px]">
                  <Link
                    href={`/track/${order.token}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E1DCC9] border border-[#412D15]/40 text-[#1F150C] hover:bg-[#E1DCC9]/80 font-bold transition-colors text-xs cursor-pointer"
                  >
                    📱 Live Tracking Pelanggan ↗
                  </Link>
                  {order.notes && (
                    <span className="truncate max-w-xs text-[#412D15] font-medium">• {order.notes}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/services/${order.id}`}
                    className="btn-outline-steel px-4 py-2 text-xs cursor-pointer"
                  >
                    Detail & Mekanik →
                  </Link>

                  {order.status === "SELESAI_PENGERJAAN" && (
                    <Link
                      href={`/cashier/${order.id}`}
                      className="btn-sage px-4 py-2 text-xs cursor-pointer"
                    >
                      Bayar di Kasir 💳
                    </Link>
                  )}

                  {order.status === "SELESAI_PEMBAYARAN" && (
                    <Link
                      href={`/cashier/${order.id}`}
                      className="btn-charcoal px-4 py-2 text-xs cursor-pointer"
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
