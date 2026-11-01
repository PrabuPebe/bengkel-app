import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { getCustomerPortalSession } from "@/lib/actions/customer-portal";
import {
  PortalClient,
  PortalCustomer,
  PortalOrder,
  PortalOrderItem,
  PortalPartItem,
  PortalVehicle,
} from "@/components/portal/portal-client";

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
      vehicles: (rawCustomer.vehicles || []).map((v: any): PortalVehicle => ({
        id: v.id,
        customerId: v.customerId,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        serviceOrders: (v.serviceOrders || []).map((o: any): PortalOrder => ({
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
          items: (o.items || []).map((i: any): PortalOrderItem => ({
            id: i.id,
            serviceName: i.serviceName,
            qty: i.qty,
            price: Number(i.price || 0),
            subtotal: Number(i.subtotal || 0),
          })),
          parts: (o.parts || []).map((p: any): PortalPartItem => ({
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
      serviceOrders: (rawCustomer.serviceOrders || []).map((o: any): PortalOrder => ({
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
        items: (o.items || []).map((i: any): PortalOrderItem => ({
          id: i.id,
          serviceName: i.serviceName,
          qty: i.qty,
          price: Number(i.price || 0),
          subtotal: Number(i.subtotal || 0),
        })),
        parts: (o.parts || []).map((p: any): PortalPartItem => ({
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
          mechanic: o.mechanicId ? { name: "Mekanik Mas Joko" } : null,
          complaints: o.notes || "Servis berkala",
          diagnosis: null,
        }));

      customer.serviceOrders = customerOrders;
      for (const v of customer.vehicles) {
        v.serviceOrders = customerOrders.filter(
          (co) => !co.token || v.serviceOrders.length === 0 || co.currentKm
        );
      }
    } catch (e) {
      console.warn("Error fetching orders for portal:", e);
    }
  }

  return (
    <PortalClient
      customer={customer}
      initialVehicleId={session.vehicleId || customer.vehicles[0]?.id || ""}
    />
  );
}
