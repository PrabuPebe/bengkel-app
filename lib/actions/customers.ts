"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";

export async function getCustomersAction(query?: string) {
  return await db.customer.findMany(query);
}

export async function createCustomerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = (formData.get("address") as string) || "";
  const notes = (formData.get("notes") as string) || "";

  const plateNumber = (formData.get("plateNumber") as string) || "";
  const brand = (formData.get("brand") as string) || "";
  const model = (formData.get("model") as string) || "";
  const yearStr = formData.get("year") as string;
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!name || !phone) {
    return { success: false, error: "Nama dan No. WhatsApp wajib diisi." };
  }

  try {
    const customer = await db.customer.create({
      name,
      phone,
      address,
      notes,
      initialVehicle: plateNumber && brand && model ? {
        plateNumber,
        brand,
        model,
        year,
      } : undefined,
    });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true, data: customer };
  } catch {
    return { success: false, error: "Gagal menyimpan data pelanggan." };
  }
}

export async function addVehicleAction(customerId: string, formData: FormData) {
  const plateNumber = formData.get("plateNumber") as string;
  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const yearStr = formData.get("year") as string;
  const year = yearStr ? parseInt(yearStr, 10) : undefined;
  const notes = (formData.get("notes") as string) || "";

  if (!customerId || !plateNumber || !brand || !model) {
    return { success: false, error: "Data kendaraan tidak lengkap." };
  }

  try {
    const vehicle = await db.vehicle.add(customerId, {
      plateNumber,
      brand,
      model,
      year,
      notes,
    });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true, data: vehicle };
  } catch {
    return { success: false, error: "Gagal menambahkan kendaraan." };
  }
}

export async function deleteCustomerAction(id: string) {
  if (!id) return { success: false, error: "ID tidak valid." };

  try {
    await db.customer.delete(id);
    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus pelanggan." };
  }
}
