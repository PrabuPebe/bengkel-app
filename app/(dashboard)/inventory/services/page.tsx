"use client";

import { useState, useEffect, useTransition } from "react";
import { Header } from "@/components/dashboard/header";
import { Modal } from "@/components/ui/modal";
import { ServicesCatalog } from "@/lib/types/database";
import {
  getServicesAction,
  createServiceAction,
  deleteServiceAction,
} from "@/lib/actions/services";

export default function ServicesCatalogPage() {
  const [services, setServices] = useState<ServicesCatalog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadServices(query?: string) {
    setIsLoading(true);
    try {
      const data = await getServicesAction(query);
      setServices(data);
    } catch {
      console.error("Gagal memuat katalog jasa");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getServicesAction().then((data) => {
      if (active) {
        setServices(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadServices(searchQuery);
  }

  async function handleCreateService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createServiceAction(formData);
      if (result.success) {
        setIsAddOpen(false);
        loadServices(searchQuery);
      } else {
        setFormError(result.error || "Gagal menyimpan jasa servis.");
      }
    });
  }

  async function handleDeleteService(id: string, name: string) {
    if (!confirm(`Hapus tindakan jasa "${name}" dari katalog?`)) return;

    startTransition(async () => {
      const result = await deleteServiceAction(id);
      if (result.success) {
        loadServices(searchQuery);
      } else {
        alert("Gagal menghapus jasa.");
      }
    });
  }

  function formatIDR(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <Header
        title="Katalog Jasa & Tarif Servis"
        subtitle="Daftar tindakan perbaikan, tune up, penggantian pelumas, dan tarif jasa pengerjaan teknisi PitCare Auto."
        actionButton={
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Jasa Baru
          </button>
        }
      />

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <input
            type="text"
            placeholder="Cari berdasarkan kode (contoh: SRV-001) atau nama jasa servis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-4 top-3.5 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              loadServices("");
            }}
            className="px-4 h-11 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Services Table Card */}
      {isLoading ? (
        <div className="p-20 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat katalog jasa servis PitCare Auto...
        </div>
      ) : services.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-base font-bold text-white mb-1">Katalog jasa masih kosong</p>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            {searchQuery ? "Tidak ada jasa yang sesuai kata kunci." : "Tambahkan paket servis pertama untuk bengkel Anda."}
          </p>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
          >
            Tambah Jasa Baru
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl shadow-slate-950/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Kode Jasa</th>
                <th className="py-3.5 px-4">Nama Tindakan & Rincian</th>
                <th className="py-3.5 px-4">Estimasi Waktu</th>
                <th className="py-3.5 px-4 text-right">Tarif Jasa (IDR)</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-400">
                    {srv.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-white">{srv.name}</p>
                    {srv.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                        {srv.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-xs font-medium text-slate-300 border border-slate-800">
                      ⏱ {srv.duration || 30} menit
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-xs">
                    {formatIDR(srv.price)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id, srv.name)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Jasa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah Jasa */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Paket Jasa Servis"
        description="Daftarkan paket pekerjaan teknisi beserta standar tarif pengerjaannya di PitCare Auto."
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kode Jasa (Unik) *
              </label>
              <input
                name="code"
                type="text"
                required
                placeholder="Contoh: SRV-009"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimasi Durasi (Menit) *
              </label>
              <input
                name="duration"
                type="number"
                required
                defaultValue={30}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Tindakan Jasa *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Contoh: Overhaul Transmisi CVT"
              className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tarif Jasa (Rp) *
            </label>
            <input
              name="price"
              type="number"
              required
              placeholder="Contoh: 75000"
              className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Deskripsi Pekerjaan (Opsional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Rincian prosedur teknis yang dikerjakan mekanik..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isPending ? "Menyimpan..." : "Simpan Jasa Servis"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
