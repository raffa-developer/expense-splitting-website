import type { ReactNode } from "react";

export function AppWindow({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute -inset-8 -z-10 rounded-[3rem]"
      />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-frame">
        <div className="flex items-center gap-3 border-b border-line bg-muted-surface px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-negative/70" />
            <span className="size-2.5 rounded-full bg-butter/70" />
            <span className="size-2.5 rounded-full bg-positive/70" />
          </span>
          <span className="money text-[11px] text-muted">{label}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
