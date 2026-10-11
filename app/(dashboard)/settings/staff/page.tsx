"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/dashboard/header";
import {
  getWorkshopStaffAction,
  registerStaffAction,
  deleteStaffAction,
  StaffRole,
} from "@/lib/actions/auth";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  workshopId?: string | null;
  createdAt?: Date;
}

export default function StaffSettingsPage() {
  const { data: session } = useSession();
  const workshopId = (session?.user as any)?.workshopId || undefined;
  const currentRole = (session?.user as any)?.role || "ADMIN";

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("MECHANIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  async function loadStaff() {
    setIsLoading(true);
    const data = await getWorkshopStaffAction(workshopId);
    setStaffList(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStaff();
  }, [workshopId]);

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!name.trim() || name.trim().length < 3) {
      setFormError("Nama lengkap minimal 3 karakter.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Masukkan format email yang valid.");
      return;
    }
    if (!password || password.length < 6) {
      setFormError("Password akun staf minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    const res = await registerStaffAction({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      workshopId,
    });

    if (res.success) {
      setFormSuccess("Staf baru berhasil didaftarkan!");
      setName("");
      setEmail("");
      setPassword("");
      setRole("MECHANIC");
      setIsSubmitting(false);
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess("");
        loadStaff();
      }, 1200);
    } else {
      setFormError(res.error || "Gagal mendaftarkan staf baru.");
      setIsSubmitting(false);
    }
  }

  async function handleDelete(userId: string, staffName: string) {
    if (confirm(`Yakin ingin menghapus akun staf "${staffName}"?`)) {
      await deleteStaffAction(userId);
      loadStaff();
    }
  }

  function getRoleBadge(roleName: string) {
    switch (roleName) {
      case "OWNER":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Owner Bengkel</span>;
      case "ADMIN":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Admin</span>;
      case "MECHANIC":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Mekanik</span>;
      case "CASHIER":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Kasir</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{roleName}</span>;
    }
  }

  return (
    <div>
      <Header
        title="Kelola Staf Bengkel"
        subtitle="Manajemen akun teknisi, kasir, dan staf administrasi bengkel Anda."
        actionButton={
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setFormError("");
              setFormSuccess("");
            }}
            className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Staf Baru</span>
          </button>
        }
      />

      {/* Main Staff Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Daftar Anggota Tim</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total {staffList.length} akun staf terdaftar di bengkel ini
            </p>
          </div>
          <button
            type="button"
            onClick={loadStaff}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Muat Ulang</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Memuat daftar staf bengkel...
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-700">Belum Ada Staf Tambahan</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Klik tombol &quot;Tambah Staf Baru&quot; di atas untuk mendaftarkan akun mekanik atau kasir bengkel.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Email Login</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {member.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {member.email}
                    </td>
                    <td className="py-3.5 px-4">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {member.role !== "OWNER" && (currentRole === "OWNER" || currentRole === "ADMIN") ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(member.id, member.name)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-medium hover:underline cursor-pointer"
                        >
                          Hapus
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Terkunci</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Staf Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Tambah Staf Baru</h3>
                <p className="text-xs text-slate-500 mt-0.5">Daftarkan mekanik atau kasir baru untuk bengkel</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap Staf <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Contoh: Rian Hidayat"
                  className="input-dark w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Login <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="rian@bengkel.com"
                  className="input-dark w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password Login <span className="text-red-500">*</span>
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
                  Peran & Tanggung Jawab <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="input-dark w-full text-sm"
                >
                  <option value="MECHANIC">Mekanik / Teknisi (Penanganan Servis & WO)</option>
                  <option value="CASHIER">Kasir (Pembayaran & Billing POS)</option>
                  <option value="ADMIN">Administrator (Akses Operasional Penuh)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Akun Staf"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
