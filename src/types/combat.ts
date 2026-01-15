import { StatusEffectType } from "./common";

export interface StatusEffect {
  type: StatusEffectType;
  name: string;
  duration: number;   // Turns remaining. -1 = permanent
  stacks: number;     // For stackable effects
  value: number;      // Effect magnitude (damage %, reduction %, etc.)
  source: "hero" | "monster" | "item";
}

/**
 * Result of a damage calculation.
 */
export interface DamageResult {
  rawDamage: number;    // Before defense
  finalDamage: number;  // After defense
  isCrit: boolean;
  isDodged: boolean;
  penetrationUsed: number;
}

/**
 * Combat log entry
 */
export interface CombatLog {
  turn: number;
  actor: "hero" | "monster";
  action: string;
  damage?: number;
  isCrit?: boolean;
  healing?: number;
  statusApplied?: StatusEffectType;
  message: string;
}

/**
 * Animation event for the UI.
 */
export interface AnimationEvent {
  id: string;
  type: "damage" | "heal" | "buff" | "debuff" | "death";
  target: "hero" | "monster";
  value?: number;
  isCrit?: boolean;
}