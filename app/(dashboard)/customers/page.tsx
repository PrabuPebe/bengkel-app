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
    <div>
      <Header
        title="Master Data Pelanggan & Kendaraan"
        subtitle="Kelola database pemilik kendaraan dan riwayat unit motor/mobil yang terdaftar di bengkel."
        actionButton={
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setIsAddCustomerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-lg shadow-[#8f63ec]/25 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pelanggan
          </button>
        }
      />

      {/* Search Bar & Filter */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <input
            type="text"
            placeholder="Cari berdasarkan nama, WhatsApp, plat nomor (contoh: B 4321 KAZ), atau tipe motor..."
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
              loadCustomers("");
            }}
            className="px-3 h-11 rounded-xl text-xs font-semibold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Customers List / Table */}
      {isLoading ? (
        <div className="p-12 text-center text-[#817797] text-sm">
          <div className="w-8 h-8 border-2 border-[#9b6cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat data pelanggan...
        </div>
      ) : customers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#221939]/40 border border-[#d2b8ff]/10">
          <p className="text-base font-bold text-[#f6f2ff] mb-1">Tidak ditemukan data pelanggan</p>
          <p className="text-xs text-[#817797] mb-4">
            {searchQuery ? "Coba gunakan kata kunci pencarian lain." : "Belum ada data pelanggan yang terdaftar."}
          </p>
          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8f63ec]"
          >
            Daftarkan Pelanggan Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {customers.map((cust) => (
            <div
              key={cust.id}
              className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 hover:border-[#9b6cff]/40 transition-all shadow-lg shadow-black/20"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#d2b8ff]/10">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7044c7] to-[#a477f3] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {cust.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-[#f6f2ff]">{cust.name}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2e2150] text-[#c49eff] font-bold">
                        {cust.vehicles.length} Kendaraan
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#b5abc9] mt-1">
                      <span className="flex items-center gap-1.5 text-[#34d399] font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {cust.phone}
                      </span>
                      {cust.address && (
                        <span className="text-[#817797] truncate max-w-md">
                          📍 {cust.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setSelectedCustomerName(cust.name);
                      setFormError("");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] transition-colors"
                  >
                    + Tambah Kendaraan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-[#817797] hover:text-[#ffaeae] hover:bg-[#3a1525] transition-colors"
                    title="Hapus Pelanggan"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Daftar Kendaraan Pelanggan */}
              <div className="mt-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#817797] mb-2">
                  Kendaraan Terdaftar
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {cust.vehicles.map((veh) => (
                    <div
                      key={veh.id}
                      className="p-3 rounded-xl bg-[#17122b] border border-[#d2b8ff]/10 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#2e2150] text-[#f6f2ff] tracking-wider border border-[#9b6cff]/30">
                            {veh.plateNumber}
                          </span>
                          {veh.year && (
                            <span className="text-[11px] text-[#817797]">({veh.year})</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-[#d9d0eb] mt-1">
                          {veh.brand} {veh.model}
                        </p>
                        {veh.notes && (
                          <p className="text-[10px] text-[#817797] mt-0.5 truncate max-w-[180px]">
                            {veh.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
        description="Masukkan data pemilik dan kendaraan pertamanya untuk memulai pencatatan bengkel."
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#3a1525] border border-[#ffaeae]/30 text-[#ffaeae] text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#c49eff] uppercase tracking-wider">
              1. Informasi Pelanggan
            </h3>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Nama Pelanggan *
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Contoh: Budi Gunawan"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Nomor WhatsApp (Aktif) *
              </label>
              <input
                name="phone"
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Alamat (Opsional)
              </label>
              <input
                name="address"
                type="text"
                placeholder="Contoh: Jl. Fatmawati No. 12"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#d2b8ff]/10">
            <h3 className="text-xs font-bold text-[#c49eff] uppercase tracking-wider">
              2. Kendaraan Pertama (Opsional / Langsung Didaftarkan)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                  Nomor Polisi (Plat No)
                </label>
                <input
                  name="plateNumber"
                  type="text"
                  placeholder="B 1234 XYZ"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm uppercase focus:outline-none focus:border-[#9b6cff]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                  Tahun Pembuatan
                </label>
                <input
                  name="year"
                  type="number"
                  placeholder="2022"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                  Merk Kendaraan
                </label>
                <input
                  name="brand"
                  type="text"
                  placeholder="Honda / Yamaha / Toyota"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                  Tipe / Model
                </label>
                <input
                  name="model"
                  type="text"
                  placeholder="Vario 160 / NMAX / Avanza"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d2b8ff]/10">
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#817797] hover:text-[#f6f2ff] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-md shadow-[#8f63ec]/30 transition-all cursor-pointer"
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
            <div className="p-3 rounded-xl bg-[#3a1525] border border-[#ffaeae]/30 text-[#ffaeae] text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Nomor Polisi (Plat No) *
              </label>
              <input
                name="plateNumber"
                type="text"
                required
                placeholder="B 5678 ABC"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm uppercase focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Tahun Pembuatan
              </label>
              <input
                name="year"
                type="number"
                placeholder="2021"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Merk Kendaraan *
              </label>
              <input
                name="brand"
                type="text"
                required
                placeholder="Contoh: Honda"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Tipe / Model *
              </label>
              <input
                name="model"
                type="text"
                required
                placeholder="Contoh: Scoopy Prestige"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
              Catatan Khusus Kendaraan (Opsional)
            </label>
            <input
              name="notes"
              type="text"
              placeholder="Contoh: Rutin ganti oli per 2.000 KM"
              className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d2b8ff]/10">
            <button
              type="button"
              onClick={() => setSelectedCustomerId(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#817797] hover:text-[#f6f2ff] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-md shadow-[#8f63ec]/30 transition-all cursor-pointer"
            >
              {isPending ? "Menambahkan..." : "Tambah Unit Kendaraan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
