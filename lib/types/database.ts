export type UserRole = "ADMIN" | "CASHIER" | "MECHANIC";

export type ServiceStatus =
  | "ANTRIAN"
  | "PENGERJAAN"
  | "MENUNGGU_PART"
  | "SELESAI_PENGERJAAN"
  | "SELESAI_PEMBAYARAN"
  | "DIBATALKAN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Vehicle {
  id: string;
  customerId: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  engineNo?: string | null;
  frameNo?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  vehicles: Vehicle[];
}

export interface ServicesCatalog {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  duration?: number | null;
  price: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PartsInventory {
  id: string;
  sku: string;
  name: string;
  category?: string | null;
  stock: number;
  minStock: number;
  costPrice: number;
  sellPrice: number;
  unit: string;
  location?: string | null;
  isLowStock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentMethod = "CASH" | "TRANSFER" | "QRIS";
export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED";

export interface ServiceOrderItem {
  id: string;
  orderId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface ServiceOrderPart {
  id: string;
  orderId: string;
  partId: string;
  partName: string;
  costPrice: number;
  sellPrice: number;
  qty: number;
  subtotal: number;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  token: string;
  customerId: string;
  customer?: Customer;
  vehicleId: string;
  vehicle?: Vehicle;
  mechanicId?: string | null;
  mechanicName?: string | null;
  createdById?: string | null;
  currentKm?: number | null;
  complaints: string;
  diagnosis?: string | null;
  status: ServiceStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  totalServices: number;
  totalParts: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  notes?: string | null;
  entryDate: Date;
  completedDate?: Date | null;
  paidDate?: Date | null;
  items: ServiceOrderItem[];
  parts: ServiceOrderPart[];
  createdAt?: Date;
  updatedAt?: Date;
}

