"use client";

import { useCombatStore } from "@/stores";
import { getHeroDefinition } from "@/data/heroes";
import { MONSTERS } from "@/data/monsters";
import { cn } from "@/lib/cn";

export function BattleArena() {
  const hero = useCombatStore((state) => state.hero);
  const monster = useCombatStore((state) => state.monster);
  const turnPhase = useCombatStore((state) => state.turnPhase);

  const heroDefinition = hero ? getHeroDefinition(hero.definitionId) : null;
  const monsterDefinition = monster ? MONSTERS[monster.definitionId] : null;

  const isPlayerTurn = turnPhase === "player_turn";
  const isMonsterTurn = turnPhase === "monster_turn";

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