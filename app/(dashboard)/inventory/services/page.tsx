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
    <div>
      <Header
        title="Katalog Jasa & Tarif Servis"
        subtitle="Daftar tindakan perbaikan, tune up, penggantian pelumas, dan tarif jasa pengerjaan teknisi bengkel."
        actionButton={
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-lg shadow-[#8f63ec]/25 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Jasa Baru
          </button>
        }
      />

      {/* Search Input */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <input
            type="text"
            placeholder="Cari berdasarkan kode (contoh: SRV-001) atau nama jasa servis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#221939]/90 border border-[#d2b8ff]/15 text-[#f6f2ff] placeholder-[#817797] text-sm focus:outline-none focus:border-[#9b6cff] transition-all"
          />
          <svg
            className="w-5 h-5 text-[#817797] absolute left-3.5 top-3 pointer-events-none"
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
            className="px-3 h-11 rounded-xl text-xs font-semibold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Services Table Card */}
      {isLoading ? (
        <div className="p-12 text-center text-[#817797] text-sm">
          <div className="w-8 h-8 border-2 border-[#9b6cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat katalog jasa servis...
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#221939]/40 border border-[#d2b8ff]/10">
          <p className="text-base font-bold text-[#f6f2ff] mb-1">Katalog jasa masih kosong</p>
          <p className="text-xs text-[#817797] mb-4">
            {searchQuery ? "Tidak ada jasa yang sesuai kata kunci." : "Tambahkan paket servis pertama untuk bengkel Anda."}
          </p>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8f63ec]"
          >
            Tambah Jasa Baru
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#d2b8ff]/15 bg-[#221939]/80 shadow-xl shadow-black/30">
          <table className="w-full text-left text-sm text-[#d9d0eb]">
            <thead className="bg-[#1b142f] text-[11px] font-bold uppercase tracking-wider text-[#817797] border-b border-[#d2b8ff]/10">
              <tr>
                <th className="py-3.5 px-4">Kode Jasa</th>
                <th className="py-3.5 px-4">Nama Tindakan & Rincian</th>
                <th className="py-3.5 px-4">Estimasi Waktu</th>
                <th className="py-3.5 px-4 text-right">Tarif Jasa (IDR)</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d2b8ff]/10">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-[#2b1f47]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#c49eff]">
                    {srv.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#f6f2ff]">{srv.name}</p>
                    {srv.description && (
                      <p className="text-xs text-[#817797] mt-0.5 line-clamp-1 max-w-md">
                        {srv.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#17122b] text-xs font-semibold text-[#b5abc9] border border-[#d2b8ff]/10">
                      ⏱ {srv.duration || 30} menit
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#34d399] text-sm">
                    {formatIDR(srv.price)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id, srv.name)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-[#817797] hover:text-[#ffaeae] hover:bg-[#3a1525] transition-colors"
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
        description="Daftarkan paket pekerjaan teknisi beserta standar tarif pengerjaannya."
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#3a1525] border border-[#ffaeae]/30 text-[#ffaeae] text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Kode Jasa (Unik) *
              </label>
              <input
                name="code"
                type="text"
                required
                placeholder="Contoh: SRV-009"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm uppercase focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Estimasi Durasi (Menit) *
              </label>
              <input
                name="duration"
                type="number"
                required
                defaultValue={30}
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
              Nama Tindakan Jasa *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Contoh: Overhaul Transmisi CVT"
              className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
              Tarif Jasa (Rp) *
            </label>
            <input
              name="price"
              type="number"
              required
              placeholder="Contoh: 75000"
              className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm font-mono focus:outline-none focus:border-[#9b6cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
              Deskripsi Pekerjaan (Opsional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Langkah-langkah yang dikerjakan mekanik..."
              className="w-full p-3 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d2b8ff]/10">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#817797] hover:text-[#f6f2ff] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-md shadow-[#8f63ec]/30 transition-all cursor-pointer"
            >
              {isPending ? "Menyimpan..." : "Simpan Jasa Servis"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
