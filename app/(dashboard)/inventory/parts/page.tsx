"use client";

import { useState, useEffect, useTransition } from "react";
import { Header } from "@/components/dashboard/header";
import { Modal } from "@/components/ui/modal";
import { PartsInventory } from "@/lib/types/database";
import {
  getPartsAction,
  createPartAction,
  updatePartStockAction,
  deletePartAction,
} from "@/lib/actions/parts";

export default function PartsInventoryPage() {
  const [parts, setParts] = useState<PartsInventory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formError, setFormError] = useState("");

  // Quick adjust stock modal
  const [adjustPart, setAdjustPart] = useState<PartsInventory | null>(null);
  const [newStockVal, setNewStockVal] = useState(0);

  async function loadParts(query?: string, category?: string) {
    setIsLoading(true);
    try {
      const data = await getPartsAction(query, category);
      setParts(data);
    } catch {
      console.error("Gagal memuat inventaris suku cadang");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getPartsAction().then((data) => {
      if (active) {
        setParts(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function handleFilter(category: string) {
    setSelectedCategory(category);
    loadParts(searchQuery, category);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadParts(searchQuery, selectedCategory);
  }

  async function handleCreatePart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createPartAction(formData);
      if (result.success) {
        setIsAddOpen(false);
        loadParts(searchQuery, selectedCategory);
      } else {
        setFormError(result.error || "Gagal menyimpan suku cadang.");
      }
    });
  }

  async function handleUpdateStock(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustPart) return;

    startTransition(async () => {
      const result = await updatePartStockAction(adjustPart.id, newStockVal);
      if (result.success) {
        setAdjustPart(null);
        loadParts(searchQuery, selectedCategory);
      } else {
        alert(result.error || "Gagal memperbarui stok.");
      }
    });
  }

  async function handleDeletePart(id: string, name: string) {
    if (!confirm(`Hapus suku cadang "${name}" dari inventaris?`)) return;

    startTransition(async () => {
      const result = await deletePartAction(id);
      if (result.success) {
        loadParts(searchQuery, selectedCategory);
      } else {
        alert("Gagal menghapus part.");
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

  const categories = [
    "all",
    "Oli & Pelumas",
    "Pengereman",
    "Pengapian",
    "Penggerak CVT",
    "Filter",
    "Pendingin",
  ];

  const lowStockCount = parts.filter((p) => p.stock <= p.minStock).length;

  return (
    <div>
      <Header
        title="Inventaris Suku Cadang (Sparepart)"
        subtitle="Kelola stok suku cadang, harga modal (HPP), harga jual, dan kontrol peringatan stok kritis otomatis."
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
            Tambah Suku Cadang
          </button>
        }
      />

      {/* Low stock alert badge banner */}
      {lowStockCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-[#381624] border border-[#ff7b92]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4d6d] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff4d6d]" />
            </span>
            <p className="text-xs font-bold text-[#ffb0c0]">
              Perhatian: {lowStockCount} item suku cadang telah mencapai atau berada di bawah batas minimum stok!
            </p>
          </div>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-[#9b6cff] text-white shadow-md shadow-[#9b6cff]/30"
                  : "bg-[#221939] text-[#b5abc9] hover:text-white hover:bg-[#2b1f47] border border-[#d2b8ff]/10"
              }`}
            >
              {cat === "all" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari berdasarkan SKU, nama part (contoh: MPX2, Busi, V-Belt), atau rak..."
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
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                loadParts("", selectedCategory);
              }}
              className="px-3 h-11 rounded-xl text-xs font-semibold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] transition-colors"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Parts Table */}
      {isLoading ? (
        <div className="p-12 text-center text-[#817797] text-sm">
          <div className="w-8 h-8 border-2 border-[#9b6cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat stok inventaris suku cadang...
        </div>
      ) : parts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#221939]/40 border border-[#d2b8ff]/10">
          <p className="text-base font-bold text-[#f6f2ff] mb-1">Data suku cadang tidak ditemukan</p>
          <p className="text-xs text-[#817797] mb-4">
            {searchQuery ? "Coba ganti filter atau kata kunci pencarian." : "Belum ada data suku cadang di gudang."}
          </p>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8f63ec]"
          >
            Tambah Part Pertama
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#d2b8ff]/15 bg-[#221939]/80 shadow-xl shadow-black/30">
          <table className="w-full text-left text-sm text-[#d9d0eb]">
            <thead className="bg-[#1b142f] text-[11px] font-bold uppercase tracking-wider text-[#817797] border-b border-[#d2b8ff]/10">
              <tr>
                <th className="py-3.5 px-4">SKU & Lokasi</th>
                <th className="py-3.5 px-4">Nama Suku Cadang</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-center">Status Stok</th>
                <th className="py-3.5 px-4 text-right">Harga Modal (HPP)</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d2b8ff]/10">
              {parts.map((part) => {
                const isLow = part.stock <= part.minStock;
                const margin = part.sellPrice - part.costPrice;
                const marginPercent = part.sellPrice > 0 ? Math.round((margin / part.sellPrice) * 100) : 0;

                return (
                  <tr key={part.id} className="hover:bg-[#2b1f47]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-xs text-[#c49eff]">{part.sku}</p>
                      {part.location && (
                        <p className="text-[11px] text-[#817797] mt-0.5">📍 {part.location}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#f6f2ff]">{part.name}</p>
                      <p className="text-[11px] text-[#817797] mt-0.5">Satuan: {part.unit}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-[#17122b] text-[#b5abc9] border border-[#d2b8ff]/10">
                        {part.category || "Umum"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#42162a] border border-[#ff7b92]/40 text-[#ff8da1] text-xs font-bold animate-pulse">
                          ⚠️ Sisa {part.stock} (Min: {part.minStock})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#163629] border border-[#34d399]/30 text-[#34d399] text-xs font-semibold">
                          ✓ {part.stock} {part.unit} (Aman)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-[#817797]">
                      {formatIDR(part.costPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#f6f2ff]">
                      {formatIDR(part.sellPrice)}
                      <span className="block text-[10px] text-[#34d399] font-normal">
                        +{marginPercent}% margin
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustPart(part);
                            setNewStockVal(part.stock);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#c49eff] bg-[#2e2150] hover:bg-[#382666] transition-colors"
                          title="Ubah Jumlah Stok"
                        >
                          Atur Stok
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePart(part.id, part.name)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-[#817797] hover:text-[#ffaeae] hover:bg-[#3a1525] transition-colors"
                          title="Hapus Part"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah Suku Cadang */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Daftarkan Suku Cadang Baru"
        description="Tambahkan item sparepart baru ke inventaris gudang bengkel."
      >
        <form onSubmit={handleCreatePart} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#3a1525] border border-[#ffaeae]/30 text-[#ffaeae] text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Kode SKU / Part *
              </label>
              <input
                name="sku"
                type="text"
                required
                placeholder="Contoh: OIL-SHELL-1L"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm uppercase focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Kategori *
              </label>
              <input
                name="category"
                type="text"
                required
                placeholder="Oli & Pelumas / Pengereman"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
              Nama Suku Cadang *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Contoh: Oli Shell Helix HX7 1L"
              className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Stok Awal *
              </label>
              <input
                name="stock"
                type="number"
                required
                defaultValue={10}
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Batas Min. Stok *
              </label>
              <input
                name="minStock"
                type="number"
                required
                defaultValue={5}
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Satuan *
              </label>
              <input
                name="unit"
                type="text"
                required
                defaultValue="PCS"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm uppercase focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Harga Modal / Beli (HPP)
              </label>
              <input
                name="costPrice"
                type="number"
                placeholder="45000"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm font-mono focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
                Harga Jual Konsumen *
              </label>
              <input
                name="sellPrice"
                type="number"
                required
                placeholder="60000"
                className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm font-mono focus:outline-none focus:border-[#9b6cff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-1">
              Lokasi Penyimpanan (Rak/Laci)
            </label>
            <input
              name="location"
              type="text"
              placeholder="Contoh: Rak B3 / Laci 2"
              className="w-full h-10 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-sm focus:outline-none focus:border-[#9b6cff]"
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
              {isPending ? "Menyimpan..." : "Simpan Suku Cadang"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Quick Adjust Stock */}
      <Modal
        isOpen={Boolean(adjustPart)}
        onClose={() => setAdjustPart(null)}
        title={`Ubah Stok: ${adjustPart?.name}`}
        description={`SKU: ${adjustPart?.sku} | Batas Minimum: ${adjustPart?.minStock} ${adjustPart?.unit}`}
      >
        <form onSubmit={handleUpdateStock} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#d9d0eb] mb-2">
              Jumlah Stok Aktual ({adjustPart?.unit})
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNewStockVal(Math.max(0, newStockVal - 1))}
                className="w-11 h-11 rounded-xl bg-[#2e2150] text-[#f6f2ff] text-lg font-black hover:bg-[#3d2c69] transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                value={newStockVal}
                onChange={(e) => setNewStockVal(parseInt(e.target.value, 10) || 0)}
                className="flex-1 h-11 text-center font-mono font-bold text-xl rounded-xl bg-[#17122b] border border-[#d2b8ff]/20 text-[#f6f2ff] focus:outline-none focus:border-[#9b6cff]"
              />
              <button
                type="button"
                onClick={() => setNewStockVal(newStockVal + 1)}
                className="w-11 h-11 rounded-xl bg-[#2e2150] text-[#f6f2ff] text-lg font-black hover:bg-[#3d2c69] transition-colors"
              >
                +
              </button>
            </div>
            {adjustPart && newStockVal <= adjustPart.minStock && (
              <p className="text-xs text-[#ff8da1] font-semibold mt-2">
                ⚠️ Jumlah ini sama dengan atau di bawah batas minimum ({adjustPart.minStock} {adjustPart.unit}). Status akan ditandai stok menipis.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#d2b8ff]/10">
            <button
              type="button"
              onClick={() => setAdjustPart(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#817797] hover:text-[#f6f2ff] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-md shadow-[#8f63ec]/30 transition-all cursor-pointer"
            >
              {isPending ? "Memperbarui..." : "Simpan Perubahan Stok"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
