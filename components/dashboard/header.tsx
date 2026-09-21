"use client";

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
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
    <header className="mb-6 pb-5" style={{ borderBottom: "1px solid rgba(30,41,59,0.7)" }}>
      {/* Top neon accent line */}
      <div className="neon-line mb-5 opacity-40" />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          {/* Breadcrumb / Status line */}
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex items-center justify-center w-2 h-2">
              <span className="absolute inline-block w-full h-full rounded-full bg-[#00D2FF] opacity-60 animate-ping" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00D2FF] shadow-[0_0_8px_#00D2FF]" />
            </span>
            <p className="text-[10px] font-bold text-[#00D2FF] uppercase tracking-widest flex items-center gap-1.5">
              <span>PitCare Auto</span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-400 font-medium normal-case tracking-normal">{today}</span>
            </p>
          </div>

          {/* Page title with gradient */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
            {title}
          </h1>

          {subtitle && (
            <div className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              {subtitle}
            </div>
          )}
        </div>

        {actionButton && (
          <div className="flex items-center gap-3 shrink-0 mt-1">
            {actionButton}
          </div>
        )}
      </div>
    </header>
  );
}
