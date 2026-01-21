import { DAMAGE_FORMULA_CONSTANT, MINIMUM_DAMAGE } from "@/lib/constants";

// TYPES

export interface DamageContext {
  attackerAtk: number;
  defenderDef: number;
  penetration: number;
  critChance: number;
  critMultiplier: number;
  dodgeChance: number;
  damageMultiplier?: number;  // Ability scaling
  bonusFlatDmage?: number;    // Added after multiplier
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
export function calculateEffectDef(
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
    bonusFlatDmage = 0,
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
  const effectiveDef = calculateEffectDef(defenderDef, penetration);
  const defIgnored = defenderDef - effectiveDef;
  const postMitigatedDamage = applyDamageFormula(baseDamage, effectiveDef);

  // 3. Check crit
  const isCrit = rollChance(critChance);
  const afterCrit = isCrit ? postMitigatedDamage * critMultiplier : postMitigatedDamage;

  // 4. Flat bonus, if applicable
  const afterBonus = afterCrit + bonusFlatDmage;

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
}

/**
 * Calculate hero basic attack damage.
 * Uses calculateDamage internally - no duplicate logic.
 */
export function calculateHeroBasicAttack(
  heroStats: HeroCombatStats,
  monsterDef: number
): DamageResult {
  return calculateDamage({
    attackerAtk: heroStats.atk + heroStats.bonusAtk,
    defenderDef: monsterDef,
    penetration: heroStats.penetration + heroStats.bonusPenetration,
    critChance: heroStats.critChance + heroStats.bonusCritChance,
    critMultiplier: heroStats.critMultiplier + heroStats.bonusCritMultiplier,
    dodgeChance: 0,  // Monsters don't dodge in MVP
    damageMultiplier: 1.0,
  });
}

export function calculateHeroAbility(
  heroStats: HeroCombatStats,
  monsterDef: number,
  abilityScaling: number,  // e.g., 1.4 for 140% ATK
  extraPenetration: number = 0,
  canCrit: boolean = true
): DamageResult {
  return calculateDamage({
    attackerAtk: heroStats.atk + heroStats.bonusAtk,
    defenderDef: monsterDef,
    penetration: heroStats.penetration + heroStats.bonusPenetration + extraPenetration,
    critChance: canCrit ? heroStats.critChance + heroStats.bonusCritChance : 0,
    critMultiplier: heroStats.critMultiplier + heroStats.bonusCritMultiplier,
    dodgeChance: 0,
    damageMultiplier: abilityScaling,
  });
}

export function calculateMonsterAttack(
  monsterAtk: number,
  heroDef: number,
  heroDodge: number,
  damageMultiplier: number = 1.0
): DamageResult {
  return calculateDamage({
    attackerAtk: monsterAtk,
    defenderDef: heroDef,
    penetration: 0,    // Monsters don't have penetration in MVP
    critChance: 0,     // Monsters don't crit in MVP
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