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
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient high-tech pitstop glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#00D2FF] text-slate-950 shadow-xl shadow-cyan-500/25 mb-4 border border-cyan-400/40">
            <span className="text-2xl font-black tracking-wider">BK</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <span>Bengkelku</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-[#00D2FF] border border-cyan-500/30">
              PITSTOP
            </span>
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Sistem Manajemen Bengkel Modern
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#131B2E] rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/80 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Masuk ke Dashboard</h2>
            <p className="text-sm text-slate-400 mt-1">
              Masukkan kredensial akun bengkel Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-rose-300 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Akun
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@bengkelku.app"
                className="input-custom w-full h-11 px-4 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
              className="btn-cyan w-full h-11 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Memverifikasi...
                </span>
              ) : (
                "Masuk ke Dashboard Pitstop →"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-xs text-center text-slate-400 mb-3 font-semibold">
              Akun Demo Bengkelku
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="w-full p-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center text-xs font-bold shadow-sm">
                  PJ
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Pak Joko — Admin Bengkel</p>
                  <p className="text-[11px] text-slate-400 font-mono">admin22@gmail.com · password: mamang22</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-slate-950 bg-[#00D2FF] px-2.5 py-0.5 rounded-full shadow-sm">
                  Isi Otomatis
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6 font-medium">
          © {new Date().getFullYear()} Bengkelku — Sistem Manajemen Bengkel Modern
        </p>
      </div>
    </div>
  );
}
