import React from "react";

import {
  CAMIRA_CRIT_CD_REDUCTION,
  CAMIRA_CRIT_MANA_MAX,
  CAMIRA_CRIT_MANA_MIN,
  CAMIRA_FOREST_EVADE,
  CAMIRA_FOREST_HP_LEVEL,
  CAMIRA_FOREST_HP_MAX,
  CAMIRA_FOREST_HP_MIN,
  CAMIRA_FOREST_STATS,
  CAMIRA_JACKPOT_CRYSTALS,
  CAMIRA_JACKPOT_CRIT_PER_USE,
  CAMIRA_JACKPOT_MAX_STACKS,
  CAMIRA_JACKPOT_PEN,
  CAMIRA_PASSIVE_BONUS,
  CAMIRA_PASSIVE_HIT_COUNT,
  CAMIRA_RAPID_FIRE_HEAL,
} from "@/data/heroes/camira";
import {
  BRAN_CRUSHING_BLOW_MISSING_HP,
  BRAN_CRUSHING_BLOW_KILL_STATS,
  BRAN_FORTIFY_BONUS_ATK,
  BRAN_FORTIFY_BONUS_PEN,
  BRAN_FORTIFY_DEF_BONUS,
  BRAN_FORTIFY_HP_GAIN,
  BRAN_FORTIFY_THRESHOLD,
  BRAN_KILL_HEAL_PERCENT,
  BRAN_PASSIVE_PENETRATION,
  BRAN_PENETRATION_UNLOCK_LEVEL,
  BRAN_SHIELD_SLAM_DEF_SCALE,
} from "@/data/heroes/bran";
import {
  LYRA_FIREBOLT_KILL_MANA,
  LYRA_MAX_MOMENTUM_PENETRATION,
  LYRA_MOMENTUM_MANA_RESTORE,
  LYRA_PYROCLASM_STAT_GAIN,
} from "@/data/heroes/lyra";
import {
  SHADE_COLLECT_CONTRACT_CRYSTALS,
  SHADE_COLLECT_DEF_GAIN,
  SHADE_COLLECT_PENETRATION,
  SHADE_CONTRACT_HEAL,
  SHADE_PHANTOM_EVADE,
  SHADE_QUICKBLADE_ATK_GAIN,
  SHADE_QUICKBLADE_CONTRACT_PEN,
  SHADE_STREAK_STATS,
  SHADE_STREAK_STAT_GAIN,
  SHADE_STREAK_UPGRADE,
} from "@/data/heroes/shade";
import { getHeroDefinition } from "@/data/heroes";
import { getDefenseModifier } from "@/systems/combat/statusEffects";
import type { Ability, HeroState, MonsterState } from "@/types";

export type TooltipMode = "brief" | "expanded";

export interface ContractStateSnapshot {
  currentTurnLimit: number;
  currentTurn: number;
  crystalBonus: number;
  expBonus: number;
  streak: number;
}

function formatParagraph(text: string): string {
  return text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getLevelIdx(level: number): number {
  return Math.max(0, Math.min(6, level - 1));
}

function getTotalAtk(hero: HeroState): number {
  return hero.stats.atk + hero.stats.bonusAtk;
}

function getTotalDef(hero: HeroState): number {
  return hero.stats.def + hero.stats.bonusDef;
}

function getEffectiveDef(hero: HeroState): number {
  const base = getTotalDef(hero);
  const modifier = getDefenseModifier(hero.statusEffects);
  return Math.floor(base * modifier);
}

function getMaxHp(hero: HeroState): number {
  return hero.stats.maxHp + hero.stats.bonusMaxHp;
}

function getPronouns(heroId: string): { subject: string; object: string; possessive: string } {
  switch (heroId) {
    case "bran":
      return { subject: "he", object: "him", possessive: "his" };
    case "lyra":
    case "camira":
    case "shade":
      return { subject: "she", object: "her", possessive: "her" };
    default:
      return { subject: "they", object: "them", possessive: "their" };
  }
}

function getScaledRawDamage(hero: HeroState, ability: Ability): number | null {
  if (!ability.damageScaling?.length) return null;
  const idx = getLevelIdx(hero.level);
  const scalingPct = ability.damageScaling[idx] ?? 100;
  return Math.floor(getTotalAtk(hero) * (scalingPct / 100));
}

function getExpandedAbilityParagraph(
  hero: HeroState,
  ability: Ability,
  monster: MonsterState | null,
  contractState?: ContractStateSnapshot,
): React.ReactNode {
  const heroName = getHeroDefinition(hero.definitionId)?.name ?? "The hero";
  const p = getPronouns(hero.definitionId);
  const idx = getLevelIdx(hero.level);
  const rawDamage = getScaledRawDamage(hero, ability);

  if (ability.id === "camira_jackpot_arrow") {
    const penPct = CAMIRA_JACKPOT_PEN[idx] ?? 0;
    const crystals = CAMIRA_JACKPOT_CRYSTALS[idx] ?? 0;
    const stacks = CAMIRA_JACKPOT_MAX_STACKS;
    const perUse = CAMIRA_JACKPOT_CRIT_PER_USE;
    const max = stacks * perUse;

    return (
      <p className="text-sm leading-relaxed">
        {heroName} fires a magic arrow, dealing <span className="font-semibold">{rawDamage ?? 0} damage</span> and ignoring{" "}
        <span className="font-semibold">{penPct}% enemy&apos;s DEF</span>. On Kill, she gains{" "}
        <span className="font-semibold">{crystals} bonus Crystals</span>. Each use also grants{" "}
        <span className="font-semibold">{perUse}% Crit Chance</span> and <span className="font-semibold">{perUse}% Crit Damage</span>,
        stacking up to {stacks} times (<span className="font-semibold">+{max}% total</span>).
      </p>
    );
  }

  if (ability.id === "camira_rapid_fire") {
    const healPct = CAMIRA_RAPID_FIRE_HEAL[idx] ?? 0;
    const perArrow = rawDamage ?? 0;
    return (
      <p className="text-sm leading-relaxed">
        {heroName} fires two arrows, each dealing <span className="font-semibold">{perArrow} damage</span> (up to{" "}
        <span className="font-semibold">{perArrow * 2} damage</span> total), then heals for{" "}
        <span className="font-semibold">{healPct}%</span> of the total damage dealt.
      </p>
    );
  }

  if (ability.id === "camira_forest_agility") {
    // These values are constant / per-level in data, but we present the resolved numbers at the current level.
    const evadePct = CAMIRA_FOREST_EVADE;
    const statGain = CAMIRA_FOREST_STATS[idx] ?? 0;
    const hasHpBonus = hero.level >= CAMIRA_FOREST_HP_LEVEL;

    return (
      <p className="text-sm leading-relaxed">
        {heroName} gains <span className="font-semibold">{evadePct}% Evasion</span> against the next attack, and gains{" "}
        <span className="font-semibold">{statGain} ATK</span> and <span className="font-semibold">{statGain} DEF</span>.
        {hasHpBonus ? (
          <>
            {" "}From Level {CAMIRA_FOREST_HP_LEVEL}, she also gains between{" "}
            <span className="font-semibold">
              {CAMIRA_FOREST_HP_MIN}-{CAMIRA_FOREST_HP_MAX} Max HP
            </span>
            .
          </>
        ) : null}
      </p>
    );
  }

  if (ability.id === "bran_shield_slam") {
    const scalingPct = ability.damageScaling?.[idx] ?? 100;
    const atkPart = Math.floor(getTotalAtk(hero) * (scalingPct / 100));
    const defPart = Math.floor(getEffectiveDef(hero) * (BRAN_SHIELD_SLAM_DEF_SCALE / 100));
    const total = atkPart + defPart;

    return (
      <p className="text-sm leading-relaxed">
        {heroName} slams {p.possessive} shield, dealing <span className="font-semibold">{total} damage</span> and stunning the enemy
        for 1 turn.
      </p>
    );
  }

  if (ability.id === "bran_fortify") {
    const defBonusPct = BRAN_FORTIFY_DEF_BONUS[idx] ?? 0;
    const bonusDef = Math.floor(getTotalDef(hero) * (defBonusPct / 100));
    const hpGain = BRAN_FORTIFY_HP_GAIN[idx] ?? 0;
    const uses = Number(hero.passiveState.fortifyUses ?? 0);
    const unlocked = Boolean(hero.passiveState.fortifyBonusUnlocked ?? false);

    const unlockNode = (
      <>
        {" "}After {BRAN_FORTIFY_THRESHOLD} uses{unlocked ? "" : ` (${uses}/${BRAN_FORTIFY_THRESHOLD})`}, {heroName} gains{" "}
        <span className="font-semibold">{BRAN_FORTIFY_BONUS_ATK} ATK</span> and{" "}
        <span className="font-semibold">{BRAN_FORTIFY_BONUS_PEN}% Penetration</span>.
      </>
    );

    return (
      <p className="text-sm leading-relaxed">
        {heroName} braces, gaining <span className="font-semibold">{bonusDef} DEF</span> for 3 turns. When it ends, {p.subject} gains{" "}
        <span className="font-semibold">{hpGain} Max HP</span> permanently.{unlockNode}
      </p>
    );
  }

  if (ability.id === "bran_crushing_blow") {
    const scalingPct = ability.damageScaling?.[idx] ?? 100;
    const base = Math.floor(getTotalAtk(hero) * (scalingPct / 100));
    const missing = monster ? Math.max(0, monster.maxHp - monster.hp) : null;
    const missingBonus = missing == null ? null : Math.floor(missing * (BRAN_CRUSHING_BLOW_MISSING_HP / 100));
    const total = base + (missingBonus ?? 0);
    const statGain = BRAN_CRUSHING_BLOW_KILL_STATS[idx] ?? 0;

    return (
      <p className="text-sm leading-relaxed">
        {heroName} strikes down the enemy, dealing <span className="font-semibold">{total} damage</span>
        {missingBonus == null ? (
          "."
        ) : (
          <>
            {" "}(increases based on <span className="font-semibold">enemy&apos;s missing HP</span>).
          </>
        )}{" "}
        On Kill, {p.subject} gains{" "}
        <span className="font-semibold">{statGain} ATK</span> and <span className="font-semibold">{statGain} DEF</span> permanently.
      </p>
    );
  }

  if (ability.id === "lyra_firebolt") {
    const dmg = rawDamage ?? 0;
    const killMana = LYRA_FIREBOLT_KILL_MANA[idx] ?? 0;
    const burnPerTurn = monster ? Math.floor(monster.maxHp * 0.05) : null;

    return (
      <p className="text-sm leading-relaxed">
        {heroName} hurls a bolt of flame, dealing <span className="font-semibold">{dmg} damage</span> and applying Burn for 3 turns
        {burnPerTurn == null ? (
          "."
        ) : (
          <>
            , dealing <span className="font-semibold">{burnPerTurn} damage per turn</span>.
          </>
        )}{" "}
        On Kill, {p.subject} restores{" "}
        <span className="font-semibold">{killMana} Mana</span>.
      </p>
    );
  }

  if (ability.id === "lyra_frost_barrier") {
    const shield = Math.floor(getMaxHp(hero) * 0.4);
    const shatter = rawDamage ?? 0;
    return (
      <p className="text-sm leading-relaxed">
        {heroName} conjures a frost barrier that absorbs up to <span className="font-semibold">{shield} damage</span> for 2 turns. When it
        breaks or expires, it shatters for <span className="font-semibold">{shatter} damage</span> and applies Chill for 2 turns,
        causing the enemy to deal <span className="font-semibold">15% less damage</span>.
      </p>
    );
  }

  if (ability.id === "lyra_pyroclasm") {
    const dmg = rawDamage ?? 0;
    const statGain = LYRA_PYROCLASM_STAT_GAIN[idx] ?? 0;
    const burn = monster?.statusEffects.find((e) => e.type === "burn");
    const burnPerTurn = monster ? Math.floor(monster.maxHp * 0.05) : null;
    const burnBonus = burn && burnPerTurn != null ? burnPerTurn * Math.max(0, burn.duration) : null;

    return (
      <p className="text-sm leading-relaxed">
        {heroName} unleashes an explosive flame, dealing <span className="font-semibold">{dmg} damage</span>. If the enemy is Burning,
        {burnBonus == null ? (
          " it consumes the Burn for bonus damage equal to its remaining Burn."
        ) : (
          <>
            {" "}it consumes the Burn for <span className="font-semibold">{burnBonus} bonus damage</span>.
          </>
        )}{" "}
        Each cast grants{" "}
        <span className="font-semibold">{statGain} ATK</span> and <span className="font-semibold">{statGain} Max HP</span> permanently.
      </p>
    );
  }

  if (ability.id === "shade_quickblade") {
    const dmg = rawDamage ?? 0;
    const atkGain = SHADE_QUICKBLADE_ATK_GAIN[idx] ?? 0;
    const remaining =
      contractState ? Math.max(0, contractState.currentTurnLimit - contractState.currentTurn) : null;

    const contractNode =
      remaining != null && remaining <= 2 ? (
        <>
          {" "}Because the Contract is near its deadline, it also ignores{" "}
          <span className="font-semibold">{SHADE_QUICKBLADE_CONTRACT_PEN}% enemy&apos;s DEF</span>.
        </>
      ) : (
        <>
          {" "}If a Contract is active with 2 or fewer turns remaining, it ignores{" "}
          <span className="font-semibold">{SHADE_QUICKBLADE_CONTRACT_PEN}% enemy&apos;s DEF</span>.
        </>
      );

    return (
      <p className="text-sm leading-relaxed">
        {heroName} strikes fast, dealing <span className="font-semibold">{dmg} damage</span>. On Kill, {p.subject} gains{" "}
        <span className="font-semibold">{atkGain} ATK</span> permanently.{contractNode}
      </p>
    );
  }

  if (ability.id === "shade_phantom_step") {
    const dmg = rawDamage ?? 0;
    return (
      <p className="text-sm leading-relaxed">
        {heroName} strikes, dealing <span className="font-semibold">{dmg} damage</span>, then gains{" "}
        <span className="font-semibold">{SHADE_PHANTOM_EVADE}% Evasion</span> for 1 turn and extends the Contract by 1 turn.
      </p>
    );
  }

  if (ability.id === "shade_collect") {
    const dmg = rawDamage ?? 0;
    const defGain = SHADE_COLLECT_DEF_GAIN[idx] ?? 0;
    const contractCrystals = SHADE_COLLECT_CONTRACT_CRYSTALS[idx] ?? 0;
    return (
      <p className="text-sm leading-relaxed">
        {heroName} collects what {p.subject}&apos;s owed, dealing <span className="font-semibold">{dmg} damage</span> and ignoring{" "}
        <span className="font-semibold">{SHADE_COLLECT_PENETRATION}% enemy&apos;s DEF</span>. On Kill, {p.subject} gains{" "}
        <span className="font-semibold">{defGain} DEF</span> permanently. On Contract completion, {p.subject} gains{" "}
        <span className="font-semibold">{contractCrystals} bonus Crystals</span>.
      </p>
    );
  }

  if (rawDamage != null) {
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        <p>{formatParagraph(ability.expandedDescription || ability.description)}</p>
        <p>
          At {heroName}&apos;s current stats, this deals <span className="font-semibold">{rawDamage} damage</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="text-sm leading-relaxed">
      <p>{formatParagraph(ability.expandedDescription || ability.description)}</p>
    </div>
  );
}

interface PassiveTooltipContentProps {
  hero: HeroState;
  mode: TooltipMode;
  contractState?: ContractStateSnapshot;
}

export function PassiveTooltipContent({ hero, mode, contractState }: PassiveTooltipContentProps) {
  const definition = getHeroDefinition(hero.definitionId);
  if (!definition) return null;

  const heroName = definition.name;
  const p = getPronouns(hero.definitionId);

  if (mode === "expanded" && hero.definitionId === "camira") {
    const idx = getLevelIdx(hero.level);
    const bonusPct = CAMIRA_PASSIVE_BONUS[idx] ?? 0;
    const bonusRaw = Math.floor(getTotalAtk(hero) * (bonusPct / 100));

    return (
      <div className="max-w-sm">
        <div className="font-semibold text-class-mage mb-1">{definition.passive.name}</div>
        <p className="text-sm leading-relaxed">
          Every {CAMIRA_PASSIVE_HIT_COUNT}rd basic attack, she fires a bonus shot that adds{" "}
          <span className="font-semibold">{bonusRaw} damage</span>. On Crit, she restores between{" "}
          <span className="font-semibold">{CAMIRA_CRIT_MANA_MIN} Mana</span> and{" "}
          <span className="font-semibold">{CAMIRA_CRIT_MANA_MAX} Mana</span>,
          and Rapid Fire&apos;s cooldown is reduced by {CAMIRA_CRIT_CD_REDUCTION} turn.
        </p>
      </div>
    );
  }

  if (mode === "expanded" && hero.definitionId === "bran") {
    const idx = getLevelIdx(hero.level);
    const healPct = BRAN_KILL_HEAL_PERCENT[idx] ?? 0;
    const maxHp = getMaxHp(hero);
    const missing = Math.max(0, maxHp - hero.stats.hp);
    const heal = Math.floor((missing * healPct) / 100);
    const hasPen = hero.level >= BRAN_PENETRATION_UNLOCK_LEVEL;

    return (
      <div className="max-w-sm">
        <div className="font-semibold text-class-mage mb-1">{definition.passive.name}</div>
        <p className="text-sm leading-relaxed">
          On Kill, {heroName} heals for <span className="font-semibold">{heal} HP</span> (based on{" "}
          <span className="font-semibold">{p.possessive} missing HP</span>).{" "}
          {hasPen ? (
            <>
              {heroName} also has <span className="font-semibold">{BRAN_PASSIVE_PENETRATION}% Penetration</span>.
            </>
          ) : (
            <>
              At Level {BRAN_PENETRATION_UNLOCK_LEVEL}, {heroName} gains{" "}
              <span className="font-semibold">{BRAN_PASSIVE_PENETRATION}% Penetration</span>.
            </>
          )}
        </p>
      </div>
    );
  }

  if (mode === "expanded" && hero.definitionId === "lyra") {
    const idx = getLevelIdx(hero.level);
    const manaRestore = LYRA_MOMENTUM_MANA_RESTORE[idx] ?? 0;
    const momentum = Number(hero.passiveState.momentum ?? 0);

    return (
      <div className="max-w-sm">
        <div className="font-semibold text-class-mage mb-1">{definition.passive.name}</div>
        <p className="text-sm leading-relaxed">
          Each consecutive ability gives {heroName} 1 Momentum (currently{" "}
          <span className="font-semibold">{Math.max(0, Math.min(3, momentum))}/3 Momentum</span>). At 1/2/3 stacks, her abilities deal
          10/20/30% more damage; at 3 stacks, she also gains{" "}
          <span className="font-semibold">{LYRA_MAX_MOMENTUM_PENETRATION}% Penetration</span>. Basic attacks reset Momentum. If reset
          from 3 stacks, she restores <span className="font-semibold">{manaRestore} Mana</span>.
        </p>
      </div>
    );
  }

  if (mode === "expanded" && hero.definitionId === "shade") {
    const idx = getLevelIdx(hero.level);
    const healPct = SHADE_CONTRACT_HEAL[idx] ?? 0;
    const heal = Math.floor((getMaxHp(hero) * healPct) / 100);
    const statGain = SHADE_STREAK_STAT_GAIN[idx] ?? 0;
    const streak =
      contractState?.streak ?? Number(hero.passiveState.contractStreak ?? 0);

    return (
      <div className="max-w-sm">
        <div className="font-semibold text-class-mage mb-1">{definition.passive.name}</div>
        <p className="text-sm leading-relaxed">
          Each encounter, {heroName} receives a Contract with a turn limit and rewards. Completing it grants{" "}
          <span className="font-semibold">bonus Crystals</span> and <span className="font-semibold">EXP</span> and heals {p.object} for{" "}
          <span className="font-semibold">{heal} HP</span>. Completing {SHADE_STREAK_UPGRADE} Contracts in a row guarantees the next
          Contract one tier higher. Every {SHADE_STREAK_STATS} completed Contracts, she gains{" "}
          <span className="font-semibold">{statGain} ATK</span>, <span className="font-semibold">{statGain} DEF</span>, and{" "}
          <span className="font-semibold">{statGain} Max HP</span>.
          <br />
          <span className="block mt-1">
            Current streak: <span className="font-semibold">{streak}</span>.
          </span>
        </p>
      </div>
    );
  }

  const body =
    mode === "brief" ? definition.passive.description : formatParagraph(definition.passive.expandedDescription);

  return (
    <div className="max-w-sm">
      <div className="font-semibold text-class-mage mb-1">{definition.passive.name}</div>
      <p className="text-sm leading-relaxed">{body}</p>
    </div>
  );
}

interface AbilityTooltipContentProps {
  hero: HeroState;
  abilityIndex: number;
  mode: TooltipMode;
  monster: MonsterState | null;
  contractState?: ContractStateSnapshot;
}

export function AbilityTooltipContent({ hero, abilityIndex, mode, monster, contractState }: AbilityTooltipContentProps) {
  const ability = hero.abilities[abilityIndex];
  if (!ability) return null;

  const idx = getLevelIdx(hero.level);
  const manaCost = ability.manaCost[idx] ?? ability.manaCost[0] ?? 0;

  return (
    <div className="max-w-xs">
      <div className="font-semibold text-class-mage">{ability.name}</div>
      <div className="mt-1">
        {mode === "brief" ? (
          <p className="text-sm leading-relaxed">{formatParagraph(ability.description)}</p>
        ) : (
          getExpandedAbilityParagraph(hero, ability, monster, contractState)
        )}
      </div>
      <div className="flex gap-3 mt-2 text-xs text-text-muted">
        <span>💧 {manaCost} MP</span>
        <span>⏱️ {ability.cooldown} turn CD</span>
      </div>
    </div>
  );
}
