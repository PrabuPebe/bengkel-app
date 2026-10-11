"use client";

import { useState, useEffect, useTransition } from "react";
import { Header } from "@/components/dashboard/header";
import { Modal } from "@/components/ui/modal";
import { PartsInventory } from "@/lib/types/database";
import {
  getPartsAction,
  createPartAction,
  restockPartAction,
  deletePartAction,
} from "@/lib/actions/parts";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const CATEGORY_OPTIONS = [
  "Oli & Pelumas",
  "Pengereman",
  "Penggerak CVT",
  "Pengapian",
  "Filter",
  "Pendingin",
  "Kelistrikan",
  "Roda & Ban",
  "Lain-lain",
];

export default function PartsInventoryPage() {
  const [parts, setParts] = useState<PartsInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "safe">("all");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedPartForRestock, setSelectedPartForRestock] = useState<PartsInventory | null>(null);

  // Form state: Restock
  const [restockQty, setRestockQty] = useState<string>("5");
  const [restockNotes, setRestockNotes] = useState("");

  // Toast & Error state
  const [toastMessage, setToastMessage] = useState("");
  const [formError, setFormError] = useState("");

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function loadParts() {
    setIsLoading(true);
    getPartsAction()
      .then((data) => {
        setParts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load parts:", err);
        setIsLoading(false);
      });
  }

  useEffect(() => {
    loadParts();
  }, []);

  // Filtered Parts
  const filteredParts = parts.filter((part) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = part.name.toLowerCase().includes(q);
      const matchSku = part.sku.toLowerCase().includes(q);
      const matchCat = (part.category || "").toLowerCase().includes(q);
      const matchLoc = (part.location || "").toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCat && !matchLoc) return false;
    }

    // Category filter
    if (selectedCategory !== "all" && part.category !== selectedCategory) {
      return false;
    }

    // Stock level filter
    const isLow = part.stock <= part.minStock;
    if (stockFilter === "low" && !isLow) return false;
    if (stockFilter === "safe" && isLow) return false;

    return true;
  });

  // Summary Metrics
  const totalItems = parts.length;
  const totalPhysicalStock = parts.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = parts.filter((p) => p.stock <= p.minStock).length;
  const totalAssetValue = parts.reduce((sum, p) => sum + p.costPrice * p.stock, 0);

  // Handler: Tambah Suku Cadang Baru
  async function handleCreatePart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createPartAction(formData);
      if (res.success && res.data) {
        setIsCreateModalOpen(false);
        form.reset();
        showToast(`✓ Suku cadang "${res.data.name}" berhasil ditambahkan.`);
        loadParts();
      } else {
        setFormError(res.error || "Gagal menyimpan suku cadang baru.");
      }
    });
  }

  // Handler: Restock / Tambah Stok Masuk
  function openRestockModal(part?: PartsInventory) {
    setFormError("");
    setSelectedPartForRestock(part || (parts.length > 0 ? parts[0] : null));
    setRestockQty("5");
    setRestockNotes("");
    setIsRestockModalOpen(true);
  }

  async function handleRestockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPartForRestock) {
      setFormError("Silakan pilih suku cadang yang akan direstock.");
      return;
    }

    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setFormError("Jumlah stok masuk harus lebih dari 0.");
      return;
    }

    setFormError("");
    startTransition(async () => {
      const res = await restockPartAction(selectedPartForRestock.id, qty);
      if (res.success && res.data) {
        setIsRestockModalOpen(false);
        showToast(
          `✓ Berhasil restock ${qty} unit ${res.data.name}. Stok sekarang: ${res.data.stock} ${res.data.unit}.`
        );
        loadParts();
      } else {
        setFormError(res.error || "Gagal memperbarui stok barang masuk.");
      }
    });
  }

  // Handler: Hapus Part
  function handleDeletePart(id: string, name: string) {
    if (!confirm(`Hapus suku cadang "${name}" dari sistem bengkel?`)) return;
    startTransition(async () => {
      const res = await deletePartAction(id);
      if (res.success) {
        showToast(`✓ Suku cadang "${name}" telah dihapus.`);
        loadParts();
      } else {
        alert(res.error || "Gagal menghapus suku cadang.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Header
        title="Manajemen Stok Suku Cadang"
        subtitle="Pantau stok fisik di bengkel, batas minimum peringatan kulakan, HPP modal, dan catat restock kiriman distributor."
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openRestockModal()}
              className="btn-ghost flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + Restock Barang Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setIsCreateModalOpen(true);
              }}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Part Baru
            </button>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage("")}
            className="text-emerald-700 hover:text-emerald-900 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Macam Suku Cadang</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{totalItems}</p>
          <p className="text-xs text-slate-400 mt-1">Total jenis part terdaftar di katalog</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Unit Fisik</span>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{totalPhysicalStock}</p>
          <p className="text-xs text-slate-400 mt-1">Akumulasi seluruh barang di rak bengkel</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Stok Menipis / Kulakan</span>
            {lowStockCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Perhatian
              </span>
            )}
          </div>
          <p
            className={`text-2xl font-bold tabular-nums mt-1 ${
              lowStockCount > 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {lowStockCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Part mencapai batas minimum (minStock)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Estimasi Nilai HPP Gudang</span>
          <p className="text-xl font-bold text-slate-900 tabular-nums font-mono mt-1">
            {formatRupiah(totalAssetValue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total modal terikat pada suku cadang</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Cari SKU, nama suku cadang, atau lokasi rak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark w-full pl-9 pr-3.5 text-xs"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Stock Level Selector */}
          <div className="bg-slate-100 p-1 rounded-lg inline-flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setStockFilter("all")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === "all"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({parts.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("low")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === "low"
                  ? "bg-white text-rose-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-rose-700"
              }`}
            >
              Menipis ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter("safe")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === "safe"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              Aman ({parts.length - lowStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Parts Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            Memuat data inventaris suku cadang PitCare Auto...
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-sm font-semibold text-slate-800">
              Tidak ada suku cadang yang sesuai pencarian
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau klik tombol "Tambah Part Baru" di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">SKU / Kode</th>
                  <th className="py-3 px-4">Nama Suku Cadang</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Stok Fisik</th>
                  <th className="py-3 px-4 text-center">Batas Min</th>
                  <th className="py-3 px-4 text-right">HPP (Modal)</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.map((part) => {
                  const isLow = part.stock <= part.minStock;
                  return (
                    <tr
                      key={part.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {part.sku}
                        </span>
                      </td>

                      {/* Nama Part & Lokasi Rak */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{part.name}</p>
                        {part.location && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            📍 Lokasi: {part.location}
                          </p>
                        )}
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {part.category || "Lain-lain"}
                      </td>

                      {/* Stok Fisik */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold tabular-nums text-sm ${
                            isLow ? "text-rose-600" : "text-slate-900"
                          }`}
                        >
                          {part.stock}
                        </span>{" "}
                        <span className="text-[10px] text-slate-400">{part.unit}</span>
                      </td>

                      {/* Batas Min (minStock) */}
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-500">
                        {part.minStock} {part.unit}
                      </td>

                      {/* HPP Modal */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatRupiah(part.costPrice)}
                      </td>

                      {/* Harga Jual */}
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {formatRupiah(part.sellPrice)}
                      </td>

                      {/* Status: Aman vs Stok Menipis */}
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Stok Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aman
                          </span>
                        )}
                      </td>

                      {/* Tindakan */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRestockModal(part)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-200"
                            title="Restock / Tambah Stok Masuk"
                          >
                            + Restock
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePart(part.id, part.name)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus suku cadang"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>

      {/* ========================================================
          MODAL 1: TAMBAH SUKU CADANG BARU
          ======================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tambah Suku Cadang Baru"
        description="Daftarkan SKU baru ke katalog gudang PitCare Auto."
      >
        <form onSubmit={handleCreatePart} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              ⚠️ {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="label-dark">SKU / Kode Part *</label>
              <input
                type="text"
                name="sku"
                required
                placeholder="Contoh: OIL-MPX2-800"
                className="input-dark font-mono uppercase"
              />
            </div>
            <div>
              <label className="label-dark">Kategori Part</label>
              <select name="category" className="input-dark" defaultValue="Oli & Pelumas">
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-dark">Nama Suku Cadang *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Oli AHM MPX2 0.8L (Matic)"
              className="input-dark"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="label-dark">Stok Awal Fisik *</label>
              <input
                type="number"
                name="stock"
                defaultValue={10}
                min={0}
                required
                className="input-dark font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="label-dark">Batas Min (Peringatan) *</label>
              <input
                type="number"
                name="minStock"
                defaultValue={5}
                min={1}
                required
                className="input-dark font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="label-dark">Satuan Barang</label>
              <select name="unit" className="input-dark" defaultValue="BOTOL">
                <option value="BOTOL">BOTOL</option>
                <option value="PCS">PCS</option>
                <option value="SET">SET</option>
                <option value="LITER">LITER</option>
                <option value="TUBE">TUBE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="label-dark">HPP / Harga Modal Beli (Rp) *</label>
              <input
                type="number"
                name="costPrice"
                defaultValue={45000}
                min={0}
                required
                placeholder="45000"
                className="input-dark font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="label-dark">Harga Jual ke Pelanggan (Rp) *</label>
              <input
                type="number"
                name="sellPrice"
                defaultValue={58000}
                min={0}
                required
                placeholder="58000"
                className="input-dark font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="label-dark">Lokasi Rak / Penyimpanan (Opsional)</label>
            <input
              type="text"
              name="location"
              placeholder="Contoh: Rak A1, Laci B2"
              className="input-dark"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn-ghost text-xs px-3.5 py-2 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary text-xs px-4 py-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Suku Cadang"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          MODAL 2: RESTOCK / TAMBAH STOK MASUK
          ======================================================== */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title="Restock / Tambah Stok Masuk"
        description="Catat barang masuk dari distributor atau kulakan untuk menambah stok fisik di gudang."
      >
        <form onSubmit={handleRestockSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label className="label-dark">Pilih Suku Cadang *</label>
            <select
              value={selectedPartForRestock?.id || ""}
              onChange={(e) => {
                const found = parts.find((p) => p.id === e.target.value);
                setSelectedPartForRestock(found || null);
              }}
              className="input-dark font-medium"
              required
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedPartForRestock && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Stok Fisik Saat Ini:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {selectedPartForRestock.stock} {selectedPartForRestock.unit}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Batas Minimum (minStock):</span>
                <span className="font-mono text-slate-700 tabular-nums">
                  {selectedPartForRestock.minStock} {selectedPartForRestock.unit}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Harga Beli (HPP):</span>
                <span className="font-mono text-slate-700 tabular-nums">
                  {formatRupiah(selectedPartForRestock.costPrice)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="label-dark">Jumlah Stok Masuk (Unit) *</label>
            <input
              type="number"
              min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              required
              placeholder="Contoh: 10"
              className="input-dark font-mono text-base font-bold tabular-nums"
            />
            {selectedPartForRestock && parseInt(restockQty, 10) > 0 && (
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                → Stok setelah restock menjadi:{" "}
                <span className="font-bold">
                  {selectedPartForRestock.stock + parseInt(restockQty, 10)}{" "}
                  {selectedPartForRestock.unit}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="label-dark">Catatan Restock / No. Surat Jalan (Opsional)</label>
            <input
              type="text"
              value={restockNotes}
              onChange={(e) => setRestockNotes(e.target.value)}
              placeholder="Contoh: Kulakan Astra Otoparts No. SJ-882"
              className="input-dark"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRestockModalOpen(false)}
              className="btn-ghost text-xs px-3.5 py-2 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary text-xs px-4 py-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Memproses Restock..." : "Konfirmasi Stok Masuk"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
