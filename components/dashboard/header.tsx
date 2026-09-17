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
    <header className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-[#412D15]/40">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#412D15] animate-pulse" />
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            PitCare Auto Suite • {today}
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed font-medium">
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
