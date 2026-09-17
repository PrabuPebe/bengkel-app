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
            className="btn-sage flex items-center gap-2 px-4 py-2.5 text-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
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
            placeholder="Cari berdasarkan kode (contoh: SRV-001) atau nama tindakan jasa servis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-custom w-full h-11 pl-11 pr-4 text-xs"
          />
          <svg
            className="w-4 h-4 text-[#412D15] absolute left-4 top-3.5 pointer-events-none"
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
            className="btn-outline-steel px-4 h-11 text-xs cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Services Table Card */}
      {isLoading ? (
        <div className="p-20 text-center text-[#412D15] text-sm card-floating">
          <div className="w-8 h-8 border-2 border-[#412D15] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat katalog jasa servis PitCare Auto...
        </div>
      ) : services.length === 0 ? (
        <div className="p-16 text-center card-floating">
          <div className="w-14 h-14 rounded-2xl bg-[#000000] border border-[#412D15]/40 flex items-center justify-center text-2xl mx-auto mb-4 text-white">
            🔧
          </div>
          <p className="text-base font-bold text-[#1F150C] mb-1">Katalog jasa masih kosong</p>
          <p className="text-xs text-[#412D15] mb-6 max-w-sm mx-auto">
            {searchQuery ? "Tidak ada jasa yang sesuai kata kunci." : "Tambahkan paket servis pertama untuk PitCare Auto."}
          </p>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="btn-sage px-5 py-2.5 text-xs cursor-pointer"
          >
            Tambah Jasa Baru
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto card-floating">
          <table className="w-full text-left text-xs text-[#1F150C]">
            <thead className="bg-[#000000] text-[11px] font-bold uppercase tracking-wider text-white border-b border-[#412D15]/30">
              <tr>
                <th className="py-4 px-5">Kode Jasa</th>
                <th className="py-4 px-5">Nama Tindakan & Rincian Prosedur</th>
                <th className="py-4 px-5">Estimasi Durasi</th>
                <th className="py-4 px-5 text-right">Standar Tarif (IDR)</th>
                <th className="py-4 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#412D15]/10">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="py-4 px-5 font-mono font-bold text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-[#1F150C] text-white">
                      {srv.code}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <p className="font-bold text-[#1F150C] text-sm">{srv.name}</p>
                    {srv.description && (
                      <p className="text-[11px] text-[#412D15] mt-1 line-clamp-1 max-w-md">
                        {srv.description}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <span className="badge-custom badge-steel">
                      ⏱ {srv.duration || 30} Menit
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-black text-sm text-[#1F150C]">
                    {formatIDR(srv.price)}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id, srv.name)}
                      disabled={isPending}
                      className="p-2 rounded-xl text-[#412D15] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F150C] mb-1">
                Kode Jasa (Unik) *
              </label>
              <input
                name="code"
                type="text"
                required
                placeholder="Contoh: SRV-009"
                className="input-custom w-full h-10 px-3.5 text-xs uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F150C] mb-1">
                Estimasi Durasi (Menit) *
              </label>
              <input
                name="duration"
                type="number"
                required
                defaultValue={30}
                className="input-custom w-full h-10 px-3.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F150C] mb-1">
              Nama Tindakan Jasa *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Contoh: Overhaul Transmisi CVT"
              className="input-custom w-full h-10 px-3.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F150C] mb-1">
              Standar Tarif Jasa (Rp) *
            </label>
            <input
              name="price"
              type="number"
              required
              placeholder="Contoh: 75000"
              className="input-custom w-full h-10 px-3.5 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F150C] mb-1">
              Deskripsi Prosedur (Opsional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Rincian prosedur teknis yang dikerjakan mekanik..."
              className="input-custom w-full p-3 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#412D15]/15">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="btn-outline-steel px-4 py-2 text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-sage px-5 py-2.5 text-xs cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Jasa Servis"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
