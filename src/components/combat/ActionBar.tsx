"use client";

import { useCombatStore } from "@/stores";
import { getHeroDefinition } from "@/data/heroes";
import { Button, Tooltip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { performSkipTurn } from "@/systems/combat/combatActions";

interface PassiveTooltipProps {
  heroId: string;
}

function PassiveTooltipContent({ heroId }: PassiveTooltipProps) {
  const definition = getHeroDefinition(heroId);
  if (!definition) return null;

  return (
    <div className="max-w-sm">
      <div className="font-semibold text-class-mage mb-1">
        {definition.passive.name}
      </div>
      <p className="text-text-secondary text-sm whitespace-pre-wrap">
        {definition.passive.expandedDescription}
      </p>
    </div>
  );
}

export function ActionBar() {
  const hero = useCombatStore((state) => state.hero);
  const turnPhase = useCombatStore((state) => state.turnPhase);
  const skipTurnsUsed = useCombatStore((state) => state.skipTurnsUsed);
  const basicAttack = useCombatStore((state) => state.basicAttack);
  const castAbility = useCombatStore((state) => state.useAbility);

  if (!hero) return null;

  const isPlayerTurn = turnPhase === "player_turn";
  const skipsRemaining = 3 - skipTurnsUsed;

  return (
    <div className="bg-bg-panel border-t border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Main Actions */}
        <div className="flex items-center gap-3">
          {/* Basic Attack with Passive Tooltip */}
          <Tooltip
            content={<PassiveTooltipContent heroId={hero.definitionId} />}
            position="top"
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => basicAttack()}
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
                  <div className="max-w-xs">
                    <div className="font-semibold text-class-mage">{ability.name}</div>
                    <p className="text-text-secondary text-sm mt-1">
                      {ability.description}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-text-muted">
                      <span>💧 {manaCost} MP</span>
                      <span>⏱️ {ability.cooldown} turn CD</span>
                    </div>
                  </div>
                }
                position="top"
              >
                <Button
                  variant={canUse ? "primary" : "secondary"}
                  size="lg"
                  onClick={() => castAbility(index)}
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
            onClick={() => performSkipTurn()}
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
