import { StatusEffect, StatusEffectType } from "@/types";
import {
  calculatePoisonDamage,
  calculateBurnDamage,
  calculateBleedDamage,
} from "./damageCalculator";

export interface EffectDefinition {
  type: StatusEffectType;
  name: string;
  stackable: boolean;
  maxStacks: number;
  defaultDuration: number;
  tickTiming: "start" | "end" | "none";
  description: (effect: StatusEffect) => string;
}

export const EFFECT_DEFINITIONS: Record<StatusEffectType, EffectDefinition> = {
  burn: {
    type: "burn",
    name: "Burn",
    stackable: false,
    maxStacks: 1,
    defaultDuration: 3,
    tickTiming: "end",
    description: (e) =>
      `Taking ${e.value}% max HP as fire damage. Healing reduced by 40%.`,
  },
  chill: {
    type: "chill",
    name: "Chill",
    stackable: false,
    maxStacks: 1,
    defaultDuration: 2,
    tickTiming: "none",
    description: (e) => `Dealing ${e.value}% less damage`,
  },
  poison: {
    type: "poison",
    name: "Poison",
    stackable: true,
    maxStacks: 5,
    defaultDuration: 4,
    tickTiming: "end",
    description: (e) => `Taking ${e.value * e.stacks}% max HP as poison damage`,
  },
  bleed: {
    type: "bleed",
    name: "Bleed",
    stackable: false,
    maxStacks: 1,
    defaultDuration: 3,
    tickTiming: "end",
    description: (e) => `Taking ${e.value}% of attacker's ATK as bleed damage`,
  },
  stun: {
    type: "stun",
    name: "Stun",
    stackable: false,
    maxStacks: 1,
    defaultDuration: 1,
    tickTiming: "start",
    description: () => "Cannot act this turn",
  },
  shield: {
    type: "shield",
    name: "Shield",
    stackable: false,
    maxStacks: 1,
    defaultDuration: 2,
    tickTiming: "none",
    description: (e) => `Absorbing up to ${e.value} damage`,
  },
  fortify: {
    type: "fortify",
    name: "Fortify",
    stackable: false,
    maxStacks: 1,
    defaultDuration: 3,
    tickTiming: "none",
    description: (e) => `DEF increased by ${e.value}%`,
  },
  momentum: {
    type: "momentum",
    name: "Arcane Momentum",
    stackable: true,
    maxStacks: 3,
    defaultDuration: -1,
    tickTiming: "none",
    description: (e) => `Ability damage +${e.stacks * 10}%`,
  },
  evade: {
    type: "evade",
    name: "Evasion",
    stackable: false,
    maxStacks: 1,
    defaultDuration: 1,
    tickTiming: "none",
    description: (e) => `${e.value}% chance to dodge next attack`,
  },
};

/**
 * Create a new status effect instance
 */
export function createStatusEffect(
  type: StatusEffectType,
  source: "hero" | "monster" | "item",
  value: number,
  duration?: number,
  stacks: number = 1,
  snapshotAtk?: number,
): StatusEffect {
  const def = EFFECT_DEFINITIONS[type];

  return {
    type,
    name: def.name,
    duration: duration ?? def.defaultDuration,
    stacks: Math.min(stacks, def.maxStacks),
    value,
    source,
    snapshotAtk,
  };
}

// EFFECT APPLICATION

/**
 * Apply or stack an effect on an existing effects array
 * Returns a NEW array (immutable).
 */
export function applyEffect(
  currentEffects: StatusEffect[],
  newEffect: StatusEffect,
): StatusEffect[] {
  const def = EFFECT_DEFINITIONS[newEffect.type];
  const existingIndex = currentEffects.findIndex(
    (e) => e.type === newEffect.type,
  );

  if (existingIndex === -1) {
    return [...currentEffects, newEffect];
  }

  const existing = currentEffects[existingIndex];
  const updated = [...currentEffects];

  if (def.stackable) {
    updated[existingIndex] = {
      ...existing,
      stacks: Math.min(existing.stacks + newEffect.stacks, def.maxStacks),
      duration: Math.max(existing.duration, newEffect.duration),
    };
  } else {
    updated[existingIndex] = {
      ...existing,
      duration: Math.max(existing.duration, newEffect.duration),
      value: Math.max(existing.value, newEffect.value),
    };
  }

  return updated;
}

/**
 * Remove an effect by type
 */
export function removeEffect(
  effects: StatusEffect[],
  type: StatusEffectType,
): StatusEffect[] {
  return effects.filter((e) => e.type !== type);
}

// SHARED STORE SLICE HELPERS
// These consolidate duplicate logic from heroSlice and monsterSlice

/**
 * Apply or stack a status effect on an entity's effect array.
 * Returns the new effects array for store updates.
 */
export function getUpdatedEffectsAfterApply(
  currentEffects: StatusEffect[],
  newEffect: StatusEffect,
): StatusEffect[] {
  const existingIndex = currentEffects.findIndex(
    (e) => e.type === newEffect.type,
  );

  if (existingIndex === -1) {
    return [...currentEffects, newEffect];
  }

  const updated = [...currentEffects];
  const existing = updated[existingIndex];
  const def = EFFECT_DEFINITIONS[newEffect.type];

  if (def.stackable) {
    updated[existingIndex] = {
      ...existing,
      stacks: Math.min(existing.stacks + newEffect.stacks, def.maxStacks),
      duration: Math.max(existing.duration, newEffect.duration),
    };
  } else {
    updated[existingIndex] = {
      ...existing,
      duration: Math.max(existing.duration, newEffect.duration),
      value: Math.max(existing.value, newEffect.value),
    };
  }

  return updated;
}

/**
 * Remove a status effect from an entity's effect array.
 * Returns the new effects array for store updates.
 */
export function getUpdatedEffectsAfterRemove(
  currentEffects: StatusEffect[],
  type: StatusEffectType,
): StatusEffect[] {
  return currentEffects.filter((e) => e.type !== type);
}

/**
 * Check if an effect exists
 */
export function hasEffect(
  effects: StatusEffect[],
  type: StatusEffectType,
): boolean {
  return effects.some((e) => e.type === type);
}

/**
 * Get an effect by type
 */
export function getEffect(
  effects: StatusEffect[],
  type: StatusEffectType,
): StatusEffect | undefined {
  return effects.find((e) => e.type === type);
}

// EFFECT PROCESSING

export interface TickResult {
  damage: number;
  healing: number;
  skipTurn: boolean;
  messages: string[];
}

/**
 * Process effects that tick at turn start/end
 * Returns what happened (damage, skip or no, messages)
 * Does NOT modify state - caller handles that
 */
export interface TickContext {
  maxHp: number;
  currentHp: number;
  def: number;
}

export function processEffectTick(
  effects: StatusEffect[],
  context: TickContext,
  timing: "start" | "end",
): TickResult {
  const result: TickResult = {
    damage: 0,
    healing: 0,
    skipTurn: false,
    messages: [],
  };

  for (const effect of effects) {
    const def = EFFECT_DEFINITIONS[effect.type];

    if (def.tickTiming !== timing) continue;

    switch (effect.type) {
      case "burn":
        const burnDamage = calculateBurnDamage(context.maxHp, effect.value, context.def);
        result.damage += burnDamage;
        result.messages.push(`Burn deals ${burnDamage} damage!`);
        break;

      case "poison":
        const poisonDamage = calculatePoisonDamage(context.currentHp, effect.value, effect.stacks);
        result.damage += poisonDamage;
        result.messages.push(
          `Poison (${effect.stacks} stacks) deals ${poisonDamage} damage!`,
        );
        break;

      case "bleed":
        const bleedDamage = calculateBleedDamage(effect.snapshotAtk ?? 0, effect.value);
        result.damage += bleedDamage;
        result.messages.push(`Enemy bleeds out for ${bleedDamage} damage!`);
        break;

      case "stun":
        if (timing === "start") {
          result.skipTurn = true;
          result.messages.push("Stunned! Turn skipped.");
        }
        break;
    }
  }

  return result;
}

/**
 * Tick down durations and return remaining effects + expired list.
 */
export function tickEffectDurations(effects: StatusEffect[]): {
  remaining: StatusEffect[];
  expired: StatusEffectType[];
} {
  const expired: StatusEffectType[] = [];

  const remaining = effects
    .map((effect) => ({
      ...effect,
      duration: effect.duration === -1 ? -1 : effect.duration - 1,
    }))
    .filter((effect) => {
      if (effect.duration === 0) {
        expired.push(effect.type);
        return false;
      }
      return true;
    });

  return { remaining, expired };
}

// EFFECT MODIFIERS (for damage calculations)

export interface EffectModifiers {
  damageMultiplier: number;
  defenseMultiplier: number;
  dodgeBonus: number;
  penetrationBonus: number;
}

/**
 * Consolidated effect modifier calculation.
 * Iterates once over effects and aggregates all modifiers.
 * Adding new effects only requires updating this function.
 */
export function getEffectModifiers(effects: StatusEffect[]): EffectModifiers {
  const modifiers: EffectModifiers = {
    damageMultiplier: 1.0,
    defenseMultiplier: 1.0,
    dodgeBonus: 0,
    penetrationBonus: 0,
  };

  for (const effect of effects) {
    switch (effect.type) {
      case "chill":
        modifiers.damageMultiplier *= 1 - effect.value / 100;
        break;
      case "momentum":
        modifiers.damageMultiplier *= 1 + effect.stacks * 0.1;
        break;
      case "fortify":
        modifiers.defenseMultiplier *= 1 + effect.value / 100;
        break;
      case "evade":
        modifiers.dodgeBonus += effect.value;
        break;
    }
  }

  return modifiers;
}

/**
 * Get damage multiplier from effects.
 * @deprecated Use getEffectModifiers instead
 */
export function getOutgoingDamageModifier(effects: StatusEffect[]): number {
  return getEffectModifiers(effects).damageMultiplier;
}

/**
 * Get DEF multiplier from effects.
 * @deprecated Use getEffectModifiers instead
 */
export function getDefenseModifier(effects: StatusEffect[]): number {
  return getEffectModifiers(effects).defenseMultiplier;
}

/**
 * Get bonus dodge chance from effects.
 * @deprecated Use getEffectModifiers instead
 */
export function getDodgeBonus(effects: StatusEffect[]): number {
  return getEffectModifiers(effects).dodgeBonus;
}

/**
 * Process shield absorption.
 * Returns how much was absorbed and the remaining damage.
 * When shield breaks, it's kept at value 0 for UI animation.
 * Caller should remove it after animation delay.
 */
export function processShieldAbsorption(
  effects: StatusEffect[],
  incomingDamage: number,
): { remainingDamage: number; newEffects: StatusEffect[]; absorbed: number; shieldBroken: boolean } {
  const shieldIndex = effects.findIndex((e) => e.type === "shield");

  if (shieldIndex === -1) {
    return {
      remainingDamage: incomingDamage,
      newEffects: effects,
      absorbed: 0,
      shieldBroken: false,
    };
  }

  const shield = effects[shieldIndex];
  const absorbed = Math.min(shield.value, incomingDamage);
  const remainingDamage = incomingDamage - absorbed;
  const remainingShield = shield.value - absorbed;
  const shieldBroken = remainingShield <= 0;

  // Always update shield value (keep at 0 if broken for UI animation)
  const newEffects = [...effects];
  newEffects[shieldIndex] = { ...shield, value: Math.max(0, remainingShield) };

  return { remainingDamage, newEffects, absorbed, shieldBroken };
}
