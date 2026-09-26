import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function buildWhatsAppReminderUrl(phone: string, customerName: string, brandModel: string, plateNumber: string, lastKm: number): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const intlPhone = cleaned.startsWith("0") ? `62${cleaned.slice(1)}` : cleaned.startsWith("62") ? cleaned : `62${cleaned}`;
  const message = `Halo Bpk/Ibu ${customerName}, kami dari *PitCare Auto* menginformasikan bahwa kendaraan *${brandModel}* dengan nomor polisi *[${plateNumber}]* (Odometer terakhir: ${lastKm.toLocaleString("id-ID")} KM) telah memasuki jadwal servis berkala / pergantian oli rutin. Yuk rawat kembali performa kendaraan Anda di PitCare Auto! Balas pesan ini untuk booking antrian tanpa tunggu.`;
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
}

export default async function ServiceRemindersPage() {
  const customers = await db.customer.findMany();
  const orders = await db.serviceOrder.findMany();

  // Susun daftar kendaraan beserta riwayat servis terakhirnya
  const reminderItems = customers.flatMap((c) =>
    c.vehicles.map((v) => {
      const vehicleOrders = orders.filter((o) => o.vehicleId === v.id || o.vehicle?.plateNumber === v.plateNumber);
      const latestOrder = vehicleOrders[0];
      const lastKm = latestOrder?.currentKm || 3200;
      const nextServiceKm = lastKm + 3000;
      const isDueSoon = lastKm >= 3000;

      return {
        customerId: c.id,
        customerName: c.name,
        phone: c.phone,
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        brandModel: `${v.brand} ${v.model}`,
        year: v.year || 2023,
        lastKm,
        nextServiceKm,
        lastServiceDate: latestOrder?.entryDate
          ? new Date(latestOrder.entryDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "60 Hari Lalu",
        status: lastKm >= 24000 ? "CRITICAL_VBELT" : isDueSoon ? "DUE_OIL" : "ACTIVE_CARE",
        waUrl: buildWhatsAppReminderUrl(c.phone, c.name, `${v.brand} ${v.model}`, v.plateNumber, lastKm),
      };
    })
  );

  return (
    <div className="space-y-6">
      <Header
        title="Pengingat Servis WhatsApp (Automated Retention)"
        subtitle="Pantau jadwal servis berkala armada pelanggan berdasarkan interval Odometer (KM) & kirim pesan pengingat WhatsApp 1-Klik."
        actionButton={
          <Link
            href="/services/new"
            className="btn-cyan flex items-center gap-2 px-4 py-2.5 text-xs font-bold cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <span>+ Buat SPK Servis</span>
          </Link>
        }
      />

      {/* Ringkasan Statistik Retensi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-pitstop p-5">
          <p className="text-xs font-bold text-slate-400">Total Armada Terpantau</p>
          <p className="text-2xl font-black font-mono text-white mt-1 tabular-nums">
            {reminderItems.length} <span className="text-xs font-semibold text-slate-400">Unit</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Sinkronisasi data pelanggan & kendaraan</p>
        </div>

        <div className="card-pitstop p-5 border-amber-500/30">
          <p className="text-xs font-bold text-amber-300">Jadwal Ganti Oli (Interval 3.000 KM)</p>
          <p className="text-2xl font-black font-mono text-amber-400 mt-1 tabular-nums">
            {reminderItems.filter((i) => i.status === "DUE_OIL").length}{" "}
            <span className="text-xs font-semibold text-amber-200/70">Unit Siap Diingatkan</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Rekomendasi pengingat via WhatsApp</p>
        </div>

        <div className="card-pitstop p-5 border-rose-500/30">
          <p className="text-xs font-bold text-rose-300">Kritis V-Belt & CVT (&gt;= 24.000 KM)</p>
          <p className="text-2xl font-black font-mono text-rose-400 mt-1 tabular-nums">
            {reminderItems.filter((i) => i.status === "CRITICAL_VBELT").length}{" "}
            <span className="text-xs font-semibold text-rose-200/70">Unit Prioritas</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Pencegahan putus sabuk CVT di jalan</p>
        </div>
      </div>

      {/* Tabel Daftar Pengingat WhatsApp */}
      <div className="card-pitstop overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-white">
              Daftar Antrian Pengingat Servis Berkala
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik tombol hijau WhatsApp untuk mengirim pesan pengingat otomatis ke nomor pelanggan
            </p>
          </div>
          <span className="badge-custom badge-selesai-pengerjaan text-[10px]">
            WhatsApp Deep-Link Ready
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table-dark w-full text-left border-collapse">
            <thead>
              <tr>
                <th>Kendaraan & Plat Nomor</th>
                <th>Pelanggan & WhatsApp</th>
                <th>Odometer Terakhir</th>
                <th>Target Servis Berikutnya</th>
                <th>Status Interval</th>
                <th className="text-right">Aksi Pengingat</th>
              </tr>
            </thead>
            <tbody>
              {reminderItems.map((item) => (
                <tr key={item.vehicleId}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-cyan-500/30 font-mono text-xs font-extrabold text-cyan-400">
                        {item.plateNumber}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{item.brandModel}</p>
                        <p className="text-[10px] text-slate-500">Tahun {item.year}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs font-bold text-slate-200">{item.customerName}</p>
                    <p className="text-[11px] font-mono text-slate-400">{item.phone}</p>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-slate-200 tabular-nums">
                      {item.lastKm.toLocaleString("id-ID")} KM
                    </span>
                    <p className="text-[10px] text-slate-500">Servis: {item.lastServiceDate}</p>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-[#00D2FF] tabular-nums">
                      {item.nextServiceKm.toLocaleString("id-ID")} KM
                    </span>
                    <p className="text-[10px] text-slate-500">Interval +3.000 KM</p>
                  </td>
                  <td>
                    {item.status === "CRITICAL_VBELT" ? (
                      <span className="badge-custom badge-danger text-[10px]">
                        ⚠️ Wajib Ganti V-Belt & Oli
                      </span>
                    ) : item.status === "DUE_OIL" ? (
                      <span className="badge-custom badge-antrian text-[10px]">
                        ⚡ Waktunya Servis Rutin
                      </span>
                    ) : (
                      <span className="badge-custom badge-selesai-pengerjaan text-[10px]">
                        ✓ Kondisi Terjaga
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <a
                      href={item.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>💬 Kirim WA Reminder</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
