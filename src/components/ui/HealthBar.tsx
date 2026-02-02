import { cn } from "@/lib/cn";

interface HealthBarProps {
  current: number;
  max: number;
  label: string;
  variant: "health" | "mana" | "enemy";
  showValues?: boolean;
  className?: string;
  /** Optional shield amount - shown when defined (including 0 for break animation) */
  shield?: number;
}

const variantStyles = {
  health: {
    bar: "bg-emerald-500",
    track: "bg-emerald-950",
    label: "text-emerald-400 font-bold",
    value: "text-emerald-500 font-extrabold",
  },
  mana: {
    bar: "bg-blue-500",
    track: "bg-blue-950",
    label: "text-blue-400 font-bold",
    value: "text-blue-500 font-extrabold",
  },
  enemy: {
    bar: "bg-rose-500",
    track: "bg-rose-950",
    label: "text-rose-400 font-bold",
    value: "text-rose-500 font-extrabold",
  },
};

export function HealthBar({
  current,
  max,
  label,
  variant,
  showValues = true,
  className,
  shield,
}: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const styles = variantStyles[variant];

  // Show shield bar when shield is defined (including 0 for break animation)
  // State flow: shield value X → 0 (animate) → removed (hide)
  const showShieldBar = shield !== undefined;
  const shieldValue = shield ?? 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Label and Values row */}
      <div className="flex justify-between items-center mb-1">
        <span className={cn("text-sm font-medium", styles.label)}>{label}</span>
        {showValues && (
          <span className={cn("text-sm font-semibold tabular-nums", styles.value)}>
            {Math.floor(current)} / {max}
            {shieldValue > 0 && (
              <span className="text-cyan-400"> (+{Math.floor(shieldValue)})</span>
            )}
          </span>
        )}
      </div>

      <div className={cn("h-4 rounded-full overflow-hidden", styles.track)}>
        {/* Bar fill */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            styles.bar,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Shield bar - shown when shield exists (including 0 for break animation) */}
      {showShieldBar && (
        <div className="mt-1">
          <div className="h-3 rounded-full overflow-hidden bg-cyan-950">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out bg-cyan-400"
              style={{ width: `${Math.min(100, (shieldValue / max) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
