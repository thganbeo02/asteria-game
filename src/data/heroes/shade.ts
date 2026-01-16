import type { HeroDefinition } from "@/types";

export const SHADE: HeroDefinition = {
  id: "shade",
  name: "Shade",
  title: "The Hollow Blade",
  class: "assassin",
  difficulty: 2,
  unlockMethod: "Starter (Free)",
  quote: "Time is money. Yours is running out.",
  lore: "Shade has no memory of who she was before the ritual. The cult that created her intended a perfect killer—obedient, emotionless, disposable. She proved them wrong on all counts.",

  baseStats: {
    maxHp: 90,
    hp: 90,
    atk: 15,
    def: 6,
    maxMana: 50,
    mana: 12,
    manaRegen: 4,
    critChance: 15,
    critMultiplier: 1.5,
    dodge: 12,
    penetration: 0,
  },

  levelScaling: {
    maxHp: [0, 10, 12, 14, 17, 20, 24],
    atk: [0, 2, 3, 3, 4, 4, 5],
    def: [0, 1, 1, 2, 2, 2, 3],
    maxMana: [0, 5, 8, 11, 14, 17, 20],
    manaRegen: [0, 0, 1, 0, 1, 0, 1],
  },

  passive: {
    name: "Professional Killer",
    description: "Contracts give bonus rewards for fast kills.",
    expandedDescription: `Each encounter, Shade is given a Contract that has a specified turn limit and reward accordingly.
      If Shade kills within the turn limit, she is rewarded with bonus Crystals and EXP, 
      and restores 10-22% Max HP (based on level).

      Completing 3 Contracts in a row will guarantee Shade's next Contract one tier higher. 
      For every 5 Contracts completed, Shade gains 5-17 ATK, DEF, and Max HP`,
  },

  abilities: [
    {
      id: "shade_quickblade",
      name: "Quickblade",
      description: "Fast strike. Gains ATK on kill.",
      expandedDescription: `Shade strikes with lethal efficiency for 120-180% ATK.
        On Kill, she gains 2-8 permanent ATK.
        
        If Contract is active with 2 or fewer turns remaining, Quickblade ignores 10% enemy's DEF.`,
      manaCost: [8, 10, 12, 14, 16, 18, 20],
      cooldown: 2,
      currentCooldown: 0,
      damageScaling: [120, 130, 140, 150, 160, 170, 180],
      tags: ["atk_on_kill", "contract_bonus", "permanent_stats"],
    },
    {
      id: "shade_phantom_step",
      name: "Phantom Step",
      description: "Strike and gain 75% evasion. Extends Contract.",
      expandedDescription: `Shade strikes for 80-140% ATK, before phasing through shadow, 
        gaining 75% Evade for a turn. Shade also extends the Contract by a turn. `,
      manaCost: [10, 13, 16, 19, 22, 25, 28],
      cooldown: 3,
      currentCooldown: 0,
      damageScaling: [80, 90, 100, 110, 120, 130, 140],
      tags: ["evade_buff", "contract_extend"],
    },
    {
      id: "shade_collect",
      name: "Collect",
      description: "High damage finisher with contract bonus.",
      expandedDescription: `Shade collects what she's owed, ignoring 25% enemy DEF and deals 180-300% ATK. 
        On Kill, she gains 2-8 DEF, and on Contract completion, Shade gains 5-125 bonus Crystals.`,
      manaCost: [20, 24, 28, 32, 36, 40, 44],
      cooldown: 4,
      currentCooldown: 0,
      damageScaling: [180, 200, 220, 240, 260, 280, 300],
      tags: ["penetration", "def_on_kill", "contract_bonus", "permanent_stats"],
    },
  ],
};

// =============================================================================
// SHADE'S CONTRACT SYSTEM
// =============================================================================

export type ContractTier = "casual" | "standard" | "rush" | "impossible";

export interface ContractConfig {
  turnLimitMin: number;
  turnLimitMax: number;
  crystalBonus: number; // Multiplier (0.2 = +20%)
  expBonus: number;
  goldBonus: number; // Flat gold
  rollChance: number; // Weight for random selection
}

export const CONTRACT_TIERS: Record<ContractTier, ContractConfig> = {
  casual: {
    turnLimitMin: 5,
    turnLimitMax: 6,
    crystalBonus: 0.2,
    expBonus: 0.1,
    goldBonus: 0,
    rollChance: 45,
  },
  standard: {
    turnLimitMin: 4,
    turnLimitMax: 5,
    crystalBonus: 0.3,
    expBonus: 0.2,
    goldBonus: 0,
    rollChance: 35,
  },
  rush: {
    turnLimitMin: 3,
    turnLimitMax: 4,
    crystalBonus: 0.5,
    expBonus: 0.3,
    goldBonus: 0,
    rollChance: 15,
  },
  impossible: {
    turnLimitMin: 2,
    turnLimitMax: 2,
    crystalBonus: 1.0,
    expBonus: 0.5,
    goldBonus: 5,
    rollChance: 5,
  },
};

// =============================================================================
// SHADE-SPECIFIC CONSTANTS
// =============================================================================

// HP healed on contract completion
export const SHADE_CONTRACT_HEAL = [10, 12, 14, 16, 18, 20, 22];

// Streak thresholds
export const SHADE_STREAK_UPGRADE = 3; // Guaranteed tier upgrade
export const SHADE_STREAK_STATS = 5; // Permanent stat bonus

// Permanent stats at 5 streak
export const SHADE_STREAK_STAT_GAIN = [5, 7, 9, 11, 13, 15, 17];

// Quickblade
export const SHADE_QUICKBLADE_ATK_GAIN = [2, 3, 4, 5, 6, 7, 8];
export const SHADE_QUICKBLADE_CONTRACT_PEN = 10;

// Phantom Step
export const SHADE_PHANTOM_EVADE = 75;

// Collect
export const SHADE_COLLECT_PENETRATION = 25;
export const SHADE_COLLECT_DEF_GAIN = [2, 3, 4, 5, 6, 7, 8];
export const SHADE_COLLECT_CONTRACT_CRYSTALS = [5, 10, 15, 25, 50, 75, 125];

export const SHADE_INITIAL_PASSIVE_STATE = {
  contractStreak: 0,
  contractPenStacks: 0,
  streakBonusUnlocked: false,
};

// =============================================================================
// CONTRACT HELPER FUNCTIONS
// =============================================================================

/**
 * Roll a random contract tier.
 * If streak >= 3, result is bumped one tier higher.
 */
export function rollContractTier(streak: number): ContractTier {
  const tierKeys: ContractTier[] = ["casual", "standard", "rush", "impossible"];
  const tiers = Object.entries(CONTRACT_TIERS);

  // 1. Calculate total weight
  const totalWeight = tiers.reduce((sum, [, config]) => sum + config.rollChance, 0);

  // 2. Perform the base roll
  let roll = Math.random() * totalWeight;
  let selectedIndex = 0;

  for (let i = 0; i < tiers.length; i++) {
    const [, config] = tiers[i];
    roll -= config.rollChance;
    if (roll <= 0) {
      selectedIndex = i;
      break;
    }
  }

  // 3. Apply the "Professional Edge" Streak Bump
  if (streak >= SHADE_STREAK_UPGRADE) {
    selectedIndex = Math.min(selectedIndex + 1, tierKeys.length - 1);
  }

  return tierKeys[selectedIndex];
}

/**
 * Generate a contract with random turn limit within tier range.
 */
export function generateContract(tier: ContractTier) {
  const config = CONTRACT_TIERS[tier];
  const turnLimit =
    config.turnLimitMin +
    Math.floor(Math.random() * (config.turnLimitMax - config.turnLimitMin + 1));

  return {
    tier,
    turnLimit,
    crystalBonus: config.crystalBonus,
    expBonus: config.expBonus,
    goldBonus: config.goldBonus,
  };
}
