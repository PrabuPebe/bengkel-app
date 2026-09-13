import { Customer, Vehicle, ServicesCatalog, PartsInventory } from "./types/database";
import { prisma } from "./prisma";

// Periksa apakah koneksi PostgreSQL nyata telah diisi
const isRealDatabase = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("your-project") &&
  !process.env.DATABASE_URL.includes("your-password")
);
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

// Helper database abstraction layer yang tangguh (Resilient Hybrid Layer)
export const db = {
  // === CUSTOMERS & VEHICLES ===
  customer: {
    async findMany(query?: string): Promise<Customer[]> {
      if (isRealDatabase) {
        try {
          const rows = await prisma.customer.findMany({
            include: { vehicles: true },
            where: query && query.trim()
              ? {
                  OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { phone: { contains: query, mode: "insensitive" } },
                  ],
                }
              : undefined,
            orderBy: { createdAt: "desc" },
          });
          if (rows.length > 0) {
            return rows as unknown as Customer[];
          }
        } catch {
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
      const part = memoryParts.find((p) => p.id === id);
      if (!part) return null;
      part.stock = newStock;
      return {
        ...part,
        isLowStock: part.stock <= part.minStock,
      };
    },

    async delete(id: string): Promise<boolean> {
      const index = memoryParts.findIndex((p) => p.id === id);
      if (index !== -1) {
        memoryParts.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  // === DASHBOARD STATS ===
  async getStats() {
    const totalCustomers = memoryCustomers.length;
    const totalVehicles = memoryCustomers.reduce((acc, c) => acc + c.vehicles.length, 0);
    const totalServices = memoryServices.length;
    const lowStockParts = memoryParts.filter((p) => p.stock <= p.minStock);

    return {
      totalCustomers,
      totalVehicles,
      totalServices,
      totalParts: memoryParts.length,
      lowStockCount: lowStockParts.length,
      lowStockItems: lowStockParts,
    };
  },
};
