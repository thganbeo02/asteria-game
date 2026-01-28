"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import { proceedToNextEncounter } from "@/systems/combat/combatActions";
import { useCombatStore, useGameStore } from "@/stores";

export function BattleArena() {
  const monster = useCombatStore((state) => state.monster);
  const turnPhase = useCombatStore((state) => state.turnPhase);
  const phase = useGameStore((state) => state.phase);
  const run = useGameStore((state) => state.run);

  const isPlayerTurn = turnPhase === "player_turn";
  const isMonsterTurn = turnPhase === "monster_turn";
  const isVictory = phase === "victory" && turnPhase === "combat_end";

  if (isVictory && run && monster) {
    const nextEncounter = run.encounter + 1;
    const shopFrequency = DIFFICULTY_CONFIG[run.difficulty].shopFrequency;
    const willShop = (nextEncounter - 1) % shopFrequency === 0 && nextEncounter > 1;

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div
          className={cn(
            "w-full max-w-md",
            "rounded-2xl border border-border bg-bg-panel",
            "p-5",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-amber-400 font-bold text-2xl">Victory</div>
              <div className="text-text-secondary mt-1">
                Earned <span className="font-semibold text-text-primary">{monster.crystalReward}</span> crystals.
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-text-muted">Up Next</div>
              <div className="text-text-primary font-semibold">
                {willShop ? "Shop" : `Encounter ${nextEncounter}`}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => useGameStore.getState().endRun(true)}
            >
              End Run
            </Button>

            <Button variant="primary" size="lg" onClick={() => proceedToNextEncounter()}>
              {willShop ? "Enter Shop" : "Next Encounter"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      {/* Battle Portraits */}
      <div className="flex items-center gap-12">
        {/* Hero Portrait */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-24 h-24 rounded-full border-4 flex items-center justify-center",
              "bg-bg-panel transition-all duration-300",
              isPlayerTurn
                ? "border-class-mage shadow-lg shadow-class-mage/30"
                : "border-border"
            )}
          >
            <span className="text-4xl">⚔️</span>
          </div>

          {isPlayerTurn && (
            <span className="px-3 py-1 bg-class-mage text-white text-xs font-semibold rounded-full uppercase tracking-wide">
              Your Turn
            </span>
          )}
        </div>

        {/* VS Indicator */}
        <div className="text-text-muted font-bold text-2xl">VS</div>

        {/* Monster Portrait */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-24 h-24 rounded-full border-4 flex items-center justify-center",
              "bg-bg-panel transition-all duration-300",
              isMonsterTurn
                ? "border-red-500 shadow-lg shadow-red-500/30"
                : "border-border"
            )}
          >
            <span className="text-4xl">👹</span>
          </div>

          {isMonsterTurn && (
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full uppercase tracking-wide">
              Enemy Turn
            </span>
          )}
        </div>
      </div>

      {/* Turn Phase Status */}
      <div className="text-center">
        {turnPhase === "combat_end" && (
          <span className="text-xl font-bold text-amber-400">
            Combat Ended!
          </span>
        )}
      </div>
    </div>
  );
}
