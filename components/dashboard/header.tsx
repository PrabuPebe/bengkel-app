"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export function Header({ title, subtitle, actionButton }: HeaderProps) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-slate-100">
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
          PitCare Auto Suite • {today}
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actionButton && (
        <div className="flex items-center gap-3 shrink-0 mt-1">
          {actionButton}
        </div>
      )}
    </header>
  );
}
