"use client";

import { CombatLayout } from "@/components/combat";
import { DeathScreen } from "@/components/screens/DeathScreen";
import { RunSummaryScreen } from "@/components/screens/RunSummaryScreen";
import { ShopScreen } from "@/components/screens/ShopScreen";
import { Button } from "@/components/ui";
import { useCombatStore, useGameStore } from "@/stores";
import { useEffect } from "react";

export default function Home() {
  const startRun = useGameStore((state) => state.startRun);
  const initCombat = useCombatStore((state) => state.initCombat);
  const hero = useCombatStore((state) => state.hero);
  const phase = useGameStore((state) => state.phase);
  const unlockedHeroes = useGameStore((state) => state.unlockedHeroes);

  // Auto-start a test combat on mount
  useEffect(() => {
    if (!hero && phase === "combat") {
      startRun("lyra", "hard");
      initCombat("lyra", "hard");
    }
  }, [hero, phase, startRun, initCombat]);

  if (phase === "combat" || phase === "victory") {
    return <CombatLayout />;
  }

  if (phase === "hero_select") {
    const start = (heroId: string, difficulty: "easy" | "medium" | "hard") => {
      const game = useGameStore.getState();
      const combat = useCombatStore.getState();

      combat.clearCombat();
      game.startRun(heroId, difficulty);
      combat.initCombat(heroId, difficulty);
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-3xl rounded-2xl border border-border bg-bg-panel p-6">
          <div className="text-2xl font-bold text-text-primary">Choose Your Hero</div>
          <div className="text-text-secondary mt-2">
            Hero select is a placeholder. Pick a hero and difficulty to start a run.
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlockedHeroes.map((heroId) => (
              <div key={heroId} className="rounded-2xl border border-border bg-bg-dark/30 p-5">
                <div className="text-lg font-bold text-text-primary capitalize">{heroId}</div>
                <div className="text-sm text-text-muted mt-1">Start a new run</div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" size="md" onClick={() => start(heroId, "easy")}>
                    Easy
                  </Button>
                  <Button variant="secondary" size="md" onClick={() => start(heroId, "medium")}>
                    Medium
                  </Button>
                  <Button variant="primary" size="md" onClick={() => start(heroId, "hard")}>
                    Hard
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "shop") {
    return <ShopScreen />;
  }

  if (phase === "death") {
    return <DeathScreen />;
  }

  if (phase === "run_summary") {
    return <RunSummaryScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-bg-panel p-6">
        <div className="text-2xl font-bold text-text-primary">{phase}</div>
        <div className="text-text-secondary mt-2">This screen is not wired up yet.</div>
        <div className="mt-6 flex justify-end">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              const combat = useCombatStore.getState();

              combat.clearCombat();
              useGameStore.getState().setPhase("hero_select");
            }}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
