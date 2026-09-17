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
      maximumFractionDigits: 0,
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
    <div className="space-y-6">
      <Header
        title="Inventaris Suku Cadang (Sparepart)"
        subtitle="Kelola stok suku cadang Bengkelku, harga modal (HPP), harga jual konsumen, dan kontrol peringatan stok kritis otomatis."
        actionButton={
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setIsAddOpen(true);
            }}
            className="btn-cyan flex items-center gap-2 px-4 py-2.5 text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            + Tambah Suku Cadang
          </button>
        }
      />

      {/* Low stock alert badge banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 shadow-xl shadow-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            </span>
            <p className="text-xs font-semibold text-rose-200">
              Perhatian Gudang: <strong className="font-mono text-rose-400 font-bold">{lowStockCount} item</strong> suku cadang berada pada atau di bawah batas minimum stok!
            </p>
          </div>
          <span className="badge-custom badge-stok-kritis self-start sm:self-auto shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.35)]">
            ⚠️ Perlu Restock Segera
          </span>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/15 text-[#00D2FF] border border-cyan-500/50 shadow-[0_0_12px_rgba(0,210,255,0.18)]"
                    : "bg-[#0F172A] text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
                }`}
              >
                {cat === "all" ? "Semua Kategori" : cat}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari berdasarkan SKU, nama part (contoh: MPX2, Busi, V-Belt), atau lokasi rak..."
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
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                loadParts("", selectedCategory);
              }}
              className="btn-outline-steel px-4 h-11 text-xs cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Parts Table */}
      {isLoading ? (
        <div className="p-20 text-center text-slate-400 text-sm card-pitstop">
          <div className="w-8 h-8 border-2 border-[#00D2FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Memuat stok inventaris Bengkelku...
        </div>
      ) : parts.length === 0 ? (
        <div className="p-16 text-center card-pitstop">
          <div className="w-14 h-14 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-center text-2xl mx-auto mb-4 text-[#00D2FF]">
            📦
          </div>
          <p className="text-base font-bold text-white mb-1">Data suku cadang tidak ditemukan</p>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            {searchQuery ? "Coba ganti filter atau kata kunci pencarian." : "Belum ada data suku cadang di gudang."}
          </p>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="btn-cyan px-5 py-2.5 text-xs cursor-pointer"
          >
            Tambah Part Pertama
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto card-pitstop">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800">
              <tr>
                <th className="py-4 px-5">SKU & Lokasi</th>
                <th className="py-4 px-5">Nama Suku Cadang</th>
                <th className="py-4 px-5">Kategori</th>
                <th className="py-4 px-5 text-center">Status Stok</th>
                <th className="py-4 px-5 text-right">Harga Modal (HPP)</th>
                <th className="py-4 px-5 text-right">Harga Jual Konsumen</th>
                <th className="py-4 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {parts.map((part) => {
                const isLow = part.stock <= part.minStock;
                const margin = part.sellPrice - part.costPrice;
                const marginPercent = part.sellPrice > 0 ? Math.round((margin / part.sellPrice) * 100) : 0;

                return (
                  <tr key={part.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5">
                      <p className="font-mono font-bold text-xs">
                        <span className="px-2 py-0.5 rounded bg-black text-[#00D2FF] border border-cyan-500/40 shadow-[0_0_8px_rgba(0,210,255,0.12)]">
                          {part.sku}
                        </span>
                      </p>
                      {part.location && (
                        <p className="text-[11px] text-slate-400 mt-1 font-medium font-mono">📍 {part.location}</p>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-bold text-white text-sm">{part.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Satuan: <span className="font-mono text-slate-300">{part.unit}</span></p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="badge-custom badge-steel">
                        {part.category || "Umum"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      {isLow ? (
                        <span className="badge-custom badge-stok-kritis animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Sisa {part.stock} (Min: {part.minStock})
                        </span>
                      ) : (
                        <span className="badge-custom badge-selesai-pengerjaan">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {part.stock} {part.unit} (Aman)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right font-mono text-xs text-slate-400">
                      {formatIDR(part.costPrice)}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-black text-sm text-white">
                      {formatIDR(part.sellPrice)}
                      <span className="block text-[10px] text-emerald-400 font-semibold mt-0.5">
                        +{marginPercent}% margin
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustPart(part);
                            setNewStockVal(part.stock);
                          }}
                          className="btn-cyan px-3 py-1.5 text-xs cursor-pointer"
                          title="Ubah Jumlah Stok"
                        >
                          Atur Stok
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePart(part.id, part.name)}
                          disabled={isPending}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
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
        description="Tambahkan item sparepart baru ke inventaris gudang Bengkelku."
      >
        <form onSubmit={handleCreatePart} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kode SKU / Part *
              </label>
              <input
                name="sku"
                type="text"
                required
                placeholder="Contoh: OIL-SHELL-1L"
                className="input-custom w-full h-10 px-3.5 text-xs uppercase font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kategori *
              </label>
              <input
                name="category"
                type="text"
                required
                placeholder="Oli & Pelumas / Pengereman"
                className="input-custom w-full h-10 px-3.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Suku Cadang *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Contoh: Oli Shell Helix HX7 1L"
              className="input-custom w-full h-10 px-3.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stok Awal *
              </label>
              <input
                name="stock"
                type="number"
                required
                defaultValue={10}
                className="input-custom w-full h-10 px-3.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Batas Min. Stok *
              </label>
              <input
                name="minStock"
                type="number"
                required
                defaultValue={5}
                className="input-custom w-full h-10 px-3.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Satuan *
              </label>
              <input
                name="unit"
                type="text"
                required
                defaultValue="PCS"
                className="input-custom w-full h-10 px-3.5 text-xs uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Harga Modal / Beli (HPP)
              </label>
              <input
                name="costPrice"
                type="number"
                placeholder="45000"
                className="input-custom w-full h-10 px-3.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Harga Jual Konsumen *
              </label>
              <input
                name="sellPrice"
                type="number"
                required
                placeholder="60000"
                className="input-custom w-full h-10 px-3.5 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lokasi Penyimpanan (Rak/Laci)
            </label>
            <input
              name="location"
              type="text"
              placeholder="Contoh: Rak B3 / Laci 2"
              className="input-custom w-full h-10 px-3.5 text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
              className="btn-cyan px-5 py-2.5 text-xs cursor-pointer disabled:opacity-50"
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
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Jumlah Stok Aktual ({adjustPart?.unit})
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNewStockVal(Math.max(0, newStockVal - 1))}
                className="btn-outline-steel w-12 h-12 text-xl font-bold cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                value={newStockVal}
                onChange={(e) => setNewStockVal(parseInt(e.target.value, 10) || 0)}
                className="input-custom flex-1 h-12 text-center font-mono font-bold text-2xl text-white"
              />
              <button
                type="button"
                onClick={() => setNewStockVal(newStockVal + 1)}
                className="btn-outline-steel w-12 h-12 text-xl font-bold cursor-pointer"
              >
                +
              </button>
            </div>
            {adjustPart && newStockVal <= adjustPart.minStock && (
              <p className="text-xs text-rose-400 font-medium mt-2 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Jumlah ini berada pada atau di bawah batas minimum ({adjustPart.minStock} {adjustPart.unit}). Status otomatis ditandai kritis.</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setAdjustPart(null)}
              className="btn-outline-steel px-4 py-2 text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-cyan px-5 py-2.5 text-xs cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Memperbarui..." : "Simpan Perubahan Stok"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
