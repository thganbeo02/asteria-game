// =============================================================================
// COMBAT SYSTEM - PUBLIC EXPORTS
// =============================================================================

// Damage Calculator (Single Source of Truth)
export {
  calculateDamage,
  calculateHeroBasicAttack,
  calculateHeroAbility,
  calculateMonsterAttack,
  calculatePercentDamage,
  calculateTrueDamage,
  rollChance,
  applyDamageFormula,
  calculateEffectiveDef,
  type DamageContext,
  type DamageResult,
  type HeroCombatStats,
  calculatePoisonDamage,
  calculateBurnDamage,
  calculateBleedDamage
} from "./damageCalculator";

// Status Effects
export {
  createStatusEffect,
  applyEffect,
  removeEffect,
  hasEffect,
  getEffect,
  processEffectTick,
  tickEffectDurations,
  getEffectModifiers,
  getOutgoingDamageModifier,
  getDefenseModifier,
  getDodgeBonus,
  processShieldAbsorption,
  getUpdatedEffectsAfterApply,
  getUpdatedEffectsAfterRemove,
  EFFECT_DEFINITIONS,
  type EffectDefinition,
  type TickResult,
  type EffectModifiers,
} from "./statusEffects";

// Monster AI
export {
  getMonsterAction,
  getEffectiveMonsterAtk,
  shouldDoubleAttack,
  type MonsterAction,
  type AIDecision,
} from "./monsterAI";

// Turn Manager
export { TurnManager } from "./turnManager";

// Combat Actions (Public API for UI)
export {
  startCombat,
  performBasicAttack,
  performAbility,
  proceedToNextEncounter,
  fleeCombat,
  canUseAbility,
  getCombatSummary,
} from "./combatActions";