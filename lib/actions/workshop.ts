"use server";

import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export interface RegisterWorkshopInput {
  workshopName: string;
  address?: string;
  city?: string;
  phone?: string;
  ownerName: string;
  email: string;
  password: string;
}

export async function registerWorkshopAction(data: RegisterWorkshopInput) {
  try {
    const workshopName = data.workshopName?.trim();
    const ownerName = data.ownerName?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password?.trim();
    const address = data.address?.trim() || "";
    const city = data.city?.trim() || "Jakarta";
    const phone = data.phone?.trim() || "";

    if (!workshopName || workshopName.length < 3) {
      return { success: false, error: "Nama bengkel minimal 3 karakter." };
    }
    if (!ownerName || ownerName.length < 3) {
      return { success: false, error: "Nama pemilik bengkel minimal 3 karakter." };
    }
    if (!email || !email.includes("@")) {
      return { success: false, error: "Format email pemilik tidak valid." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password akun minimal 6 karakter." };
    }

    // 1. Cek apakah email sudah terdaftar di database
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return { success: false, error: "Email sudah terdaftar. Silakan gunakan email lain atau login." };
      }
    } catch (err) {
      console.warn("Prisma check email fallback:", err);
    }

    // 2. Buat slug unik untuk bengkel
    const baseSlug =
      workshopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "bengkel";
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    // 3. Buat Record Bengkel Baru
    const workshop = await db.workshop.create({
      name: workshopName,
      slug,
      address: address || undefined,
      city: city || "Jakarta",
      phone: phone || undefined,
    });

    // 4. Daftarkan Akun Pemilik (Role: OWNER)
    let createdUser: any = null;
    try {
      createdUser = await prisma.user.create({
        data: {
          name: ownerName,
          email,
          password,
          role: "OWNER",
          workshopId: workshop.id,
        },
      });
    } catch (err) {
      console.error("Prisma user create fallback:", err);
    }

    // Selalu pastikan ada di in-memory untuk ketahanan offline
    db.user.addMemoryUser({
      id: createdUser?.id || `usr-owner-${Date.now()}`,
      name: ownerName,
      email,
      role: "OWNER",
      workshopId: workshop.id,
      createdAt: new Date(),
    });

    // 5. Inisialisasi Starter Pack Layanan (Services Catalog) untuk Bengkel Baru
    const starterServices = [
      { code: `${slug}-SRV-01`, name: "Ganti Oli Mesin", desc: "Jasa kuras & isi oli mesin baru", duration: 15, price: 25000 },
      { code: `${slug}-SRV-02`, name: "Ganti Oli Gardan", desc: "Penggantian pelumas transmisi matic", duration: 10, price: 15000 },
      { code: `${slug}-SRV-03`, name: "Tune Up Injeksi Standar", desc: "Pembersihan ruang bakar & injector", duration: 45, price: 75000 },
      { code: `${slug}-SRV-04`, name: "Servis CVT Lengkap", desc: "Bongkar puli & bersihkan mangkok kopling", duration: 35, price: 55000 },
      { code: `${slug}-SRV-05`, name: "Ganti Kampas Rem", desc: "Pembersihan kaliper & pasang kampas rem", duration: 20, price: 25000 },
    ];

    for (const s of starterServices) {
      try {
        await db.servicesCatalog.create({
          workshopId: workshop.id,
          code: s.code,
          name: s.name,
          description: s.desc,
          duration: s.duration,
          price: s.price,
        });
      } catch (e) {
        console.warn("Gagal inisialisasi starter service:", s.code, e);
      }
    }

    // 6. Inisialisasi Starter Pack Suku Cadang (Parts Inventory)
    const starterParts = [
      { sku: `${slug}-OIL-01`, name: "Oli Mesin Matic 0.8L", cat: "Oli & Pelumas", stock: 20, min: 5, cost: 45000, sell: 58000, unit: "BOTOL", loc: "Rak A1" },
      { sku: `${slug}-OIL-02`, name: "Oli Gardan Matic 120ml", cat: "Oli & Pelumas", stock: 25, min: 5, cost: 12000, sell: 18000, unit: "TUBE", loc: "Rak A2" },
      { sku: `${slug}-SPK-01`, name: "Busi Standar Matic", cat: "Pengapian", stock: 12, min: 3, cost: 16000, sell: 26000, unit: "PCS", loc: "Laci B1" },
      { sku: `${slug}-BRK-01`, name: "Kampas Rem Depan Cakram", cat: "Pengereman", stock: 8, min: 2, cost: 32000, sell: 48000, unit: "SET", loc: "Laci B2" },
      { sku: `${slug}-BRK-02`, name: "Kampas Rem Belakang Tromol", cat: "Pengereman", stock: 8, min: 2, cost: 26000, sell: 39000, unit: "SET", loc: "Laci B2" },
    ];

    for (const p of starterParts) {
      try {
        await db.partsInventory.create({
          workshopId: workshop.id,
          sku: p.sku,
          name: p.name,
          category: p.cat,
          stock: p.stock,
          minStock: p.min,
          costPrice: p.cost,
          sellPrice: p.sell,
          unit: p.unit,
          location: p.loc,
        });
      } catch (e) {
        console.warn("Gagal inisialisasi starter part:", p.sku, e);
      }
    }

    return {
      success: true,
      workshopId: workshop.id,
      workshopName: workshop.name,
      ownerEmail: email,
    };
  } catch (error: any) {
    console.error("registerWorkshopAction error:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan internal saat mendaftarkan bengkel.",
    };
  }
}

export async function getWorkshopByIdAction(workshopId: string) {
  try {
    return await db.workshop.findById(workshopId);
  } catch (err) {
    console.error("getWorkshopByIdAction error:", err);
    return null;
  }
}
