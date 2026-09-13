"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";

export async function getPartsAction(query?: string, category?: string) {
  return await db.partsInventory.findMany(query, category);
}

export async function createPartAction(formData: FormData) {
  const sku = formData.get("sku") as string;
  const name = formData.get("name") as string;
  const category = (formData.get("category") as string) || "Lain-lain";
  const stockStr = formData.get("stock") as string;
  const minStockStr = formData.get("minStock") as string;
  const costPriceStr = formData.get("costPrice") as string;
  const sellPriceStr = formData.get("sellPrice") as string;
  const unit = (formData.get("unit") as string) || "PCS";
  const location = (formData.get("location") as string) || "";

  if (!sku || !name || !sellPriceStr) {
    return { success: false, error: "SKU, nama part, dan harga jual wajib diisi." };
  }

  const stock = stockStr ? parseInt(stockStr, 10) : 0;
  const minStock = minStockStr ? parseInt(minStockStr, 10) : 5;
  const costPrice = costPriceStr ? parseFloat(costPriceStr) : 0;
  const sellPrice = parseFloat(sellPriceStr);

  try {
    const part = await db.partsInventory.create({
      sku,
      name,
      category,
      stock,
      minStock,
      costPrice,
      sellPrice,
      unit,
      location,
    });

    revalidatePath("/inventory/parts");
    revalidatePath("/dashboard");
    return { success: true, data: part };
  } catch {
    return { success: false, error: "Gagal menyimpan data suku cadang." };
  }
}

export async function updatePartStockAction(id: string, newStock: number) {
  if (!id || isNaN(newStock) || newStock < 0) {
    return { success: false, error: "Jumlah stok tidak valid." };
  }

  try {
    const part = await db.partsInventory.updateStock(id, newStock);
    revalidatePath("/inventory/parts");
    revalidatePath("/dashboard");
    return { success: true, data: part };
  } catch {
    return { success: false, error: "Gagal memperbarui stok." };
  }
}

export async function deletePartAction(id: string) {
  if (!id) return { success: false, error: "ID tidak valid." };

  try {
    await db.partsInventory.delete(id);
    revalidatePath("/inventory/parts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus suku cadang." };
  }
}
