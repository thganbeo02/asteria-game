import { DAMAGE_FORMULA_CONSTANT, MINIMUM_DAMAGE } from "@/lib/constants";
import { StatusEffect } from "@/types";

// TYPES

export interface DamageContext {
  attackerAtk: number;
  defenderDef: number;
  penetration: number;
  critChance: number;
  critMultiplier: number;
  dodgeChance: number;
  damageMultiplier?: number;  // Ability scaling
  bonusFlatDamage?: number;    // Added after multiplier
}

export interface DamageResult {
  rawDamage: number;    // Before defense
  finalDamage: number;  // After defense
  isCrit: boolean;
  isDodged: boolean;
  defIgnored: number;
  damageBreakdown: {
    base: number;
    afterPen: number;
    afterCrit: number;
    afterBonus: number;
  }
}

// CORE FUNCTIONS

/**
 * Roll a percentage chance.
 * @param chance (0-100)
 * @returns true if roll succeeds
 */
export function rollChance(chance: number): boolean {
  return Math.random() * 100 < chance;
}

/**
 * Calculate effect DEF after penetration
 */
export function calculateEffectiveDef(
  baseDef: number,
  penetration: number
): number {
  // Pen is within 0-100
  const pen = Math.max(0, Math.min(100, penetration));
  return baseDef * (1 - pen / 100);
}

/**
 * Apply damage formula: ATK * 200 / (200 + DEF)
 */
export function applyDamageFormula(atk: number, def: number): number {
  return (atk * DAMAGE_FORMULA_CONSTANT / (DAMAGE_FORMULA_CONSTANT + def))
}

/**
 * Full damage calculation with modifiers
 */
export function calculateDamage(context: DamageContext): DamageResult {
  const {
    attackerAtk,
    defenderDef,
    penetration,
    critChance,
    critMultiplier,
    dodgeChance,
    damageMultiplier = 1.0,
    bonusFlatDamage = 0,
  } = context;

  // 1. Check dodge
  const isDodged = rollChance(dodgeChance);
  if (isDodged) {
    return {
      rawDamage: 0,
      finalDamage: 0,
      isCrit: false,
      isDodged: true,
      defIgnored: 0,
      damageBreakdown: {
        base: 0,
        afterPen: 0,
        afterCrit: 0,
        afterBonus: 0
      },
    };
  }

  // 2. Post mitigation damage 
  const baseDamage = attackerAtk * damageMultiplier;
  const effectiveDef = calculateEffectiveDef(defenderDef, penetration);
  const defIgnored = defenderDef - effectiveDef;
  const postMitigatedDamage = applyDamageFormula(baseDamage, effectiveDef);

  // 3. Check crit
  const isCrit = rollChance(critChance);
  const afterCrit = isCrit ? postMitigatedDamage * critMultiplier : postMitigatedDamage;

  // 4. Flat bonus, if applicable
  const afterBonus = afterCrit + bonusFlatDamage;

  // 5. Final damage
  const finalDamage = Math.max(MINIMUM_DAMAGE, Math.floor(afterBonus));

  return {
    rawDamage: Math.floor(baseDamage),
    finalDamage,
    isCrit,
    isDodged: false,
    defIgnored,
    damageBreakdown: {
      base: Math.floor(baseDamage),
      afterPen: Math.floor(postMitigatedDamage),
      afterCrit: Math.floor(afterCrit),
      afterBonus: Math.floor(afterBonus),
    }
  }
}

export interface HeroCombatStats {
  atk: number;
  bonusAtk: number;
  critChance: number;
  bonusCritChance: number;
  critMultiplier: number;
  bonusCritMultiplier: number;
  penetration: number;
  bonusPenetration: number;
  dodge: number;
  bonusDodge: number;
  heroClass?: string;
}

/**
 * Helper to create hero damage context - consolidates duplicate context building
 */
function createHeroDamageContext(
  heroStats: HeroCombatStats,
  monsterDef: number,
  options: {
    damageMultiplier?: number;
    extraPenetration?: number;
    canCrit?: boolean;
    dodgeChance?: number;
    bonusFlatDamage?: number;
  } = {},
): DamageContext {
  const {
    extraPenetration = 0,
    canCrit = true,
    dodgeChance = 0,
    bonusFlatDamage = 0,
  } = options;

  let { damageMultiplier = 1.0 } = options;
  let critChance = canCrit ? heroStats.critChance + heroStats.bonusCritChance : 0;
  let penetration = heroStats.penetration + heroStats.bonusPenetration + extraPenetration;

  // Ranger Innate: excess crit conversion
  if (heroStats.heroClass === "ranger" && critChance > 100) {
    const excess = critChance - 100;
    penetration += excess;
    damageMultiplier += excess * 0.1;
    critChance = 100;
  }

  return {
    attackerAtk: heroStats.atk + heroStats.bonusAtk,
    defenderDef: monsterDef,
    penetration,
    critChance,
    critMultiplier: heroStats.critMultiplier + heroStats.bonusCritMultiplier,
    dodgeChance,
    damageMultiplier,
    bonusFlatDamage,
  };
}

/**
 * Calculate hero basic attack damage.
 */
export function calculateHeroBasicAttack(
  heroStats: HeroCombatStats,
  monsterDef: number,
  bonusFlatDamage: number = 0
): DamageResult {
  return calculateDamage(createHeroDamageContext(heroStats, monsterDef, { bonusFlatDamage }));
}

/**
 * Calculate hero ability damage.
 */
export function calculateHeroAbility(
  heroStats: HeroCombatStats,
  monsterDef: number,
  abilityScaling: number,
  extraPenetration: number = 0,
  canCrit: boolean = true
): DamageResult {
  return calculateDamage(
    createHeroDamageContext(heroStats, monsterDef, {
      damageMultiplier: abilityScaling,
      extraPenetration,
      canCrit,
    }),
  );
}

/**
 * Calculate monster attack damage.
 */
export function calculateMonsterAttack(
  monsterAtk: number,
  heroDef: number,
  heroDodge: number,
  damageMultiplier: number = 1.0
): DamageResult {
  return calculateDamage({
    attackerAtk: monsterAtk,
    defenderDef: heroDef,
    penetration: 0,
    critChance: 0,
    critMultiplier: 1.5,
    dodgeChance: heroDodge,
    damageMultiplier,
  });
}

export function calculatePercentDamage(
  maxHp: number,
  percent: number
): number {
  const damage = Math.floor(maxHp * (percent / 100));
  return Math.max(MINIMUM_DAMAGE, damage);
}

export function calculateTrueDamage(
  amount: number,
  dodgeChance: number = 0
): DamageResult {
  const isDodged = rollChance(dodgeChance);

  return {
    rawDamage: amount,
    finalDamage: isDodged ? 0 : Math.floor(amount),
    isCrit: false,
    isDodged,
    defIgnored: 0,
    damageBreakdown: {
      base: amount,
      afterPen: amount,
      afterCrit: amount,
      afterBonus: amount,
    },
  };
}

// DoT DAMAGE HELPERS

/**
 * Poison damage (% Current HP)
 * True damage, ignores DEF.
 * 
 * @param currentHp - Target's current HP
 * @param percent - Damage as percent
 * @param stacks - Number of poison stacks
 */
export function calculatePoisonDamage(
  currentHp: number,
  percent: number,
  stacks: number
): number {
  const damage = currentHp * (percent * stacks) / 100;
  return Math.max(MINIMUM_DAMAGE, Math.floor(damage));
}

/**
 * Burn damage (% Max HP, reduced by DEF)
 * Penetration does NOT affect burn
 * Also applies Grievous Wounds (40% healing reduction) - handled separately
 * 
 * @param maxHp - Target's max HP
 * @param percent - Damage as percentage
 * @param targetDef - Target's defense (full DEF applied, no penetration)
 */
export function calculateBurnDamage(
  maxHp: number,
  percent: number,
  targetDef: number
): number {
  const rawDamage = maxHp * percent / 100;
    const reducedDamage = applyDamageFormula(rawDamage, targetDef);
  
  return Math.max(MINIMUM_DAMAGE, Math.floor(reducedDamage));
}

/**
 * Burned targets receive 40% less healing.
 * 
 * @param baseHealing - Raw healing amount
 * @param effects - Target's current status effects
 */
export function applyHealing(
  baseHealing: number,
  effects: StatusEffect[]
): number {
  let healing = baseHealing;
  
  // Grievous Wounds from Burn
  const hasBurn = effects.some(e => e.type === "burn");
  if (hasBurn) {
    healing *= 0.6; // 40% reduction
  }
  
  return Math.floor(healing);
}

/**
 * Bleed damage (% of attacker's ATK when applied)
 * True damage
 * 
 * @param snapshotAtk - Attacker's ATK at time of application
 * @param percent - Damage as percentage of ATK
 */
export function calculateBleedDamage(
  snapshotAtk: number,
  percent: number
): number {
  const damage = snapshotAtk * percent / 100;
  return Math.max(MINIMUM_DAMAGE, Math.floor(damage));
}