"use client";

import { useCombatStore, useGameStore } from "@/stores";
import { MONSTERS } from "@/data/monsters";
import { HealthBar } from "@/components/ui";
import { cn } from "@/lib/cn";

export function MonsterPanel() {
  const monster = useCombatStore((state) => state.monster);
  const run = useGameStore((state) => state.run);

  if (!monster) {
    return (
      <div className="panel p-6">
        <p className="text-text-muted text-center">No enemy</p>
      </div>
    );
  }

  const definition = MONSTERS[monster.definitionId];
  if (!definition) return null;

  const contractState = run?.heroId === "shade" ? run.contractState : undefined;

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
          💎 {monster.crystalReward} Crystals
        </span>
        <span className="text-text-muted">
          ✨ {monster.expReward} EXP
        </span>
      </div>

      {contractState && (
        (() => {
          const remaining = Math.max(0, contractState.currentTurnLimit - contractState.currentTurn);
          const pct = contractState.currentTurnLimit > 0
            ? Math.min(1, contractState.currentTurn / contractState.currentTurnLimit)
            : 0;
          const deadline = remaining > 0 && remaining <= 2;
          const tierStyles: Record<string, string> = {
            casual: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
            standard: "bg-amber-500/15 text-amber-300 border-amber-500/40",
            rush: "bg-orange-500/15 text-orange-300 border-orange-500/40",
            impossible: "bg-red-500/15 text-red-300 border-red-500/40",
          };

          return (
            <div className="rounded-xl border border-border bg-bg-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-text-primary">Contract</div>
                <span
                  className={cn(
                    "text-[11px] uppercase tracking-wide border px-2 py-0.5 rounded-full",
                    tierStyles[contractState.tier] ?? "bg-bg-dark/40 text-text-muted border-border",
                  )}
                >
                  {contractState.tier}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                <span>Turns: {Math.min(contractState.currentTurn, contractState.currentTurnLimit)} / {contractState.currentTurnLimit}</span>
                {deadline && <span className="text-amber-300 font-semibold animate-pulse">Deadline</span>}
              </div>

              <div className="mt-2 h-2 w-full rounded-full bg-bg-dark/60 overflow-hidden">
                <div
                  className={cn("h-full transition-all", deadline ? "bg-amber-400" : "bg-class-mage")}
                  style={{ width: `${Math.round(pct * 100)}%` }}
                />
              </div>

              <div className="mt-3 text-xs text-text-secondary flex flex-wrap gap-2">
                <span>+{Math.round(contractState.crystalBonus * 100)}% Crystals</span>
                <span>+{Math.round(contractState.expBonus * 100)}% EXP</span>
                {contractState.goldBonus > 0 && <span>+{contractState.goldBonus} Gold</span>}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                <span>Streak: <span className="font-semibold text-text-primary">{contractState.streak}</span></span>
                <span>Completed: <span className="font-semibold text-text-primary">{contractState.completed}</span></span>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
