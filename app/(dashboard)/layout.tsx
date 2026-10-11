import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex linear-workspace">
      {/* Linear-style slim pure white sidebar */}
      <Sidebar />

      {/* Main content workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
