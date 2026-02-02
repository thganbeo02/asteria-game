"use client";

import { CombatLayout } from "@/components/combat";
import { DeathScreen } from "@/components/screens/DeathScreen";
import { RunSummaryScreen } from "@/components/screens/RunSummaryScreen";
import { ShopScreen } from "@/components/screens/ShopScreen";
import { Button } from "@/components/ui";
import { useCombatStore, useGameStore } from "@/stores";
import { useEffect, useState, useCallback, useRef } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const autoStartAttempted = useRef(false);
  
  const startRun = useGameStore((state) => state.startRun);
  const setPhase = useGameStore((state) => state.setPhase);
  const initCombat = useCombatStore((state) => state.initCombat);
  const clearCombat = useCombatStore((state) => state.clearCombat);
  const hero = useCombatStore((state) => state.hero);
  const phase = useGameStore((state) => state.phase);
  const unlockedHeroes = useGameStore((state) => state.unlockedHeroes);

  // Handle hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Auto-start a test combat on mount if no hero and phase is combat
  useEffect(() => {
    if (mounted && !hero && phase === "combat" && !autoStartAttempted.current) {
      autoStartAttempted.current = true;
      console.log("Auto-starting test combat...");
      startRun("lyra", "hard");
      initCombat("lyra", "hard");
    }
  }, [mounted, hero, phase, startRun, initCombat]);

  const handleStartRun = useCallback(
    (heroId: string, difficulty: "easy" | "medium" | "hard") => {
      clearCombat();
      startRun(heroId, difficulty);
      initCombat(heroId, difficulty);
    },
    [clearCombat, startRun, initCombat]
  );

  const handleBackToSelect = useCallback(() => {
    clearCombat();
    setPhase("hero_select");
  }, [clearCombat, setPhase]);

  // Prevent hydration mismatch with a clearer message
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark text-text-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-class-mage border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Initializing Asteria...</p>
        </div>
      </div>
    );
  }

  if (phase === "combat" || phase === "victory") {
    return <CombatLayout />;
  }

  if (phase === "hero_select") {
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
                  <Button variant="secondary" size="md" onClick={() => handleStartRun(heroId, "easy")}>
                    Easy
                  </Button>
                  <Button variant="secondary" size="md" onClick={() => handleStartRun(heroId, "medium")}>
                    Medium
                  </Button>
                  <Button variant="primary" size="md" onClick={() => handleStartRun(heroId, "hard")}>
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
          <Button variant="secondary" size="lg" onClick={handleBackToSelect}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
