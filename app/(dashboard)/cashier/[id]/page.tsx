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
      <div className="p-16 text-center text-[#817797] text-sm print:hidden">
        <div className="w-8 h-8 border-2 border-[#9b6cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Memuat data penagihan kasir...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#221939]/40 border border-[#d2b8ff]/10 print:hidden">
        <p className="text-base font-bold text-[#f6f2ff] mb-2">Faktur Tidak Ditemukan</p>
        <Link
          href="/cashier"
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8f63ec]"
        >
          Kembali ke Antrean Kasir
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
      {/* Top Bar (Hidden on Print) */}
      <div className="print:hidden mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cashier"
            className="p-2.5 rounded-xl bg-[#221939] border border-[#d2b8ff]/15 text-[#b5abc9] hover:text-[#f6f2ff] hover:bg-[#2e2150] transition-colors"
            title="Kembali ke Antrean Kasir"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#f6f2ff] tracking-tight">
                Billing Faktur: {order.orderNumber}
              </h1>
              {isAlreadyPaid ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ LUNAS
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ⏳ Menunggu Pembayaran
                </span>
              )}
            </div>
            <p className="text-xs text-[#b5abc9]">
              Pelanggan: <strong className="text-[#f6f2ff]">{order.customer?.name}</strong> • Unit:{" "}
              <strong className="text-[#f6f2ff]">{order.vehicle?.plateNumber}</strong> ({order.vehicle?.brand}{" "}
              {order.vehicle?.model})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/services/${order.id}`}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#b5abc9] hover:text-[#f6f2ff] bg-[#221939] hover:bg-[#2e2150] transition-colors"
          >
            Lihat SPK Mekanik ↗
          </Link>

          <button
            type="button"
            onClick={handlePrintReceipt}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-lg shadow-[#8f63ec]/25 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Nota Struk (Thermal / A4)
          </button>
        </div>
      </div>

      {checkoutError && (
        <div className="print:hidden mb-6 p-4 rounded-xl bg-[#3a1525] border border-[#ffaeae]/30 text-[#ffaeae] text-xs font-semibold">
          {checkoutError}
        </div>
      )}

      {/* Main Billing Grid (Screen View) */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Breakdown & Customer Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity Card */}
          <div className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 shadow-xl shadow-black/20">
            <h2 className="text-xs font-bold text-[#c49eff] uppercase tracking-wider pb-2 border-b border-[#d2b8ff]/10 mb-3">
              Informasi Faktur & Kendaraan
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[#817797]">Pemilik Kendaraan:</p>
                <p className="font-bold text-[#f6f2ff] text-sm">{order.customer?.name}</p>
                <p className="text-[#34d399]">{order.customer?.phone}</p>
                {order.customer?.address && (
                  <p className="text-[#817797] mt-1">{order.customer?.address}</p>
                )}
              </div>

              <div>
                <p className="text-[#817797]">Unit Kendaraan:</p>
                <p className="font-bold text-[#f6f2ff] text-sm">
                  {order.vehicle?.brand} {order.vehicle?.model}
                </p>
                <p className="font-mono font-bold text-[#c49eff]">{order.vehicle?.plateNumber}</p>
                {order.currentKm && (
                  <p className="text-[#817797] mt-1">KM: {order.currentKm.toLocaleString("id-ID")} KM</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#d2b8ff]/10 grid grid-cols-2 gap-4 text-[11px] text-[#817797]">
              <div>
                <span>Tanggal Masuk: </span>
                <strong className="text-[#f6f2ff]">{formatDate(order.entryDate)}</strong>
              </div>
              <div>
                <span>Mekanik Penanggungjawab: </span>
                <strong className="text-[#f6f2ff]">{order.mechanicName || "Teknisi"}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Table: Jasa & Sparepart */}
          <div className="p-5 rounded-2xl bg-[#221939]/80 border border-[#d2b8ff]/15 shadow-xl shadow-black/20">
            <h2 className="text-xs font-bold text-[#c49eff] uppercase tracking-wider pb-2 border-b border-[#d2b8ff]/10 mb-3">
              Rincian Pekerjaan Jasa & Suku Cadang
            </h2>

            <div className="space-y-4">
              {/* Jasa Section */}
              <div>
                <p className="text-xs font-bold text-[#f6f2ff] mb-2 flex items-center justify-between">
                  <span>🔧 Jasa Servis</span>
                  <span className="text-[#34d399]">{formatRupiah(order.totalServices)}</span>
                </p>
                {order.items.length === 0 ? (
                  <p className="text-xs text-[#817797] italic py-1">Tidak ada biaya jasa servis.</p>
                ) : (
                  <div className="space-y-1.5">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#17122b]/70 border border-[#d2b8ff]/5"
                      >
                        <span className="text-[#d9d0eb]">{item.serviceName}</span>
                        <span className="font-bold text-[#f6f2ff]">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Parts Section */}
              <div className="pt-3 border-t border-[#d2b8ff]/10">
                <p className="text-xs font-bold text-[#f6f2ff] mb-2 flex items-center justify-between">
                  <span>📦 Suku Cadang (Sparepart)</span>
                  <span className="text-[#34d399]">{formatRupiah(order.totalParts)}</span>
                </p>
                {order.parts.length === 0 ? (
                  <p className="text-xs text-[#817797] italic py-1">Tidak ada suku cadang terpakai.</p>
                ) : (
                  <div className="space-y-1.5">
                    {order.parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#17122b]/70 border border-[#d2b8ff]/5"
                      >
                        <span className="text-[#d9d0eb]">
                          {part.partName} <span className="text-[#817797]">({part.qty}x @ {formatRupiah(part.sellPrice)})</span>
                        </span>
                        <span className="font-bold text-[#f6f2ff]">{formatRupiah(part.subtotal)}</span>
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
          <div className="p-6 rounded-2xl bg-[#221939]/90 border border-[#d2b8ff]/20 shadow-2xl shadow-black/30">
            <h2 className="text-sm font-bold text-[#f6f2ff] pb-3 border-b border-[#d2b8ff]/10 flex items-center justify-between">
              <span>💳 Terminal Pembayaran Kasir</span>
              {isAlreadyPaid && (
                <span className="text-xs text-emerald-400 font-bold">LUNAS</span>
              )}
            </h2>

            {/* Total Calculation breakdown */}
            <div className="space-y-3 py-4 text-xs border-b border-[#d2b8ff]/10">
              <div className="flex items-center justify-between text-[#b5abc9]">
                <span>Total Tindakan Jasa</span>
                <span className="font-semibold text-[#f6f2ff]">{formatRupiah(order.totalServices)}</span>
              </div>
              <div className="flex items-center justify-between text-[#b5abc9]">
                <span>Total Suku Cadang</span>
                <span className="font-semibold text-[#f6f2ff]">{formatRupiah(order.totalParts)}</span>
              </div>
              <div className="flex items-center justify-between text-[#b5abc9]">
                <span>Subtotal Bruto</span>
                <span className="font-semibold text-[#f6f2ff]">{formatRupiah(subtotalCombined)}</span>
              </div>

              {/* Diskon Input */}
              <div className="pt-2 border-t border-[#d2b8ff]/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#d9d0eb]">
                    Potongan Diskon (Rp):
                  </label>
                  {isAlreadyPaid ? (
                    <span className="font-bold text-[#ffaeae]">-{formatRupiah(order.discount)}</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={discount || ""}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-32 h-9 px-3 text-right rounded-lg bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] text-xs focus:outline-none focus:border-[#9b6cff]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grand Total Display */}
            <div className="py-4 flex items-baseline justify-between bg-[#17122b] px-4 rounded-xl my-4 border border-[#d2b8ff]/10">
              <div>
                <p className="text-[10px] font-bold text-[#817797] uppercase tracking-wider">
                  Total Tagihan Bersih
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">
                  {formatRupiah(currentGrandTotal)}
                </p>
              </div>
              <span className="text-[11px] text-[#b5abc9]">Termasuk PPN</span>
            </div>

            {isAlreadyPaid ? (
              /* Already Paid Details */
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-emerald-300">Metode Pembayaran:</span>
                    <strong className="text-[#f6f2ff]">{order.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-300">Jumlah Uang Diterima:</span>
                    <strong className="text-[#f6f2ff]">{formatRupiah(order.paidAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-300">Kembalian:</span>
                    <strong className="text-emerald-400">{formatRupiah(order.changeAmount)}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-500/20">
                    <span className="text-[#817797]">Waktu Lunas:</span>
                    <span className="text-[#b5abc9]">{formatDate(order.paidDate)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#8f63ec] to-[#6f45c3] hover:brightness-110 shadow-lg shadow-[#8f63ec]/30 transition-all cursor-pointer"
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
                  <label className="block text-xs font-bold text-[#d9d0eb] mb-2">
                    Metode Pembayaran *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["CASH", "TRANSFER", "QRIS"] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMethodChange(m)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          paymentMethod === m
                            ? "bg-[#8f63ec] text-white border-[#8f63ec] shadow-md shadow-[#8f63ec]/25"
                            : "bg-[#17122b] text-[#b5abc9] border-[#d2b8ff]/10 hover:border-[#d2b8ff]/30"
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
                    <label className="text-xs font-bold text-[#d9d0eb]">
                      Uang Diterima dari Pelanggan (Rp) *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(currentGrandTotal)}
                      className="text-[11px] font-bold text-[#c49eff] hover:underline"
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
                    className="w-full h-11 px-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/15 text-[#f6f2ff] font-mono text-base font-bold focus:outline-none focus:border-[#9b6cff]"
                  />

                  {/* Quick cash pills (for CASH mode) */}
                  {paymentMethod === "CASH" && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[50000, 100000, 200000, 300000, 500000]
                        .filter((val) => val >= currentGrandTotal)
                        .map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => handleQuickCash(amount)}
                            className="px-2.5 py-1 rounded-lg bg-[#2e2150] text-[#c49eff] hover:bg-[#382666] text-[10px] font-bold"
                          >
                            {formatRupiah(amount)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Change Calculation Display */}
                <div className="p-3.5 rounded-xl bg-[#17122b] border border-[#d2b8ff]/10 flex items-center justify-between">
                  <span className="text-xs text-[#817797] font-semibold">Kembalian:</span>
                  <span
                    className={`font-mono text-base font-black ${
                      numericPaidAmount >= currentGrandTotal ? "text-emerald-400" : "text-[#817797]"
                    }`}
                  >
                    {formatRupiah(changeAmount)}
                  </span>
                </div>

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={isPending || numericPaidAmount < currentGrandTotal}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          ========================================================= */}
      <div className="hidden print:block print:max-w-xs print:mx-auto print:font-mono print:text-black print:text-[11px] print:leading-tight">
        {/* Workshop Header */}
        <div className="text-center pb-2 border-b border-dashed border-gray-400">
          <h2 className="text-base font-black tracking-wider uppercase">BENGKELKU</h2>
          <p className="text-[10px]">Bengkel Servis & Suku Cadang Terpercaya</p>
          <p className="text-[9px]">Jl. Otomotif Raya No. 88, Jakarta Selatan</p>
          <p className="text-[9px]">WhatsApp: 0812-3456-7890</p>
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
            <span>Admin / {order.mechanicName || "Mekanik"}</span>
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
          <p className="font-bold">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
          <p>Garansi Servis 7 Hari / 500 KM (Kecuali kelistrikan).</p>
          <p>Simpan nota ini sebagai bukti garansi resmi.</p>
        </div>
      </div>
    </div>
  );
}
