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
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,210,255,0.08) 0%, transparent 70%)", transform: "translate(30%, -40%)" }}
      />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 70%)", transform: "translate(-30%, 40%)" }}
      />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,210,255,0.03) 0%, transparent 70%)", transform: "translate(-50%, -50%)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#00D2FF] text-slate-950 shadow-2xl mb-4 border border-cyan-400/30 relative">
            <span className="text-2xl font-black tracking-wider relative z-10">PA</span>
            <div
              className="absolute -inset-1 rounded-2xl opacity-30 pointer-events-none"
              style={{ background: "linear-gradient(135deg, #00D2FF, #2563EB)", filter: "blur(8px)", zIndex: 0 }}
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center justify-center gap-2 gradient-text">
            <span>PitCare Auto</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-[#00D2FF] border border-cyan-500/25">
              PRO
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Sistem Manajemen Bengkel Modern
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-3xl shadow-2xl shadow-black/70 p-8"
          style={{
            background: "linear-gradient(145deg, #161f35 0%, #111828 100%)",
            border: "1px solid rgba(30,41,59,0.9)",
            borderTop: "1px solid rgba(0,210,255,0.2)",
          }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Masuk ke Dashboard</h2>
            <p className="text-sm text-slate-500 mt-0.5">
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

            {/* Email with icon */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Email Akun
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@bengkelku.app"
                  className="input-custom w-full h-11 pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            {/* Password with icon */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-custom w-full h-11 pl-10 pr-4 text-sm"
                />
              </div>
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
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(30,41,59,0.8)" }}>
            <p className="text-xs text-center text-slate-600 mb-3 font-semibold uppercase tracking-wider">
              Akun Demo
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="w-full p-3 rounded-xl hover:bg-[#1E293B]/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all cursor-pointer text-left group"
              style={{ background: "rgba(15,23,42,0.5)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center text-xs font-bold shadow-sm shadow-cyan-900/40">
                  PJ
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Pak Joko — Admin Bengkel</p>
                  <p className="text-[11px] text-slate-500 font-mono">admin22@gmail.com · password: mamang22</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-slate-950 bg-[#00D2FF] px-2.5 py-0.5 rounded-full shadow-sm">
                  Isi Otomatis
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600 mt-6 font-medium">
          © {new Date().getFullYear()} PitCare Auto — Modern Workshop Suite & Management System
        </p>
      </div>
    </div>
  );
}
