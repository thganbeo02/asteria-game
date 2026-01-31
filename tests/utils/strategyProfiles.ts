import { BRAN_CRUSHING_BLOW_MISSING_HP, BRAN_SHIELD_SLAM_DEF_SCALE } from "@/data/heroes/bran";
import { DAMAGE_FORMULA_CONSTANT } from "@/lib/constants";
import { getEffectiveMonsterAtk } from "@/systems/combat/monsterAI";
import { getDefenseModifier, getDodgeBonus, getOutgoingDamageModifier } from "@/systems/combat/statusEffects";
import type { HeroState, MonsterState } from "@/types";

export type Strategy = "survival" | "balanced" | "greed" | "apex";

export const DEFAULT_STRATEGIES: Strategy[] = ["survival", "balanced", "greed", "apex"];

function titleCase(s: string): string {
  return s
    .split("_")
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1))
    .join(" ");
}

export function getStrategyLabel(heroId: string, strategy: Strategy): string {
  if (heroId === "bran") {
    const labels: Record<Strategy, string> = {
      survival: "Stun Cycle",
      balanced: "Fortress Builder",
      greed: "Executioner Snowball",
      apex: "Iron Fortress",
    };
    return labels[strategy];
  }

  // Default: preserve existing names for clarity.
  return titleCase(strategy);
}

export function formatStrategy(heroId: string, strategy: Strategy): string {
  const label = getStrategyLabel(heroId, strategy);
  // Keep the stable id visible so STRAT env vars remain obvious.
  return label === strategy ? label : `${label} (${strategy})`;
}

export function getHeroKitSummary(heroId: string): string {
  if (heroId === "camira") {
    return [
      "Kit: Rapid Fire (2 hits + heal), Forest Agility (evade + permanent stats), ",
      "Jackpot Arrow (high pen finisher + bonus crystals on kill + crit stacking). ",
      "AI uses estimates for kill shots + incoming damage, plus a finisher mana reserve.",
    ].join("");
  }
  if (heroId === "bran") {
    return [
      "Kit: Shield Slam (stun + DEF-scaling damage), Fortify (temp DEF then permanent Max HP on expiry; mastery after 6 uses), ",
      "Crushing Blow (execute scales with enemy missing HP; permanent ATK/DEF on kill), Iron Will (heal on kill; penetration unlock at level 4).",
    ].join("");
  }
  if (heroId === "lyra" || heroId === "shade") {
    return "Kit: AI uses simple ability-priority heuristics (plus a low-HP override) and shop weighting by strategy.";
  }
  return "Kit: AI uses ability availability + strategy heuristics.";
}

export function getStrategyMeaning(heroId: string, strategy: Strategy): string {
  if (heroId === "bran") {
    if (strategy === "survival") {
      return "Default to Shield Slam on cooldown for control; Fortify only when next hit is lethal or drops HP <= 25%; Crushing Blow only as a sure kill.";
    }
    if (strategy === "balanced") {
      return "Farm safe Fortify expirations (permanent Max HP) without refreshing; use Shield Slam as tempo/safety; take Crushing Blow when kill is likely or guaranteed.";
    }
    if (strategy === "greed") {
      return "Maximize Crushing Blow kills for permanent ATK/DEF; avoid Fortify/Shield Slam unless threatened; break stalls after 10 turns.";
    }
    return "Max encounters: rush Fortify mastery (6 uses), use basics to regen mana, Shield Slam predicted spike turns (wolf pounce / skeleton bone throw) and high-ATK threats, and use Crushing Blow only as a kill-secure when the monster is <= 50% HP.";
  }

  if (heroId === "camira") {
    if (strategy === "survival") {
      return "Use Jackpot Arrow to end fights (up to 1.2x expected kill); use Forest Agility only if the next hit is lethal or drops HP <= 20%; Rapid Fire when HP < 70%; otherwise basic.";
    }
    if (strategy === "balanced") {
      return "Guarantee Jackpot Arrow kill shots; keep mana reserved for Jackpot; force basics when the 3rd-attack passive is next; spend Rapid Fire only when mana is high and reserve is preserved.";
    }
    if (strategy === "greed") {
      return "Prioritize Jackpot kills; allow limited stalling but hard-cap at 12 turns; early Agility if it doesn't break the jackpot plan; emergency Rapid Fire when HP < 30%.";
    }
    return "Scaling mode: guaranteed Jackpot finisher; Rapid Fire when HP < 60%; Agility early (turns < 10) for permanent stats; force basics on passive cadence.";
  }

  // Defaults for other heroes: keep this concise to avoid lying about kits.
  if (strategy === "survival") return "Conservative: prioritize defensive/utility ability usage and buy potions more often.";
  if (strategy === "balanced") return "Generalist: mix offense/defense; steady purchasing.";
  if (strategy === "greed") return "Aggressive: prioritize offense and delay potions.";
  return "Scaling: prioritize long-term growth (mana regen/max mana) via shop weighting.";
}

export function desiredPotionThreshold(heroId: string, strategy: Strategy): number {
  // Hero-specific overrides
  if (heroId === "bran" && strategy === "apex") return 75;

  if (strategy === "survival") return 70;
  if (strategy === "balanced") return 55;
  if (strategy === "greed") return 40;
  return 60;
}

export interface ItemWeights {
  atk: number;
  def: number;
  maxHp: number;
  maxMana: number;
  manaRegen: number;
  critChance: number;
  critMultiplier: number;
  dodge: number;
  penetration: number;
}

export function getItemWeights(heroId: string, strategy: Strategy): ItemWeights {
  const weights: Record<Strategy, ItemWeights> = {
    survival: {
      atk: 0.6,
      def: 1.8,
      maxHp: 2.2,
      maxMana: 0.6,
      manaRegen: 1.0,
      critChance: 0.4,
      critMultiplier: 0.2,
      dodge: 0.9,
      penetration: 0.5,
    },
    balanced: {
      atk: 1.2,
      def: 1.1,
      maxHp: 1.3,
      maxMana: 0.7,
      manaRegen: 1.0,
      critChance: 0.8,
      critMultiplier: 0.4,
      dodge: 0.7,
      penetration: 1.0,
    },
    greed: {
      atk: 1.8,
      def: 0.6,
      maxHp: 0.6,
      maxMana: 1.1,
      manaRegen: 1.3,
      critChance: 1.2,
      critMultiplier: 0.6,
      dodge: 0.6,
      penetration: 1.3,
    },
    apex: {
      atk: 1.1,
      def: 1.0,
      maxHp: 1.2,
      maxMana: 1.7,
      manaRegen: 2.4,
      critChance: 0.7,
      critMultiplier: 0.4,
      dodge: 0.8,
      penetration: 0.9,
    },
  };

  const base = weights[strategy];
  if (heroId === "bran" && strategy === "apex") {
    // Bran apex goal is survival-first: buy defensive stats over mana stacking.
    return {
      ...base,
      atk: 0.7,
      def: 1.7,
      maxHp: 2.0,
      maxMana: 0.7,
      manaRegen: 1.3,
      critChance: 0.4,
      critMultiplier: 0.2,
      dodge: 0.7,
      penetration: 0.5,
    };
  }

  return base;
}

export interface SimulationContext {
  turnsThisFight: number;
}

export type DecisionAction = number | "basic";

export type EstimateAbilityDamageFn = (
  hero: HeroState,
  monster: MonsterState,
  scaling: number,
  extraPen?: number,
  hits?: number,
) => { min: number; expected: number };

export type EstimateIncomingDamageFn = (
  monster: MonsterState,
  hero: HeroState,
) => { min: number; expected: number };

export interface DecideActionInput {
  heroId: string;
  strategy: Strategy;
  hero: HeroState;
  monster: MonsterState;
  context: SimulationContext;

  levelIdx: number;
  maxHp: number;
  hpPct: number;
  manaPct: number;
  currentMana: number;
  monsterHp: number;

  canUse: (idx: number) => boolean;
  costOf: (idx: number) => number;

  estimateAbilityDamage: EstimateAbilityDamageFn;
  estimateIncomingDamage: EstimateIncomingDamageFn;
}

function estimateBranShieldSlam(
  hero: HeroState,
  monster: MonsterState,
  levelIdx: number,
  estimateAbilityDamage: EstimateAbilityDamageFn,
): { min: number; expected: number } {
  const scale = (hero.abilities[0]?.damageScaling?.[levelIdx] ?? 110) / 100;
  const base = estimateAbilityDamage(hero, monster, scale);

  const baseHeroDef = hero.stats.def + hero.stats.bonusDef;
  const heroDefModifier = getDefenseModifier(hero.statusEffects);
  const effectiveHeroDef = Math.floor(baseHeroDef * heroDefModifier);
  const defBonus = Math.floor(effectiveHeroDef * (BRAN_SHIELD_SLAM_DEF_SCALE / 100));

  return {
    min: base.min + defBonus,
    expected: base.expected + defBonus,
  };
}

function estimateBranCrushingBlow(
  hero: HeroState,
  monster: MonsterState,
  levelIdx: number,
  estimateAbilityDamage: EstimateAbilityDamageFn,
): { min: number; expected: number } {
  const scale = (hero.abilities[2]?.damageScaling?.[levelIdx] ?? 160) / 100;
  const base = estimateAbilityDamage(hero, monster, scale);
  const missing = Math.max(0, monster.maxHp - monster.hp);
  const executeBonus = Math.floor(missing * (BRAN_CRUSHING_BLOW_MISSING_HP / 100));

  return {
    min: base.min + executeBonus,
    expected: base.expected + executeBonus,
  };
}

export function decideActionForHero(input: DecideActionInput): DecisionAction {
  const {
    heroId,
    strategy,
    hero,
    monster,
    context,
    levelIdx,
    maxHp,
    hpPct,
    manaPct,
    currentMana,
    monsterHp,
    canUse,
    costOf,
    estimateAbilityDamage,
    estimateIncomingDamage,
  } = input;

  if (heroId === "camira") {
    // 0: Rapid Fire
    // 1: Forest Agility
    // 2: Jackpot Arrow

    const rapidScale = (hero.abilities[0].damageScaling?.[levelIdx] ?? 100) / 100;
    const jackpotScale = (hero.abilities[2].damageScaling?.[levelIdx] ?? 140) / 100;

    const jackpotPen = [30, 35, 40, 45, 50, 55, 60][levelIdx];

    const dmgRapid = estimateAbilityDamage(hero, monster, rapidScale, 0, 2);
    const dmgJackpot = estimateAbilityDamage(hero, monster, jackpotScale, jackpotPen, 1);

    const jackpotCost = costOf(2);
    const incoming = estimateIncomingDamage(monster, hero);
    const projectedAfterHit = hero.stats.hp - incoming.min;
    const dropsBelow20 = maxHp > 0 ? projectedAfterHit / maxHp <= 0.2 : false;
    const isLethal = projectedAfterHit <= 0;

    const keepsFinisherReserve = (idx: number) => {
      if (idx === 2) return true;
      const cost = costOf(idx);
      if (!Number.isFinite(cost)) return false;
      return currentMana - cost >= jackpotCost;
    };

    if (strategy === "survival") {
      if (canUse(2) && monsterHp <= dmgJackpot.expected * 1.2) return 2;
      if (canUse(1) && (isLethal || dropsBelow20)) return 1;
      if (hpPct < 70 && canUse(0)) return 0;
      return "basic";
    }

    if (strategy === "balanced") {
      if (canUse(2) && monsterHp <= dmgJackpot.min) return 2;
      if (hpPct < 30 && canUse(0) && keepsFinisherReserve(0)) return 0;
      const nextDeadeyeBonus = Number(hero.passiveState?.attackCount ?? 0) === 2;
      if (canUse(1) && keepsFinisherReserve(1) && (isLethal || dropsBelow20)) return 1;
      if (nextDeadeyeBonus) return "basic";
      if (manaPct > 70 && canUse(0) && keepsFinisherReserve(0) && monsterHp > dmgRapid.expected) return 0;
      return "basic";
    }

    if (strategy === "greed") {
      const turnsThisFight = context.turnsThisFight;
      if (turnsThisFight > 12) {
        if (canUse(2)) return 2;
        if (canUse(0)) return 0;
        return "basic";
      }

      if (turnsThisFight <= 4 && canUse(1) && keepsFinisherReserve(1) && incoming.min > hero.stats.hp * 0.35) {
        return 1;
      }

      if (canUse(2) && monsterHp <= dmgJackpot.min) return 2;
      if (canUse(2) && monsterHp <= dmgJackpot.expected * 1.1) return 2;
      if (hpPct < 30 && canUse(0)) return 0;
      if (canUse(0) && keepsFinisherReserve(0) && monsterHp > dmgRapid.expected * 1.25) return 0;
      return "basic";
    }

    if (strategy === "apex") {
      if (canUse(2) && monsterHp <= dmgJackpot.min) return 2;
      if (hpPct < 60 && canUse(0)) return 0;
      if (canUse(1) && context.turnsThisFight < 10) return 1;
      const nextDeadeyeBonus = Number(hero.passiveState?.attackCount ?? 0) === 2;
      if (nextDeadeyeBonus) return "basic";
      return "basic";
    }
  }

  if (heroId === "bran") {
    // 0: Shield Slam
    // 1: Fortify
    // 2: Crushing Blow
    const incoming = estimateIncomingDamage(monster, hero);
    const projectedAfterHit = hero.stats.hp - incoming.min;
    const dropsBelow25 = maxHp > 0 ? projectedAfterHit / maxHp <= 0.25 : false;
    const isLethal = projectedAfterHit <= 0;
    const hasFortify = hero.statusEffects.some((e) => e.type === "fortify");

    const ss = estimateBranShieldSlam(hero, monster, levelIdx, estimateAbilityDamage);
    const cb = estimateBranCrushingBlow(hero, monster, levelIdx, estimateAbilityDamage);

    const canKillWithCB = canUse(2) && monsterHp <= cb.min;
    const canLikelyKillWithCB = canUse(2) && monsterHp <= cb.expected * 1.1;

    if (strategy === "survival") {
      if (canKillWithCB) return 2;
      if (canUse(0)) return 0; // keep the enemy controlled as default
      if (canUse(1) && !hasFortify && (isLethal || dropsBelow25)) return 1;
      return "basic";
    }

    if (strategy === "balanced") {
      if (canKillWithCB) return 2;

      // Prioritize Fortify uptime without refreshing (to farm expirations)
      if (canUse(1) && !hasFortify) {
        const wantsBuffer = isLethal || dropsBelow25 || hpPct < 80 || incoming.min > maxHp * 0.18;
        const expectsLongFight = monsterHp > ss.expected * 1.8;
        if (wantsBuffer || expectsLongFight) return 1;
      }

      // Use stun as a safety valve and tempo tool
      if (canUse(0) && (isLethal || dropsBelow25 || hpPct < 55 || manaPct > 45)) return 0;

      if (canLikelyKillWithCB) return 2;
      return "basic";
    }

    if (strategy === "greed") {
      // Snowball by securing Crushing Blow kills for permanent ATK/DEF
      if (canKillWithCB) return 2;

      // Avoid killing with Shield Slam unless we're in danger; preserve CB as finisher
      if (canUse(1) && !hasFortify && (isLethal || dropsBelow25 || hpPct < 35)) return 1;
      if (canUse(0) && (isLethal || dropsBelow25 || hpPct < 45)) return 0;

      if (context.turnsThisFight > 10) {
        if (canUse(0)) return 0;
        if (canUse(1) && !hasFortify) return 1;
      }

      if (canLikelyKillWithCB) return 2;
      return "basic";
    }

    if (strategy === "apex") {
      // Max-encounters mode (survival-first):
      // - Rush Fortify uses early to unlock mastery
      // - Deny spike turns with Shield Slam, especially vs wolf/skeleton
      // - Use Crushing Blow only as a kill-secure when monster HP <= 50%
      // - Prefer basics whenever we need mana (basics are the consistent mana regen source)

      const monsterStunned = monster.statusEffects.some((e) => e.type === "stun");
      const monsterHpPct = monster.maxHp > 0 ? (monster.hp / monster.maxHp) * 100 : 100;

      const fortifyUses = Number(hero.passiveState.fortifyUses ?? 0);
      const fortifyMasteryUnlocked = Boolean(hero.passiveState.fortifyBonusUnlocked ?? false);

      const threatMonster =
        monster.definitionId === "skeleton" ||
        monster.definitionId === "wolf" ||
        monster.definitionId === "mimic" ||
        monster.definitionId === "orc" ||
        monster.definitionId === "dragon";

      // Pattern-aware spike prediction
      const isWolfPounceNext = monster.definitionId === "wolf" && monster.patternIndex === 2;
      const isSkeletonThrowNext = monster.definitionId === "skeleton" && monster.patternIndex === 1;
      const spikeNextTurn = isWolfPounceNext || isSkeletonThrowNext;

      const highIncoming = incoming.min > maxHp * 0.15;
      const mediumIncoming = incoming.min > maxHp * 0.11;

      // 1) Kill-secure rule: Crushing Blow only if monster is <= 50% HP and it kills
      if (monsterHpPct <= 50 && canKillWithCB) return 2;

      // 2) Emergency: deny lethal hit (stun first), otherwise Fortify
      if (isLethal || dropsBelow25 || hpPct < 35) {
        if (canUse(0) && !monsterStunned) return 0;
        if (canUse(1) && !hasFortify) return 1;
        return "basic";
      }

      // 3) Rush Fortify mastery early (6 uses), without refreshing
      if (!fortifyMasteryUnlocked && fortifyUses < 6) {
        if (canUse(1) && !hasFortify) return 1;
        // If we can't afford Fortify yet, basic to regen toward it
        const fortifyCost = costOf(1);
        if (Number.isFinite(fortifyCost) && currentMana < fortifyCost) return "basic";
      }

      // 4) Shield Slam spikes (wolf pounce / skeleton throw) and high-ATK threats
      if ((spikeNextTurn || highIncoming || threatMonster) && canUse(0) && !monsterStunned) {
        return 0;
      }

      // 5) Keep Fortify cycling for stability (only when not already fortified)
      if (canUse(1) && !hasFortify) {
        const wantsFortify = hpPct < 90 || mediumIncoming || threatMonster;
        const expectsLongFight = monsterHp > ss.expected * 1.4;
        if (wantsFortify || expectsLongFight) return 1;
      }

      // 6) If we're in the CB kill window soon, keep progressing with basics; if we're safe and have excess mana, use Shield Slam for tempo
      if (canUse(0) && !monsterStunned && manaPct > 55 && hpPct > 60 && monsterHp > ss.expected * 1.2) {
        return 0;
      }

      // 7) Optional: if CB is a guaranteed kill even above 50% (rare), take it only when safe.
      // (User asked for <= 50% rule; keep this disabled by default.)

      return "basic";
    }
  }

  // Fallback: old behavior (priority list)
  if (heroId === "lyra") {
    if (strategy === "survival") {
      if (canUse(1)) return 1;
      if (canUse(2)) return 2;
      if (canUse(0)) return 0;
      return "basic";
    }
    if (strategy === "greed") {
      if (canUse(2)) return 2;
      if (canUse(0)) return 0;
      if (canUse(1)) return 1;
      return "basic";
    }
    if (hpPct < 50) {
      if (canUse(1)) return 1;
      if (canUse(2)) return 2;
      if (canUse(0)) return 0;
      return "basic";
    }
    if (canUse(2)) return 2;
    if (canUse(0)) return 0;
    if (canUse(1)) return 1;
    return "basic";
  }

  if (heroId === "shade") {
    if (strategy === "survival") {
      if (canUse(1)) return 1;
      if (canUse(0)) return 0;
      if (canUse(2)) return 2;
      return "basic";
    }
    if (strategy === "greed") {
      if (canUse(2)) return 2;
      if (canUse(0)) return 0;
      if (canUse(1)) return 1;
      return "basic";
    }
    if (hpPct < 50) {
      if (canUse(1)) return 1;
      if (canUse(2)) return 2;
      if (canUse(0)) return 0;
      return "basic";
    }
    if (canUse(0)) return 0;
    if (canUse(2)) return 2;
    if (canUse(1)) return 1;
    return "basic";
  }

  // Generic fallback
  if (canUse(0)) return 0;
  if (canUse(1)) return 1;
  if (canUse(2)) return 2;
  return "basic";
}

// Optional: helper used by hero strategy authors.
export function estimateIncomingDamage(monster: MonsterState, hero: HeroState): { min: number; expected: number } {
  const chillModifier = getOutgoingDamageModifier(monster.statusEffects);
  const effectiveAtk = Math.floor(getEffectiveMonsterAtk(monster) * chillModifier);

  const heroDef = hero.stats.def + hero.stats.bonusDef;
  const defModifier = getDefenseModifier(hero.statusEffects);
  const effectiveDef = Math.floor(heroDef * defModifier);

  const heroDodge = Math.min(
    100,
    hero.stats.dodge + hero.stats.bonusDodge + getDodgeBonus(hero.statusEffects),
  );

  const mitigation = DAMAGE_FORMULA_CONSTANT / (DAMAGE_FORMULA_CONSTANT + Math.max(0, effectiveDef));
  const rawDamage = Math.floor(effectiveAtk * mitigation);
  const min = Math.max(1, rawDamage);
  const expected = Math.max(0, Math.floor(rawDamage * (1 - heroDodge / 100)));
  return { min, expected };
}
