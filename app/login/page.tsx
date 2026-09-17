"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Email atau password salah. Periksa kembali kredensial Anda.");
      setIsLoading(false);
    }
  }

  function fillDemo() {
    setEmail("admin22@gmail.com");
    setPassword("mamang22");
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient subtle blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#412D15]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1F150C]/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#1F150C] shadow-xl shadow-[#000000]/20 mb-4 border border-[#412D15]/40">
            <span className="text-xl font-black text-white tracking-wider">PA</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            PitCare Auto
          </h1>
          <p className="text-sm font-semibold text-zinc-400 mt-1">
            Sistem Manajemen Bengkel Modern
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-[#412D15]/20 shadow-xl shadow-[#000000]/10 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#1F150C]">Masuk ke Dashboard</h2>
            <p className="text-sm text-[#412D15] mt-1">
              Masukkan kredensial akun bengkel Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-rose-700 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1F150C] mb-1.5">
                Email Akun
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@pitcare.auto"
                className="input-custom w-full h-11 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F150C] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-custom w-full h-11 px-4 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-sage w-full h-11 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Memverifikasi...
                </span>
              ) : (
                "Masuk ke Dashboard →"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-[#412D15]/15">
            <p className="text-xs text-center text-[#412D15] mb-3 font-semibold">
              Akun Demo PitCare Auto
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="w-full p-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-[#412D15]/30 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1F150C] text-white flex items-center justify-center text-xs font-bold">
                  PJ
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1F150C]">Pak Joko — Admin Bengkel</p>
                  <p className="text-[11px] text-[#412D15]">admin22@gmail.com · password: mamang22</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-white bg-[#412D15] px-2.5 py-0.5 rounded-full shadow-xs">
                  Isi Otomatis
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-500 mt-6 font-medium">
          © {new Date().getFullYear()} PitCare Auto — Platform Manajemen Bengkel Modern
        </p>
      </div>
    </div>
  );
}