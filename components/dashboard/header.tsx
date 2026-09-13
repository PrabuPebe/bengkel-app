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
    <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#d2b8ff]/10">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
          <p className="text-xs font-semibold text-[#817797] uppercase tracking-widest">
            Bengkelku Operational • {today}
          </p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f6f2ff] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#b5abc9] mt-1 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actionButton}
      </div>
    </header>
  );
}
