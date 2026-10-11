"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  async function handleLogout() {
    await signOut({ redirect: false });
    window.location.replace("/login");
  }

  const navLinks = [
    {
      group: "Menu Utama",
      items: [
        {
          name: "Dashboard Bengkel",
          href: "/dashboard",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          name: "Tambah Servis Baru",
          href: "/services/new",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "Operasional Harian",
      items: [
        {
          name: "Antrean & Pengerjaan",
          href: "/services",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
        {
          name: "Kasir & Pembayaran",
          href: "/cashier",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "Data Bengkel",
      items: [
        {
          name: "Data Pelanggan & Motor",
          href: "/customers",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          name: "Daftar Paket & Jasa",
          href: "/inventory/services",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          name: "Stok Suku Cadang",
          href: "/inventory/parts",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          name: "Pengingat Servis WA",
          href: "/reminders",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile hamburger trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="p-2.5 rounded-lg bg-white text-slate-900 border border-slate-200 shadow-xs focus:outline-none hover:bg-slate-50 transition-all cursor-pointer"
          aria-label="Buka Navigasi"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpenMobile ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Linear.app Style Slim Pure White Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
              PA
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 tracking-tight block leading-none">
                PitCare Auto
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                Sistem Servis Bengkel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navLinks.map((section) => (
            <div key={section.group}>
              <p className="px-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                {section.group}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/services/new"
                      ? pathname === "/services/new"
                      : item.href === "/services"
                      ? pathname === "/services" || (pathname.startsWith("/services/") && pathname !== "/services/new")
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpenMobile(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-slate-100 font-semibold text-slate-900"
                          : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className={isActive ? "text-slate-900" : "text-slate-400"}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: Portal Pelanggan & User Logout */}
        <div className="p-3 border-t border-slate-200/80 space-y-2 bg-slate-50/50">
          <Link
            href="/portal"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span>Lihat Portal Pelanggan</span>
            <span>→</span>
          </Link>

          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || "Admin Bengkel"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || "Staff Operasional"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              title="Keluar dari akun"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
