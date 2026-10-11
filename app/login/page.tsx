"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerStaffAction, StaffRole } from "@/lib/actions/auth";
import {
  loginCustomerPortalAction,
  registerCustomerPortalAction,
} from "@/lib/actions/customer-portal";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab: "staff" | "customer"
  const [activeTab, setActiveTab] = useState<"staff" | "customer">("staff");

  // Mode for Staff: "login" | "register"
  const [staffMode, setStaffMode] = useState<"login" | "register">("login");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("MECHANIC");

  // Mode for Customer: "login" | "register"
  const [customerMode, setCustomerMode] = useState<"login" | "register">("login");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPlate, setCustomerPlate] = useState("");
  const [regCustomerName, setRegCustomerName] = useState("");
  const [regCustomerPhone, setRegCustomerPhone] = useState("");
  const [regPlateNumber, setRegPlateNumber] = useState("");
  const [regBrand, setRegBrand] = useState("Honda");
  const [regModel, setRegModel] = useState("");
  const [regYear, setRegYear] = useState(new Date().getFullYear().toString());

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const registered = searchParams.get("registered");
    const emailParam = searchParams.get("email");
    if (registered === "1") {
      setSuccessMsg("Pendaftaran bengkel berhasil! Silakan masuk dengan email dan password Owner Anda.");
      if (emailParam) {
        setStaffEmail(emailParam);
      }
    }
  }, [searchParams]);

  async function handleStaffLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    const res = await signIn("credentials", {
      email: staffEmail,
      password: staffPassword,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Email atau password tidak cocok dengan akun database. Periksa kembali kredensial Anda.");
      setIsLoading(false);
    }
  }

  async function handleStaffRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!staffName.trim() || staffName.trim().length < 3) {
      setError("Nama lengkap staf minimal 3 karakter.");
      return;
    }
    if (!staffEmail.trim() || !staffEmail.includes("@")) {
      setError("Masukkan format email staf yang valid.");
      return;
    }
    if (!staffPassword || staffPassword.length < 6) {
      setError("Password akun staf minimal 6 karakter.");
      return;
    }

    setIsLoading(true);

    const res = await registerStaffAction({
      name: staffName.trim(),
      email: staffEmail.trim(),
      password: staffPassword,
      role: staffRole,
    });

    if (res.success) {
      setSuccessMsg("Akun staf berhasil didaftarkan! Silakan masuk.");
      setStaffMode("login");
      setIsLoading(false);
    } else {
      setError(res.error || "Gagal mendaftarkan staf baru.");
      setIsLoading(false);
    }
  }

  async function handleCustomerLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    const res = await loginCustomerPortalAction(customerPhone, customerPlate);

    if (res.success) {
      router.push("/portal");
      router.refresh();
    } else {
      setError(res.error || "Data kendaraan tidak ditemukan dalam database.");
      setIsLoading(false);
    }
  }

  async function handleCustomerRegister(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    const res = await registerCustomerPortalAction({
      name: regCustomerName,
      phone: regCustomerPhone,
      plateNumber: regPlateNumber,
      brand: regBrand,
      model: regModel,
      year: regYear ? parseInt(regYear) : undefined,
    });

    if (res.success) {
      router.push("/portal");
      router.refresh();
    } else {
      setError(res.error || "Gagal mendaftarkan kendaraan.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 text-slate-900 py-10">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white shadow-xs mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">PitCare Auto</h1>
          <p className="text-xs text-slate-500 mt-1">
            Platform SaaS Multi-Bengkel & Portal Riwayat Servis Pelanggan
          </p>
        </div>

        {/* Linear Pure White Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-7">
          {/* Dual Portal Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("staff");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "staff"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Login Staf Bengkel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("customer");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "customer"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Portal Pelanggan</span>
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
              {successMsg}
            </div>
          )}

          {/* TAB 1: STAFF BENGKEL */}
          {activeTab === "staff" && (
            <div>
              {staffMode === "login" ? (
                <div>
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-slate-900">Masuk ke Bengkel</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Masuk sebagai Pemilik (Owner), Admin, Kasir, atau Mekanik
                    </p>
                  </div>

                  <form onSubmit={handleStaffLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Email Akun
                      </label>
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        required
                        placeholder="nama@bengkel.com"
                        className="input-dark w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="input-dark w-full text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full h-11 text-xs font-semibold cursor-pointer disabled:opacity-60 mt-1"
                    >
                      {isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Dashboard Bengkel →"}
                    </button>
                  </form>

                  {/* Multi-Bengkel SaaS CTA - Clean & Real */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5 text-center space-y-2">
                      <p className="text-xs font-semibold text-slate-900">
                        Ingin mengelola bengkel Anda sendiri di PitCare Auto?
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Daftarkan bengkel Anda secara mandiri dengan starter pack suku cadang & layanan otomatis.
                      </p>
                      <Link
                        href="/register/workshop"
                        className="inline-flex items-center justify-center w-full py-2 px-3 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        + Daftarkan Bengkel Baru Sekarang
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffMode("register");
                        setError("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                    >
                      Staf mekanik/kasir baru? Daftar akun staf
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Daftar Akun Staf</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Buat akun untuk mekanik atau kasir</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaffMode("login")}
                      className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      Kembali ke Login
                    </button>
                  </div>

                  <form onSubmit={handleStaffRegister} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nama Lengkap Staf
                      </label>
                      <input
                        type="text"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        required
                        placeholder="Contoh: Rian Hidayat"
                        className="input-dark w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Email Staf
                      </label>
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        required
                        placeholder="rian@bengkel.com"
                        className="input-dark w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        required
                        placeholder="Minimal 6 karakter"
                        className="input-dark w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Peran di Bengkel
                      </label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                        className="input-dark w-full text-sm"
                      >
                        <option value="MECHANIC">Mekanik / Teknisi</option>
                        <option value="CASHIER">Kasir</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full h-11 text-xs font-semibold cursor-pointer disabled:opacity-60 mt-2"
                    >
                      {isLoading ? "Menyimpan Data..." : "Simpan & Daftarkan Staf"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PORTAL PELANGGAN */}
          {activeTab === "customer" && (
            <div>
              {customerMode === "login" ? (
                <div>
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-slate-900">Cek Kondisi & Riwayat Motor</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Masukkan nomor WhatsApp & plat nomor motor untuk melihat riwayat servis di semua bengkel rekanan PitCare
                    </p>
                  </div>

                  <form onSubmit={handleCustomerLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nomor WhatsApp / HP Pelanggan
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        placeholder="Contoh: 081234567890"
                        className="input-dark w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nomor Plat Motor
                      </label>
                      <input
                        type="text"
                        value={customerPlate}
                        onChange={(e) => setCustomerPlate(e.target.value.toUpperCase())}
                        required
                        placeholder="Contoh: B 1234 XYZ"
                        className="input-dark w-full text-sm font-mono uppercase font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full h-11 text-xs font-semibold cursor-pointer disabled:opacity-60 mt-1"
                    >
                      {isLoading ? "Mencari Data Kendaraan..." : "Buka Portal Motor Saya →"}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode("register");
                        setError("");
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      Motor baru pertama kali servis? Daftarkan Kendaraan
                    </button>
                  </div>

                  <div className="mt-6 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-500">
                    <p className="font-medium text-slate-700 mb-0.5">💡 Informasi Portal Pelanggan:</p>
                    <p>
                      Pelanggan dapat memantau estimasi odometer oli berikutnya, rekomendasi suku cadang, dan riwayat pengerjaan dari seluruh bengkel rekanan PitCare Auto.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Daftarkan Motor Baru</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Simpan profil motor Anda di PitCare Auto</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomerMode("login")}
                      className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      Kembali ke Login
                    </button>
                  </div>

                  <form onSubmit={handleCustomerRegister} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nama Pemilik Motor
                      </label>
                      <input
                        type="text"
                        value={regCustomerName}
                        onChange={(e) => setRegCustomerName(e.target.value)}
                        required
                        placeholder="Contoh: Hendra Wijaya"
                        className="input-dark w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nomor WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={regCustomerPhone}
                        onChange={(e) => setRegCustomerPhone(e.target.value)}
                        required
                        placeholder="081299887766"
                        className="input-dark w-full text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Plat Nomor
                        </label>
                        <input
                          type="text"
                          value={regPlateNumber}
                          onChange={(e) => setRegPlateNumber(e.target.value.toUpperCase())}
                          required
                          placeholder="B 1234 XYZ"
                          className="input-dark w-full text-sm font-mono uppercase font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Merk Motor
                        </label>
                        <input
                          type="text"
                          value={regBrand}
                          onChange={(e) => setRegBrand(e.target.value)}
                          required
                          placeholder="Honda / Yamaha"
                          className="input-dark w-full text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Tipe Motor
                        </label>
                        <input
                          type="text"
                          value={regModel}
                          onChange={(e) => setRegModel(e.target.value)}
                          required
                          placeholder="Vario 160 / NMAX"
                          className="input-dark w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Tahun
                        </label>
                        <input
                          type="number"
                          value={regYear}
                          onChange={(e) => setRegYear(e.target.value)}
                          placeholder="2024"
                          className="input-dark w-full text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full h-11 text-xs font-semibold cursor-pointer disabled:opacity-60 mt-2"
                    >
                      {isLoading ? "Mendaftarkan..." : "Daftarkan & Buka Portal →"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          © {new Date().getFullYear()} PitCare Auto — Sistem Manajemen Bengkel Modern
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs text-slate-400">Memuat halaman masuk...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
