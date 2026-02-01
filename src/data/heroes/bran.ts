import type { HeroDefinition } from "@/types";

export const BRAN: HeroDefinition = {
  id: "bran",
  name: "Bran",
  title: "The Village Defender",
  class: "warrior",
  difficulty: 2,
  unlockMethod: "Starter (Free)",
  lore: "Born in the farming village of Oakenshield, Bran picked up a sword not for glory, but to protect his home. With no noble training or legendary power, he fights through sheer strength and stubborn resolve.",
  quote: "You want to hurt them? You'll have to go through me first.",

  baseStats: {
    maxHp: 110,
    hp: 110,
    atk: 14,
    def: 10,
    maxMana: 40,
    mana: 10,
    manaRegen: 3,
    critChance: 5,
    critMultiplier: 1.5,
    dodge: 5,
    penetration: 0,
  },

  levelScaling: {
    maxHp:     [0, 12, 18, 24, 30, 36, 42],
    atk:       [0, 4, 7, 10, 14, 19, 25],
    def:       [0, 4, 7, 10, 14, 19, 25],
    maxMana:   [0, 5, 7, 9, 11, 14, 18],   
    manaRegen: [0, 0, 1, 0, 1, 0, 1],
  },

  passive: {
    name: "Iron Will",
    description: "Heal on kill. Gain penetration at level 4.",
    expandedDescription: `Bran's determination keeps him standing.
    On Kill, he heals for 24-48% of missing HP (scales with level).
    On level 4, Bran also gains 20% Penetration.`,
  },

  abilities: [
    {
      id: "bran_shield_slam",
      name: "Shield Slam",
      description: "Stun enemy for 1 turn.",
      expandedDescription: `Bran slams his shield at the enemy, dealing 90-150% ATK + 25% DEF damage
      and stunning it for 1 turn (skip their next action).`,
      manaCost: [8, 10, 12, 14, 16, 18, 20],
      cooldown: 2,
      currentCooldown: 0,
      damageScaling: [90, 100, 110, 120, 130, 140, 150],
      tags: ["stun", "def_scaling"],
    },
    {
      id: "bran_fortify",
      name: "Fortify",
      description: "Massive DEF buff for 3 turns.",
      expandedDescription: `Bran braces for impact, gaining 40-70% bonus DEF for 3 turns. 
      He then shrugs off, gaining 5-15 permanent Max HP. Every 5 uses, Bran gains 10 ATK and 5% Penetration.`,
      manaCost: [10, 14, 18, 22, 26, 30, 34],
      cooldown: 4,
      currentCooldown: 0,
      tags: ["def_buff", "permanent_stats"],
    },
    {
      id: "bran_crushing_blow",
      name: "Crushing Blow",
      description: "Execute. More damage to low HP enemies.",
      expandedDescription: `Bran strikes down the enemy boldly, dealing 140-230% ATK + 20% enemy missing HP.
      On Kill, he gains 3-15 permanent ATK and DEF.`,
      manaCost: [18, 22, 26, 30, 34, 38, 42],
      cooldown: 4,
      currentCooldown: 0,
      damageScaling: [140, 155, 170, 185, 200, 215, 230],
      tags: ["execute", "stats_on_kill"],
    },
  ],
};

// =============================================================================
// BRAN-SPECIFIC CONSTANTS
// =============================================================================

// Iron Will: % of missing HP healed on kill
export const BRAN_KILL_HEAL_PERCENT = [24, 28, 32, 36, 40, 44, 48];

// Level at which passive penetration unlocks
export const BRAN_PENETRATION_UNLOCK_LEVEL = 4;
export const BRAN_PASSIVE_PENETRATION = 20;

// Fortify: DEF bonus percentage
export const BRAN_FORTIFY_DEF_BONUS = [40, 45, 50, 55, 60, 65, 70];

// Fortify: Max HP gained when buff expires
export const BRAN_FORTIFY_HP_GAIN = [5, 7, 9, 11, 13, 15, 15];

// Fortify: Uses needed for permanent bonus
export const BRAN_FORTIFY_THRESHOLD = 5;
export const BRAN_FORTIFY_BONUS_ATK = 10;
export const BRAN_FORTIFY_BONUS_PEN = 5;
export const BRAN_INITIAL_PASSIVE_STATE = {
  fortifyUses: 0,
  fortifyBonusUnlocked: false,
  penetrationApplied: false,
  pendingFortifyHpGain: 0,
};

// Shield Slam: DEF scaling
export const BRAN_SHIELD_SLAM_DEF_SCALE = 25;  // +25% of DEF as damage

// Crushing Blow: Missing HP scaling
export const BRAN_CRUSHING_BLOW_MISSING_HP = 20;  // +20% of enemy missing HP

// Crushing Blow: Stats on kill
export const BRAN_CRUSHING_BLOW_KILL_STATS = [3, 5, 7, 9, 11, 13, 15];
