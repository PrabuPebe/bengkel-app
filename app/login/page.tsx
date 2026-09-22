"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerStaffAction, StaffRole } from "@/lib/actions/auth";
import {
  loginCustomerPortalAction,
  registerCustomerPortalAction,
} from "@/lib/actions/customer-portal";

export default function LoginPage() {
  const router = useRouter();

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

  // Handler: Staff Login
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
      setError("Email atau password staf salah. Periksa kembali kredensial Anda.");
      setIsLoading(false);
    }
  }

  // Handler: Staff Register
  async function handleStaffRegister(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    const res = await registerStaffAction({
      name: staffName,
      email: staffEmail,
      password: staffPassword,
      role: staffRole,
    });

    if (res.success) {
      setSuccessMsg("Akun staf berhasil didaftarkan di Supabase! Silakan masuk.");
      setStaffMode("login");
      setIsLoading(false);
    } else {
      setError(res.error || "Gagal mendaftarkan staf baru.");
      setIsLoading(false);
    }
  }

  // Handler: Customer Login
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
      setError(res.error || "Data kendaraan tidak ditemukan.");
      setIsLoading(false);
    }
  }

  // Handler: Customer Register
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

  // Demo Fills
  function fillStaffAdmin() {
    setStaffEmail("admin22@gmail.com");
    setStaffPassword("mamang22");
    setError("");
  }

  function fillStaffMechanic() {
    setStaffEmail("mekanik@pitcare.auto");
    setStaffPassword("pitcare123");
    setError("");
  }

  function fillCustomerDemo() {
    setCustomerPhone("081234567890");
    setCustomerPlate("B 1234 ABC");
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Dot grid pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient ambient glow orbs */}
      <div
        className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,210,255,0.08) 0%, transparent 70%)",
          transform: "translate(30%, -40%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 70%)",
          transform: "translate(-30%, 40%)",
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#00D2FF] text-slate-950 shadow-xl shadow-[#00D2FF]/20 mb-3 border border-cyan-400/30 relative">
            <span className="text-2xl font-black tracking-wider">PA</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center justify-center gap-2">
            <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              PitCare Auto
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-[#00D2FF] border border-cyan-500/30">
              ENTERPRISE
            </span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Enterprise Workshop Suite & Client Experience
          </p>
        </div>

        {/* Card Container */}
        <div
          className="rounded-3xl shadow-2xl shadow-black/80 p-6 md:p-8"
          style={{
            background: "linear-gradient(145deg, #131b2e 0%, #0d1322 100%)",
            border: "1px solid rgba(30,41,59,0.85)",
            borderTop: "1px solid rgba(0,210,255,0.25)",
          }}
        >
          {/* Dual Login Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("staff");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "staff"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Staf Bengkel
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("customer");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "customer"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              Portal Pelanggan
            </button>
          </div>

          {/* Alert Error / Success */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-rose-300 font-medium">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-emerald-300 font-medium">{successMsg}</p>
            </div>
          )}

          {/* ================= TAB 1: STAF BENGKEL ================= */}
          {activeTab === "staff" && (
            <div>
              {staffMode === "login" ? (
                <div>
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-white">Login Staf & Manajemen</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Masuk untuk mengelola SPK, inventaris, dan billing kasir
                    </p>
                  </div>

                  <form onSubmit={handleStaffLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Staf
                      </label>
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        required
                        placeholder="admin@pitcare.auto"
                        className="input-custom w-full h-11 px-3.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="input-custom w-full h-11 px-3.5 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-cyan w-full h-11 text-sm font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Dashboard Operasional →"}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffMode("register");
                        setError("");
                      }}
                      className="text-xs text-[#00D2FF] hover:underline font-semibold cursor-pointer"
                    >
                      Belum punya akun staf? Daftar Staf Baru di sini ↗
                    </button>
                  </div>

                  {/* Quick Fill Demo Staf */}
                  <div className="mt-6 pt-5 border-t border-slate-800">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-center mb-2.5">
                      Kredensial Demo Cepat
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={fillStaffAdmin}
                        className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-white">Pak Joko</p>
                        <p className="text-[10px] text-cyan-400 font-mono">Owner / Admin</p>
                      </button>
                      <button
                        type="button"
                        onClick={fillStaffMechanic}
                        className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-white">Budi Santoso</p>
                        <p className="text-[10px] text-amber-400 font-mono">Mekanik Kepala</p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Form Daftar Staf Baru */
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white">Registrasi Staf Baru</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Daftarkan akun staf baru langsung ke tabel Supabase
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaffMode("login")}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Kembali ke Login
                    </button>
                  </div>

                  <form onSubmit={handleStaffRegister} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Lengkap Staf *
                      </label>
                      <input
                        type="text"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        required
                        placeholder="Contoh: Rian Hidayat"
                        className="input-custom w-full h-10 px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Internal *
                      </label>
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        required
                        placeholder="rian@pitcare.auto"
                        className="input-custom w-full h-10 px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password Baru *
                      </label>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        required
                        placeholder="Minimal 4 karakter"
                        className="input-custom w-full h-10 px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Peran & Tanggung Jawab *
                      </label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                        className="input-custom w-full h-10 px-3 text-sm bg-[#0B0F17]"
                      >
                        <option value="MECHANIC">Mekanik / Teknisi Pitstop</option>
                        <option value="CASHIER">Kasir / Front Office</option>
                        <option value="ADMIN">Administrator / Pemilik Bengkel</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-cyan w-full h-11 text-sm font-bold cursor-pointer disabled:opacity-60 mt-2"
                    >
                      {isLoading ? "Menyimpan ke Supabase..." : "Simpan & Daftarkan Staf →"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: PORTAL PELANGGAN ================= */}
          {activeTab === "customer" && (
            <div>
              {customerMode === "login" ? (
                <div>
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-white">Portal Cek Kendaraan Pelanggan</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pantau kesehatan unit, sisa umur oli/part, dan riwayat nota servis Anda
                    </p>
                  </div>

                  <form onSubmit={handleCustomerLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nomor WhatsApp / HP Aktif *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                          WA
                        </span>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                          placeholder="081299887766"
                          className="input-custom w-full h-11 pl-12 pr-3.5 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nomor Plat Kendaraan *
                      </label>
                      <input
                        type="text"
                        value={customerPlate}
                        onChange={(e) => setCustomerPlate(e.target.value.toUpperCase())}
                        required
                        placeholder="Contoh: B 1234 RFS"
                        className="input-custom w-full h-11 px-3.5 text-sm font-mono tracking-wider uppercase font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-cyan w-full h-11 text-sm font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {isLoading ? "Mengecek Database Supabase..." : "Masuk ke Portal Pelanggan →"}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode("register");
                        setError("");
                      }}
                      className="text-xs text-[#00D2FF] hover:underline font-semibold cursor-pointer"
                    >
                      Belum pernah servis? Daftarkan Kendaraan Baru ↗
                    </button>
                  </div>

                  {/* Demo Pelanggan */}
                  <div className="mt-6 pt-5 border-t border-slate-800">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-center mb-2.5">
                      Coba Akun Pelanggan Terdaftar
                    </p>
                    <button
                      type="button"
                      onClick={fillCustomerDemo}
                      className="w-full p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">Pak Bambang Santoso</p>
                        <p className="text-[10px] text-slate-400 font-mono">081234567890 · Plat: B 1234 ABC</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-950 bg-[#00D2FF] px-2 py-0.5 rounded-md">
                        Isi Cepat
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Form Daftar Kendaraan Baru */
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white">Daftarkan Kendaraan Baru</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Simpan data unit Anda untuk memudahkan booking & monitoring servis
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomerMode("login")}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Kembali ke Login
                    </button>
                  </div>

                  <form onSubmit={handleCustomerRegister} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Pemilik / Pelanggan *
                      </label>
                      <input
                        type="text"
                        value={regCustomerName}
                        onChange={(e) => setRegCustomerName(e.target.value)}
                        required
                        placeholder="Contoh: Hendra Wijaya"
                        className="input-custom w-full h-9.5 px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nomor WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={regCustomerPhone}
                        onChange={(e) => setRegCustomerPhone(e.target.value)}
                        required
                        placeholder="081299887766"
                        className="input-custom w-full h-9.5 px-3 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nomor Plat Kendaraan *
                        </label>
                        <input
                          type="text"
                          value={regPlateNumber}
                          onChange={(e) => setRegPlateNumber(e.target.value.toUpperCase())}
                          required
                          placeholder="B 9999 XYZ"
                          className="input-custom w-full h-9.5 px-3 text-sm font-mono uppercase font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Merk / Pabrikan *
                        </label>
                        <input
                          type="text"
                          value={regBrand}
                          onChange={(e) => setRegBrand(e.target.value)}
                          required
                          placeholder="Honda / Yamaha / Toyota"
                          className="input-custom w-full h-9.5 px-3 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Model / Tipe Motor/Mobil *
                        </label>
                        <input
                          type="text"
                          value={regModel}
                          onChange={(e) => setRegModel(e.target.value)}
                          required
                          placeholder="Vario 160 / NMAX 155"
                          className="input-custom w-full h-9.5 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tahun Kendaraan
                        </label>
                        <input
                          type="number"
                          value={regYear}
                          onChange={(e) => setRegYear(e.target.value)}
                          placeholder="2024"
                          className="input-custom w-full h-9.5 px-3 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-cyan w-full h-11 text-sm font-bold cursor-pointer disabled:opacity-60 mt-3"
                    >
                      {isLoading ? "Mendaftarkan ke Database..." : "Daftarkan & Buka Portal →"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-600 mt-6 font-medium">
          © {new Date().getFullYear()} PitCare Auto — Modern Workshop Suite & Management System
        </p>
      </div>
    </div>
  );
}
