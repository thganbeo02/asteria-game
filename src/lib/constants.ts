// =============================================================================
// GAME CONSTANTS
// =============================================================================
// All balance numbers in one place. Change here to tune the game.

import type { Difficulty } from "@/types";

// LEVELING
export const EXP_THRESHOLDS = {
  2: 1000,
  3: 2750,
  4: 5500,
  5: 9500,
  6: 15000,
  7: 22500,
} as const;

export const MAX_LEVEL = 7;

// DIFFICULTY SETTINGS
export const DIFFICULTY_CONFIG: Record<Difficulty, {
  shopFrequency: number;
  skipBonus: number;
  goldMultiplier: number;
}> = {
  easy: {
    shopFrequency: 3,
    skipBonus: 20,
    goldMultiplier: 1.0,
  },
  medium: {
    shopFrequency: 3,
    skipBonus: 40,
    goldMultiplier: 1.5,
  },
  hard: {
    shopFrequency: 3,
    skipBonus: 60,
    goldMultiplier: 2.0,
  },
}

// COMBAT
// Damage formula: ATK * 200 / (200 + DEF)
export const DAMAGE_FORMULA_CONSTANT = 200;
export const MINIMUM_DAMAGE = 1;

// SHOP
export const SHOP_ITEM_COUNT = 4;

export const HEALTH_POTION = {
  maxPerLevel: 3,
  healPercent: [25, 30, 35, 40, 45, 50, 50],
  cost: [30, 45, 65, 90, 120, 155, 195],
};

// Epic chance increases when you skip shops
export const EPIC_CHANCE_BY_SKIPS: Record<number, number> = {
  0: 20,
  1: 30,
  2: 40,
  3: 50,  // 3+ uses this
};

// MONSTER SPAWN RATES
export const MONSTER_SPAWN_RATES: Record<number, Record<string, number>> = {
  1: { slime: 30, wolf: 30, zombie: 24, skeleton: 16 },
  2: { slime: 26, wolf: 24, zombie: 24, skeleton: 18, mimic: 8 },
  3: { slime: 20, wolf: 25, zombie: 25, skeleton: 20, mimic: 10 },
  4: { slime: 17, wolf: 18, zombie: 23, skeleton: 22, mimic: 15, vampire: 5 },
  5: { slime: 15, wolf: 15, zombie: 18, skeleton: 20, mimic: 15, vampire: 10, orc: 7 },
  6: { slime: 10, wolf: 10, zombie: 15, skeleton: 15, mimic: 15, vampire: 15, orc: 12, dragon: 8 },
  7: { slime: 10, wolf: 10, zombie: 10, skeleton: 10, mimic: 16, vampire: 16, orc: 16, dragon: 12 },
};
