"use client";

import { useCombatStore } from "@/stores";
import { MONSTERS } from "@/data/monsters";
import { HealthBar } from "@/components/ui";
import { cn } from "@/lib/cn";

export function MonsterPanel() {
  const monster = useCombatStore((state) => state.monster);

  if (!monster) {
    return (
      <div className="panel p-6">
        <p className="text-text-muted text-center">No enemy</p>
      </div>
    );
  }

  const definition = MONSTERS[monster.definitionId];
  if (!definition) return null;

  return (
    <div className="liquid-panel p-6 flex flex-col gap-5">
      {/* Monster Identity */}
      <div className="flex items-center justify-end gap-4">
        <div className="text-right">
          <h2 className="text-xl font-bold text-text-primary">{definition.name}</h2>
          <p className="text-sm text-red-500 uppercase tracking-wide">
            {definition.description.split(".")[0]}
          </p>
        </div>

        {/* Avatar Placeholder */}
        <div className="liquid-tile w-14 h-14 flex items-center justify-center">
          <span className="text-2xl">👹</span>
        </div>
      </div>

      {/* Health Bar */}
      <HealthBar
        current={monster.hp}
        max={monster.maxHp}
        label="Health"
        variant="enemy"
      />

      {/* Monster Stats Preview */}
      <div className="flex justify-end gap-6 text-sm">
        <div className="text-right">
          <span className="text-text-muted">ATK</span>
          <span className="ml-2 text-text-primary font-semibold">{monster.atk}</span>
        </div>
        <div className="text-right">
          <span className="text-text-muted">DEF</span>
          <span className="ml-2 text-text-primary font-semibold">{monster.def}</span>
        </div>
      </div>

      {/* Status Effects */}
      <div className="flex flex-wrap justify-end gap-2">
        {monster.statusEffects.length === 0 ? (
          <span className="text-xs text-text-muted">No active effects</span>
        ) : (
          monster.statusEffects.map((effect, index) => (
            <div
              key={`${effect.type}-${index}`}
              className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30"
            >
              {effect.name}
              {effect.stacks > 1 && ` x${effect.stacks}`}
              {effect.duration > 0 && ` (${effect.duration})`}
            </div>
          ))
        )}
      </div>

      {/* Rewards Preview */}
      <div className="pt-3 border-t border-border flex justify-end gap-4 text-xs">
        <span className="text-text-muted">
          💎 {monster.crystalReward} crystals
        </span>
        <span className="text-text-muted">
          ✨ {monster.expReward} exp
        </span>
      </div>
    </div>
  );
}
