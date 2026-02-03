"use client";

import { useState } from "react";

import { useCombatStore, useGameStore } from "@/stores";
import type { RunDecisionKind } from "@/stores/gameStore/types";
import { Button, Tooltip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { performSkipTurn } from "@/systems/combat/combatActions";
import {
  AbilityTooltipContent,
  PassiveTooltipContent,
  TooltipMode,
} from "@/components/combat/ActionTooltips";

export function ActionBar() {
  const [tooltipMode, setTooltipMode] = useState<TooltipMode>("expanded");
  const hero = useCombatStore((state) => state.hero);
  const monster = useCombatStore((state) => state.monster);
  const turnPhase = useCombatStore((state) => state.turnPhase);
  const turnCount = useCombatStore((state) => state.turnCount);
  const skipTurnsUsed = useCombatStore((state) => state.skipTurnsUsed);
  const basicAttack = useCombatStore((state) => state.basicAttack);
  const castAbility = useCombatStore((state) => state.useAbility);
  const contractState = useGameStore((state) => state.run?.contractState);

  if (!hero) return null;

  const isPlayerTurn = turnPhase === "player_turn";
  const skipsRemaining = 3 - skipTurnsUsed;

  const recordDecision = (kind: RunDecisionKind, payload?: Record<string, unknown>) => {
    const run = useGameStore.getState().run;
    useGameStore.getState().recordDecision(kind, {
      turnCount,
      turnPhase,
      heroHp: hero.stats.hp,
      heroMaxHp: hero.stats.maxHp + hero.stats.bonusMaxHp,
      heroMana: hero.stats.mana,
      heroMaxMana: hero.stats.maxMana + hero.stats.bonusMaxMana,
      crystals: run?.crystals ?? 0,
      monsterId: monster?.definitionId ?? null,
      monsterHp: monster?.hp ?? null,
      ...payload,
    });
  };

  return (
    <div className="bg-bg-panel border-t border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Main Actions */}
        <div className="flex items-center gap-3">
          {/* Basic Attack with Passive Tooltip */}
          <Tooltip
            content={
              <PassiveTooltipContent hero={hero} mode={tooltipMode} contractState={contractState} />
            }
            position="top"
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                recordDecision("basic_attack");
                basicAttack();
              }}
              disabled={!isPlayerTurn}
              className="min-w-[100px]"
            >
              <span className="text-lg">⚔️</span>
              Attack
            </Button>
          </Tooltip>

          {/* Ability Buttons */}
          {hero.abilities.map((ability, index) => {
            const manaCost = ability.manaCost[Math.min(hero.level - 1, 6)];
            const isOnCooldown = ability.currentCooldown > 0;
            const hasEnoughMana = hero.stats.mana >= manaCost;
            const canUse = isPlayerTurn && !isOnCooldown && hasEnoughMana;

            return (
              <Tooltip
                key={ability.id}
                content={
                  <AbilityTooltipContent
                    hero={hero}
                    abilityIndex={index}
                    mode={tooltipMode}
                    monster={monster}
                    contractState={contractState}
                  />
                }
                position="top"
              >
                <Button
                  variant={canUse ? "primary" : "secondary"}
                  size="lg"
                  onClick={() => {
                    recordDecision("cast_ability", {
                      abilityIndex: index,
                      abilityId: ability.id,
                      manaCost,
                    });
                    castAbility(index);
                  }}
                  disabled={!canUse}
                  className={cn(
                    "min-w-[100px] relative",
                    isOnCooldown && "opacity-60"
                  )}
                >
                  <span className="text-lg">
                    {index === 0 ? "🔥" : index === 1 ? "🛡️" : "💥"}
                  </span>
                  <span className="truncate max-w-[60px]">{ability.name}</span>

                  {/* Cooldown Overlay */}
                  {isOnCooldown && (
                    <div className="absolute inset-0 bg-bg-dark/70 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-text-primary">
                        {ability.currentCooldown}
                      </span>
                    </div>
                  )}

                  {/* Mana Cost Badge */}
                  {!isOnCooldown && (
                    <span
                      className={cn(
                        "absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-xs font-medium",
                        hasEnoughMana
                          ? "bg-stat-mana text-white"
                          : "bg-red-600 text-white"
                      )}
                    >
                      {manaCost}
                    </span>
                  )}
                </Button>
              </Tooltip>
            );
          })}
        </div>

        {/* Skip Turn Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="md"
            onClick={() =>
              setTooltipMode((m) => (m === "brief" ? "expanded" : "brief"))
            }
            disabled={!hero}
            className="whitespace-nowrap"
          >
            Tooltips: {tooltipMode === "brief" ? "Brief" : "Expanded"}
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              recordDecision("skip_turn", { skipsRemaining });
              performSkipTurn();
            }}
            disabled={!isPlayerTurn || skipsRemaining <= 0}
          >
            Skip Turn ({skipsRemaining}/3)
          </Button>

          {/* Keyboard Hint */}
          <span className="text-xs text-text-muted hidden lg:block">
            Press SPACE to skip
          </span>
        </div>
      </div>
    </div>
  );
}
