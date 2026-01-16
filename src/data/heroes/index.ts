// Mage:
// - Basic attack does 70-80% ATK

import { HeroDefinition, HeroState, HeroStats } from "@/types";
import { BRAN, BRAN_INITIAL_PASSIVE_STATE } from "./bran";
import { LYRA, LYRA_INITIAL_PASSIVE_STATE } from "./lyra";
import { CAMIRA, CAMIRA_INITIAL_PASSIVE_STATE } from "./camira";
import { SHADE, SHADE_INITIAL_PASSIVE_STATE } from "./shade";

// Ranger:
// - Rangers have a 10-20% chance to find a random Consumable item

// Assassin:
// - Starts every encounter with +10% Dodge for first 2 turns

// Warrior:
// - Reduces all incoming flat damage by 2-14

export * from "./bran";
export * from "./camira";
export * from "./lyra";
export * from "./shade";

// lookup map
export const HEROES: Record<string, HeroDefinition> = {
  bran: BRAN,
  camira: CAMIRA,
  lyra: LYRA,
  shade: SHADE,
};

export const ALL_HEROES = Object.values(HEROES);

export const STARTER_HEROES = ALL_HEROES.filter(
  h => h.unlockMethod === "Starter (Free)"
);

// Initial passive states
const PASSIVE_STATES: Record<string, Record<string, number | boolean>> = {
  lyra: LYRA_INITIAL_PASSIVE_STATE,
  bran: BRAN_INITIAL_PASSIVE_STATE,
  shade: SHADE_INITIAL_PASSIVE_STATE,
  camira: CAMIRA_INITIAL_PASSIVE_STATE,
};

/**
 * Create initial stats from base stats (adds bonus fields set to 0)
 */
export function createInitialStats(base: HeroDefinition["baseStats"]): HeroStats {
  return {
    ...base,
    bonusAtk: 0,
    bonusDef: 0,
    bonusMaxHp: 0,
    bonusMaxMana: 0,
    bonusCritChance: 0,
    bonusCritMultiplier: 0,
    bonusDodge: 0,
    bonusPenetration: 0,
  };
}

/**
 * Create a fresh HeroState for starting a run
 */
export function createHeroState(heroId: string): HeroState | null {
  const def = HEROES[heroId];
  if (!def) return null;

  return {
    definitionId: heroId,
    level: 1,
    stats: createInitialStats(def.baseStats),
    abilities: def.abilities.map(a => ({ ...a, currentCooldown: 0})),
    statusEffects: [],
    passiveState: { ...PASSIVE_STATES[heroId]},
  }
}

/**
 * Get hero definition by ID
 */
export function getHeroDefinition(id: string): HeroDefinition | undefined {
  return HEROES[id];
}