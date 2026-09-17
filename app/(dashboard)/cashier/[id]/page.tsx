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
      <div className="p-24 text-center text-[#435663] text-sm print:hidden card-floating">
        <div className="w-8 h-8 border-2 border-[#A3B087] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Memuat terminal kasir PitCare Auto...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center rounded-2xl card-floating max-w-lg mx-auto print:hidden">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold border border-rose-200">
          !
        </div>
        <h2 className="text-base font-bold text-[#313647] mb-2">Faktur Tidak Ditemukan</h2>
        <p className="text-xs text-[#435663] mb-6">
          Nomor SPK atau ID penagihan yang Anda cari tidak tersedia dalam database PitCare Auto.
        </p>
        <Link
          href="/cashier"
          className="btn-sage inline-flex items-center px-4 py-2 text-xs cursor-pointer"
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
            className="btn-outline-steel p-2.5 cursor-pointer"
            title="Kembali ke Antrean Kasir"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[#313647] tracking-tight flex items-center gap-2">
                <span>Billing Faktur:</span>
                <span className="font-mono text-[#313647] font-black">{order.orderNumber}</span>
              </h1>
              {isAlreadyPaid ? (
                <span className="badge-custom badge-sage">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2c3621]" />
                  LUNAS
                </span>
              ) : (
                <span className="badge-custom badge-cream">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#435663] animate-pulse" />
                  Menunggu Pembayaran
                </span>
              )}
            </div>
            <p className="text-xs text-[#435663] mt-1 font-medium">
              Pelanggan: <strong className="text-[#313647]">{order.customer?.name}</strong> • Unit:{" "}
              <strong className="font-mono text-[#313647]">{order.vehicle?.plateNumber}</strong> ({order.vehicle?.brand}{" "}
              {order.vehicle?.model})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/services/${order.id}`}
            className="btn-outline-steel px-4 py-2.5 text-xs cursor-pointer"
          >
            Lihat SPK Mekanik ↗
          </Link>

          <button
            type="button"
            onClick={handlePrintReceipt}
            className="btn-charcoal flex items-center gap-2 px-4 py-2.5 text-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Nota Struk Resmi
          </button>
        </div>
      </div>

      {checkoutError && (
        <div className="print:hidden mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Main Billing Grid (Screen View) */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Breakdown & Customer Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity Card */}
          <div className="card-floating p-6">
            <h2 className="text-xs font-bold text-[#435663] uppercase tracking-wider pb-3 border-b border-[#435663]/15 mb-4">
              Informasi Faktur & Unit Pelanggan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[#435663] text-[11px]">Pemilik Kendaraan:</p>
                <p className="font-bold text-[#313647] text-base mt-1">{order.customer?.name}</p>
                <a
                  href={`https://wa.me/${order.customer?.phone.replace(/^0/, "62")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#313647] font-semibold hover:underline inline-flex items-center gap-1 mt-1 transition-colors"
                >
                  📱 WA: {order.customer?.phone}
                </a>
                {order.customer?.address && (
                  <p className="text-[#435663] mt-1.5 leading-relaxed">{order.customer?.address}</p>
                )}
              </div>

              <div>
                <p className="text-[#435663] text-[11px]">Unit Kendaraan:</p>
                <p className="font-bold text-[#313647] text-base mt-1">
                  {order.vehicle?.brand} {order.vehicle?.model}
                </p>
                <p className="font-mono font-bold text-[#313647] text-sm mt-1">{order.vehicle?.plateNumber}</p>
                {order.currentKm && (
                  <p className="text-[#435663] mt-1.5">KM Aktual: {order.currentKm.toLocaleString("id-ID")} KM</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#435663]/15 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#435663]">
              <div>
                <span>Tanggal Masuk: </span>
                <strong className="text-[#313647]">{formatDate(order.entryDate)}</strong>
              </div>
              <div>
                <span>Teknisi Penanggungjawab: </span>
                <strong className="text-[#313647]">{order.mechanicName || "Teknisi PitCare Auto"}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Table: Jasa & Sparepart */}
          <div className="card-floating p-6">
            <h2 className="text-xs font-bold text-[#435663] uppercase tracking-wider pb-3 border-b border-[#435663]/15 mb-4">
              Rincian Pekerjaan Jasa & Suku Cadang
            </h2>

            <div className="space-y-5">
              {/* Jasa Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-[#313647] flex items-center gap-1.5">
                    <span>🔧 Tindakan Jasa Servis</span>
                    <span className="text-[#435663] text-[11px]">({order.items.length})</span>
                  </p>
                  <span className="font-mono font-black text-[#313647] text-xs">
                    {formatRupiah(order.totalServices)}
                  </span>
                </div>
                {order.items.length === 0 ? (
                  <p className="text-xs text-[#435663] italic py-2">Tidak ada biaya jasa servis.</p>
                ) : (
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#FFF8D4]/40 border border-[#435663]/15"
                      >
                        <span className="text-[#313647] font-semibold">{item.serviceName}</span>
                        <span className="font-mono font-black text-[#313647]">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Parts Section */}
              <div className="pt-4 border-t border-[#435663]/15">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold text-[#313647] flex items-center gap-1.5">
                    <span>📦 Suku Cadang (Sparepart)</span>
                    <span className="text-[#435663] text-[11px]">({order.parts.length})</span>
                  </p>
                  <span className="font-mono font-black text-[#313647] text-xs">
                    {formatRupiah(order.totalParts)}
                  </span>
                </div>
                {order.parts.length === 0 ? (
                  <p className="text-xs text-[#435663] italic py-2">Tidak ada suku cadang terpakai.</p>
                ) : (
                  <div className="space-y-2">
                    {order.parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#FFF8D4]/40 border border-[#435663]/15"
                      >
                        <span className="text-[#313647]">
                          <strong className="font-bold">{part.partName}</strong>{" "}
                          <span className="text-[#435663] font-mono text-[11px]">
                            ({part.qty}x @ {formatRupiah(part.sellPrice)})
                          </span>
                        </span>
                        <span className="font-mono font-black text-[#313647]">{formatRupiah(part.subtotal)}</span>
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
          <div className="card-floating p-6 relative overflow-hidden">
            <h2 className="text-sm font-bold text-[#313647] pb-3 border-b border-[#435663]/15 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>💳</span>
                <span>Terminal Kasir</span>
              </span>
              {isAlreadyPaid && (
                <span className="badge-custom badge-sage">
                  LUNAS
                </span>
              )}
            </h2>

            {/* Total Calculation breakdown */}
            <div className="space-y-3 py-4 text-xs border-b border-[#435663]/15">
              <div className="flex items-center justify-between text-[#435663]">
                <span>Total Biaya Jasa</span>
                <span className="font-mono font-bold text-[#313647]">{formatRupiah(order.totalServices)}</span>
              </div>
              <div className="flex items-center justify-between text-[#435663]">
                <span>Total Suku Cadang</span>
                <span className="font-mono font-bold text-[#313647]">{formatRupiah(order.totalParts)}</span>
              </div>
              <div className="flex items-center justify-between text-[#435663]">
                <span>Subtotal Bruto</span>
                <span className="font-mono font-bold text-[#313647]">{formatRupiah(subtotalCombined)}</span>
              </div>

              {/* Diskon Input */}
              <div className="pt-2 border-t border-[#435663]/15">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#313647]">
                    Potongan Diskon (Rp):
                  </label>
                  {isAlreadyPaid ? (
                    <span className="font-mono font-bold text-rose-600">-{formatRupiah(order.discount)}</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={discount || ""}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="input-custom w-32 h-9 px-3 text-right font-mono text-xs"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grand Total Display */}
            <div className="py-4 px-4 rounded-xl bg-[#FFF8D4] border border-[#A3B087]/50 my-4 flex items-baseline justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#435663] uppercase tracking-wider">
                  Total Tagihan Bersih
                </p>
                <p className="text-3xl font-black font-mono text-[#313647] mt-1">
                  {formatRupiah(currentGrandTotal)}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#435663] font-mono">PitCare Auto</span>
            </div>

            {isAlreadyPaid ? (
              /* Already Paid Details */
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-xl bg-[#FFF8D4]/50 border border-[#435663]/20 text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-[#435663]">Metode Bayar:</span>
                    <strong className="text-[#313647] font-bold">{order.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#435663]">Uang Diterima:</span>
                    <strong className="font-mono text-[#313647] font-bold">{formatRupiah(order.paidAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#435663]">Kembalian:</span>
                    <strong className="font-mono text-[#313647] font-bold">{formatRupiah(order.changeAmount)}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#435663]/15">
                    <span className="text-[#435663]">Waktu Lunas:</span>
                    <span className="text-[#313647]">{formatDate(order.paidDate)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="btn-charcoal w-full flex items-center justify-center gap-2 py-3 text-xs cursor-pointer"
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
                  <label className="block text-xs font-semibold text-[#313647] mb-2">
                    Metode Pembayaran *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["CASH", "TRANSFER", "QRIS"] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMethodChange(m)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          paymentMethod === m
                            ? "bg-[#313647] text-[#FFF8D4] border-[#313647] shadow-xs"
                            : "bg-white text-[#435663] border-[#435663]/20 hover:bg-[#FFF8D4]/40"
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
                    <label className="text-xs font-semibold text-[#313647]">
                      Uang Diterima Pelanggan (Rp) *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(currentGrandTotal)}
                      className="text-[11px] font-bold text-[#313647] hover:underline transition-colors cursor-pointer"
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
                    className="input-custom w-full h-11 px-3.5 text-base font-bold font-mono"
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
                            className="px-2.5 py-1 rounded-lg bg-[#FFF8D4] hover:bg-[#FFF8D4]/80 text-[#313647] text-[10px] font-mono font-bold transition-all border border-[#A3B087]/40 cursor-pointer"
                          >
                            {formatRupiah(amount)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Change Calculation Display */}
                <div className="p-3.5 rounded-xl bg-[#FFF8D4]/60 border border-[#435663]/20 flex items-center justify-between">
                  <span className="text-xs text-[#435663] font-semibold">Kembalian:</span>
                  <span
                    className={`font-mono text-base font-black ${
                      numericPaidAmount >= currentGrandTotal ? "text-[#313647]" : "text-[#435663]"
                    }`}
                  >
                    {formatRupiah(changeAmount)}
                  </span>
                </div>

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={isPending || numericPaidAmount < currentGrandTotal}
                  className="btn-sage w-full py-3 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#313647] border-t-transparent rounded-full animate-spin" />
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
          <p className="text-[9px]">PitCare Auto — Layanan Otomotif Modern, Cepat & Terpercaya</p>
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
