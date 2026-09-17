"use client";

import { use, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
      <div className="p-24 text-center text-slate-400 text-sm print:hidden glass-panel rounded-2xl border border-white/10">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Memuat terminal kasir PitCare Auto...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 max-w-lg mx-auto print:hidden">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold border border-rose-500/20">
          !
        </div>
        <h2 className="text-base font-bold text-white mb-2">Faktur Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400 mb-6">
          Nomor SPK atau ID penagihan yang Anda cari tidak tersedia dalam database PitCare Auto.
        </p>
        <Link
          href="/cashier"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
        >
          ← Kembali ke Antrean Kasir
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
        `Uang pembayaran kurang! Nominal harus minimal ${formatRupiah(currentGrandTotal)}`
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
        router.refresh();
      } else {
        setCheckoutError(res.error || "Gagal menyelesaikan pembayaran kasir.");
      }
    });
  }

  function handlePrintReceipt() {
    window.print();
  }

  return (
    <div>
      {/* Top Navigation & Status Bar (Hidden on Print) */}
      <div className="print:hidden mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/cashier"
            className="p-2.5 rounded-xl glass-panel border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Kembali ke Antrean Kasir"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Billing Faktur:</span>
                <span className="font-mono text-indigo-400">{order.orderNumber}</span>
              </h1>
              {isAlreadyPaid ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  LUNAS
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Menunggu Pembayaran
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pelanggan: <strong className="text-slate-200">{order.customer?.name}</strong> • Unit:{" "}
              <strong className="font-mono text-indigo-400">{order.vehicle?.plateNumber}</strong> ({order.vehicle?.brand}{" "}
              {order.vehicle?.model})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/services/${order.id}`}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white glass-panel border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
          >
            Lihat SPK Mekanik ↗
          </Link>

          <button
            type="button"
            onClick={handlePrintReceipt}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Nota Struk Resmi
          </button>
        </div>
      </div>

      {checkoutError && (
        <div className="print:hidden mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Main Billing Grid (Screen View) */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Breakdown & Customer Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl shadow-black/40">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-white/5 mb-4">
              Informasi Faktur & Unit Pelanggan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Pemilik Kendaraan:</p>
                <p className="font-bold text-white text-base mt-1">{order.customer?.name}</p>
                <a
                  href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-medium hover:text-emerald-300 inline-flex items-center gap-1 mt-1 transition-colors"
                >
                  📱 WA: {order.customer?.phone}
                </a>
                {order.customer?.address && (
                  <p className="text-slate-400 mt-1.5 leading-relaxed">{order.customer?.address}</p>
                )}
              </div>

              <div>
                <p className="text-slate-400 text-[11px]">Unit Kendaraan:</p>
                <p className="font-bold text-white text-base mt-1">
                  {order.vehicle?.brand} {order.vehicle?.model}
                </p>
                <p className="font-mono font-bold text-indigo-400 text-sm mt-1">{order.vehicle?.plateNumber}</p>
                {order.currentKm && (
                  <p className="text-slate-400 mt-1.5">KM Aktual: {order.currentKm.toLocaleString("id-ID")} KM</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-400">
              <div>
                <span>Tanggal Masuk: </span>
                <strong className="text-slate-200">{formatDate(order.entryDate)}</strong>
              </div>
              <div>
                <span>Teknisi Penanggungjawab: </span>
                <strong className="text-slate-200">{order.mechanicName || "Teknisi PitCare Auto"}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Table: Jasa & Sparepart */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl shadow-black/40">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-white/5 mb-4">
              Rincian Pekerjaan Jasa & Suku Cadang
            </h2>

            <div className="space-y-5">
              {/* Jasa Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🔧 Tindakan Jasa Servis</span>
                    <span className="text-slate-400 text-[11px]">({order.items.length})</span>
                  </p>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {formatRupiah(order.totalServices)}
                  </span>
                </div>
                {order.items.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Tidak ada biaya jasa servis.</p>
                ) : (
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950/60 border border-white/5"
                      >
                        <span className="text-slate-200 font-medium">{item.serviceName}</span>
                        <span className="font-mono font-bold text-white">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Parts Section */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>📦 Suku Cadang (Sparepart)</span>
                    <span className="text-slate-400 text-[11px]">({order.parts.length})</span>
                  </p>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {formatRupiah(order.totalParts)}
                  </span>
                </div>
                {order.parts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Tidak ada suku cadang terpakai.</p>
                ) : (
                  <div className="space-y-2">
                    {order.parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950/60 border border-white/5"
                      >
                        <span className="text-slate-200">
                          {part.partName}{" "}
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({part.qty}x @ {formatRupiah(part.sellPrice)})
                          </span>
                        </span>
                        <span className="font-mono font-bold text-white">{formatRupiah(part.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Terminal & Cashier Calculations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-sm font-bold text-white pb-3 border-b border-white/5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>💳</span>
                <span>Terminal Kasir</span>
              </span>
              {isAlreadyPaid && (
                <span className="text-xs text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  LUNAS
                </span>
              )}
            </h2>

            {/* Total Calculation breakdown */}
            <div className="space-y-3 py-4 text-xs border-b border-white/5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Biaya Jasa</span>
                <span className="font-mono font-semibold text-white">{formatRupiah(order.totalServices)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Suku Cadang</span>
                <span className="font-mono font-semibold text-white">{formatRupiah(order.totalParts)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Subtotal Bruto</span>
                <span className="font-mono font-semibold text-white">{formatRupiah(subtotalCombined)}</span>
              </div>

              {/* Diskon Input */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Potongan Diskon (Rp):
                  </label>
                  {isAlreadyPaid ? (
                    <span className="font-mono font-bold text-rose-400">-{formatRupiah(order.discount)}</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={discount || ""}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-32 h-9 px-3 text-right rounded-xl bg-slate-950/80 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grand Total Display */}
            <div className="py-4 px-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 my-4 flex items-baseline justify-between shadow-inner">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Tagihan Bersih
                </p>
                <p className="text-3xl font-black font-mono text-emerald-400 mt-1">
                  {formatRupiah(currentGrandTotal)}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 font-mono">PitCare Auto</span>
            </div>

            {isAlreadyPaid ? (
              /* Already Paid Details */
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Metode Bayar:</span>
                    <strong className="text-white font-bold">{order.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uang Diterima:</span>
                    <strong className="font-mono text-white font-bold">{formatRupiah(order.paidAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kembalian:</span>
                    <strong className="font-mono text-emerald-400 font-bold">{formatRupiah(order.changeAmount)}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/5">
                    <span className="text-slate-500">Waktu Lunas:</span>
                    <span className="text-slate-400">{formatDate(order.paidDate)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Cetak Ulang Faktur Struk
                </button>
              </div>
            ) : (
              /* Checkout Form for Pending */
              <form onSubmit={handleConfirmPayment} className="space-y-4 pt-1">
                {/* Method selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Metode Pembayaran *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["CASH", "TRANSFER", "QRIS"] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMethodChange(m)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                          paymentMethod === m
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25 font-bold"
                            : "bg-slate-950/60 text-slate-400 border-white/10 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {m === "CASH" ? "💵 Tunai" : m === "TRANSFER" ? "🏦 Transfer" : "📱 QRIS"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Paid Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Uang Diterima Pelanggan (Rp) *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(currentGrandTotal)}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
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
                    placeholder="Masukkan nominal bayar..."
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                  />

                  {/* Quick cash pills (for CASH mode) */}
                  {paymentMethod === "CASH" && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {[50000, 100000, 200000, 300000, 500000, 1000000]
                        .filter((val) => val >= currentGrandTotal)
                        .slice(0, 4)
                        .map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => handleQuickCash(amount)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono font-semibold transition-all border border-white/5 cursor-pointer"
                          >
                            {formatRupiah(amount)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Change Calculation Display */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Kembalian:</span>
                  <span
                    className={`font-mono text-base font-black ${
                      numericPaidAmount >= currentGrandTotal ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {formatRupiah(changeAmount)}
                  </span>
                </div>

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={isPending || numericPaidAmount < currentGrandTotal}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses Pembayaran...
                    </span>
                  ) : (
                    "✓ Selesaikan Pembayaran & Terbitkan Faktur"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          PRINTABLE OFFICIAL RECEIPT / THERMAL STRUK (Clean Output)
          Official PitCare Auto Workshop Receipt
          ========================================================= */}
      <div className="hidden print:block print:max-w-xs print:mx-auto print:font-mono print:text-black print:text-[11px] print:leading-tight">
        {/* Workshop Header */}
        <div className="text-center pb-2 border-b border-dashed border-gray-400">
          <h2 className="text-base font-black tracking-wider uppercase">PITCARE AUTO</h2>
          <p className="text-[10px] font-semibold">Automotive Service & Genuine Spareparts</p>
          <p className="text-[9px]">Layanan Bengkel Modern, Cepat & Terpercaya</p>
          <p className="text-[9px]">Hotline / WhatsApp: 0812-3456-7890</p>
        </div>

        {/* Invoice Info */}
        <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>No. Faktur:</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{formatDate(order.paidDate || new Date())}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir / Teknisi:</span>
            <span>Admin / {order.mechanicName || "Teknisi"}</span>
          </div>
          <div className="flex justify-between">
            <span>Pelanggan:</span>
            <span>{order.customer?.name} ({order.customer?.phone})</span>
          </div>
          <div className="flex justify-between">
            <span>Kendaraan:</span>
            <span className="font-bold">{order.vehicle?.plateNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipe:</span>
            <span>{order.vehicle?.brand} {order.vehicle?.model} {order.currentKm ? `(${order.currentKm} KM)` : ""}</span>
          </div>
        </div>

        {/* Itemized Services & Parts */}
        <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
          <p className="font-bold text-[10px] uppercase">Rincian Pekerjaan & Suku Cadang:</p>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-[10px]">
              <span className="truncate max-w-[180px]">{item.serviceName}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
          {order.parts.map((p) => (
            <div key={p.id} className="flex justify-between text-[10px]">
              <span className="truncate max-w-[180px]">
                {p.partName} ({p.qty}x)
              </span>
              <span>{formatRupiah(p.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal Jasa:</span>
            <span>{formatRupiah(order.totalServices)}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal Sparepart:</span>
            <span>{formatRupiah(order.totalParts)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Diskon:</span>
              <span>-{formatRupiah(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
            <span>GRAND TOTAL:</span>
            <span>{formatRupiah(order.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Metode Pembayaran:</span>
            <span>{order.paymentMethod || paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Bayar:</span>
            <span>{formatRupiah(order.paidAmount || numericPaidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Kembalian:</span>
            <span>{formatRupiah(order.changeAmount || changeAmount)}</span>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="pt-3 text-center text-[9px] space-y-1">
          <p className="font-bold">*** TERIMA KASIH ATAS KEPERCAYAAN ANDA ***</p>
          <p>Garansi Servis Resmi PitCare Auto: 7 Hari / 500 KM.</p>
          <p>Simpan nota ini sebagai bukti garansi & riwayat servis resmi.</p>
        </div>
      </div>
    </div>
  );
}
