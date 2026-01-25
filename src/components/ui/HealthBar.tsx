import { cn } from "@/lib/cn";

interface HealthBarProps {
  current: number;
  max: number;
  label: string;
  variant: "health" | "mana" | "enemy";
  showValues?: boolean;
  className?: string;
}

const variantStyles = {
  health: {
    bar: "bg-emerald-500",
    track: "bg-emerald-950",
    label: "text-emerald-400",
  },
  mana: {
    bar: "bg-blue-500",
    track: "bg-blue-950",
    label: "text-blue-400",
  },
  enemy: {
    bar: "bg-rose-500",
    track: "bg-rose-950",
    label: "text-blue-400",
  },
};

export function HealthBar({
  current,
  max,
  label,
  variant,
  showValues = true,
  className,
}: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const styles = variantStyles[variant];

  return (
    <div className={cn("w-full", className)}>
      {/* Label and Values row */}
      <div className="flex justify-between items-center mb-1">
        <span>{label}</span>
        {showValues && (
          <span className="text-sm font-semibold text-gray-200">
            {Math.floor(current)} / {max}
          </span>
        )}
      </div>

      <div className={cn("h-2 rounded-full overflow-hidden", styles.track)}>
        {/* Bar fill */}
        <div
          className={cn(
            "h-full rounded-full transitional-all duration-300 ease-out",
            styles.bar,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
