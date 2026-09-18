import {
  Customer,
  Vehicle,
  ServicesCatalog,
  PartsInventory,
  ServiceOrder,
  ServiceOrderItem,
  ServiceOrderPart,
  ServiceStatus,
  PaymentMethod,
  PaymentStatus,
} from "./types/database";
import { prisma } from "./prisma";

// Periksa apakah koneksi PostgreSQL nyata telah diisi
const isRealDatabase = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("your-project") &&
  !process.env.DATABASE_URL.includes("your-password")
);

// Mappers Prisma Decimal -> Number & Safe Interface Types
function mapPrismaCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address ?? null,
    notes: c.notes ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    vehicles: (c.vehicles || []).map((v: any) => ({
      id: v.id,
      customerId: v.customerId,
      plateNumber: v.plateNumber,
      brand: v.brand,
      model: v.model,
      year: v.year ?? null,
      engineNo: v.engineNo ?? null,
      frameNo: v.frameNo ?? null,
      notes: v.notes ?? null,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    })),
  };
}

function mapPrismaService(s: any): ServicesCatalog {
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    description: s.description ?? null,
    duration: s.duration ?? null,
    price: Number(s.price),
    isActive: s.isActive ?? true,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function mapPrismaPart(p: any): PartsInventory {
  const stock = p.stock ?? 0;
  const minStock = p.minStock ?? 5;
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category ?? "Lain-lain",
    stock,
    minStock,
    costPrice: Number(p.costPrice),
    sellPrice: Number(p.sellPrice),
    unit: p.unit ?? "PCS",
    location: p.location ?? null,
    isLowStock: stock <= minStock,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function mapPrismaOrder(o: any): ServiceOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    token: o.token,
    customerId: o.customerId,
    customer: o.customer ? mapPrismaCustomer(o.customer) : undefined,
    vehicleId: o.vehicleId,
    vehicle: o.vehicle
      ? {
          id: o.vehicle.id,
          customerId: o.vehicle.customerId,
          plateNumber: o.vehicle.plateNumber,
          brand: o.vehicle.brand,
          model: o.vehicle.model,
          year: o.vehicle.year ?? null,
          engineNo: o.vehicle.engineNo ?? null,
          frameNo: o.vehicle.frameNo ?? null,
          notes: o.vehicle.notes ?? null,
          createdAt: o.vehicle.createdAt,
          updatedAt: o.vehicle.updatedAt,
        }
      : undefined,
    mechanicId: o.mechanicId ?? null,
    mechanicName: o.mechanic?.name ?? null,
    createdById: o.createdById ?? null,
    currentKm: o.currentKm ?? null,
    complaints: o.complaints,
    diagnosis: o.diagnosis ?? null,
    status: o.status as ServiceStatus,
    paymentStatus: o.paymentStatus as PaymentStatus,
    paymentMethod: (o.paymentMethod as PaymentMethod) ?? null,
    totalServices: Number(o.totalServices),
    totalParts: Number(o.totalParts),
    discount: Number(o.discount),
    grandTotal: Number(o.grandTotal),
    paidAmount: Number(o.paidAmount),
    changeAmount: Number(o.changeAmount),
    notes: o.notes ?? null,
    entryDate: o.entryDate,
    completedDate: o.completedDate ?? null,
    paidDate: o.paymentStatus === "PAID" ? (o.completedDate || o.updatedAt) : null,
    items: (o.items || []).map((item: any) => ({
      id: item.id,
      orderId: item.orderId,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      price: Number(item.price),
      qty: item.qty,
      subtotal: Number(item.subtotal),
    })),
    parts: (o.parts || []).map((partItem: any) => ({
      id: partItem.id,
      orderId: partItem.orderId,
      partId: partItem.partId,
      partName: partItem.partName,
      costPrice: Number(partItem.costPrice),
      sellPrice: Number(partItem.sellPrice),
      qty: partItem.qty,
      subtotal: Number(partItem.subtotal),
    })),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const memoryCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Budi Gunawan",
    phone: "081234567890",
    address: "Jl. Fatmawati No. 12, Cilandak, Jakarta Selatan",
    notes: "Pelanggan rutin servis bulanan motor matic.",
    createdAt: new Date(),
    vehicles: [
      {
        id: "veh-1",
        customerId: "cust-1",
        plateNumber: "B 4321 KAZ",
        brand: "Honda",
        model: "Vario 160",
        year: 2022,
        notes: "Ganti oli rutin tiap 2.000 KM.",
      },
    ],
  },
  {
    id: "cust-2",
    name: "Maya Indah",
    phone: "082198765432",
    address: "Apartemen Mediterania Garden, Jakarta Barat",
    notes: "Sering minta cek getaran CVT.",
    createdAt: new Date(),
    vehicles: [
      {
        id: "veh-2",
        customerId: "cust-2",
        plateNumber: "B 6543 TGB",
        brand: "Yamaha",
        model: "NMAX 155 Connected",
        year: 2021,
        notes: "Pakai oli Shell Advance AX7.",
      },
    ],
  },
  {
    id: "cust-3",
    name: "Hendra Wijaya",
    phone: "085611223344",
    address: "Cluster Graha Raya Bintaro, Tangerang Selatan",
    notes: "Memiliki 2 kendaraan: motor harian dan mobil keluarga.",
    createdAt: new Date(),
    vehicles: [
      {
        id: "veh-3",
        customerId: "cust-3",
        plateNumber: "B 3123 POI",
        brand: "Honda",
        model: "Beat FI ESP",
        year: 2020,
        notes: "Motor operasional kerja harian.",
      },
      {
        id: "veh-4",
        customerId: "cust-3",
        plateNumber: "B 1982 SIF",
        brand: "Toyota",
        model: "Avanza 1.3G MT",
        year: 2019,
        notes: "Mobil keluarga, servis berkala tiap 6 bulan.",
      },
    ],
  },
  {
    id: "cust-4",
    name: "Rina Kurnia",
    phone: "087855667788",
    address: "Jl. Margonda Raya No. 88, Depok",
    notes: "Mahasiswi, kendaraan sering dipakai jarak jauh.",
    createdAt: new Date(),
    vehicles: [
      {
        id: "veh-5",
        customerId: "cust-4",
        plateNumber: "B 5432 ZZZ",
        brand: "Yamaha",
        model: "Aerox 155",
        year: 2023,
        notes: "Kondisi sangat mulus, servis berkala tepat waktu.",
      },
    ],
  },
  {
    id: "cust-5",
    name: "Agus Prabowo",
    phone: "081399887766",
    address: "Perum Harapan Indah Blok CC, Bekasi",
    notes: "Pelanggan baru rekomendasi rekan kantor.",
    createdAt: new Date(),
    vehicles: [
      {
        id: "veh-6",
        customerId: "cust-5",
        plateNumber: "B 7890 KLC",
        brand: "Honda",
        model: "Scoopy Prestige",
        year: 2022,
        notes: "Keluhan rem depan bunyi mendecit.",
      },
      {
        id: "veh-7",
        customerId: "cust-5",
        plateNumber: "B 2341 UYT",
        brand: "Daihatsu",
        model: "Xenia 1.5 Deluxe",
        year: 2018,
        notes: "Mobil operasional usaha katering.",
      },
    ],
  },
];

const memoryServices: ServicesCatalog[] = [
  {
    id: "srv-1",
    code: "SRV-001",
    name: "Ganti Oli Mesin",
    description: "Jasa pembuangan oli bekas, pembersihan baut pembuangan, dan pengisian oli baru.",
    duration: 15,
    price: 25000,
    isActive: true,
  },
  {
    id: "srv-2",
    code: "SRV-002",
    name: "Ganti Oli Gardan / Transmisi",
    description: "Penggantian pelumas gearbox roda belakang motor matic.",
    duration: 10,
    price: 15000,
    isActive: true,
  },
  {
    id: "srv-3",
    code: "SRV-003",
    name: "Tune Up Injeksi Motor",
    description: "Pembersihan ruang bakar, setel klep, cek busi, scanner ECU, dan uji putaran stasioner.",
    duration: 45,
    price: 85000,
    isActive: true,
  },
  {
    id: "srv-4",
    code: "SRV-004",
    name: "Servis CVT Lengkap & Pembersihan",
    description: "Bongkar puli depan-belakang, cuci mangkok kopling, amplas kampas ganda, dan pelumasan grease tahan panas.",
    duration: 40,
    price: 65000,
    isActive: true,
  },
  {
    id: "srv-5",
    code: "SRV-005",
    name: "Ganti Kampas Rem Depan / Belakang",
    description: "Pelepasan kaliper, pembersihan piston rem, pemasangan kampas baru, dan bleeding minyak rem.",
    duration: 25,
    price: 30000,
    isActive: true,
  },
  {
    id: "srv-6",
    code: "SRV-006",
    name: "Kuras & Ganti Air Radiator",
    description: "Flushing jalur pendingin mesin dan pengisian air radiator coolant baru.",
    duration: 20,
    price: 35000,
    isActive: true,
  },
  {
    id: "srv-7",
    code: "SRV-007",
    name: "Pembersihan Throttle Body (TB)",
    description: "Pembersihan kerak karbon sensor IACV/TP throttle body motor injeksi.",
    duration: 30,
    price: 50000,
    isActive: true,
  },
  {
    id: "srv-8",
    code: "SRV-008",
    name: "Tune Up & Spooring Mobil Ringan",
    description: "Pemeriksaan 24 titik mobil, pembersihan filter udara, cek busi, dan kelarasan roda.",
    duration: 60,
    price: 200000,
    isActive: true,
  },
];

const memoryParts: PartsInventory[] = [
  {
    id: "part-1",
    sku: "OIL-MPX2-800",
    name: "Oli AHM MPX2 0.8L (Matic)",
    category: "Oli & Pelumas",
    stock: 28,
    minStock: 10,
    costPrice: 46000,
    sellPrice: 58000,
    unit: "BOTOL",
    location: "Rak A1",
  },
  {
    id: "part-2",
    sku: "OIL-YAMA-800",
    name: "Oli Mesin Yamalube Matic 0.8L",
    category: "Oli & Pelumas",
    stock: 18,
    minStock: 8,
    costPrice: 44000,
    sellPrice: 56000,
    unit: "BOTOL",
    location: "Rak A1",
  },
  {
    id: "part-3",
    sku: "OIL-SHELL-AX7",
    name: "Oli Shell Advance AX7 Scooter 0.8L",
    category: "Oli & Pelumas",
    stock: 12,
    minStock: 5,
    costPrice: 52000,
    sellPrice: 65000,
    unit: "BOTOL",
    location: "Rak A2",
  },
  {
    id: "part-4",
    sku: "OIL-GRD-120",
    name: "Oli Gardan AHM Gear Oil 120ml",
    category: "Oli & Pelumas",
    stock: 35,
    minStock: 10,
    costPrice: 13000,
    sellPrice: 18000,
    unit: "TUBE",
    location: "Rak A3",
  },
  {
    id: "part-5",
    sku: "SPK-CPR9EA",
    name: "Busi NGK CPR9EA-9 Nickel",
    category: "Pengapian",
    stock: 3, // LOW STOCK (minStock: 5)
    minStock: 5,
    costPrice: 18000,
    sellPrice: 28000,
    unit: "PCS",
    location: "Laci B1",
  },
  {
    id: "part-6",
    sku: "BRK-PAD-VR160",
    name: "Kampas Rem Cakram Depan Vario 160",
    category: "Pengereman",
    stock: 2, // LOW STOCK (minStock: 5)
    minStock: 5,
    costPrice: 34000,
    sellPrice: 49000,
    unit: "SET",
    location: "Laci B2",
  },
  {
    id: "part-7",
    sku: "BRK-SHOE-HND",
    name: "Kampas Rem Tromol Belakang Honda Matic",
    category: "Pengereman",
    stock: 9,
    minStock: 4,
    costPrice: 28000,
    sellPrice: 42000,
    unit: "SET",
    location: "Laci B2",
  },
  {
    id: "part-8",
    sku: "VBLT-NMAX-KIT",
    name: "V-Belt & Roller Kit Yamaha NMAX 155",
    category: "Penggerak CVT",
    stock: 1, // LOW STOCK (minStock: 3)
    minStock: 3,
    costPrice: 145000,
    sellPrice: 195000,
    unit: "SET",
    location: "Rak C1",
  },
  {
    id: "part-9",
    sku: "FLT-AIR-BEAT",
    name: "Filter Udara Honda Beat FI ESP",
    category: "Filter",
    stock: 6,
    minStock: 5,
    costPrice: 38000,
    sellPrice: 52000,
    unit: "PCS",
    location: "Rak C2",
  },
  {
    id: "part-10",
    sku: "RAD-COOL-1L",
    name: "Air Radiator Coolant Prestone 1L",
    category: "Pendingin",
    stock: 14,
    minStock: 6,
    costPrice: 26000,
    sellPrice: 38000,
    unit: "BOTOL",
    location: "Rak D1",
  },
];

const memoryServiceOrders: ServiceOrder[] = [
  {
    id: "ord-1",
    orderNumber: "WO-202609-0001",
    token: "trk-vario160-budi",
    customerId: "cust-1",
    vehicleId: "veh-1",
    mechanicId: "usr-3",
    mechanicName: "Budi Santoso",
    currentKm: 12400,
    complaints: "Servis rutin berkala dan ganti oli mesin. Tarikan awal terasa agak gredek saat macet.",
    diagnosis: null,
    status: "ANTRIAN",
    paymentStatus: "PENDING",
    paymentMethod: null,
    totalServices: 25000,
    totalParts: 58000,
    discount: 0,
    grandTotal: 83000,
    paidAmount: 0,
    changeAmount: 0,
    notes: "Pelanggan menunggu di ruang tunggu bengkel.",
    entryDate: new Date(Date.now() - 45 * 60 * 1000),
    items: [
      {
        id: "item-1-1",
        orderId: "ord-1",
        serviceId: "srv-1",
        serviceName: "Ganti Oli Mesin",
        price: 25000,
        qty: 1,
        subtotal: 25000,
      },
    ],
    parts: [
      {
        id: "part-1-1",
        orderId: "ord-1",
        partId: "part-1",
        partName: "Oli AHM MPX2 0.8L (Matic)",
        costPrice: 46000,
        sellPrice: 58000,
        qty: 1,
        subtotal: 58000,
      },
    ],
  },
  {
    id: "ord-2",
    orderNumber: "WO-202609-0002",
    token: "trk-nmax-maya",
    customerId: "cust-2",
    vehicleId: "veh-2",
    mechanicId: "usr-3",
    mechanicName: "Budi Santoso",
    currentKm: 18250,
    complaints: "Getar keras di bagian CVT saat rpm rendah (kecepatan 20-30 km/jam). Rem belakang kurang pakem.",
    diagnosis: "Roller aus dan puli CVT kotor tertutup serbuk kampas ganda. Kampas rem belakang sudah tipis.",
    status: "PENGERJAAN",
    paymentStatus: "PENDING",
    paymentMethod: null,
    totalServices: 95000,
    totalParts: 237000,
    discount: 0,
    grandTotal: 332000,
    paidAmount: 0,
    changeAmount: 0,
    notes: "Unit ditinggal, konfirmasi via WhatsApp jika pengerjaan selesai.",
    entryDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    items: [
      {
        id: "item-2-1",
        orderId: "ord-2",
        serviceId: "srv-4",
        serviceName: "Servis CVT Lengkap & Pembersihan",
        price: 65000,
        qty: 1,
        subtotal: 65000,
      },
      {
        id: "item-2-2",
        orderId: "ord-2",
        serviceId: "srv-5",
        serviceName: "Ganti Kampas Rem Depan / Belakang",
        price: 30000,
        qty: 1,
        subtotal: 30000,
      },
    ],
    parts: [
      {
        id: "part-2-1",
        orderId: "ord-2",
        partId: "part-8",
        partName: "V-Belt & Roller Kit Yamaha NMAX 155",
        costPrice: 145000,
        sellPrice: 195000,
        qty: 1,
        subtotal: 195000,
      },
      {
        id: "part-2-2",
        orderId: "ord-2",
        partId: "part-7",
        partName: "Kampas Rem Tromol Belakang Honda Matic",
        costPrice: 28000,
        sellPrice: 42000,
        qty: 1,
        subtotal: 42000,
      },
    ],
  },
  {
    id: "ord-3",
    orderNumber: "WO-202609-0003",
    token: "trk-beat-hendra",
    customerId: "cust-3",
    vehicleId: "veh-3",
    mechanicId: "usr-3",
    mechanicName: "Budi Santoso",
    currentKm: 24100,
    complaints: "Mesin sulit di-starter di pagi hari, tenaga ngempos saat menanjak curam.",
    diagnosis: "Elektroda busi aus renggang dan filter udara kotor tersumbat debu. Telah dilakukan tune up injeksi, reset ECU, dan ganti oli.",
    status: "SELESAI_PENGERJAAN",
    paymentStatus: "PENDING",
    paymentMethod: null,
    totalServices: 110000,
    totalParts: 138000,
    discount: 10000,
    grandTotal: 238000,
    paidAmount: 0,
    changeAmount: 0,
    notes: "Pengerjaan selesai diuji coba dan siap dipanggil ke meja kasir.",
    entryDate: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
    completedDate: new Date(Date.now() - 15 * 60 * 1000),
    items: [
      {
        id: "item-3-1",
        orderId: "ord-3",
        serviceId: "srv-3",
        serviceName: "Tune Up Injeksi Motor",
        price: 85000,
        qty: 1,
        subtotal: 85000,
      },
      {
        id: "item-3-2",
        orderId: "ord-3",
        serviceId: "srv-1",
        serviceName: "Ganti Oli Mesin",
        price: 25000,
        qty: 1,
        subtotal: 25000,
      },
    ],
    parts: [
      {
        id: "part-3-1",
        orderId: "ord-3",
        partId: "part-1",
        partName: "Oli AHM MPX2 0.8L (Matic)",
        costPrice: 46000,
        sellPrice: 58000,
        qty: 1,
        subtotal: 58000,
      },
      {
        id: "part-3-2",
        orderId: "ord-3",
        partId: "part-5",
        partName: "Busi NGK CPR9EA-9 Nickel",
        costPrice: 18000,
        sellPrice: 28000,
        qty: 1,
        subtotal: 28000,
      },
      {
        id: "part-3-3",
        orderId: "ord-3",
        partId: "part-9",
        partName: "Filter Udara Honda Beat FI ESP",
        costPrice: 38000,
        sellPrice: 52000,
        qty: 1,
        subtotal: 52000,
      },
    ],
  },
  {
    id: "ord-4",
    orderNumber: "WO-202609-0004",
    token: "trk-scoopy-agus",
    customerId: "cust-5",
    vehicleId: "veh-6",
    mechanicId: "usr-3",
    mechanicName: "Budi Santoso",
    currentKm: 8900,
    complaints: "Ganti oli mesin dan oli transmisi gardan rutin bulanan.",
    diagnosis: "Kondisi mesin prima, pelumas transmisi diganti bersih.",
    status: "SELESAI_PEMBAYARAN",
    paymentStatus: "PAID",
    paymentMethod: "CASH",
    totalServices: 40000,
    totalParts: 76000,
    discount: 0,
    grandTotal: 116000,
    paidAmount: 120000,
    changeAmount: 4000,
    notes: "Pembayaran lunas via Kasir (Tunai). Struk telah diserahkan.",
    entryDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
    completedDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
    paidDate: new Date(Date.now() - 4 * 60 * 60 * 1000 + 10 * 60 * 1000),
    items: [
      {
        id: "item-4-1",
        orderId: "ord-4",
        serviceId: "srv-1",
        serviceName: "Ganti Oli Mesin",
        price: 25000,
        qty: 1,
        subtotal: 25000,
      },
      {
        id: "item-4-2",
        orderId: "ord-4",
        serviceId: "srv-2",
        serviceName: "Ganti Oli Gardan / Transmisi",
        price: 15000,
        qty: 1,
        subtotal: 15000,
      },
    ],
    parts: [
      {
        id: "part-4-1",
        orderId: "ord-4",
        partId: "part-1",
        partName: "Oli AHM MPX2 0.8L (Matic)",
        costPrice: 46000,
        sellPrice: 58000,
        qty: 1,
        subtotal: 58000,
      },
      {
        id: "part-4-2",
        orderId: "ord-4",
        partId: "part-4",
        partName: "Oli Gardan AHM Gear Oil 120ml",
        costPrice: 13000,
        sellPrice: 18000,
        qty: 1,
        subtotal: 18000,
      },
    ],
  },
];

// Helper database abstraction layer yang tangguh (Resilient Hybrid Layer)
export const db = {
  // === CUSTOMERS & VEHICLES ===
  customer: {
    async findMany(query?: string): Promise<Customer[]> {
      if (isRealDatabase) {
        try {
          const rows = await prisma.customer.findMany({
            include: {
              vehicles: {
                orderBy: { createdAt: "desc" },
              },
            },
            where: query && query.trim()
              ? {
                  OR: [
                    { name: { contains: query.trim(), mode: "insensitive" } },
                    { phone: { contains: query.trim(), mode: "insensitive" } },
                    { address: { contains: query.trim(), mode: "insensitive" } },
                    {
                      vehicles: {
                        some: {
                          OR: [
                            { plateNumber: { contains: query.trim(), mode: "insensitive" } },
                            { model: { contains: query.trim(), mode: "insensitive" } },
                            { brand: { contains: query.trim(), mode: "insensitive" } },
                          ],
                        },
                      },
                    },
                  ],
                }
              : undefined,
            orderBy: { createdAt: "desc" },
          });
          if (rows.length > 0) {
            return rows.map(mapPrismaCustomer);
          }
        } catch (err) {
          console.error("Error prisma.customer.findMany:", err);
          // fallback to in-memory store
        }
      }
      let results = [...memoryCustomers];
      if (query && query.trim()) {
        const q = query.toLowerCase().trim();
        results = results.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.vehicles.some((v) => v.plateNumber.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)),
        );
      }
      return results;
    },

    async create(data: {
      name: string;
      phone: string;
      address?: string;
      notes?: string;
      initialVehicle?: {
        plateNumber: string;
        brand: string;
        model: string;
        year?: number;
      };
    }): Promise<Customer> {
      if (isRealDatabase) {
        try {
          const created = await prisma.customer.create({
            data: {
              name: data.name.trim(),
              phone: data.phone.trim(),
              address: data.address?.trim() || null,
              notes: data.notes?.trim() || null,
              vehicles: data.initialVehicle?.plateNumber
                ? {
                    create: [
                      {
                        plateNumber: data.initialVehicle.plateNumber.toUpperCase().trim(),
                        brand: data.initialVehicle.brand.trim(),
                        model: data.initialVehicle.model.trim(),
                        year: data.initialVehicle.year || new Date().getFullYear(),
                      },
                    ],
                  }
                : undefined,
            },
            include: {
              vehicles: true,
            },
          });

          const mapped = mapPrismaCustomer(created);
          memoryCustomers.unshift(mapped);
          return mapped;
        } catch (err) {
          console.error("Error prisma.customer.create:", err);
        }
      }

      // Fallback in-memory
      const newCustId = `cust-${Date.now()}`;
      const newVehicles: Vehicle[] = [];

      if (data.initialVehicle?.plateNumber) {
        newVehicles.push({
          id: `veh-${Date.now()}`,
          customerId: newCustId,
          plateNumber: data.initialVehicle.plateNumber.toUpperCase().trim(),
          brand: data.initialVehicle.brand.trim(),
          model: data.initialVehicle.model.trim(),
          year: data.initialVehicle.year || new Date().getFullYear(),
        });
      }

      const newCustomer: Customer = {
        id: newCustId,
        name: data.name.trim(),
        phone: data.phone.trim(),
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        createdAt: new Date(),
        vehicles: newVehicles,
      };

      memoryCustomers.unshift(newCustomer);
      return newCustomer;
    },

    async delete(id: string): Promise<boolean> {
      if (isRealDatabase) {
        try {
          // Bersihkan relasi order terlebih dahulu jika ada agar terhindar dari FK error
          await prisma.serviceOrderItem.deleteMany({
            where: { order: { customerId: id } },
          });
          await prisma.serviceOrderPart.deleteMany({
            where: { order: { customerId: id } },
          });
          await prisma.serviceOrder.deleteMany({
            where: { customerId: id },
          });
          await prisma.customer.delete({
            where: { id },
          });
          const index = memoryCustomers.findIndex((c) => c.id === id);
          if (index !== -1) {
            memoryCustomers.splice(index, 1);
          }
          return true;
        } catch (err) {
          console.error("Error prisma.customer.delete:", err);
        }
      }

      const index = memoryCustomers.findIndex((c) => c.id === id);
      if (index !== -1) {
        memoryCustomers.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  vehicle: {
    async add(customerId: string, data: {
      plateNumber: string;
      brand: string;
      model: string;
      year?: number;
      notes?: string;
    }): Promise<Vehicle | null> {
      if (isRealDatabase) {
        try {
          const created = await prisma.vehicle.create({
            data: {
              customerId,
              plateNumber: data.plateNumber.toUpperCase().trim(),
              brand: data.brand.trim(),
              model: data.model.trim(),
              year: data.year || null,
              notes: data.notes?.trim() || null,
            },
          });

          const mapped: Vehicle = {
            id: created.id,
            customerId: created.customerId,
            plateNumber: created.plateNumber,
            brand: created.brand,
            model: created.model,
            year: created.year ?? null,
            engineNo: created.engineNo ?? null,
            frameNo: created.frameNo ?? null,
            notes: created.notes ?? null,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          };

          const cust = memoryCustomers.find((c) => c.id === customerId);
          if (cust) {
            cust.vehicles.push(mapped);
          }
          return mapped;
        } catch (err) {
          console.error("Error prisma.vehicle.create:", err);
        }
      }

      const customer = memoryCustomers.find((c) => c.id === customerId);
      if (!customer) return null;

      const newVehicle: Vehicle = {
        id: `veh-${Date.now()}`,
        customerId,
        plateNumber: data.plateNumber.toUpperCase().trim(),
        brand: data.brand.trim(),
        model: data.model.trim(),
        year: data.year || null,
        notes: data.notes?.trim() || null,
      };

      customer.vehicles.push(newVehicle);
      return newVehicle;
    },
  },

  // === SERVICES CATALOG ===
  servicesCatalog: {
    async findMany(query?: string): Promise<ServicesCatalog[]> {
      if (isRealDatabase) {
        try {
          const rows = await prisma.servicesCatalog.findMany({
            where: query && query.trim()
              ? {
                  OR: [
                    { name: { contains: query.trim(), mode: "insensitive" } },
                    { code: { contains: query.trim(), mode: "insensitive" } },
                    { description: { contains: query.trim(), mode: "insensitive" } },
                  ],
                }
              : undefined,
            orderBy: { createdAt: "desc" },
          });
          if (rows.length > 0) {
            return rows.map(mapPrismaService);
          }
        } catch (err) {
          console.error("Error prisma.servicesCatalog.findMany:", err);
        }
      }

      let results = [...memoryServices];
      if (query && query.trim()) {
        const q = query.toLowerCase().trim();
        results = results.filter(
          (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
        );
      }
      return results;
    },

    async create(data: {
      code: string;
      name: string;
      description?: string;
      duration?: number;
      price: number;
    }): Promise<ServicesCatalog> {
      if (isRealDatabase) {
        try {
          const created = await prisma.servicesCatalog.create({
            data: {
              code: data.code.toUpperCase().trim(),
              name: data.name.trim(),
              description: data.description?.trim() || null,
              duration: data.duration || 30,
              price: data.price,
              isActive: true,
            },
          });

          const mapped = mapPrismaService(created);
          memoryServices.unshift(mapped);
          return mapped;
        } catch (err) {
          console.error("Error prisma.servicesCatalog.create:", err);
        }
      }

      const newService: ServicesCatalog = {
        id: `srv-${Date.now()}`,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        duration: data.duration || 30,
        price: data.price,
        isActive: true,
        createdAt: new Date(),
      };

      memoryServices.unshift(newService);
      return newService;
    },

    async delete(id: string): Promise<boolean> {
      if (isRealDatabase) {
        try {
          await prisma.serviceOrderItem.deleteMany({
            where: { serviceId: id },
          });
          await prisma.servicesCatalog.delete({
            where: { id },
          });
          const index = memoryServices.findIndex((s) => s.id === id);
          if (index !== -1) memoryServices.splice(index, 1);
          return true;
        } catch (err) {
          console.error("Error prisma.servicesCatalog.delete:", err);
        }
      }

      const index = memoryServices.findIndex((s) => s.id === id);
      if (index !== -1) {
        memoryServices.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  // === PARTS INVENTORY ===
  partsInventory: {
    async findMany(query?: string, category?: string): Promise<PartsInventory[]> {
      if (isRealDatabase) {
        try {
          const where: any = {};
          if (query && query.trim()) {
            where.OR = [
              { name: { contains: query.trim(), mode: "insensitive" } },
              { sku: { contains: query.trim(), mode: "insensitive" } },
              { category: { contains: query.trim(), mode: "insensitive" } },
            ];
          }
          if (category && category !== "all") {
            where.category = category;
          }

          const rows = await prisma.partsInventory.findMany({
            where: Object.keys(where).length > 0 ? where : undefined,
            orderBy: { createdAt: "desc" },
          });

          if (rows.length > 0) {
            return rows.map(mapPrismaPart);
          }
        } catch (err) {
          console.error("Error prisma.partsInventory.findMany:", err);
        }
      }

      let results = memoryParts.map((part) => ({
        ...part,
        isLowStock: part.stock <= part.minStock,
      }));

      if (query && query.trim()) {
        const q = query.toLowerCase().trim();
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.category && p.category.toLowerCase().includes(q)),
        );
      }

      if (category && category !== "all") {
        results = results.filter((p) => p.category === category);
      }

      return results;
    },

    async create(data: {
      sku: string;
      name: string;
      category?: string;
      stock: number;
      minStock: number;
      costPrice: number;
      sellPrice: number;
      unit: string;
      location?: string;
    }): Promise<PartsInventory> {
      if (isRealDatabase) {
        try {
          const created = await prisma.partsInventory.create({
            data: {
              sku: data.sku.toUpperCase().trim(),
              name: data.name.trim(),
              category: data.category?.trim() || "Lain-lain",
              stock: data.stock,
              minStock: data.minStock,
              costPrice: data.costPrice,
              sellPrice: data.sellPrice,
              unit: data.unit || "PCS",
              location: data.location?.trim() || null,
            },
          });

          const mapped = mapPrismaPart(created);
          memoryParts.unshift(mapped);
          return mapped;
        } catch (err) {
          console.error("Error prisma.partsInventory.create:", err);
        }
      }

      const newPart: PartsInventory = {
        id: `part-${Date.now()}`,
        sku: data.sku.toUpperCase().trim(),
        name: data.name.trim(),
        category: data.category?.trim() || "Lain-lain",
        stock: data.stock,
        minStock: data.minStock,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        unit: data.unit || "PCS",
        location: data.location?.trim() || null,
        isLowStock: data.stock <= data.minStock,
        createdAt: new Date(),
      };

      memoryParts.unshift(newPart);
      return newPart;
    },

    async updateStock(id: string, newStock: number): Promise<PartsInventory | null> {
      if (isRealDatabase) {
        try {
          const updated = await prisma.partsInventory.update({
            where: { id },
            data: { stock: newStock },
          });

          const mapped = mapPrismaPart(updated);
          const mem = memoryParts.find((p) => p.id === id);
          if (mem) {
            mem.stock = newStock;
            mem.isLowStock = newStock <= mem.minStock;
          }

          return mapped;
        } catch (err) {
          console.error("Error prisma.partsInventory.updateStock:", err);
        }
      }

      const part = memoryParts.find((p) => p.id === id);
      if (!part) return null;
      part.stock = newStock;
      return {
        ...part,
        isLowStock: part.stock <= part.minStock,
      };
    },

    async delete(id: string): Promise<boolean> {
      if (isRealDatabase) {
        try {
          await prisma.serviceOrderPart.deleteMany({
            where: { partId: id },
          });
          await prisma.partsInventory.delete({
            where: { id },
          });
          const index = memoryParts.findIndex((p) => p.id === id);
          if (index !== -1) memoryParts.splice(index, 1);
          return true;
        } catch (err) {
          console.error("Error prisma.partsInventory.delete:", err);
        }
      }

      const index = memoryParts.findIndex((p) => p.id === id);
      if (index !== -1) {
        memoryParts.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  // === SERVICE ORDERS (WORK ORDERS & BILLING) ===
  serviceOrder: {
    async findMany(filters?: { status?: string; query?: string }): Promise<ServiceOrder[]> {
      if (isRealDatabase) {
        try {
          const dbOrders = await prisma.serviceOrder.findMany({
            include: {
              customer: { include: { vehicles: true } },
              vehicle: true,
              mechanic: true,
              items: true,
              parts: true,
            },
            where: filters?.status && filters.status !== "ALL"
              ? { status: filters.status as any }
              : undefined,
            orderBy: { entryDate: "desc" },
          });

          if (dbOrders.length > 0) {
            let mapped = dbOrders.map(mapPrismaOrder);
            if (filters?.query && filters.query.trim()) {
              const q = filters.query.toLowerCase().trim();
              mapped = mapped.filter(
                (o) =>
                  o.orderNumber.toLowerCase().includes(q) ||
                  o.customer?.name.toLowerCase().includes(q) ||
                  o.customer?.phone.toLowerCase().includes(q) ||
                  o.vehicle?.plateNumber.toLowerCase().includes(q) ||
                  o.vehicle?.model.toLowerCase().includes(q)
              );
            }
            return mapped;
          }
        } catch (err) {
          console.error("Error prisma.serviceOrder.findMany:", err);
        }
      }

      let results = memoryServiceOrders.map((order) => {
        const customer = memoryCustomers.find((c) => c.id === order.customerId);
        const vehicle = customer?.vehicles.find((v) => v.id === order.vehicleId);
        return {
          ...order,
          customer,
          vehicle,
        };
      });

      if (filters?.status && filters.status !== "ALL") {
        results = results.filter((o) => o.status === filters.status);
      }

      if (filters?.query && filters.query.trim()) {
        const q = filters.query.toLowerCase().trim();
        results = results.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer?.name.toLowerCase().includes(q) ||
            o.customer?.phone.toLowerCase().includes(q) ||
            o.vehicle?.plateNumber.toLowerCase().includes(q) ||
            o.vehicle?.model.toLowerCase().includes(q)
        );
      }

      return results.sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime());
    },

    async findById(id: string): Promise<ServiceOrder | null> {
      if (isRealDatabase) {
        try {
          const order = await prisma.serviceOrder.findFirst({
            where: {
              OR: [{ id }, { orderNumber: id }, { token: id }],
            },
            include: {
              customer: { include: { vehicles: true } },
              vehicle: true,
              mechanic: true,
              items: true,
              parts: true,
            },
          });
          if (order) {
            return mapPrismaOrder(order);
          }
        } catch (err) {
          console.error("Error prisma.serviceOrder.findById:", err);
        }
      }

      const order = memoryServiceOrders.find((o) => o.id === id || o.orderNumber === id || o.token === id);
      if (!order) return null;
      const customer = memoryCustomers.find((c) => c.id === order.customerId);
      const vehicle = customer?.vehicles.find((v) => v.id === order.vehicleId);
      return {
        ...order,
        customer,
        vehicle,
      };
    },

    async findByToken(token: string): Promise<ServiceOrder | null> {
      if (isRealDatabase) {
        try {
          const order = await prisma.serviceOrder.findFirst({
            where: {
              OR: [{ token }, { id: token }, { orderNumber: token }],
            },
            include: {
              customer: { include: { vehicles: true } },
              vehicle: true,
              mechanic: true,
              items: true,
              parts: true,
            },
          });
          if (order) {
            return mapPrismaOrder(order);
          }
        } catch (err) {
          console.error("Error prisma.serviceOrder.findByToken:", err);
        }
      }

      const order = memoryServiceOrders.find((o) => o.token === token || o.id === token || o.orderNumber === token);
      if (!order) return null;
      const customer = memoryCustomers.find((c) => c.id === order.customerId);
      const vehicle = customer?.vehicles.find((v) => v.id === order.vehicleId);
      return {
        ...order,
        customer,
        vehicle,
      };
    },

    async create(data: {
      customerId: string;
      vehicleId: string;
      mechanicId?: string;
      mechanicName?: string;
      currentKm?: number;
      complaints: string;
      notes?: string;
      initialServiceIds?: string[];
      initialPartIds?: { partId: string; qty: number }[];
    }): Promise<ServiceOrder> {
      const count = memoryServiceOrders.length + 1;
      const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
      const orderNumber = `WO-${dateStr}-${String(count).padStart(4, "0")}`;
      const token = `trk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const orderId = `ord-${Date.now()}`;

      // In-memory prep
      const items: ServiceOrderItem[] = [];
      let totalServices = 0;
      if (data.initialServiceIds && data.initialServiceIds.length > 0) {
        for (const srvId of data.initialServiceIds) {
          const srv = memoryServices.find((s) => s.id === srvId);
          if (srv) {
            items.push({
              id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              orderId,
              serviceId: srv.id,
              serviceName: srv.name,
              price: srv.price,
              qty: 1,
              subtotal: srv.price,
            });
            totalServices += srv.price;
          }
        }
      }

      const parts: ServiceOrderPart[] = [];
      let totalParts = 0;
      if (data.initialPartIds && data.initialPartIds.length > 0) {
        for (const p of data.initialPartIds) {
          const part = memoryParts.find((x) => x.id === p.partId);
          if (part && part.stock >= p.qty) {
            part.stock -= p.qty;
            const subtotal = part.sellPrice * p.qty;
            parts.push({
              id: `partItem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              orderId,
              partId: part.id,
              partName: part.name,
              costPrice: part.costPrice,
              sellPrice: part.sellPrice,
              qty: p.qty,
              subtotal,
            });
            totalParts += subtotal;
          }
        }
      }

      const newOrder: ServiceOrder = {
        id: orderId,
        orderNumber,
        token,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        mechanicId: data.mechanicId || "usr-3",
        mechanicName: data.mechanicName || "Budi Santoso",
        currentKm: data.currentKm || null,
        complaints: data.complaints.trim(),
        diagnosis: null,
        status: "ANTRIAN",
        paymentStatus: "PENDING",
        paymentMethod: null,
        totalServices,
        totalParts,
        discount: 0,
        grandTotal: totalServices + totalParts,
        paidAmount: 0,
        changeAmount: 0,
        notes: data.notes?.trim() || null,
        entryDate: new Date(),
        items,
        parts,
      };

      memoryServiceOrders.unshift(newOrder);
      return newOrder;
    },

    async updateStatus(id: string, status: ServiceStatus, diagnosis?: string): Promise<ServiceOrder | null> {
      if (isRealDatabase) {
        try {
          const updated = await prisma.serviceOrder.update({
            where: { id },
            data: {
              status: status as any,
              diagnosis: diagnosis !== undefined ? (diagnosis.trim() || null) : undefined,
              completedDate: status === "SELESAI_PENGERJAAN" ? new Date() : undefined,
            },
            include: {
              customer: { include: { vehicles: true } },
              vehicle: true,
              mechanic: true,
              items: true,
              parts: true,
            },
          });
          if (updated) {
            return mapPrismaOrder(updated);
          }
        } catch (err) {
          console.error("Error prisma.serviceOrder.updateStatus:", err);
        }
      }

      const order = memoryServiceOrders.find((o) => o.id === id);
      if (!order) return null;
      order.status = status;
      if (diagnosis !== undefined) {
        order.diagnosis = diagnosis.trim() || null;
      }
      if (status === "SELESAI_PENGERJAAN" && !order.completedDate) {
        order.completedDate = new Date();
      }
      return order;
    },

    async addItem(orderId: string, serviceId: string): Promise<ServiceOrder | null> {
      const order = memoryServiceOrders.find((o) => o.id === orderId);
      const srv = memoryServices.find((s) => s.id === serviceId);
      if (!order || !srv) return null;

      order.items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.id,
        serviceId: srv.id,
        serviceName: srv.name,
        price: srv.price,
        qty: 1,
        subtotal: srv.price,
      });

      order.totalServices = order.items.reduce((acc, i) => acc + i.subtotal, 0);
      order.grandTotal = Math.max(0, order.totalServices + order.totalParts - order.discount);
      return order;
    },

    async removeItem(orderId: string, itemId: string): Promise<ServiceOrder | null> {
      const order = memoryServiceOrders.find((o) => o.id === orderId);
      if (!order) return null;
      order.items = order.items.filter((i) => i.id !== itemId);
      order.totalServices = order.items.reduce((acc, i) => acc + i.subtotal, 0);
      order.grandTotal = Math.max(0, order.totalServices + order.totalParts - order.discount);
      return order;
    },

    async addPart(orderId: string, partId: string, qty = 1): Promise<ServiceOrder | null> {
      const order = memoryServiceOrders.find((o) => o.id === orderId);
      const part = memoryParts.find((p) => p.id === partId);
      if (!order || !part || part.stock < qty) return null;

      part.stock -= qty;
      const subtotal = part.sellPrice * qty;

      order.parts.push({
        id: `partItem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.id,
        partId: part.id,
        partName: part.name,
        costPrice: part.costPrice,
        sellPrice: part.sellPrice,
        qty,
        subtotal,
      });

      order.totalParts = order.parts.reduce((acc, p) => acc + p.subtotal, 0);
      order.grandTotal = Math.max(0, order.totalServices + order.totalParts - order.discount);
      return order;
    },

    async removePart(orderId: string, partItemId: string): Promise<ServiceOrder | null> {
      const order = memoryServiceOrders.find((o) => o.id === orderId);
      if (!order) return null;
      const partItem = order.parts.find((p) => p.id === partItemId);
      if (partItem) {
        const part = memoryParts.find((p) => p.id === partItem.partId);
        if (part) {
          part.stock += partItem.qty;
        }
      }
      order.parts = order.parts.filter((p) => p.id !== partItemId);
      order.totalParts = order.parts.reduce((acc, p) => acc + p.subtotal, 0);
      order.grandTotal = Math.max(0, order.totalServices + order.totalParts - order.discount);
      return order;
    },

    async checkoutBilling(orderId: string, data: {
      paymentMethod: PaymentMethod;
      discount?: number;
      paidAmount: number;
    }): Promise<ServiceOrder | null> {
      if (isRealDatabase) {
        try {
          const currentOrder = await prisma.serviceOrder.findUnique({
            where: { id: orderId },
          });

          if (currentOrder) {
            const discount = data.discount || 0;
            const grandTotal = Math.max(0, Number(currentOrder.totalServices) + Number(currentOrder.totalParts) - discount);
            const paidAmount = data.paidAmount;
            const changeAmount = Math.max(0, paidAmount - grandTotal);

            const updated = await prisma.serviceOrder.update({
              where: { id: orderId },
              data: {
                discount,
                grandTotal,
                paidAmount,
                changeAmount,
                paymentMethod: data.paymentMethod as any,
                paymentStatus: "PAID",
                status: "SELESAI_PEMBAYARAN",
                completedDate: currentOrder.completedDate ?? new Date(),
              },
              include: {
                customer: { include: { vehicles: true } },
                vehicle: true,
                mechanic: true,
                items: true,
                parts: true,
              },
            });

            return mapPrismaOrder(updated);
          }
        } catch (err) {
          console.error("Error prisma.serviceOrder.checkoutBilling:", err);
        }
      }

      const order = memoryServiceOrders.find((o) => o.id === orderId);
      if (!order) return null;

      const discount = data.discount || 0;
      const grandTotal = Math.max(0, order.totalServices + order.totalParts - discount);
      const paidAmount = data.paidAmount;
      const changeAmount = Math.max(0, paidAmount - grandTotal);

      order.discount = discount;
      order.grandTotal = grandTotal;
      order.paidAmount = paidAmount;
      order.changeAmount = changeAmount;
      order.paymentMethod = data.paymentMethod;
      order.paymentStatus = "PAID";
      order.status = "SELESAI_PEMBAYARAN";
      order.paidDate = new Date();
      if (!order.completedDate) {
        order.completedDate = new Date();
      }

      return order;
    },
  },

  // === DASHBOARD STATS ===
  async getStats() {
    if (isRealDatabase) {
      try {
        const [
          totalCustomers,
          totalVehicles,
          totalServices,
          allParts,
        ] = await Promise.all([
          prisma.customer.count(),
          prisma.vehicle.count(),
          prisma.servicesCatalog.count(),
          prisma.partsInventory.findMany({
            select: { id: true, name: true, stock: true, minStock: true, unit: true },
          }),
        ]);

        const lowStockItems = allParts
          .filter((p) => p.stock <= p.minStock)
          .map((p) => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            unit: p.unit,
          }));

        // Service order stats: if there are DB orders, use DB stats, otherwise fallback to memory orders
        const dbOrderCount = await prisma.serviceOrder.count();
        let activeQueueCount = 0;
        let inProgressCount = 0;
        let readyForCashierCount = 0;
        let completedOrdersCount = 0;
        let todayRevenue = 0;

        if (dbOrderCount > 0) {
          const [
            qCount,
            pCount,
            rCount,
            cCount,
            paidOrders,
          ] = await Promise.all([
            prisma.serviceOrder.count({ where: { status: "ANTRIAN" } }),
            prisma.serviceOrder.count({ where: { status: "PENGERJAAN" } }),
            prisma.serviceOrder.count({ where: { status: "SELESAI_PENGERJAAN" } }),
            prisma.serviceOrder.count({ where: { status: "SELESAI_PEMBAYARAN" } }),
            prisma.serviceOrder.findMany({
              where: { paymentStatus: "PAID" },
              select: { grandTotal: true },
            }),
          ]);
          activeQueueCount = qCount;
          inProgressCount = pCount;
          readyForCashierCount = rCount;
          completedOrdersCount = cCount;
          todayRevenue = paidOrders.reduce((acc, o) => acc + Number(o.grandTotal), 0);
        } else {
          activeQueueCount = memoryServiceOrders.filter((o) => o.status === "ANTRIAN").length;
          inProgressCount = memoryServiceOrders.filter((o) => o.status === "PENGERJAAN").length;
          readyForCashierCount = memoryServiceOrders.filter((o) => o.status === "SELESAI_PENGERJAAN").length;
          completedOrdersCount = memoryServiceOrders.filter((o) => o.status === "SELESAI_PEMBAYARAN").length;
          todayRevenue = memoryServiceOrders
            .filter((o) => o.paymentStatus === "PAID")
            .reduce((acc, o) => acc + o.grandTotal, 0);
        }

        return {
          totalCustomers,
          totalVehicles,
          totalServices,
          totalParts: allParts.length,
          lowStockCount: lowStockItems.length,
          lowStockItems,
          activeQueueCount,
          inProgressCount,
          readyForCashierCount,
          completedOrdersCount,
          todayRevenue,
        };
      } catch (err) {
        console.error("Error prisma.getStats:", err);
      }
    }

    // Memory fallback
    const totalCustomers = memoryCustomers.length;
    const totalVehicles = memoryCustomers.reduce((acc, c) => acc + c.vehicles.length, 0);
    const totalServices = memoryServices.length;
    const lowStockParts = memoryParts.filter((p) => p.stock <= p.minStock);

    const activeQueueCount = memoryServiceOrders.filter((o) => o.status === "ANTRIAN").length;
    const inProgressCount = memoryServiceOrders.filter((o) => o.status === "PENGERJAAN").length;
    const readyForCashierCount = memoryServiceOrders.filter((o) => o.status === "SELESAI_PENGERJAAN").length;
    const completedOrdersCount = memoryServiceOrders.filter((o) => o.status === "SELESAI_PEMBAYARAN").length;
    const todayRevenue = memoryServiceOrders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((acc, o) => acc + o.grandTotal, 0);

    return {
      totalCustomers,
      totalVehicles,
      totalServices,
      totalParts: memoryParts.length,
      lowStockCount: lowStockParts.length,
      lowStockItems: lowStockParts,
      activeQueueCount,
      inProgressCount,
      readyForCashierCount,
      completedOrdersCount,
      todayRevenue,
    };
  },
};
