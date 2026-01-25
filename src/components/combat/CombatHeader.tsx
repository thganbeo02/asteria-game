"use client";

import { useCombatStore } from "@/stores";
import { useGameStore } from "@/stores";
import { ThemeToggle } from "../ui/ThemeToggle";

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
        <div className="flex items-center gap-2 text-xl">
          <span className="text-text-muted">{Math.max(1, turnCount - 1)}</span>
          <span className="text-text-muted">|</span>
          <span className="text-text-primary font-bold text-2xl">{turnCount}</span>
          <span className="text-text-muted">|</span>
          <span className="text-text-muted">{turnCount + 1}</span>
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