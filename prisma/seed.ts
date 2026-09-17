import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const initialUsers = [
  {
    name: "Pak Joko (Owner)",
    email: "admin22@gmail.com",
    role: "ADMIN" as const,
  },
  {
    name: "Siti Rahma",
    email: "kasir@pitcare.auto",
    role: "CASHIER" as const,
  },
  {
    name: "Budi Santoso",
    email: "mekanik@pitcare.auto",
    role: "MECHANIC" as const,
  },
];

export const initialCustomers = [
  {
    name: "Budi Gunawan",
    phone: "081234567890",
    address: "Jl. Fatmawati No. 12, Cilandak, Jakarta Selatan",
    notes: "Pelanggan rutin servis bulanan motor matic.",
    vehicles: [
      {
        plateNumber: "B 4321 KAZ",
        brand: "Honda",
        model: "Vario 160",
        year: 2022,
        notes: "Ganti oli rutin tiap 2.000 KM.",
      },
    ],
  },
  {
    name: "Maya Indah",
    phone: "082198765432",
    address: "Apartemen Mediterania Garden, Jakarta Barat",
    notes: "Sering minta cek getaran CVT.",
    vehicles: [
      {
        plateNumber: "B 6543 TGB",
        brand: "Yamaha",
        model: "NMAX 155 Connected",
        year: 2021,
        notes: "Pakai oli Shell Advance AX7.",
      },
    ],
  },
  {
    name: "Hendra Wijaya",
    phone: "085611223344",
    address: "Cluster Graha Raya Bintaro, Tangerang Selatan",
    notes: "Memiliki 2 kendaraan: motor harian dan mobil keluarga.",
    vehicles: [
      {
        plateNumber: "B 3123 POI",
        brand: "Honda",
        model: "Beat FI ESP",
        year: 2020,
        notes: "Motor operasional kerja harian.",
      },
      {
        plateNumber: "B 1982 SIF",
        brand: "Toyota",
        model: "Avanza 1.3G MT",
        year: 2019,
        notes: "Mobil keluarga, servis berkala tiap 6 bulan.",
      },
    ],
  },
  {
    name: "Rina Kurnia",
    phone: "087855667788",
    address: "Jl. Margonda Raya No. 88, Depok",
    notes: "Mahasiswi, kendaraan sering dipakai jarak jauh.",
    vehicles: [
      {
        plateNumber: "B 5432 ZZZ",
        brand: "Yamaha",
        model: "Aerox 155",
        year: 2023,
        notes: "Kondisi sangat mulus, servis berkala tepat waktu.",
      },
    ],
  },
  {
    name: "Agus Prabowo",
    phone: "081399887766",
    address: "Perum Harapan Indah Blok CC, Bekasi",
    notes: "Pelanggan baru rekomendasi rekan kantor.",
    vehicles: [
      {
        plateNumber: "B 7890 KLC",
        brand: "Honda",
        model: "Scoopy Prestige",
        year: 2022,
        notes: "Keluhan rem depan bunyi mendecit.",
      },
      {
        plateNumber: "B 2341 UYT",
        brand: "Daihatsu",
        model: "Xenia 1.5 Deluxe",
        year: 2018,
        notes: "Mobil operasional usaha katering.",
      },
    ],
  },
];

export const initialServices = [
  {
    code: "SRV-001",
    name: "Ganti Oli Mesin",
    description: "Jasa pembuangan oli bekas, pembersihan baut pembuangan, dan pengisian oli baru.",
    duration: 15,
    price: 25000,
  },
  {
    code: "SRV-002",
    name: "Ganti Oli Gardan / Transmisi",
    description: "Penggantian pelumas gearbox roda belakang motor matic.",
    duration: 10,
    price: 15000,
  },
  {
    code: "SRV-003",
    name: "Tune Up Injeksi Motor",
    description: "Pembersihan ruang bakar, setel klep, cek busi, scanner ECU, dan uji putaran stasioner.",
    duration: 45,
    price: 85000,
  },
  {
    code: "SRV-004",
    name: "Servis CVT Lengkap & Pembersihan",
    description: "Bongkar puli depan-belakang, cuci mangkok kopling, amplas kampas ganda, dan pelumasan grease tahan panas.",
    duration: 40,
    price: 65000,
  },
  {
    code: "SRV-005",
    name: "Ganti Kampas Rem Depan / Belakang",
    description: "Pelepasan kaliper, pembersihan piston rem, pemasangan kampas baru, dan bleeding minyak rem.",
    duration: 25,
    price: 30000,
  },
  {
    code: "SRV-006",
    name: "Kuras & Ganti Air Radiator",
    description: "Flushing jalur pendingin mesin dan pengisian air radiator coolant baru.",
    duration: 20,
    price: 35000,
  },
  {
    code: "SRV-007",
    name: "Pembersihan Throttle Body (TB)",
    description: "Pembersihan kerak karbon sensor IACV/TP throttle body motor injeksi.",
    duration: 30,
    price: 50000,
  },
  {
    code: "SRV-008",
    name: "Tune Up & Spooring Mobil Ringan",
    description: "Pemeriksaan 24 titik mobil, pembersihan filter udara, cek busi, dan kelarasan roda.",
    duration: 60,
    price: 200000,
  },
];

export const initialParts = [
  {
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
    sku: "SPK-CPR9EA",
    name: "Busi NGK CPR9EA-9 Nickel",
    category: "Pengapian",
    stock: 3, // LOW STOCK
    minStock: 5,
    costPrice: 18000,
    sellPrice: 28000,
    unit: "PCS",
    location: "Laci B1",
  },
  {
    sku: "BRK-PAD-VR160",
    name: "Kampas Rem Cakram Depan Vario 160",
    category: "Pengereman",
    stock: 2, // LOW STOCK
    minStock: 5,
    costPrice: 34000,
    sellPrice: 49000,
    unit: "SET",
    location: "Laci B2",
  },
  {
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
    sku: "VBLT-NMAX-KIT",
    name: "V-Belt & Roller Kit Yamaha NMAX 155",
    category: "Penggerak CVT",
    stock: 1, // LOW STOCK
    minStock: 3,
    costPrice: 145000,
    sellPrice: 195000,
    unit: "SET",
    location: "Rak C1",
  },
  {
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

export async function main() {
  console.log("Menjalankan database seeder PitCare Auto...");

  // Seed Users
  for (const user of initialUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }
  console.log(`✓ Berhasil seed ${initialUsers.length} pengguna internal.`);

  // Seed Services Catalog
  for (const srv of initialServices) {
    await prisma.servicesCatalog.upsert({
      where: { code: srv.code },
      update: {
        name: srv.name,
        description: srv.description,
        duration: srv.duration,
        price: srv.price,
      },
      create: {
        code: srv.code,
        name: srv.name,
        description: srv.description,
        duration: srv.duration,
        price: srv.price,
      },
    });
  }
  console.log(`✓ Berhasil seed ${initialServices.length} katalog jasa servis.`);

  // Seed Parts Inventory
  for (const part of initialParts) {
    await prisma.partsInventory.upsert({
      where: { sku: part.sku },
      update: {
        name: part.name,
        category: part.category,
        stock: part.stock,
        minStock: part.minStock,
        costPrice: part.costPrice,
        sellPrice: part.sellPrice,
        unit: part.unit,
        location: part.location,
      },
      create: {
        sku: part.sku,
        name: part.name,
        category: part.category,
        stock: part.stock,
        minStock: part.minStock,
        costPrice: part.costPrice,
        sellPrice: part.sellPrice,
        unit: part.unit,
        location: part.location,
      },
    });
  }
  console.log(`✓ Berhasil seed ${initialParts.length} suku cadang inventaris.`);

  // Seed Customers & Vehicles
  for (const cust of initialCustomers) {
    let existingCust = await prisma.customer.findFirst({
      where: { phone: cust.phone },
    });

    if (!existingCust) {
      existingCust = await prisma.customer.create({
        data: {
          name: cust.name,
          phone: cust.phone,
          address: cust.address,
          notes: cust.notes,
        },
      });
    }

    for (const veh of cust.vehicles) {
      await prisma.vehicle.upsert({
        where: { plateNumber: veh.plateNumber },
        update: {
          brand: veh.brand,
          model: veh.model,
          year: veh.year,
          notes: veh.notes,
          customerId: existingCust.id,
        },
        create: {
          plateNumber: veh.plateNumber,
          brand: veh.brand,
          model: veh.model,
          year: veh.year,
          notes: veh.notes,
          customerId: existingCust.id,
        },
      });
    }
  }
  console.log(`✓ Berhasil seed ${initialCustomers.length} pelanggan beserta kendaraan.`);
  console.log("Seeding selesai dengan sukses!");
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error("Gagal menjalankan seeder:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
