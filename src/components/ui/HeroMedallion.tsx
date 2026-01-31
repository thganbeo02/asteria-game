import { cn } from "@/lib/cn";

interface HeroMedallionProps {
  level: number;
  expPct: number; // 0..1
  expTooltip?: string;
  portrait?: React.ReactNode;
  className?: string;
}

export function HeroMedallion({
  level,
  expPct,
  expTooltip,
  portrait,
  className,
}: HeroMedallionProps) {
  const pct = Math.max(0, Math.min(1, expPct));

  // SVG circle math
  const r = 44;
  const c = 2 * Math.PI * r;
  const dash = c;
  const dashOffset = c * (1 - pct);

  return (
    <div
      className={cn(
        "relative",
        "w-20 h-20",
        className,
      )}
      title={expTooltip}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        aria-hidden="true"
      >
        {/* Outer track */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--ui-border)"
          strokeWidth="4"
          opacity="0.9"
        />

        {/* Progress ring (starts at bottom) */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgb(20 184 166)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={dashOffset}
          transform="rotate(90 50 50)"
          style={{ transition: "stroke-dashoffset 420ms ease" }}
        />
      </svg>

      {/* Portrait frame */}
      <div className="absolute inset-[10px] rounded-full overflow-hidden border border-border bg-bg-panel flex items-center justify-center">
        <div className="text-2xl select-none">{portrait ?? "\u2694\uFE0F"}</div>
      </div>

      {/* Level badge (bottom-right) */}
      <div className="absolute -right-1 -bottom-1 w-9 h-9 rounded-full border border-border bg-bg-panel flex items-center justify-center shadow-sm">
        <span className="text-sm font-extrabold text-text-primary tabular-nums">{level}</span>
      </div>
    </div>
  );
}
