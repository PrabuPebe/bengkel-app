import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area with ambient glow */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 relative">
        {/* Ambient background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 80% 20%, rgba(0,210,255,0.04) 0%, transparent 65%), " +
              "radial-gradient(ellipse 50% 50% at 10% 80%, rgba(37,99,235,0.04) 0%, transparent 60%)",
          }}
        />
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(0,210,255,0.15) 40%, rgba(37,99,235,0.1) 70%, transparent 100%)",
          }}
        />
        <main className="relative flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

