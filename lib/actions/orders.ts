"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { ServiceStatus, PaymentMethod } from "../types/database";

export async function getServiceOrdersAction(filters?: { status?: string; query?: string }) {
  return await db.serviceOrder.findMany(filters);
}

export async function getServiceOrderByIdAction(id: string) {
  return await db.serviceOrder.findById(id);
}

export async function getServiceOrderByTokenAction(token: string) {
  return await db.serviceOrder.findByToken(token);
}

export async function createServiceOrderAction(data: {
  customerId: string;
  vehicleId: string;
  mechanicId?: string;
  mechanicName?: string;
  currentKm?: number;
  complaints: string;
  notes?: string;
  initialServiceIds?: string[];
  initialPartIds?: { partId: string; qty: number }[];
}) {
  if (!data.customerId || !data.vehicleId || !data.complaints?.trim()) {
    return { success: false, error: "Pelanggan, kendaraan, dan keluhan awal wajib diisi." };
  }

  try {
    const order = await db.serviceOrder.create(data);
    revalidatePath("/services");
    revalidatePath("/cashier");
    revalidatePath("/dashboard");
    revalidatePath("/inventory/parts");
    return { success: true, data: order };
  } catch {
    return { success: false, error: "Gagal menerbitkan Work Order servis." };
  }
}

export async function updateServiceStatusAction(
  id: string,
  status: ServiceStatus,
  diagnosis?: string
) {
  if (!id || !status) {
    return { success: false, error: "Parameter tidak lengkap." };
  }

  try {
    const order = await db.serviceOrder.updateStatus(id, status, diagnosis);
    revalidatePath(`/services/${id}`);
    revalidatePath("/services");
    revalidatePath("/cashier");
    revalidatePath("/dashboard");
    return { success: true, data: order };
  } catch {
    return { success: false, error: "Gagal memperbarui status servis." };
  }
}

export async function addServiceOrderItemAction(orderId: string, serviceId: string) {
  if (!orderId || !serviceId) {
    return { success: false, error: "ID order dan jasa servis tidak valid." };
  }

  try {
    const order = await db.serviceOrder.addItem(orderId, serviceId);
    revalidatePath(`/services/${orderId}`);
    revalidatePath("/services");
    revalidatePath("/cashier");
    return { success: true, data: order };
  } catch {
    return { success: false, error: "Gagal menambahkan tindakan jasa servis." };
  }
}

export async function removeServiceOrderItemAction(orderId: string, itemId: string) {
  if (!orderId || !itemId) {
    return { success: false, error: "ID tidak valid." };
  }

  try {
    const order = await db.serviceOrder.removeItem(orderId, itemId);
    revalidatePath(`/services/${orderId}`);
    revalidatePath("/services");
    revalidatePath("/cashier");
    return { success: true, data: order };
  } catch {
    return { success: false, error: "Gagal menghapus tindakan jasa servis." };
  }
}

export async function addServiceOrderPartAction(orderId: string, partId: string, qty = 1) {
  if (!orderId || !partId) {
    return { success: false, error: "ID order dan suku cadang tidak valid." };
  }

  try {
    const order = await db.serviceOrder.addPart(orderId, partId, qty);
    if (!order) {
      return { success: false, error: "Stok suku cadang tidak mencukupi di gudang!" };
    }
    revalidatePath(`/services/${orderId}`);
    revalidatePath("/services");
    revalidatePath("/cashier");
    revalidatePath("/inventory/parts");
    revalidatePath("/dashboard");
    return { success: true, data: order };
  } catch {
    return { success: false, error: "Gagal menambahkan suku cadang." };
  }
}

export async function removeServiceOrderPartAction(orderId: string, partItemId: string) {
  if (!orderId || !partItemId) {
    return { success: false, error: "ID tidak valid." };
  }

  try {
    const order = await db.serviceOrder.removePart(orderId, partItemId);
    revalidatePath(`/services/${orderId}`);
    revalidatePath("/services");
    revalidatePath("/cashier");
    revalidatePath("/inventory/parts");
    revalidatePath("/dashboard");
    return { success: true, data: order };
  } catch {
    return { success: false, error: "Gagal membatalkan pemakaian suku cadang." };
  }
}

export async function checkoutBillingAction(
  orderId: string,
  data: {
    paymentMethod: PaymentMethod;
    discount?: number;
    paidAmount: number;
  }
) {
  if (!orderId || !data.paymentMethod || data.paidAmount === undefined) {
    return { success: false, error: "Data pembayaran tidak lengkap." };
  }

  try {
    const order = await db.serviceOrder.checkoutBilling(orderId, data);
    revalidatePath(`/cashier/${orderId}`);
    revalidatePath("/cashier");
    revalidatePath("/services");
    revalidatePath(`/services/${orderId}`);
    revalidatePath("/dashboard");
    return { success: true, data: order };
  } catch {
    return { success: false, error: "Gagal memproses pembayaran kasir." };
  }
}
