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
      group: "Ringkasan Operasional",
      items: [
        {
          name: "Dashboard Pitstop",
          href: "/dashboard",
          badge: null,
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "Alur Pengerjaan Servis",
      items: [
        {
          name: "Work Order Servis",
          href: "/services",
          badge: null,
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
        {
          name: "Kasir & Billing POS",
          href: "/cashier",
          badge: null,
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "Master & Inventaris",
      items: [
        {
          name: "Pelanggan & Armada",
          href: "/customers",
          badge: null,
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: "Katalog Jasa Servis",
          href: "/inventory/services",
          badge: null,
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          name: "Stok Suku Cadang",
          href: "/inventory/parts",
          badge: null,
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
          className="p-2.5 rounded-xl bg-[#0F172A] text-[#00D2FF] border border-slate-800 shadow-lg shadow-black/40 focus:outline-none hover:border-[#00D2FF]/50 transition-all cursor-pointer"
          aria-label="Buka Navigasi"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpenMobile ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Premium v2 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl shadow-black/60 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, #0c1526 0%, #0F172A 40%, #0a1120 100%)",
          borderRight: "1px solid rgba(30, 41, 59, 0.8)",
        }}
      >
        {/* Ambient radial glow top */}
        <div
          className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,210,255,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Brand Header */}
        <div className="relative p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(30,41,59,0.7)" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#00D2FF] text-slate-950 shadow-lg shadow-[#00D2FF]/20 flex items-center justify-center font-black text-sm tracking-wider">
                BK
              </div>
              <div
                className="absolute -inset-0.5 rounded-xl opacity-40 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, #00D2FF, #2563EB)",
                  filter: "blur(5px)",
                  zIndex: -1,
                }}
              />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-none flex items-center gap-1.5">
                <span>Bengkelku</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-[#00D2FF] border border-cyan-500/25">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                High-Tech Pitstop
              </p>
            </div>
          </div>
          <span className="pill-live">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse" />
            Live
          </span>
        </div>

        {/* Nav links */}
        <nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navLinks.map((group, gi) => (
            <div key={group.group}>
              {gi > 0 && (
                <div className="neon-line mb-4 opacity-30" />
              )}
              <p className="px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 mb-2">
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpenMobile(false)}
                        className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-cyan-500/12 to-blue-600/8 text-[#00D2FF] font-bold"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        }`}
                        style={isActive ? { boxShadow: "0 0 0 1px rgba(0,210,255,0.18)" } : {}}
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                            style={{ background: "linear-gradient(180deg, #00D2FF, #2563EB)" }}
                          />
                        )}
                        <div className="flex items-center gap-3">
                          <span className={`transition-colors ${isActive ? "text-[#00D2FF]" : "text-slate-500"}`}>
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              isActive
                                ? "bg-cyan-500/20 text-[#00D2FF]"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="relative p-4" style={{ borderTop: "1px solid rgba(30,41,59,0.7)", background: "rgba(11,15,23,0.6)" }}>
          <div className="neon-line absolute top-0 left-4 right-4 opacity-25" />
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-cyan-900/40">
              {(user?.name || "BK").substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || "Mekanik Kepala"}</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">{user?.email || "admin@bengkelku.app"}</p>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-amber-500/12 text-[#F59E0B] border border-amber-500/30">
              {user?.role || "ADMIN"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/8 hover:bg-rose-500/15 border border-rose-500/25 hover:border-rose-500/45 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar Sesi
          </button>
        </div>
      </aside>
    </>
  );
}
