"use client";

import { useCombatStore } from "@/stores";
import { useGameStore } from "@/stores";
import { EXP_THRESHOLDS, MAX_LEVEL } from "@/lib/constants";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";

function expProgress(exp: number, level: number): {
  label: string;
  tooltip: string;
  pct: number;
} {
  if (level >= MAX_LEVEL) {
    return { label: "MAX", tooltip: "Max level", pct: 1 };
  }

  // Thresholds are cumulative.
  // Show progress within the current level: (exp - prevThreshold) / (next - prev).
  const prevThreshold = (EXP_THRESHOLDS as Record<number, number>)[level] ?? 0;
  const nextThreshold = (EXP_THRESHOLDS as Record<number, number>)[level + 1] ?? prevThreshold;
  const current = Math.max(0, exp - prevThreshold);
  const needed = Math.max(1, nextThreshold - prevThreshold);
  const pct = Math.max(0, Math.min(1, current / needed));
  return {
    label: `${Math.floor(pct * 100)}%`,
    tooltip: `${current} / ${needed}`,
    pct,
  };
}

export function CombatHeader() {
  const turnCount = useCombatStore((state) => state.turnCount);
  const run = useGameStore((state) => state.run);
  const hero = useCombatStore((state) => state.hero);

  if (!run) return null;

  const level = hero?.level ?? run.currentLevel;
  const exp = run.exp ?? 0;
  const xp = expProgress(exp, level);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      {/* Logo / Game Name */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="text-teal-400 font-bold text-lg tracking-wide">
          ASTERIA
        </span>
      </div>

      {/* Turn Counter */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-text-muted uppercase tracking-widest mb-1">
          Current Turn
        </span>
        <div className="overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {(() => {
              const left =
                turnCount > 1
                  ? { key: String(turnCount - 1), label: String(turnCount - 1), kind: "muted" as const }
                  : { key: "pad-0", label: "--", kind: "muted" as const };
              const current = { key: String(turnCount), label: String(turnCount), kind: "current" as const };
              const right = { key: String(turnCount + 1), label: String(turnCount + 1), kind: "muted" as const };

              const numbers = [left, current, right];
              const elements: Array<
                | { type: "num"; key: string; label: string; kind: "muted" | "current" }
                | { type: "sep"; key: string }
              > = [];

              for (let i = 0; i < numbers.length; i++) {
                const n = numbers[i];
                if (i > 0) {
                  elements.push({
                    type: "sep",
                    key: `sep-${numbers[i - 1].key}-${n.key}`,
                  });
                }
                elements.push({ type: "num", key: n.key, label: n.label, kind: n.kind });
              }

              return (
                <div className="flex items-center gap-2 text-xl tabular-nums">
                  {elements.map((el) => {
                    if (el.type === "sep") {
                      return (
                        <motion.span
                          layout
                          key={el.key}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="text-text-muted"
                        >
                          |
                        </motion.span>
                      );
                    }

                    const isCurrent = el.kind === "current";

                    return (
                      <motion.span
                        layout
                        key={el.key}
                        initial={{ opacity: 0, x: 10, filter: "blur(2px)", scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)", scale: 1 }}
                        exit={{ opacity: 0, x: -10, filter: "blur(2px)", scale: 0.98 }}
                        transition={{
                          duration: 0.28,
                          ease: "easeInOut",
                          layout: { duration: 0.34, ease: "easeInOut" },
                        }}
                        className={
                          isCurrent
                            ? "text-text-primary font-bold text-2xl w-9 text-center font-mono"
                            : "text-text-muted w-7 text-center font-mono"
                        }
                      >
                        {el.label}
                      </motion.span>
                    );
                  })}
                </div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>

      {/* Run Info */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-col items-end">
          <span className="text-xs text-text-muted uppercase tracking-widest">
            Encounter
          </span>
          <span className="text-text-secondary font-semibold">
            {run.encounter} · Level {level}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-text-muted">Crystals</div>
            <div className="text-text-primary font-semibold tabular-nums">{run.crystals}</div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-text-muted">EXP</div>
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-28 rounded-full bg-bg-dark/40 overflow-hidden border border-border"
                title={xp.tooltip}
              >
                <div
                  className="h-full bg-teal-500"
                  style={{ width: `${xp.pct * 100}%` }}
                />
              </div>
              <div className="text-xs text-text-muted tabular-nums w-10 text-right">{xp.label}</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <ThemeToggle />
      </div>
    </header>
  );
}
