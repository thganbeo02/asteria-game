import type { HeroDefinition } from "@/types";

export const CAMIRA: HeroDefinition = {
  id: "camira",
  name: "Camira",
  title: "The Arrow of People",
  class: "ranger",
  difficulty: 1,
  unlockMethod: "Starter (Free)",
  lore: "Camira is an outlaw from Millbrook who steals from monsters to feed her starving village. She values precision and mobility over heavy armor.",
  quote: "Take from the beasts. Give to the people. Survive another day.",

  baseStats: {
    maxHp: 92,
    hp: 92,
    atk: 12,
    def: 5,
    maxMana: 55,
    mana: 10,
    manaRegen: 4,
    critChance: 20,
    critMultiplier: 1.75,
    dodge: 10,
    penetration: 0,
  },

  levelScaling: {
    maxHp: [0, 10, 12, 14, 16, 18, 20],
    atk: [0, 2, 3, 3, 4, 4, 5],
    def: [0, 1, 1, 2, 2, 2, 3],
    maxMana: [0, 5, 8, 11, 14, 17, 20],
    manaRegen: [0, 0, 1, 0, 1, 0, 1],
  },

  passive: {
    name: "Deadeye Hustle",
    description:
      "Every 3rd basic attack hits harder. Crits restore Mana and reduce Rapid Fire CD.",
    expandedDescription: `Camira's survival instincts and precision make every shot count.
      Every 3rd basic attack, she deals bonus 30-60% ATK damage (based on level).
      On Crit, she restores 2-5 Mana and reduces the cooldown of Rapid Fire by 1 turn.`,
  },

  abilities: [
    {
      id: "camira_rapid_fire",
      name: "Rapid Fire",
      description: "Two arrows. Heals from damage dealt.",
      expandedDescription: `Fire two arrows, each dealing 70-100% ATK (each arrow can Crit).
 Heal for 30-60% of total damage dealt.`,
      manaCost: [9, 12, 15, 18, 21, 24, 27],
      cooldown: 2,
      currentCooldown: 0,
      damageScaling: [70, 75, 80, 85, 90, 95, 100],
      tags: ["multi_hit", "lifesteal"],
    },
    {
      id: "camira_forest_agility",
      name: "Forest Agility",
      description: "60% evasion + permanent stats.",
      expandedDescription: `Tap survival instincts: 60% evasion for next attack.
Gain 3-9 permanent ATK and DEF.
From Level 5: Also gain 12-15 random max HP.`,
      manaCost: [10, 14, 18, 22, 26, 30, 34],
      cooldown: 3,
      currentCooldown: 0,
      tags: ["evade_buff", "permanent_stats"],
    },
    {
      id: "camira_jackpot_arrow",
      name: "Jackpot Arrow",
      description: "Magic arrow. Massive crystal bonus on kill.",
      expandedDescription: `Fire a magic arrow: 140-260% ATK, ignoring 30-60% DEF.
        On Kill: Gain 20-600 bonus crystals.
        Each use grants **3% Crit Chance and Crit Damage**, up to 8 times (**${0} / 8**).`,
      manaCost: [16, 20, 24, 28, 32, 36, 40],
      cooldown: 4,
      currentCooldown: 0,
      damageScaling: [140, 160, 180, 200, 220, 240, 260],
      tags: ["penetration", "crystal_on_kill", "crit_stacking"],
    },
  ],
};

// =============================================================================
// CAMIRA-SPECIFIC CONSTANTS
// =============================================================================

export const CAMIRA_INITIAL_PASSIVE_STATE = {
  attackCount: 0,
  jackpotStacks: 0,
};
// Passive: Every Nth attack gets bonus
export const CAMIRA_PASSIVE_HIT_COUNT = 3;
export const CAMIRA_PASSIVE_BONUS = [30, 35, 40, 45, 50, 55, 60];

// Passive: Crit bonuses
export const CAMIRA_CRIT_MANA_MIN = 2;
export const CAMIRA_CRIT_MANA_MAX = 5;
export const CAMIRA_CRIT_CD_REDUCTION = 1;

// Rapid Fire: Lifesteal percentage
export const CAMIRA_RAPID_FIRE_HEAL = [30, 35, 40, 45, 50, 55, 60];

// Forest Agility
export const CAMIRA_FOREST_EVADE = 60;
export const CAMIRA_FOREST_STATS = [3, 4, 5, 6, 7, 8, 9];
export const CAMIRA_FOREST_HP_LEVEL = 5; // Level at which HP bonus starts
export const CAMIRA_FOREST_HP_MIN = 12;
export const CAMIRA_FOREST_HP_MAX = 15;

// Jackpot Arrow
export const CAMIRA_JACKPOT_PEN = [30, 35, 40, 45, 50, 55, 60];
export const CAMIRA_JACKPOT_CRYSTALS = [20, 40, 75, 125, 200, 350, 600];
export const CAMIRA_JACKPOT_CRIT_PER_USE = 3;
export const CAMIRA_JACKPOT_MAX_STACKS = 8;
