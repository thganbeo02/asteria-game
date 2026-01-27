"use client";

import { useCombatStore } from "@/stores";
import { useGameStore } from "@/stores";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";

export function CombatHeader() {
  const turnCount = useCombatStore((state) => state.turnCount);
  const run = useGameStore((state) => state.run);

  if (!run) return null;

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

      {/* Encounter Info */}
      <div className="flex flex-col items-end">
        <span className="text-xs text-text-muted uppercase tracking-widest">
          Encounter
        </span>
        <span className="text-text-secondary font-semibold">
          {run.encounter} · Level {run.currentLevel}
        </span>
      </div>

      <div>
        <ThemeToggle />
      </div>
    </header>
  );
}
