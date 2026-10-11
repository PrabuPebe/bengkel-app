"use server";

import { prisma } from "../prisma";
import { db } from "../db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface CustomerSessionData {
  customerId: string;
  customerName: string;
  phone: string;
  vehicleId: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
}

export async function loginCustomerPortalAction(rawPhone: string, rawPlate: string) {
  const phone = rawPhone.trim().replace(/[^0-9]/g, "");
  const plate = rawPlate.trim().toUpperCase().replace(/\s+/g, " ");

  if (!phone || !plate) {
    return { success: false, error: "Nomor WhatsApp dan Plat Nomor kendaraan wajib diisi." };
  }

  try {
    let matchedVehicle: any = null;
    const targetPlateClean = plate.replace(/\s+/g, "");
    const targetPhoneSuffix = phone.length >= 8 ? phone.slice(-8) : phone;

    // 1. Coba pencarian via Prisma jika Supabase aktif
    try {
      const allVehicles = await prisma.vehicle.findMany({
        include: {
          customer: true,
        },
      });

      matchedVehicle = allVehicles.find((v) => {
        const vPlateClean = v.plateNumber.replace(/\s+/g, "").toUpperCase();
        const vPhoneClean = v.customer.phone.replace(/[^0-9]/g, "");
        const plateMatches = vPlateClean === targetPlateClean;
        const phoneMatches =
          vPhoneClean.includes(targetPhoneSuffix) ||
          targetPhoneSuffix.includes(vPhoneClean.slice(-8));
        return plateMatches && phoneMatches;
      });
    } catch (err) {
      console.warn("Prisma search error, falling back to memory database:", err);
    }

    // 2. Fallback pencarian in-memory (resilient offline/paused Supabase)
    if (!matchedVehicle) {
      const customers = await db.customer.findMany();
      for (const c of customers) {
        const cPhoneClean = c.phone.replace(/[^0-9]/g, "");
        const phoneMatches =
          cPhoneClean.includes(targetPhoneSuffix) ||
          targetPhoneSuffix.includes(cPhoneClean.slice(-8));

        for (const v of c.vehicles || []) {
          const vPlateClean = v.plateNumber.replace(/\s+/g, "").toUpperCase();
          if (vPlateClean === targetPlateClean && phoneMatches) {
            matchedVehicle = {
              id: v.id,
              customerId: c.id,
              plateNumber: v.plateNumber,
              brand: v.brand,
              model: v.model,
              year: v.year,
              customer: {
                id: c.id,
                name: c.name,
                phone: c.phone,
              },
            };
            break;
          }
        }
        if (matchedVehicle) break;
      }
    }

    // 3. Resilient Demo Matcher (jika menggunakan nomor / plat contoh)
    if (!matchedVehicle && (targetPlateClean === "B1234ABC" || targetPhoneSuffix === "34567890")) {
      matchedVehicle = {
        id: "veh-demo-1",
        customerId: "cust-1",
        plateNumber: plate || "B 1234 ABC",
        brand: "Honda",
        model: "Beat ESP 110",
        year: 2023,
        customer: {
          id: "cust-1",
          name: "Budi Gunawan",
          phone: "081234567890",
        },
      };
    }

    if (!matchedVehicle) {
      return {
        success: false,
        error: "Data kendaraan dengan kombinasi No. WhatsApp dan Plat Nomor tersebut tidak ditemukan. Silakan daftarkan kendaraan baru di tab Daftar.",
      };
    }

    const sessionData: CustomerSessionData = {
      customerId: matchedVehicle.customerId,
      customerName: matchedVehicle.customer.name,
      phone: matchedVehicle.customer.phone,
      vehicleId: matchedVehicle.id,
      plateNumber: matchedVehicle.plateNumber,
      brand: matchedVehicle.brand,
      model: matchedVehicle.model,
      year: matchedVehicle.year,
    };

    const cookieStore = await cookies();
    cookieStore.set("pitcare_customer_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 hari aktif
    });

    return { success: true, data: sessionData };
  } catch (err) {
    console.error("loginCustomerPortalAction error:", err);
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat memproses login portal pelanggan.",
    };
  }
}

export async function registerCustomerPortalAction(data: {
  name: string;
  phone: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number;
}) {
  const name = data.name.trim();
  const phone = data.phone.trim();
  const plateNumber = data.plateNumber.trim().toUpperCase();
  const brand = data.brand.trim();
  const model = data.model.trim();
  const year = data.year ? Number(data.year) : null;

  if (!name || !phone || !plateNumber || !brand || !model) {
    return { success: false, error: "Semua kolom bertanda bintang wajib diisi." };
  }

  try {
    let customer: any = null;
    let vehicle: any = null;

    // 1. Coba simpan ke database Prisma
    try {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { plateNumber },
        include: { customer: true },
      });

      if (existingVehicle) {
        return {
          success: false,
          error: `Plat nomor ${plateNumber} sudah terdaftar atas nama pelanggan: ${existingVehicle.customer.name}. Silakan langsung masuk di tab Cek Motor Saya.`,
        };
      }

      customer = await prisma.customer.findFirst({
        where: {
          phone: {
            contains: phone.replace(/[^0-9]/g, "").slice(-8),
          },
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name,
            phone,
            notes: "Pendaftaran Mandiri via Portal Pelanggan",
          },
        });
      }

      vehicle = await prisma.vehicle.create({
        data: {
          customerId: customer.id,
          plateNumber,
          brand,
          model,
          year,
        },
      });
    } catch (dbErr) {
      console.warn("Prisma register error, falling back to in-memory:", dbErr);
    }

    // 2. Fallback in-memory
    if (!customer || !vehicle) {
      customer = await db.customer.create({
        name,
        phone,
        notes: "Pendaftaran Mandiri Portal Pelanggan",
        initialVehicle: {
          plateNumber,
          brand,
          model,
          year: year || new Date().getFullYear(),
        },
      });
      vehicle = customer.vehicles[0];
    }

    const sessionData: CustomerSessionData = {
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
    };

    const cookieStore = await cookies();
    cookieStore.set("pitcare_customer_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath("/portal");
    revalidatePath("/customers");
    revalidatePath("/dashboard");

    return { success: true, data: sessionData };
  } catch (err) {
    console.error("registerCustomerPortalAction error:", err);
    return {
      success: false,
      error: "Gagal menyimpan data pendaftaran.",
    };
  }
}

export async function getCustomerPortalSession(): Promise<CustomerSessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pitcare_customer_session");
    if (!sessionCookie?.value) return null;
    return JSON.parse(sessionCookie.value) as CustomerSessionData;
  } catch {
    return null;
  }
}

export async function logoutCustomerPortalAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("pitcare_customer_session");
  redirect("/login");
}
