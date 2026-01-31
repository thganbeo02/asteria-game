"use client";

import { useCombatStore } from "@/stores";
import { useGameStore } from "@/stores";
import { getHeroDefinition } from "@/data/heroes";
import { HealthBar, HeroMedallion, StatDisplay } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getDefenseModifier } from "@/systems/combat/statusEffects";
import { EXP_THRESHOLDS, MAX_LEVEL } from "@/lib/constants";

export function HeroPanel() {
  const hero = useCombatStore((state) => state.hero);
  const run = useGameStore((s) => s.run);
  const phase = useGameStore((s) => s.phase);

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

  const isCompact = phase === "shop";
  const levelFromRun = hero.level ?? run?.currentLevel ?? 1;
  const exp = run?.exp ?? 0;
  const xp = (() => {
    if (levelFromRun >= MAX_LEVEL) return { pct: 1, tooltip: "Max level" };
    const prevThreshold = (EXP_THRESHOLDS as Record<number, number>)[levelFromRun] ?? 0;
    const nextThreshold = (EXP_THRESHOLDS as Record<number, number>)[levelFromRun + 1] ?? prevThreshold;
    const current = Math.max(0, exp - prevThreshold);
    const needed = Math.max(1, nextThreshold - prevThreshold);
    const pct = Math.max(0, Math.min(1, current / needed));
    return { pct, tooltip: `${current} / ${needed}` };
  })();

  // Extract shield value from status effects
  // Pass undefined when no shield (hides bar), or the value (including 0 for break animation)
  const shieldEffect = hero.statusEffects.find((e) => e.type === "shield");
  const shieldAmount = shieldEffect?.value;

  const baseDef = stats.def + stats.bonusDef;
  const defModifier = getDefenseModifier(hero.statusEffects);
  const effectiveDef = Math.floor(baseDef * defModifier);
  const tempDefDelta = Math.max(0, effectiveDef - baseDef);

  const displayStats = [
    { label: "ATK", value: stats.atk + stats.bonusAtk, numericValue: stats.atk + stats.bonusAtk },
    {
      label: "DEF",
      value:
        tempDefDelta > 0 ? (
          <span>
            {effectiveDef}
            <span className="text-emerald-400 text-sm font-semibold"> (+{tempDefDelta})</span>
          </span>
        ) : (
          baseDef
        ),
      numericValue: effectiveDef,
    },
    {
      label: "CRIT CH",
      value: `${stats.critChance + stats.bonusCritChance}%`,
      numericValue: stats.critChance + stats.bonusCritChance,
    },
    {
      label: "CRIT MULT",
      value: `x${(stats.critMultiplier + stats.bonusCritMultiplier).toFixed(2)}`,
      numericValue: stats.critMultiplier + stats.bonusCritMultiplier,
    },
    {
      label: "DODGE",
      value: `${stats.dodge + stats.bonusDodge}%`,
      numericValue: stats.dodge + stats.bonusDodge,
    },
    {
      label: "PEN",
      value: `${stats.penetration + stats.bonusPenetration}%`,
      numericValue: stats.penetration + stats.bonusPenetration,
    },
  ];

  return (
    <div className={cn("liquid-panel flex flex-col", isCompact ? "p-5 gap-4" : "p-6 gap-5")}>
      {/* Hero Identity */}
      <div className="flex items-center gap-4">
        <HeroMedallion
          className={isCompact ? "w-16 h-16" : "w-20 h-20"}
          level={levelFromRun}
          expPct={xp.pct}
          expTooltip={xp.tooltip}
          portrait={"\u2694\uFE0F"}
        />

        <div className="min-w-0">
          <h2 className={cn("font-bold text-text-primary truncate", isCompact ? "text-lg" : "text-xl")}>
            {definition.name}
          </h2>
          <p className="text-sm text-text-muted uppercase tracking-wide">
            {definition.class}
          </p>
          {run && (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-extrabold text-text-primary tabular-nums">
                💎 {run.crystals} Crystals
              </span>
            </div>
          )}
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

      {/* Status Effects (hide in shop to keep panel compact) */}
      {phase !== "shop" && (
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
      )}
    </div>
  );
}
