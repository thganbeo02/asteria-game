"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useCombatStore, useGameStore } from "@/stores";

function totalKills(monstersKilled: Record<string, number>): number {
  return Object.values(monstersKilled).reduce((a, b) => a + b, 0);
}

export function DeathScreen() {
  const phase = useGameStore((s) => s.phase);
  const run = useGameStore((s) => s.run);

  if (phase !== "death") return null;

  const restart = () => {
    const game = useGameStore.getState();
    const combat = useCombatStore.getState();

    if (!game.run) {
      // Fallback: start a default run
      game.startRun("lyra", "hard");
      combat.initCombat("lyra", "hard");
      return;
    }

    const { heroId, difficulty } = game.run;
    combat.clearCombat();
    game.startRun(heroId, difficulty);
    combat.initCombat(heroId, difficulty);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={cn("w-full max-w-2xl", "rounded-2xl border border-border bg-bg-panel p-6")}>
        <div className="text-2xl font-bold text-text-primary">You Died</div>
        <div className="text-text-secondary mt-2">
          {run ? "Your run has ended." : "No run data available."}
        </div>

        {run && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-bg-dark/30 p-4">
              <div className="text-xs uppercase tracking-widest text-text-muted">Encounter Reached</div>
              <div className="text-xl font-bold text-text-primary mt-1">{run.encounter}</div>
            </div>
            <div className="rounded-xl border border-border bg-bg-dark/30 p-4">
              <div className="text-xs uppercase tracking-widest text-text-muted">Score</div>
              <div className="text-xl font-bold text-text-primary mt-1">{run.score}</div>
            </div>
            <div className="rounded-xl border border-border bg-bg-dark/30 p-4">
              <div className="text-xs uppercase tracking-widest text-text-muted">Crystals Earned</div>
              <div className="text-xl font-bold text-text-primary mt-1">{run.crystalsEarned}</div>
            </div>
            <div className="rounded-xl border border-border bg-bg-dark/30 p-4">
              <div className="text-xs uppercase tracking-widest text-text-muted">Monsters Killed</div>
              <div className="text-xl font-bold text-text-primary mt-1">{totalKills(run.monstersKilled)}</div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="secondary" size="lg" onClick={() => useGameStore.getState().setPhase("hero_select")}>
            Hero Select
          </Button>
          <Button variant="primary" size="lg" onClick={() => restart()}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
