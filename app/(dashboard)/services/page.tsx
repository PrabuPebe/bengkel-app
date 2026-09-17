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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Antrian Pit
        </span>
      );
    case "PENGERJAAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-spin" />
          Sedang Dikerjakan
        </span>
      );
    case "MENUNGGU_PART":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-600/15 text-amber-200 border border-amber-600/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Menunggu Part
        </span>
      );
    case "SELESAI_PENGERJAAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Siap Ditagih (Kasir)
        </span>
      );
    case "SELESAI_PEMBAYARAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          Faktur Lunas
        </span>
      );
    case "DIBATALKAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
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

  // Quick statistics calculation
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
    { id: "PENGERJAAN", label: "Dikerjakan", count: stats.pengerjaan },
    { id: "MENUNGGU_PART", label: "Menunggu Part" },
    { id: "SELESAI_PENGERJAAN", label: "Siap Bayar", count: stats.siapBayar },
    { id: "SELESAI_PEMBAYARAN", label: "Lunas", count: stats.lunas },
  ];

  return (
    <div>
      <Header
        title="Work Order & Pengerjaan Servis"
        subtitle="Pantau antrian servis pit, pengerjaan mekanik, pemakaian suku cadang, hingga kesiapan faktur kasir."
        actionButton={
          <Link
            href="/services/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-lg shadow-[#8f63ec]/25 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Buat SPK Baru
          </Link>
        }
      />

      {/* Metric Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider">
            Antrian Menunggu
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-400">{stats.antrian}</span>
            <span className="text-xs text-[#b5abc9]">Unit di pit</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider">
            Sedang Dikerjakan
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-sky-400">{stats.pengerjaan}</span>
            <span className="text-xs text-[#b5abc9]">Aktif di pit</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider">
            Siap ke Kasir
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-400">{stats.siapBayar}</span>
            <span className="text-xs text-[#b5abc9]">Menunggu bayar</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15">
          <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider">
            Faktur Lunas
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#c49eff]">{stats.lunas}</span>
            <span className="text-xs text-[#b5abc9]">Selesai transaksi</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4 mb-6">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-[#8f63ec] text-white shadow-md shadow-[#8f63ec]/30"
                    : "bg-[#221939]/70 text-[#b5abc9] hover:text-[#f6f2ff] hover:bg-[#2e2150] border border-[#d2b8ff]/10"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-[#17122b] text-[#817797]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari nomor SPK (WO-...), plat nomor (B 4321 KAZ), nama pelanggan, atau tipe unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#221939]/90 border border-[#d2b8ff]/15 text-[#f6f2ff] placeholder-[#817797] text-sm focus:outline-none focus:border-[#9b6cff] transition-all"
            />
            <svg
              className="w-5 h-5 text-[#817797] absolute left-3.5 top-3 pointer-events-none"
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
              className="px-4 h-11 rounded-xl text-xs font-semibold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-16 text-center text-[#817797] text-sm">
          <div className="w-8 h-8 border-2 border-[#9b6cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data Work Order...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#221939]/40 border border-[#d2b8ff]/10">
          <p className="text-base font-bold text-[#f6f2ff] mb-1">
            Tidak ada Work Order dalam kategori ini
          </p>
          <p className="text-xs text-[#817797] mb-4">
            {searchQuery
              ? "Coba gunakan kata kunci pencarian lain atau ganti filter status."
              : "Belum ada SPK terbit untuk status yang dipilih."}
          </p>
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8f63ec]"
          >
            + Terbitkan SPK Baru
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/40 transition-all shadow-lg shadow-black/20"
            >
              {/* Top Row: Order Number, Plate, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#d2b8ff]/10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#17122b] text-[#c49eff] border border-[#9b6cff]/30">
                    {order.orderNumber}
                  </span>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#2e2150] text-[#f6f2ff] border border-[#d2b8ff]/20 tracking-wider">
                    {order.vehicle?.plateNumber || "NO-PLATE"}
                  </span>
                  <span className="text-xs font-bold text-[#d9d0eb]">
                    {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : "Kendaraan Terhapus"}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Middle Row: Customer Info & Keluhan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3.5 text-xs">
                <div>
                  <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider mb-1">
                    Pemilik Kendaraan
                  </p>
                  <p className="font-bold text-[#f6f2ff] text-sm">
                    {order.customer?.name || "Pelanggan Terhapus"}
                  </p>
                  <p className="text-[#34d399] font-medium mt-0.5">
                    WA: {order.customer?.phone || "-"}
                  </p>
                  {order.currentKm && (
                    <p className="text-[#817797] mt-0.5">
                      KM Saat Masuk: <span className="font-mono text-[#d9d0eb]">{order.currentKm.toLocaleString("id-ID")} KM</span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider mb-1">
                    Keluhan & Diagnosis
                  </p>
                  <p className="text-[#b5abc9] line-clamp-2">
                    <span className="text-[#f6f2ff] font-semibold">Keluhan: </span>
                    {order.complaints}
                  </p>
                  {order.diagnosis && (
                    <p className="text-[#34d399] line-clamp-1 mt-1">
                      <span className="font-semibold">Diagnosis: </span>
                      {order.diagnosis}
                    </p>
                  )}
                  <p className="text-[#817797] mt-1">
                    Mekanik: <span className="font-bold text-[#c49eff]">{order.mechanicName || "Belum Ditugaskan"}</span>
                  </p>
                </div>

                <div className="md:text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-[#817797] uppercase tracking-wider mb-1">
                      Estimasi / Total Biaya
                    </p>
                    <p className="text-lg font-black text-[#f6f2ff]">
                      {formatRupiah(order.grandTotal)}
                    </p>
                    <p className="text-[11px] text-[#817797] mt-0.5">
                      {order.items.length} Jasa • {order.parts.length} Sparepart
                    </p>
                  </div>
                  <p className="text-[10px] text-[#817797] mt-2">
                    Masuk: {formatDate(order.entryDate)}
                  </p>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-[#d2b8ff]/10">
                <div className="flex items-center gap-2 text-xs text-[#817797]">
                  {order.notes && (
                    <span className="truncate max-w-sm">
                      📝 Catatan: {order.notes}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/services/${order.id}`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] transition-colors"
                  >
                    Detail & Mekanik →
                  </Link>

                  {order.status === "SELESAI_PENGERJAAN" && (
                    <Link
                      href={`/cashier/${order.id}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-sm shadow-emerald-500/20 transition-all"
                    >
                      Bayar di Kasir 💰
                    </Link>
                  )}

                  {order.status === "SELESAI_PEMBAYARAN" && (
                    <Link
                      href={`/cashier/${order.id}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 transition-all"
                    >
                      Lihat / Cetak Faktur 🖨️
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
