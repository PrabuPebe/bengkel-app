"use client";

import { useState, useEffect, useTransition } from "react";
import { Header } from "@/components/dashboard/header";
import { Modal } from "@/components/ui/modal";
import { Customer } from "@/lib/types/database";
import {
  getCustomersAction,
  createCustomerAction,
  addVehicleAction,
  deleteCustomerAction,
} from "@/lib/actions/customers";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal State: Tambah Pelanggan
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal State: Tambah Kendaraan ke Pelanggan yang ada
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  async function loadCustomers(query?: string) {
    setIsLoading(true);
    try {
      const data = await getCustomersAction(query);
      setCustomers(data);
    } catch {
      console.error("Gagal memuat data pelanggan");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getCustomersAction().then((data) => {
      if (active) {
        setCustomers(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCustomers(searchQuery);
  }

  async function handleCreateCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createCustomerAction(formData);
      if (result.success) {
        setIsAddCustomerOpen(false);
        loadCustomers(searchQuery);
      } else {
        setFormError(result.error || "Gagal menyimpan data.");
      }
    });
  }

  async function handleAddVehicle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setFormError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addVehicleAction(selectedCustomerId, formData);
      if (result.success) {
        setSelectedCustomerId(null);
        loadCustomers(searchQuery);
      } else {
        setFormError(result.error || "Gagal menambahkan kendaraan.");
      }
    });
  }

  async function handleDeleteCustomer(id: string, name: string) {
    if (!confirm(`Hapus pelanggan "${name}" beserta seluruh data kendaraannya?`)) return;

    startTransition(async () => {
      const result = await deleteCustomerAction(id);
      if (result.success) {
        loadCustomers(searchQuery);
      } else {
        alert("Gagal menghapus pelanggan.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Header
        title="Master Pelanggan & Armada Kendaraan"
        subtitle="Kelola database pelanggan Bengkelku dan riwayat armada kendaraan roda dua maupun roda empat berstandar Pitstop."
        actionButton={
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setIsAddCustomerOpen(true);
            }}
            className="btn-cyan flex items-center gap-2 px-4 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            + Tambah Pelanggan
          </button>
        }
      />

      {/* Search Bar & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <input
            type="text"
            placeholder="Cari berdasarkan nama, nomor WhatsApp, plat nomor (contoh: B 4321 KAZ), atau merk unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-custom w-full h-11 pl-11 pr-4 text-xs"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none"
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
              loadCustomers("");
            }}
            className="btn-outline-steel px-4 h-11 text-xs cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Customers List / Table */}
      {isLoading ? (
        <div className="p-20 text-center text-slate-400 text-sm card-pitstop">
          <div className="w-8 h-8 border-2 border-[#00D2FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat master pelanggan Bengkelku...
        </div>
      ) : customers.length === 0 ? (
        <div className="p-16 text-center card-pitstop">
          <div className="w-14 h-14 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-center text-2xl mx-auto mb-4 text-[#00D2FF]">
            👥
          </div>
          <p className="text-base font-bold text-white mb-1">Tidak ditemukan data pelanggan</p>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            {searchQuery ? "Coba gunakan kata kunci pencarian lain." : "Belum ada data pelanggan yang terdaftar."}
          </p>
          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="btn-cyan px-5 py-2.5 text-xs cursor-pointer"
          >
            Daftarkan Pelanggan Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {customers.map((cust) => (
            <div
              key={cust.id}
              className="card-pitstop p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-[#00D2FF] border border-cyan-500/30 flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-black/40">
                    {cust.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base font-bold text-white tracking-tight">{cust.name}</h2>
                      <span className="badge-custom badge-steel">
                        {cust.vehicles.length} Kendaraan
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 mt-1.5 font-medium">
                      <a
                        href={`https://wa.me/${cust.phone.replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#00D2FF] font-bold hover:underline transition-colors font-mono"
                      >
                        <span>📱 {cust.phone}</span>
                      </a>
                      {cust.address && (
                        <span className="text-slate-400 truncate max-w-md">
                          📍 {cust.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end lg:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setSelectedCustomerName(cust.name);
                      setFormError("");
                    }}
                    className="btn-outline-steel px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    + Tambah Kendaraan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                    disabled={isPending}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                    title="Hapus Pelanggan"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Daftar Kendaraan Pelanggan */}
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF]" />
                  <span>Unit Kendaraan Terdaftar</span>
                </p>
                {cust.vehicles.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Belum ada armada kendaraan yang ditautkan.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {cust.vehicles.map((veh) => (
                      <div
                        key={veh.id}
                        className="p-3.5 rounded-xl bg-[#0F172A] border border-slate-800/90 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-black text-[#00D2FF] border border-cyan-500/40 tracking-wider shadow-[0_0_8px_rgba(0,210,255,0.12)]">
                              {veh.plateNumber}
                            </span>
                            {veh.year && (
                              <span className="text-[11px] font-mono text-slate-400">({veh.year})</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white mt-2">
                            {veh.brand} {veh.model}
                          </p>
                          {veh.notes && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                              {veh.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Pelanggan Baru */}
      <Modal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        title="Daftarkan Pelanggan & Kendaraan Baru"
        description="Masukkan data pemilik dan armada kendaraan pertamanya untuk dicatat ke database Bengkelku."
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#00D2FF] uppercase tracking-wider">
              1. Informasi Pelanggan
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Pelanggan *
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Contoh: Budi Gunawan"
                className="input-custom w-full h-10 px-3.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor WhatsApp (Aktif) *
              </label>
              <input
                name="phone"
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                className="input-custom w-full h-10 px-3.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat (Opsional)
              </label>
              <input
                name="address"
                type="text"
                placeholder="Contoh: Jl. Fatmawati No. 12"
                className="input-custom w-full h-10 px-3.5 text-xs"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-[#00D2FF] uppercase tracking-wider">
              2. Kendaraan Pertama (Opsional)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Polisi (Plat No)
                </label>
                <input
                  name="plateNumber"
                  type="text"
                  placeholder="B 1234 XYZ"
                  className="input-custom w-full h-10 px-3.5 text-xs uppercase font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tahun Pembuatan
                </label>
                <input
                  name="year"
                  type="number"
                  placeholder="2022"
                  className="input-custom w-full h-10 px-3.5 text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Merk Kendaraan
                </label>
                <input
                  name="brand"
                  type="text"
                  placeholder="Honda / Yamaha / Toyota"
                  className="input-custom w-full h-10 px-3.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipe / Model
                </label>
                <input
                  name="model"
                  type="text"
                  placeholder="Vario 160 / NMAX / Avanza"
                  className="input-custom w-full h-10 px-3.5 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(false)}
              className="btn-outline-steel px-4 py-2 text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-cyan px-5 py-2.5 text-xs cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Pelanggan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Kendaraan ke Pelanggan yang Ada */}
      <Modal
        isOpen={Boolean(selectedCustomerId)}
        onClose={() => setSelectedCustomerId(null)}
        title={`Tambah Kendaraan: ${selectedCustomerName}`}
        description="Daftarkan unit kendaraan lain milik pelanggan ini."
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor Polisi (Plat No) *
              </label>
              <input
                name="plateNumber"
                type="text"
                required
                placeholder="B 5678 ABC"
                className="input-custom w-full h-10 px-3.5 text-xs uppercase font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tahun Pembuatan
              </label>
              <input
                name="year"
                type="number"
                placeholder="2021"
                className="input-custom w-full h-10 px-3.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Merk Kendaraan *
              </label>
              <input
                name="brand"
                type="text"
                required
                placeholder="Contoh: Honda"
                className="input-custom w-full h-10 px-3.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipe / Model *
              </label>
              <input
                name="model"
                type="text"
                required
                placeholder="Contoh: Scoopy Prestige"
                className="input-custom w-full h-10 px-3.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan Khusus Kendaraan (Opsional)
            </label>
            <input
              name="notes"
              type="text"
              placeholder="Contoh: Rutin ganti oli per 2.000 KM"
              className="input-custom w-full h-10 px-3.5 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedCustomerId(null)}
              className="btn-outline-steel px-4 py-2 text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-cyan px-5 py-2.5 text-xs cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Menambahkan..." : "Tambah Unit Kendaraan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
