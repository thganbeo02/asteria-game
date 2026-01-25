import { cn } from "@/lib/cn";

interface Stat {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}

interface StatDisplayProps {
  stats: Stat[];
  columns?: 2 | 4;
  className?: string;
}

export function StatDisplay({ stats, columns = 2, className }: StatDisplayProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 ? "grid-cols-2" : "grid-cols-4",
        className
      )}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col">
          <span className="text-xs text-text-muted uppercase tracking-wide">
            {stat.label}
          </span>
          <span className="text-lg font-bold text-text-primary">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}