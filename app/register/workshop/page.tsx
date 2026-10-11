"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerWorkshopAction } from "@/lib/actions/workshop";

export default function RegisterWorkshopPage() {
  const router = useRouter();

  // Workshop Form State
  const [workshopName, setWorkshopName] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Owner Account State
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!workshopName.trim() || workshopName.trim().length < 3) {
      setError("Nama bengkel minimal 3 karakter.");
      return;
    }
    if (!ownerName.trim() || ownerName.trim().length < 3) {
      setError("Nama pemilik bengkel minimal 3 karakter.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password akun minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerWorkshopAction({
        workshopName: workshopName.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        password,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/login?registered=1&email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        setError(res.error || "Gagal mendaftarkan bengkel.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan sistem saat mendaftar.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 text-slate-900 py-10">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-xs mb-3 hover:bg-slate-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
              />
            </svg>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            Multi-Bengkel SaaS Platform
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftarkan Bengkel Anda di PitCare Auto
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Mulai kelola operasional servis, inventori suku cadang, dan portal pelanggan mandiri dalam hitungan menit.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-900">Pendaftaran Bengkel Berhasil!</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Bengkel <strong className="text-slate-900">{workshopName}</strong> dan akun Owner Anda telah siap. Paket starter jasa & suku cadang telah otomatis diinisialisasi.
              </p>
              <p className="text-xs text-blue-600 font-medium">Mengarahkan ke halaman login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Profil Bengkel */}
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Informasi Bengkel
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nama Bengkel <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={workshopName}
                      onChange={(e) => setWorkshopName(e.target.value)}
                      required
                      placeholder="Contoh: Bengkel Motor Mandiri Jaya"
                      className="input-dark w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Kota Operasional <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder="Contoh: Jakarta Selatan / Bandung"
                      className="input-dark w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      No. WhatsApp / Telepon Bengkel
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 081298765432"
                      className="input-dark w-full text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Alamat Lengkap Bengkel
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Contoh: Jl. Raya Fatmawati No. 45, Cilandak"
                      className="input-dark w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Akun Pemilik (Owner) */}
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Akun Pemilik Bengkel (Owner)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nama Lengkap Pemilik <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                      placeholder="Contoh: Bambang Sudiro"
                      className="input-dark w-full text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Login Pemilik <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="bambang@bengkeljaya.com"
                      className="input-dark w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Minimal 6 karakter"
                      className="input-dark w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ulangi Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Konfirmasi password"
                      className="input-dark w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Starter Pack Feature Callout */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Fitur Siap Pakai Langsung untuk Bengkel Baru:
                </p>
                <ul className="list-disc list-inside text-slate-500 pl-1 space-y-0.5">
                  <li>Otomatis terisi 5 paket jasa dasar (Ganti Oli, Tune Up, Servis CVT, dll)</li>
                  <li>Otomatis terisi 5 katalog suku cadang awal (Oli matic, oli gardan, busi, kampas rem)</li>
                  <li>Akses tambah mekanik & kasir khusus bengkel Anda setelah login</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full h-11 text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {isLoading ? "Mendaftarkan Bengkel & Menyiapkan Akun..." : "Daftarkan Bengkel Sekarang →"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                >
                  ← Sudah punya akun bengkel? Masuk di sini
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} PitCare Auto — Platform Sistem Manajemen Bengkel Multi-Tenant
        </p>
      </div>
    </div>
  );
}
