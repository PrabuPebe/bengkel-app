"use client";

import { useSession } from "next-auth/react";

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export function Header({ title, subtitle, actionButton }: HeaderProps) {
  const { data: session } = useSession();
  const workshopName = (session?.user as any)?.workshopName || "Bengkel Mitra";

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-6 pb-5 border-b border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-700">PitCare Auto</span>
              <span>•</span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {workshopName}
              </span>
              <span>•</span>
              <span>{today}</span>
            </p>
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>

          {subtitle && (
            <div className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              {subtitle}
            </div>
          )}
        </div>

        {actionButton && (
          <div className="flex items-center gap-3 shrink-0">
            {actionButton}
          </div>
        )}
      </div>
    </header>
  );
}
