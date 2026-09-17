"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleFillDemoCredentials() {
    setEmail("admin22@gmail.com");
    setPassword("mamang22");
    setErrorMessage("");
  }

  async function handleCredentialsLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (mode === "register") {
      setSuccessMessage(
        "Pendaftaran akun baru demo berhasil diterima. Silakan gunakan kredensial demo untuk masuk.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setErrorMessage("Username atau password tidak sesuai. Pastikan menggunakan akun demo resmi.");
    } catch {
      setErrorMessage("Koneksi gagal. Periksa jaringan internet lalu coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const providersResponse = await fetch("/api/auth/providers");
      const providers = (await providersResponse.json()) as Record<string, unknown>;

      if (!providers.google) {
        setErrorMessage(
          "Login Google belum dikonfigurasi pada server ini. Silakan masuk menggunakan kredensial internal di atas.",
        );
        setIsLoading(false);
        return;
      }

      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setErrorMessage(
        "Layanan login Google sedang tidak tersedia. Gunakan username dan password.",
      );
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950 overflow-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 -right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 -left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Centered Luxury Glass Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 text-white shadow-xl shadow-indigo-600/30 font-black text-2xl tracking-wider mb-3.5 border border-white/20 ring-4 ring-indigo-500/10">
            PA
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            PitCare Auto
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mt-1">
            Enterprise Automotive Suite
          </p>
        </div>

        {/* Card Container with Glassmorphism */}
        <div className="p-7 sm:p-9 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl shadow-black/80 backdrop-blur-2xl">
          {/* Segmented Auth Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/70 border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                mode === "login"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Masuk Workspace
            </button>
            <button
              type="button"
              onClick={() => changeMode("register")}
              className={`py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                mode === "register"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Buat Akun Baru
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {mode === "login" ? "Selamat Datang Kembali" : "Mulai Bersama PitCare Auto"}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {mode === "login"
                ? "Akses modul servis, antrian pit, pelanggan, dan kasir billing."
                : "Daftarkan akun mekanik atau kasir baru untuk bengkel Anda."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Username atau Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="text"
                  required
                  placeholder="admin22@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-300"
                >
                  Kata Sandi (Password)
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => alert("Gunakan password demo resmi: mamang22")}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-950/70 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  title={showPassword ? "Sembunyikan" : "Lihat password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button with Gradient & Micro-interaction */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:brightness-110 shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all duration-300 cursor-pointer disabled:opacity-60"
            >
              {isLoading
                ? "Memproses Autentikasi..."
                : mode === "login"
                  ? "Masuk ke Workspace PitCare Auto →"
                  : "Daftarkan Akun"}
            </button>
          </form>

          {/* Quick Demo Credentials Helper Card */}
          <div className="mt-5 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <div className="text-[11px] text-indigo-300 leading-tight">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Akun Demo Resmi:
              </p>
              <p className="text-slate-400 font-mono text-[10px] mt-1">
                admin22@gmail.com • mamang22
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition-all duration-200"
            >
              Isi Otomatis
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <div className="flex-1 h-px bg-white/5" />
            <span>atau</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-11 px-4 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" role="img">
              <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" />
              <path fill="#34A853" d="M12 21.69c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.69Z" />
              <path fill="#FBBC05" d="M6.54 13.78a5.85 5.85 0 0 1 0-3.56V7.69H3.3a9.77 9.77 0 0 0 0 8.62l3.24-2.53Z" />
              <path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.27 14.63 2.31 12 2.31a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.91 9.46 6.19 12 6.19Z" />
            </svg>
            Masuk dengan Google
          </button>

          {/* Footer */}
          <p className="text-center text-[10px] text-slate-500 mt-6 leading-relaxed">
            Dilindungi sistem keamanan sesi terenkripsi PitCare Auto.
          </p>
        </div>
      </div>
    </main>
  );
}