import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { getCustomerPortalSession, logoutCustomerPortalAction } from "@/lib/actions/customer-portal";

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
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface PortalPartItem {
  id: string;
  partName: string;
  qty: number;
  sellPrice: number;
  subtotal: number;
}

interface PortalOrderItem {
  id: string;
  serviceName: string;
  qty: number;
  price: number;
  subtotal: number;
}

interface PortalOrder {
  id: string;
  orderNumber: string;
  token?: string;
  currentKm?: number | null;
  status: string;
  entryDate: Date | string;
  completedDate?: Date | string | null;
  grandTotal: number;
  totalServices: number;
  totalParts: number;
  items: PortalOrderItem[];
  parts: PortalPartItem[];
  mechanic?: { name: string } | null;
  complaints?: string | null;
  diagnosis?: string | null;
}

interface PortalVehicle {
  id: string;
  customerId: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  serviceOrders: PortalOrder[];
}

interface PortalCustomer {
  id: string;
  name: string;
  phone: string;
  vehicles: PortalVehicle[];
  serviceOrders: PortalOrder[];
}

export default async function CustomerPortalPage() {
  const session = await getCustomerPortalSession();

  if (!session) {
    redirect("/login");
  }

  // 1. Coba ambil data pelanggan lengkap dari Supabase
  let rawCustomer: any = null;
  try {
    rawCustomer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        vehicles: {
          include: {
            serviceOrders: {
              include: {
                items: true,
                parts: true,
                mechanic: true,
              },
              orderBy: { entryDate: "desc" },
            },
          },
        },
        serviceOrders: {
          include: {
            vehicle: true,
            items: true,
            parts: true,
            mechanic: true,
          },
          orderBy: { entryDate: "desc" },
        },
      },
    });
  } catch (err) {
    console.warn("Prisma error in portal, falling back to memory database:", err);
  }

  // 2. Fallback ke database in-memory jika Prisma offline/unreachable
  if (!rawCustomer) {
    rawCustomer = await db.customer.findById(session.customerId);
  }

  let customer: PortalCustomer;

  if (rawCustomer) {
    customer = {
      id: rawCustomer.id,
      name: rawCustomer.name,
      phone: rawCustomer.phone,
      vehicles: (rawCustomer.vehicles || []).map((v: any) => ({
        id: v.id,
        customerId: v.customerId,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        serviceOrders: (v.serviceOrders || []).map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          token: o.token,
          currentKm: o.currentKm,
          status: o.status,
          entryDate: o.entryDate,
          completedDate: o.completedDate,
          grandTotal: Number(o.grandTotal || 0),
          totalServices: Number(o.totalServices || 0),
          totalParts: Number(o.totalParts || 0),
          items: (o.items || []).map((i: any) => ({
            id: i.id,
            serviceName: i.serviceName,
            qty: i.qty,
            price: Number(i.price || 0),
            subtotal: Number(i.subtotal || 0),
          })),
          parts: (o.parts || []).map((p: any) => ({
            id: p.id,
            partName: p.partName,
            qty: p.qty,
            sellPrice: Number(p.sellPrice || 0),
            subtotal: Number(p.subtotal || 0),
          })),
          mechanic: o.mechanic ? { name: o.mechanic.name } : null,
          complaints: o.complaints || o.notes,
          diagnosis: o.diagnosis,
        })),
      })),
      serviceOrders: (rawCustomer.serviceOrders || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        token: o.token,
        currentKm: o.currentKm,
        status: o.status,
        entryDate: o.entryDate,
        completedDate: o.completedDate,
        grandTotal: Number(o.grandTotal || 0),
        totalServices: Number(o.totalServices || 0),
        totalParts: Number(o.totalParts || 0),
        items: (o.items || []).map((i: any) => ({
          id: i.id,
          serviceName: i.serviceName,
          qty: i.qty,
          price: Number(i.price || 0),
          subtotal: Number(i.subtotal || 0),
        })),
        parts: (o.parts || []).map((p: any) => ({
          id: p.id,
          partName: p.partName,
          qty: p.qty,
          sellPrice: Number(p.sellPrice || 0),
          subtotal: Number(p.subtotal || 0),
        })),
        mechanic: o.mechanic ? { name: o.mechanic.name } : null,
        complaints: o.complaints || o.notes,
        diagnosis: o.diagnosis,
      })),
    };
  } else {
    customer = {
      id: session.customerId,
      name: session.customerName,
      phone: session.phone,
      vehicles: [
        {
          id: session.vehicleId,
          customerId: session.customerId,
          plateNumber: session.plateNumber,
          brand: session.brand,
          model: session.model,
          year: session.year ?? 2023,
          serviceOrders: [],
        },
      ],
      serviceOrders: [],
    };
  }

  // Pastikan array vehicles terisi
  if (!customer.vehicles || customer.vehicles.length === 0) {
    customer.vehicles = [
      {
        id: session.vehicleId,
        customerId: session.customerId,
        plateNumber: session.plateNumber,
        brand: session.brand,
        model: session.model,
        year: session.year ?? 2023,
        serviceOrders: [],
      },
    ];
  }

  // Lengkapi riwayat servis jika belum termuat
  if (!customer.serviceOrders || customer.serviceOrders.length === 0) {
    try {
      const orders = await db.serviceOrder.findMany();
      const customerOrders: PortalOrder[] = orders
        .filter(
          (o) => o.customerId === session.customerId || o.vehicle?.plateNumber === session.plateNumber
        )
        .map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          token: o.token,
          currentKm: o.currentKm,
          status: o.status,
          entryDate: o.entryDate,
          completedDate: o.completedDate,
          grandTotal: o.grandTotal,
          totalServices: o.totalServices,
          totalParts: o.totalParts,
          items: o.items.map((i) => ({
            id: i.id,
            serviceName: i.serviceName,
            qty: i.qty,
            price: i.price,
            subtotal: i.subtotal,
          })),
          parts: o.parts.map((p) => ({
            id: p.id,
            partName: p.partName,
            qty: p.qty,
            sellPrice: p.sellPrice,
            subtotal: p.subtotal,
          })),
          mechanic: o.mechanicId ? { name: "Mekanik PitCare" } : null,
          complaints: o.notes || "Servis berkala",
          diagnosis: null,
        }));

      customer.serviceOrders = customerOrders;
      for (const v of customer.vehicles) {
        v.serviceOrders = customerOrders;
      }
    } catch (e) {
      console.warn("Error fetching orders for portal:", e);
    }
  }

  // Pilih kendaraan yang sedang aktif (default yang ada di sesi)
  const activeVehicle =
    customer.vehicles.find((v) => v.id === session.vehicleId) || customer.vehicles[0];

  const vehicleOrders = activeVehicle?.serviceOrders || [];
  const latestOrder = vehicleOrders[0];
  const currentKm = latestOrder?.currentKm || 0;

  // === KALKULASI PREDICTIVE PART LIFESPAN TRACKER (USER-FRIENDLY) ===
  // 1. Oli Mesin (Interval: 3.000 KM)
  const oilInterval = 3000;
  const oilOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => p.partName.toLowerCase().includes("oli"))
  );
  const oilReplacedKm = oilOrder?.currentKm || 0;
  const oilKmElapsed = Math.max(0, currentKm - oilReplacedKm);
  const oilRemainingKm = Math.max(0, oilInterval - (oilOrder ? oilKmElapsed : currentKm % oilInterval));
  const oilPercentage = Math.min(100, Math.max(0, Math.round((oilRemainingKm / oilInterval) * 100)));
  const oilStatus =
    oilRemainingKm <= 0
      ? {
          label: "Waktunya Ganti Hari Ini",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          barColor: "bg-rose-500",
          iconBg: "bg-rose-50 text-rose-600 border border-rose-200/80",
          desc: "Sudah melewati batas kilometer aman. Disarankan segera ganti oli agar mesin tidak aus.",
        }
      : oilRemainingKm <= 500
      ? {
          label: "Perlu Diperiksa",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          barColor: "bg-amber-500",
          iconBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
          desc: `Tersisa ${oilRemainingKm.toLocaleString("id-ID")} KM lagi • Bersiap ganti oli dalam waktu dekat.`,
        }
      : {
          label: "Kondisi Prima (Aman)",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          barColor: "bg-emerald-500",
          iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
          desc: `Tersisa ${oilRemainingKm.toLocaleString("id-ID")} KM lagi • Kondisi pelumas masih prima & siap pakai harian.`,
        };

  // 2. Busi Pengapian (Interval: 8.000 KM)
  const sparkInterval = 8000;
  const sparkOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => p.partName.toLowerCase().includes("busi"))
  );
  const sparkReplacedKm = sparkOrder?.currentKm || 0;
  const sparkKmElapsed = Math.max(0, currentKm - sparkReplacedKm);
  const sparkRemainingKm = Math.max(0, sparkInterval - (sparkOrder ? sparkKmElapsed : currentKm % sparkInterval));
  const sparkPercentage = Math.min(100, Math.max(0, Math.round((sparkRemainingKm / sparkInterval) * 100)));
  const sparkStatus =
    sparkRemainingKm <= 0
      ? {
          label: "Waktunya Ganti Hari Ini",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          barColor: "bg-rose-500",
          iconBg: "bg-rose-50 text-rose-600 border border-rose-200/80",
          desc: "Busi sudah melewati batas masa pakai. Ganti baru untuk mencegah motor mogok atau sulit distarter.",
        }
      : sparkRemainingKm <= 1200
      ? {
          label: "Perlu Diperiksa",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          barColor: "bg-amber-500",
          iconBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
          desc: `Tersisa ${sparkRemainingKm.toLocaleString("id-ID")} KM lagi • Periksa kerenggangan elektroda busi saat servis.`,
        }
      : {
          label: "Kondisi Prima (Aman)",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          barColor: "bg-emerald-500",
          iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
          desc: `Tersisa ${sparkRemainingKm.toLocaleString("id-ID")} KM lagi • Percikan api busi sempurna, tarikan mesin enteng.`,
        };

  // 3. V-Belt / Sabuk CVT (Interval: 24.000 KM)
  const beltInterval = 24000;
  const beltOrder = vehicleOrders.find((o) =>
    o.parts.some((p) => {
      const n = p.partName.toLowerCase();
      return n.includes("belt") || n.includes("roller") || n.includes("rantai");
    })
  );
  const beltReplacedKm = beltOrder?.currentKm || 0;
  const beltKmElapsed = Math.max(0, currentKm - beltReplacedKm);
  const beltRemainingKm = Math.max(0, beltInterval - (beltOrder ? beltKmElapsed : currentKm % beltInterval));
  const beltPercentage = Math.min(100, Math.max(0, Math.round((beltRemainingKm / beltInterval) * 100)));
  const beltStatus =
    beltRemainingKm <= 0
      ? {
          label: "Waktunya Ganti Hari Ini",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          barColor: "bg-rose-500",
          iconBg: "bg-rose-50 text-rose-600 border border-rose-200/80",
          desc: "V-Belt sudah melewati 24.000 KM. Segera ganti sabuk baru agar tidak putus mendadak di jalan raya.",
        }
      : beltRemainingKm <= 3000
      ? {
          label: "Perlu Diperiksa",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          barColor: "bg-amber-500",
          iconBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
          desc: `Tersisa ${beltRemainingKm.toLocaleString("id-ID")} KM lagi • Periksa apakah ada retakan rambut pada sabuk CVT.`,
        }
      : {
          label: "Kondisi Prima (Aman)",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          barColor: "bg-emerald-500",
          iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
          desc: `Tersisa ${beltRemainingKm.toLocaleString("id-ID")} KM lagi • Rekomendasi servis berikutnya di KM ${(currentKm + beltRemainingKm).toLocaleString("id-ID")}.`,
        };

  // Pesan WhatsApp Booking / Konsultasi
  const waMessage = encodeURIComponent(
    `Halo PitCare Auto, saya ${customer.name}. Saya ingin konsultasi / booking jadwal servis untuk kendaraan saya (${activeVehicle?.brand} ${activeVehicle?.model} - ${activeVehicle?.plateNumber}). Mohon informasinya. Terima kasih!`
  );
  const waLink = `https://wa.me/6281234567890?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16 antialiased">
      {/* 1. Header Navbar Pelanggan (Linear Pure Light) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs tracking-wider shadow-xs">
            PA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">PitCare Auto</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                PORTAL PELANGGAN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Layanan Digital & Riwayat Perawatan Unit</p>
          </div>
        </div>

        <form action={logoutCustomerPortalAction}>
          <button
            type="submit"
            className="text-xs font-semibold text-slate-700 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar Sesi
          </button>
        </form>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 2. Banner Sambutan Pelanggan (Clean White Card) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sesi Pelanggan Terverifikasi
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Selamat Datang, <span>{customer.name}</span>!
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              WhatsApp: <span className="font-mono font-semibold text-slate-700">{customer.phone}</span> · Terdaftar memiliki{" "}
              <strong className="text-slate-800">{customer.vehicles.length} unit kendaraan</strong>
            </p>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.541 1.848.819 2.796.82h.005c3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.775-5.807zm3.374 8.212c-.143.402-.832.748-1.161.796-.328.049-.728.067-2.316-.583-1.631-.669-2.66-2.341-2.74-2.448-.08-.106-.653-.871-.653-1.663 0-.792.414-1.182.56-1.341.147-.159.32-.199.426-.199.107 0 .213.002.306.007.098.005.228-.037.356.27.133.32.453 1.107.493 1.187.04.08.067.173.013.28-.053.106-.08.172-.16.265-.08.093-.168.207-.24.278-.08.08-.163.167-.07.327.093.16.413.682.887 1.103.609.541 1.123.708 1.282.788.16.08.253.067.347-.04.093-.107.4-466.507-.626.107-.16.213-.133.36-.08.147.053.933.44 1.093.52.16.08.267.12.307.186.04.067.04.387-.103.789z" />
            </svg>
            Konsultasi / Booking via WhatsApp
          </a>
        </div>

        {/* 3. Kartu Pilihan Unit Kendaraan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Unit Kendaraan Saya
            </h3>
            <span className="text-xs text-slate-400">
              Pilih kendaraan untuk melihat estimasi kesehatan & riwayat servis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.vehicles.map((v) => {
              const isSelected = v.id === activeVehicle?.id;
              return (
                <div
                  key={v.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white tracking-wider">
                      {v.plateNumber}
                    </span>
                    {isSelected && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        ✓ Dipilih
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {v.brand} {v.model}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Tahun {v.year || "-"} · Total {v.serviceOrders.length} kali servis
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Kartu Kesehatan Suku Cadang Ramah Orang Awam (Predictive Lifespan Tracker) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Kartu Kesehatan Suku Cadang Motor
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimasi otomatis sisa masa pakai suku cadang unit{" "}
                <strong className="text-slate-800">{activeVehicle?.plateNumber}</strong> berdasarkan riwayat kilometer bengkel.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs shrink-0">
              <span className="text-slate-500 font-medium">Odometer Terakhir:</span>
              <span className="font-mono font-bold text-slate-900">
                {currentKm > 0 ? `${currentKm.toLocaleString("id-ID")} KM` : "Belum Ada Catatan KM"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Oli Mesin */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center font-bold text-sm shrink-0">
                    🛢️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Oli Mesin</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Interval: 3.000 KM</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${oilStatus.badge}`}>
                  {oilStatus.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sisa Jarak Tempuh:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {oilRemainingKm.toLocaleString("id-ID")} KM ({oilPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${oilStatus.barColor}`}
                    style={{ width: `${oilPercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {oilStatus.desc}
              </p>
            </div>

            {/* Card 2: Busi Pengapian */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center font-bold text-sm shrink-0">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Busi Pengapian</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Interval: 8.000 KM</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${sparkStatus.badge}`}>
                  {sparkStatus.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sisa Jarak Tempuh:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {sparkRemainingKm.toLocaleString("id-ID")} KM ({sparkPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${sparkStatus.barColor}`}
                    style={{ width: `${sparkPercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {sparkStatus.desc}
              </p>
            </div>

            {/* Card 3: V-Belt / Sabuk CVT */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center font-bold text-sm shrink-0">
                    🔄
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">V-Belt / Sabuk CVT</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Interval: 24.000 KM</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${beltStatus.badge}`}>
                  {beltStatus.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sisa Jarak Tempuh:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {beltRemainingKm.toLocaleString("id-ID")} KM ({beltPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${beltStatus.barColor}`}
                    style={{ width: `${beltPercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {beltStatus.desc}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Riwayat Servis Unit (Service History) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Riwayat Servis & Nota Transparan</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pengerjaan servis berkala beserta suku cadang yang dipasang pada kendaraan ini.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
              {vehicleOrders.length} Riwayat Servis
            </span>
          </div>

          {vehicleOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs font-semibold text-slate-700">Belum ada riwayat pengerjaan untuk kendaraan ini.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Kunjungi PitCare Auto untuk memulai servis pertama Anda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicleOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-colors space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatDate(order.entryDate)}
                      </span>
                      {order.currentKm && (
                        <span className="text-xs font-mono font-semibold text-slate-700">
                          · {order.currentKm.toLocaleString("id-ID")} KM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          order.status === "SELESAI_PEMBAYARAN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.status === "SELESAI_PENGERJAAN"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {order.status === "SELESAI_PEMBAYARAN"
                          ? "✓ Lunas / Selesai"
                          : order.status === "SELESAI_PENGERJAAN"
                          ? "Siap Diambil"
                          : "Sedang Dikerjakan"}
                      </span>

                      {order.token && (
                        <Link
                          href={`/track/${order.token}`}
                          target="_blank"
                          className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 ml-2"
                        >
                          Pelacakan Live ↗
                        </Link>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Keluhan / Catatan:</strong> {order.complaints || "-"}
                  </p>

                  {/* Rincian Jasa & Spareparts */}
                  <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1.5">
                        Tindakan Jasa Servis ({order.items.length})
                      </p>
                      {order.items.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Tidak ada rincian jasa</p>
                      ) : (
                        <ul className="space-y-1">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between text-slate-700 text-[11px]">
                              <span>• {item.serviceName}</span>
                              <span className="font-mono text-slate-900 font-semibold">{formatRupiah(Number(item.subtotal))}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1.5">
                        Suku Cadang Terpasang ({order.parts.length})
                      </p>
                      {order.parts.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Tidak ada pergantian part</p>
                      ) : (
                        <ul className="space-y-1">
                          {order.parts.map((part) => (
                            <li key={part.id} className="flex justify-between text-slate-700 text-[11px]">
                              <span>• {part.partName} (x{part.qty})</span>
                              <span className="font-mono text-slate-900 font-semibold">{formatRupiah(Number(part.subtotal))}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Mekanik: <strong className="text-slate-800">{order.mechanic?.name || "Mekanik PitCare"}</strong>
                    </span>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 mr-2">Total Biaya:</span>
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {formatRupiah(Number(order.grandTotal))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
