"use client";

import { useCombatStore } from "@/stores";
import { getHeroDefinition } from "@/data/heroes";
import { HealthBar, StatDisplay } from "@/components/ui";
import { cn } from "@/lib/cn";

export function HeroPanel() {
  const hero = useCombatStore((state) => state.hero);

  if (!hero) {
    return (
      <div className="panel p-6">
        <p className="text-text-muted">No hero loaded</p>
      </div>
    );
  }

  const definition = getHeroDefinition(hero.definitionId);
  if (!definition) return null;

  const { stats } = hero;
  const currentHp = stats.hp;
  const maxHp = stats.maxHp + stats.bonusMaxHp;
  const currentMana = stats.mana;
  const maxMana = stats.maxMana + stats.bonusMaxMana;

  // Extract shield value from status effects
  // Pass undefined when no shield (hides bar), or the value (including 0 for break animation)
  const shieldEffect = hero.statusEffects.find((e) => e.type === "shield");
  const shieldAmount = shieldEffect?.value;

  const displayStats = [
    { label: "ATK", value: stats.atk + stats.bonusAtk },
    { label: "DEF", value: stats.def + stats.bonusDef },
    { label: "CRIT", value: `${stats.critChance + stats.bonusCritChance}%` },
    { label: "DODGE", value: `${stats.dodge + stats.bonusDodge}%` },
  ];

  return (
    <div className="panel p-6 flex flex-col gap-5">
      {/* Hero Identity */}
      <div className="flex items-center gap-4">
        {/* Avatar Placeholder */}
        <div className="w-14 h-14 rounded-xl bg-bg-hover border border-border flex items-center justify-center">
          <span className="text-2xl">⚔️</span>
        </div>

        <div>
          <h2 className="text-xl font-bold text-text-primary">{definition.name}</h2>
          <p className="text-sm text-text-muted uppercase tracking-wide">
            Level {hero.level} {definition.class}
          </p>
        </div>
      </div>

      {/* Health Bar */}
      <HealthBar
        current={currentHp}
        max={maxHp}
        label="Vitality (HP)"
        variant="health"
        shield={shieldAmount}
      />

      {/* Mana Bar */}
      <HealthBar
        current={currentMana}
        max={maxMana}
        label="Resonance (MP)"
        variant="mana"
      />

      {/* Stats Grid */}
      <StatDisplay stats={displayStats} columns={2} />

      {/* Status Effects */}
      <div className="flex flex-wrap gap-2">
        {hero.statusEffects.length === 0 ? (
          <span className="text-xs text-text-muted">No active effects</span>
        ) : (
          hero.statusEffects.map((effect, index) => (
            <div
              key={`${effect.type}-${index}`}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                effect.source === "hero"
                  ? "bg-class-mage/20 text-class-mage border border-class-mage/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              )}
            >
              {effect.name}
              {effect.stacks > 1 && ` x${effect.stacks}`}
              {effect.duration > 0 && ` (${effect.duration})`}
            </div>
          ))
        )}
      </div>
    </div>
  );
}