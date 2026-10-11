"use server";

import { prisma } from "../prisma";
import { db } from "../db";
import { revalidatePath } from "next/cache";

export type StaffRole = "OWNER" | "ADMIN" | "CASHIER" | "MECHANIC";

export async function getMechanicsAction(workshopId?: string) {
  try {
    const mechanics = await db.user.findMany("MECHANIC", workshopId);
    return mechanics.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
    }));
  } catch (err) {
    console.error("getMechanicsAction error:", err);
    return [];
  }
}

export async function getWorkshopStaffAction(workshopId?: string) {
  try {
    const staff = await db.user.findMany(undefined, workshopId);
    return staff.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      workshopId: u.workshopId,
      createdAt: u.createdAt,
    }));
  } catch (err) {
    console.error("getWorkshopStaffAction error:", err);
    return [];
  }
}

export async function registerStaffAction(data: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  workshopId?: string;
}) {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const password = data.password.trim();
  const role = data.role;
  const workshopId = data.workshopId || null;

  if (!name || !email || !password) {
    return { success: false, error: "Nama, email, dan password wajib diisi." };
  }

  if (password.length < 4) {
    return { success: false, error: "Password minimal 4 karakter." };
  }

  try {
    try {
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        return { success: false, error: "Email tersebut sudah terdaftar sebagai staf." };
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password,
          role,
          workshopId,
        },
      });

      revalidatePath("/dashboard");
      revalidatePath("/settings/staff");
      return {
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          workshopId: newUser.workshopId,
        },
      };
    } catch (dbErr) {
      console.warn("Prisma error in registerStaffAction, falling back to memory:", dbErr);
    }

    // Fallback: tambahkan ke memory users
    const newStaff = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: role as any,
      workshopId,
      createdAt: new Date(),
    };
    db.user.addMemoryUser(newStaff);

    revalidatePath("/dashboard");
    revalidatePath("/settings/staff");
    return {
      success: true,
      data: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        workshopId: newStaff.workshopId,
      },
    };
  } catch (err) {
    console.error("registerStaffAction error:", err);
    return {
      success: false,
      error: "Gagal menyimpan data staf baru.",
    };
  }
}

export async function deleteStaffAction(userId: string) {
  try {
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (dbErr) {
      console.warn("Prisma user delete fallback:", dbErr);
    }
    revalidatePath("/settings/staff");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menghapus staf." };
  }
}
