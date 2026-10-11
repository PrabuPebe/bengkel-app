"use client";

import { use, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ServiceOrder, PaymentMethod } from "@/lib/types/database";
import { getServiceOrderByIdAction, checkoutBillingAction } from "@/lib/actions/orders";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CashierBillingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Payment checkout states
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paidAmountInput, setPaidAmountInput] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState("");

  // Print modal & format states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<"THERMAL" | "A4">("THERMAL");

  useEffect(() => {
    let active = true;
    getServiceOrderByIdAction(resolvedParams.id).then((data) => {
      if (active) {
        if (data) {
          setOrder(data);
          setDiscount(data.discount || 0);
          if (data.paymentStatus === "PAID") {
            setPaymentMethod(data.paymentMethod || "CASH");
            setPaidAmountInput(String(data.paidAmount));
          }
        }
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-500 text-sm print:hidden bg-white border border-slate-200 rounded-xl shadow-xs">
        Memuat rincian nota kasir PitCare Auto...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center rounded-xl bg-white border border-slate-200 shadow-xs max-w-lg mx-auto print:hidden">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Nota Servis Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mb-6">
          Nomor nota yang Anda cari tidak tersedia dalam sistem PitCare Auto.
        </p>
        <Link href="/cashier" className="btn-primary inline-flex items-center px-4 py-2 text-xs">
          ← Kembali ke Daftar Kasir
        </Link>
      </div>
    );
  }

  const isAlreadyPaid = order.paymentStatus === "PAID";
  const subtotalCombined = order.totalServices + order.totalParts;
  const currentGrandTotal = Math.max(0, subtotalCombined - (discount || 0));
  const numericPaidAmount = parseFloat(paidAmountInput) || 0;
  const changeAmount = Math.max(0, numericPaidAmount - currentGrandTotal);

  function handleQuickCash(amount: number) {
    setPaidAmountInput(String(amount));
  }

  function handleMethodChange(method: PaymentMethod) {
    setPaymentMethod(method);
    if (method === "TRANSFER" || method === "QRIS") {
      setPaidAmountInput(String(currentGrandTotal));
    }
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutError("");

    if (numericPaidAmount < currentGrandTotal) {
      setCheckoutError(
        `Nominal pembayaran kurang! Masukkan minimal ${formatRupiah(currentGrandTotal)}`
      );
      return;
    }

    startTransition(async () => {
      const res = await checkoutBillingAction(order!.id, {
        paymentMethod,
        discount: discount || 0,
        paidAmount: numericPaidAmount,
      });

      if (res.success && res.data) {
        setOrder(res.data);
        setIsPrintModalOpen(true); // Langsung buka pratinjau cetak struk setelah sukses
        router.refresh();
      } else {
        setCheckoutError(res.error || "Gagal menyelesaikan pembayaran kasir.");
      }
    });
  }

  function handleTriggerDirectPrint() {
    window.print();
  }

  return (
    <div>
      {/* Top Navigation & Status Bar (Hidden on Print) */}
      <div className="print:hidden mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cashier"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Kembali ke Kasir"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                Nota Pembayaran Servis #{order.orderNumber}
              </h1>
              {isAlreadyPaid ? (
                <span className="badge-selesai-pembayaran">Lunas</span>
              ) : (
                <span className="badge-antrian">Menunggu Pembayaran</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pelanggan: <strong className="text-slate-800">{order.customer?.name}</strong> • Motor:{" "}
              <strong className="font-mono text-slate-800">{order.vehicle?.plateNumber}</strong> ({order.vehicle?.brand}{" "}
              {order.vehicle?.model})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/services/${order.id}`} className="btn-ghost px-3.5 py-2 text-xs">
            Lihat Detail Servis
          </Link>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-xs cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Struk & Nota Kasir
          </button>
        </div>
      </div>

      {checkoutError && (
        <div className="print:hidden mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          ⚠️ {checkoutError}
        </div>
      )}

      {/* Main Billing Grid (Screen View) */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rincian Jasa & Suku Cadang (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Two Distinct Summary Cards: [Total Biaya Jasa] & [Total Harga Suku Cadang] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Biaya Jasa</span>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatRupiah(order.totalServices)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{order.items.length} paket / tindakan jasa servis</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Harga Suku Cadang</span>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatRupiah(order.totalParts)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{order.parts.length} item suku cadang diganti</p>
            </div>
          </div>

          {/* Itemized Table: Jasa & Suku Cadang */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  1. Rincian Biaya Jasa Servis ({order.items.length})
                </h2>
                <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                  {formatRupiah(order.totalServices)}
                </span>
              </div>
              {order.items.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Tidak ada biaya jasa servis.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2.5 text-xs">
                      <span className="font-medium text-slate-800">{item.serviceName}</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  2. Rincian Harga Suku Cadang ({order.parts.length})
                </h2>
                <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                  {formatRupiah(order.totalParts)}
                </span>
              </div>
              {order.parts.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Tidak ada suku cadang yang diganti.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {order.parts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between py-2.5 text-xs">
                      <div>
                        <span className="font-medium text-slate-800">{part.partName}</span>{" "}
                        <span className="text-slate-500 font-mono text-[11px]">
                          ({part.qty}x @ {formatRupiah(part.sellPrice)})
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(part.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kotak Klausul Garansi Servis (Info Pelanggan di Layar) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-slate-700 font-bold shrink-0">🛡️ Klausul Garansi Resmi:</span>
                <span className="text-slate-600 leading-relaxed">
                  Garansi Servis: Berlaku 7 hari / 500 KM sejak tanggal pengerjaan untuk keluhan/tindakan yang sama dengan menunjukkan nota ini.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Kalkulator Pembayaran & Kembalian Instan (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Kalkulator Kasir & Pembayaran</h2>
              {isAlreadyPaid && <span className="badge-selesai-pembayaran">LUNAS</span>}
            </div>

            <div className="space-y-2.5 text-xs pb-4 border-b border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Total Biaya Jasa</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatRupiah(order.totalServices)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Harga Suku Cadang</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatRupiah(order.totalParts)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-medium text-slate-600">Potongan Diskon (Rp)</label>
                {isAlreadyPaid ? (
                  <span className="font-mono font-semibold text-red-600 tabular-nums">
                    -{formatRupiah(order.discount)}
                  </span>
                ) : (
                  <input
                    type="number"
                    min={0}
                    value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 w-32 px-3 rounded-md bg-white border border-slate-300 text-right font-mono text-xs text-slate-900"
                  />
                )}
              </div>
            </div>

            {/* Grand Total Box */}
            <div className="my-4 p-4 rounded-xl bg-slate-900 text-white flex items-baseline justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">
                  Total Tagihan Akhir
                </p>
                <p className="text-3xl font-bold font-mono tabular-nums mt-1">
                  {formatRupiah(currentGrandTotal)}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-300">PitCare Auto</span>
            </div>

            {isAlreadyPaid ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Pembayaran</span>
                    <strong className="text-slate-900">{order.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uang Diterima</span>
                    <strong className="font-mono text-slate-900 tabular-nums">
                      {formatRupiah(order.paidAmount)}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-700 font-semibold">Kembalian Pelanggan</span>
                    <strong className="font-mono text-lg text-emerald-700 tabular-nums">
                      {formatRupiah(order.changeAmount)}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="btn-primary w-full py-3 text-xs cursor-pointer shadow-xs"
                >
                  🖨️ Cetak / Pratinjau Nota Struk
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Pilih Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["CASH", "TRANSFER", "QRIS"] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMethodChange(m)}
                        className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          paymentMethod === m
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {m === "CASH" ? "Tunai (Cash)" : m === "TRANSFER" ? "Transfer Bank" : "QRIS"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Uang Diterima dari Pelanggan (Rp)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(currentGrandTotal)}
                      className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Uang Pas ({formatRupiah(currentGrandTotal)})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={currentGrandTotal}
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    required
                    placeholder="Contoh: 150000"
                    className="input-dark w-full text-base font-bold font-mono tabular-nums"
                  />

                  {paymentMethod === "CASH" && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[50000, 100000, 150000, 200000, 300000, 500000]
                        .filter((val) => val >= currentGrandTotal)
                        .slice(0, 4)
                        .map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => handleQuickCash(amount)}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-medium transition-colors border border-slate-200 cursor-pointer"
                          >
                            {formatRupiah(amount)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Large Instant Change Calculator Box */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-950 block">
                      Uang Kembalian Pelanggan
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Dihitung otomatis dari uang yang diterima
                    </span>
                  </div>
                  <span className="font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                    {formatRupiah(changeAmount)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isPending || numericPaidAmount < currentGrandTotal}
                  className="btn-primary w-full py-3 text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Memproses Pembayaran..." : "Selesaikan Pembayaran & Terbitkan Nota"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL CETAK NOTA KASIR: FORMAT THERMAL (58/80mm) & A4
          ======================================================== */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Pratinjau & Cetak Nota Resmi"
        description="Pilih format cetak nota kasir (Thermal Struk Rol 58mm/80mm atau Faktur Resmi A4) yang dilengkapi klausul garansi servis resmi."
      >
        <div className="space-y-4">
          {/* Format Selector Tab */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setPrintFormat("THERMAL")}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                printFormat === "THERMAL"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🧾 Struk Thermal (58/80mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintFormat("A4")}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                printFormat === "A4"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📄 Faktur Standar (A4)</span>
            </button>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-[55vh] overflow-y-auto">
            {printFormat === "THERMAL" ? (
              /* Thermal Format Preview */
              <div className="max-w-[280px] mx-auto bg-white p-4 rounded-lg border border-slate-300 font-mono text-black text-[11px] leading-tight shadow-xs">
                <div className="text-center pb-2 border-b border-dashed border-gray-400">
                  <h2 className="text-base font-black tracking-wider uppercase">PITCARE AUTO</h2>
                  <p className="text-[10px] font-semibold">Workshop Suite & Spareparts</p>
                  <p className="text-[9px] text-gray-600">Hotline / WA: 0812-3456-7890</p>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>No. Nota:</span>
                    <span className="font-bold">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>{formatDate(order.paidDate || new Date())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{order.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plat Motor:</span>
                    <span className="font-bold">{order.vehicle?.plateNumber}</span>
                  </div>
                  {order.currentKm && (
                    <div className="flex justify-between">
                      <span>KM Masuk:</span>
                      <span>{order.currentKm.toLocaleString("id-ID")} KM</span>
                    </div>
                  )}
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                  <p className="font-bold text-[10px] uppercase">Rincian:</p>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-[10px]">
                      <span className="truncate max-w-[170px]">{item.serviceName}</span>
                      <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                  {order.parts.map((p) => (
                    <div key={p.id} className="flex justify-between text-[10px]">
                      <span className="truncate max-w-[170px]">
                        {p.partName} ({p.qty}x)
                      </span>
                      <span>{formatRupiah(p.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Total Jasa:</span>
                    <span>{formatRupiah(order.totalServices)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Part:</span>
                    <span>{formatRupiah(order.totalParts)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Diskon:</span>
                      <span>-{formatRupiah(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                    <span>TOTAL BAYAR:</span>
                    <span>{formatRupiah(order.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bayar ({order.paymentMethod || paymentMethod}):</span>
                    <span>{formatRupiah(order.paidAmount || numericPaidAmount || order.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(order.changeAmount || changeAmount)}</span>
                  </div>
                </div>

                {/* TUGAS 4: Klausul Garansi Servis Format Thermal */}
                <div className="mt-3 pt-2 text-center space-y-1.5">
                  <div className="p-2 border border-dashed border-gray-400 rounded bg-slate-50 text-[9px] leading-snug">
                    <p className="font-bold uppercase tracking-wider text-black">
                      Klausul Garansi Servis Resmi
                    </p>
                    <p className="text-[9px] mt-0.5 text-black">
                      Garansi Servis: Berlaku 7 hari / 500 KM sejak tanggal pengerjaan untuk keluhan/tindakan yang sama dengan menunjukkan nota ini.
                    </p>
                  </div>
                  <p className="text-[9px] font-bold">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
                  <p className="text-[8px] text-gray-500">
                    Simpan nota fisik ini sebagai bukti resmi klaim garansi servis.
                  </p>
                </div>
              </div>
            ) : (
              /* A4 Format Preview */
              <div className="bg-white p-6 rounded-lg border border-slate-300 text-slate-900 text-xs space-y-4 shadow-xs">
                {/* Header Faktur A4 */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-black tracking-wider text-slate-900">PITCARE AUTO</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Sistem Informasi Manajemen Servis & Suku Cadang</p>
                    <p className="text-[11px] text-slate-500">Jl. Otomotif Raya No. 88 • Hotline: 0812-3456-7890</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs">
                      FAKTUR RESMI
                    </span>
                    <p className="font-mono font-bold text-slate-800 text-xs mt-1.5">#{order.orderNumber}</p>
                    <p className="text-[11px] text-slate-500">{formatDate(order.paidDate || new Date())}</p>
                  </div>
                </div>

                {/* Identitas Pelanggan & Kendaraan */}
                <div className="grid grid-cols-2 gap-4 text-xs py-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data Pelanggan:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{order.customer?.name}</p>
                    <p className="text-slate-600 font-mono text-[11px]">WA: {order.customer?.phone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data Kendaraan:</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">{order.vehicle?.plateNumber}</p>
                    <p className="text-slate-600">
                      {order.vehicle?.brand} {order.vehicle?.model}{" "}
                      {order.currentKm ? `(${order.currentKm.toLocaleString("id-ID")} KM)` : ""}
                    </p>
                  </div>
                </div>

                {/* Tabel Itemized Jasa & Sparepart */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2.5">No</th>
                        <th className="p-2.5">Uraian Pekerjaan / Suku Cadang</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Harga Satuan</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2 text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-medium text-slate-800">[Jasa] {item.serviceName}</td>
                          <td className="p-2 text-center font-mono">1</td>
                          <td className="p-2 text-right font-mono">{formatRupiah(item.price)}</td>
                          <td className="p-2 text-right font-mono font-semibold">{formatRupiah(item.subtotal)}</td>
                        </tr>
                      ))}
                      {order.parts.map((p, idx) => (
                        <tr key={p.id}>
                          <td className="p-2 text-slate-400">{order.items.length + idx + 1}</td>
                          <td className="p-2 font-medium text-slate-800">[Part] {p.partName}</td>
                          <td className="p-2 text-center font-mono">{p.qty}</td>
                          <td className="p-2 text-right font-mono">{formatRupiah(p.sellPrice)}</td>
                          <td className="p-2 text-right font-mono font-semibold">{formatRupiah(p.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ringkasan Biaya */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Biaya Jasa:</span>
                      <span className="font-mono tabular-nums">{formatRupiah(order.totalServices)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Suku Cadang:</span>
                      <span className="font-mono tabular-nums">{formatRupiah(order.totalParts)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Potongan Diskon:</span>
                        <span className="font-mono tabular-nums">-{formatRupiah(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-slate-300 text-slate-900">
                      <span>TOTAL PEMBAYARAN:</span>
                      <span className="font-mono tabular-nums">{formatRupiah(order.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* TUGAS 4: Klausul Garansi Servis Format A4 */}
                <div className="mt-4 p-3.5 rounded-lg border border-slate-300 bg-slate-50 text-xs">
                  <p className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                    🛡️ Klausul Garansi Servis Resmi PitCare Auto:
                  </p>
                  <p className="text-slate-700 leading-relaxed font-normal">
                    Garansi Servis: Berlaku 7 hari / 500 KM sejak tanggal pengerjaan untuk keluhan/tindakan yang sama dengan menunjukkan nota ini.
                  </p>
                </div>

                {/* Tanda Tangan */}
                <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs text-slate-600">
                  <div>
                    <p>Tanda Terima Pelanggan,</p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-800 border-t border-slate-300 inline-block px-8 pt-1">
                      ( {order.customer?.name} )
                    </p>
                  </div>
                  <div>
                    <p>Hormat Kami / Kasir,</p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-800 border-t border-slate-300 inline-block px-8 pt-1">
                      ( Admin PitCare Auto )
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="btn-ghost text-xs px-4 py-2 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleTriggerDirectPrint}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak ke Printer Sekarang (Print)
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================
          PRINT CONTAINER (DIBACA OLEH BROWSER WINDOW.PRINT())
          Desain responsif untuk Roll Kertas Thermal 58/80mm & Kertas A4
          ======================================================== */}
      <div className="hidden print:block print:max-w-xs print:mx-auto print:font-mono print:text-black print:text-[11px] print:leading-tight">
        <div className="text-center pb-2 border-b border-dashed border-gray-400">
          <h2 className="text-base font-black tracking-wider uppercase">PITCARE AUTO</h2>
          <p className="text-[10px] font-semibold">Workshop Suite & Spareparts</p>
          <p className="text-[9px]">Hotline / WhatsApp: 0812-3456-7890</p>
        </div>

        <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>No. Nota:</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{formatDate(order.paidDate || new Date())}</span>
          </div>
          <div className="flex justify-between">
            <span>Pelanggan:</span>
            <span>{order.customer?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Plat Motor:</span>
            <span className="font-bold">{order.vehicle?.plateNumber}</span>
          </div>
          {order.currentKm && (
            <div className="flex justify-between">
              <span>KM Masuk:</span>
              <span>{order.currentKm.toLocaleString("id-ID")} KM</span>
            </div>
          )}
        </div>

        <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-[10px]">
              <span className="truncate max-w-[170px]">{item.serviceName}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
          {order.parts.map((p) => (
            <div key={p.id} className="flex justify-between text-[10px]">
              <span className="truncate max-w-[170px]">
                {p.partName} ({p.qty}x)
              </span>
              <span>{formatRupiah(p.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>Total Biaya Jasa:</span>
            <span>{formatRupiah(order.totalServices)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Suku Cadang:</span>
            <span>{formatRupiah(order.totalParts)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Diskon:</span>
              <span>-{formatRupiah(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
            <span>TOTAL BAYAR:</span>
            <span>{formatRupiah(order.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tunai / Diterima:</span>
            <span>{formatRupiah(order.paidAmount || numericPaidAmount || order.grandTotal)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Kembalian:</span>
            <span>{formatRupiah(order.changeAmount || changeAmount)}</span>
          </div>
        </div>

        {/* TUGAS 4: Klausul Garansi Resmi Bengkel Pada Struk Fisik Cetak */}
        <div className="mt-3 pt-2 text-center space-y-1">
          <div className="p-2 border border-dashed border-gray-600 rounded text-[9px] leading-snug">
            <p className="font-bold uppercase tracking-wider">GARANSI SERVIS RESMI</p>
            <p className="text-[9px] font-normal">
              Garansi Servis: Berlaku 7 hari / 500 KM sejak tanggal pengerjaan untuk keluhan/tindakan yang sama dengan menunjukkan nota ini.
            </p>
          </div>
          <p className="text-[9px] font-bold mt-1">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
          <p className="text-[8px]">Simpan nota ini sebagai bukti klaim garansi resmi.</p>
        </div>
      </div>
    </div>
  );
}
