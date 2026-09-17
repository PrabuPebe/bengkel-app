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
    <header className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-slate-800/80">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00D2FF] shadow-[0_0_10px_#00D2FF] animate-pulse" />
          <p className="text-[11px] font-bold text-[#00D2FF] uppercase tracking-widest flex items-center gap-2">
            <span>Bengkelku Pitstop</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium">{today}</span>
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed font-medium">
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
