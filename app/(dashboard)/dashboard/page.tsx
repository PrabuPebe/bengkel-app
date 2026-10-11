import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { db } from "@/lib/db";
import { ServiceStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getLinearStatusBadge(status: ServiceStatus | string) {
  switch (status) {
    case "ANTRIAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Menunggu Antrean
        </span>
      );
    case "PENGERJAAN":
    case "MENUNGGU_PART":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Sedang Dikerjakan
        </span>
      );
    case "SELESAI_PENGERJAAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Menunggu Pembayaran
        </span>
      );
    case "SELESAI_PEMBAYARAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Selesai / Lunas
        </span>
      );
    case "DIBATALKAN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Dibatalkan
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}

export default async function DashboardOverviewPage() {
  const stats = await db.getStats();
  const recentOrders = await db.serviceOrder.findMany();
  const feedOrders = recentOrders.slice(0, 7);
  const activeServicesToday =
    stats.activeQueueCount + stats.inProgressCount + stats.readyForCashierCount;

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <Header
        title="Ringkasan Operasional Bengkel"
        subtitle="Pantau antrean servis motor hari ini, pendapatan kasir, dan pemakaian suku cadang secara langsung."
        actionButton={
          <Link
            href="/services/new"
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-semibold shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Servis Baru</span>
          </Link>
        }
      />

      {/* 2. 3 CARD METRIK UTAMA DI BAGIAN ATAS (Linear Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Servis Aktif Hari Ini */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Servis Aktif Hari Ini</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {stats.inProgressCount} Dikerjakan
              </span>
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
              {activeServicesToday}{" "}
              <span className="text-sm font-normal text-slate-500">Motor</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {stats.activeQueueCount} antre • {stats.readyForCashierCount} menunggu bayar
            </span>
            <Link href="/services" className="font-semibold text-slate-900 hover:underline">
              Lihat Antrean →
            </Link>
          </div>
        </div>

        {/* Card 2: Pendapatan Hari Ini */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Pendapatan Hari Ini</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {stats.completedOrdersCount} Lunas
              </span>
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
              {formatRupiah(stats.todayRevenue)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total {stats.todayServicesCount} pengerjaan servis hari ini</span>
            <Link href="/cashier" className="font-semibold text-slate-900 hover:underline">
              Buka Kasir →
            </Link>
          </div>
        </div>

        {/* Card 3: Peringatan Stok Menipis */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Peringatan Stok Menipis</span>
              {stats.lowStockCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Perlu Restock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Stok Aman
                </span>
              )}
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
              {stats.lowStockCount}{" "}
              <span className="text-sm font-normal text-slate-500">Suku Cadang</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">
              {stats.lowStockCount > 0
                ? `Termasuk: ${stats.lowStockItems.slice(0, 2).map((i) => i.name).join(", ")}`
                : "Seluruh komponen di atas batas peringatan"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. AREA UTAMA: TABEL ANTREAN SERVIS TERKINI & STATISTIK SUKU CADANG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI (8 KOLOM): TABEL ANTREAN SERVIS TERKINI (Linear Table Style) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Antrean Servis Terkini
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Daftar motor pelanggan yang sedang ditangani hari ini
              </p>
            </div>
            <Link
              href="/services"
              className="btn-secondary text-xs px-3 py-2"
            >
              Lihat Semua Servis
            </Link>
          </div>

          {feedOrders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-slate-600 mb-1">
                Belum ada antrean servis hari ini
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Klik tombol Tambah Servis Baru untuk mencatat motor pelanggan yang masuk.
              </p>
              <Link href="/services/new" className="btn-primary text-xs px-4 py-2">
                + Tambah Servis Baru
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Plat Motor
                    </th>
                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nama Pelanggan
                    </th>
                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Keluhan Utama
                    </th>
                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="plate-badge">
                          {order.vehicle?.plateNumber || "B 1234 XY"}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {order.vehicle?.brand} {order.vehicle?.model}
                        </p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-sm font-medium text-slate-900">
                          {order.customer?.name || "Pelanggan"}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {order.currentKm
                            ? `${order.currentKm.toLocaleString("id-ID")} KM`
                            : "KM belum dicatat"}
                        </p>
                      </td>
                      <td className="py-3.5 px-5 max-w-xs">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {order.complaints}
                        </p>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {getLinearStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {order.status === "SELESAI_PENGERJAAN" ? (
                          <Link
                            href="/cashier"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            Proses Bayar →
                          </Link>
                        ) : (
                          <Link
                            href={`/services/${order.id}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            Buka Detail
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* KOLOM KANAN (4 KOLOM): TOP 5 SUKU CADANG TERLARIS (Fast/Slow Moving Analytics) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Top 5 Suku Cadang Terlaris
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                Fast / Slow Moving
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Komponen yang paling sering dipakai saat servis
            </p>
          </div>

          <div className="space-y-3">
            {stats.topUsedParts &&
              stats.topUsedParts.map((part, index) => {
                const maxQty = Math.max(...stats.topUsedParts.map((x) => x.totalQty), 1);
                const barWidth = Math.max(18, Math.round((part.totalQty / maxQty) * 100));
                const isFastMoving = index < 3 || part.totalQty >= 4;

                return (
                  <div
                    key={part.partId}
                    className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/70 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-400 tabular-nums">
                            #{index + 1}
                          </span>
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {part.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              isFastMoving
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isFastMoving ? "Cepat Laku (Fast Moving)" : "Jarang Ganti (Slow Moving)"}
                          </span>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {formatRupiah(part.totalRevenue)}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-800 tabular-nums shrink-0">
                        {part.totalQty}x dipakai
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFastMoving ? "bg-slate-900" : "bg-amber-500"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
