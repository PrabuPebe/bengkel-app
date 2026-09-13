"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";

export async function getServicesAction(query?: string) {
  return await db.servicesCatalog.findMany(query);
}

export async function createServiceAction(formData: FormData) {
  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || "";
  const durationStr = formData.get("duration") as string;
  const priceStr = formData.get("price") as string;

  if (!code || !name || !priceStr) {
    return { success: false, error: "Kode, nama jasa, dan harga wajib diisi." };
  }

  const duration = durationStr ? parseInt(durationStr, 10) : 30;
  const price = parseFloat(priceStr);

  if (isNaN(price) || price < 0) {
    return { success: false, error: "Harga jasa tidak valid." };
  }

  try {
    const service = await db.servicesCatalog.create({
      code,
      name,
      description,
      duration,
      price,
    });

    revalidatePath("/inventory/services");
    revalidatePath("/dashboard");
    return { success: true, data: service };
  } catch {
    return { success: false, error: "Gagal menyimpan jasa servis." };
  }
}

export async function deleteServiceAction(id: string) {
  if (!id) return { success: false, error: "ID tidak valid." };

  try {
    await db.servicesCatalog.delete(id);
    revalidatePath("/inventory/services");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus jasa servis." };
  }
}
