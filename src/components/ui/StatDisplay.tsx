import { cn } from "@/lib/cn";
import { useEffect, useMemo, useRef, useState } from "react";

interface Stat {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  numericValue?: number;
}

interface StatDisplayProps {
  stats: Stat[];
  columns?: 2 | 4;
  className?: string;
}

export function StatDisplay({ stats, columns = 2, className }: StatDisplayProps) {
  const [flash, setFlash] = useState<Record<string, "up" | "down" | undefined>>({});
  const prev = useRef<Record<string, number>>({});
  const timers = useRef<Record<string, number>>({});
  const rafs = useRef<Record<string, number>>({});

  const numericByLabel = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of stats) {
      if (typeof s.numericValue === "number" && Number.isFinite(s.numericValue)) {
        out[s.label] = s.numericValue;
      }
    }
    return out;
  }, [stats]);

  useEffect(() => {
    for (const [label, nextVal] of Object.entries(numericByLabel)) {
      const prevVal = prev.current[label];
      prev.current[label] = nextVal;
      if (typeof prevVal !== "number") continue;
      if (prevVal === nextVal) continue;

      const dir: "up" | "down" = nextVal > prevVal ? "up" : "down";

      const existingRaf = rafs.current[label];
      if (existingRaf) window.cancelAnimationFrame(existingRaf);
      rafs.current[label] = window.requestAnimationFrame(() => {
        setFlash((cur) => ({ ...cur, [label]: dir }));
      });

      const existing = timers.current[label];
      if (existing) window.clearTimeout(existing);
      timers.current[label] = window.setTimeout(() => {
        setFlash((cur) => {
          if (cur[label] === undefined) return cur;
          const next = { ...cur };
          delete next[label];
          return next;
        });
        delete timers.current[label];
      }, 650);
    }
  }, [numericByLabel]);

  useEffect(() => {
    return () => {
      for (const id of Object.values(timers.current)) window.clearTimeout(id);
      timers.current = {};

      for (const id of Object.values(rafs.current)) window.cancelAnimationFrame(id);
      rafs.current = {};
    };
  }, []);

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
          <span
            className={cn(
              "text-lg font-bold text-text-primary",
              flash[stat.label] === "up" && "text-emerald-400 animate-[stat-bump_650ms_ease-out]",
              flash[stat.label] === "down" && "text-red-400 animate-[stat-drop_650ms_ease-out]",
            )}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
