"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export type StaffRole = "ADMIN" | "CASHIER" | "MECHANIC";

export async function registerStaffAction(data: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}) {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const password = data.password.trim();
  const role = data.role;

  if (!name || !email || !password) {
    return { success: false, error: "Nama, email, dan password wajib diisi." };
  }

  if (password.length < 4) {
    return { success: false, error: "Password minimal 4 karakter." };
  }

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
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
  } catch (err) {
    console.error("registerStaffAction error:", err);
    return {
      success: false,
      error: "Gagal menyimpan data staf ke database Supabase.",
    };
  }
}
