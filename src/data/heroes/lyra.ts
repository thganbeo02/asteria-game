import type { HeroDefinition } from "@/types";

export const LYRA: HeroDefinition = {
  id: "lyra",
  name: "Lyra",
  title: "The Emblar Sorcerer",
  class: "mage",
  difficulty: 1,
  unlockMethod: "Starter (Free)",
  quote: "Knowledge is power. Fire is just... faster.",
  lore: "Lyra was a librarian's apprentice at the Ashen Academy until she accidentally burned it down discovering her gift. Now she wanders, turning her volatile magic into a force for good—one carefully controlled explosion at a time.",

  baseStats: {
    maxHp: 85,
    hp: 85,
    atk: 12,
    def: 4,
    maxMana: 62,
    mana: 12,
    manaRegen: 5,
    critChance: 7,
    critMultiplier: 1.5,
    dodge: 8,
    penetration: 0,
  },

  levelScaling: {
    // Index 1 = gain when leveling from 1 → 2
    maxHp: [0, 8, 10, 12, 15, 18, 22],
    atk: [0, 4, 8, 12, 17, 22, 28],
    def: [0, 3, 6, 9, 12, 16, 20],
    maxMana: [0, 5, 8, 11, 14, 17, 20],
    manaRegen: [0, 0, 1, 0, 1, 0, 1],
  },

  passive: {
    name: "Arcane Momentum",
    description:
      "Consecutive spells grow stronger. Basic attacks reset the chain but restore mana.",
    expandedDescription: `Lyra's magic builds upon itself, rewarding commitment to spellcasting.
      Each consecutive ability grants 1 Momentum stack, up to 3:
      - 1 Stack: +10% ability damage
      - 2 Stacks: +20% ability damage
      - 3 Stacks: +30% ability damage + 15% Penetration

      Basic attacks reset Momentum to 0. When reset from max stacks, she restores 3-21 Mana.`,
  },

  abilities: [
    // =========================================================================
    // ABILITY 1: Firebolt
    // =========================================================================
    {
      id: "lyra_firebolt",
      name: "Firebolt",
      description: "Quick fire spell. Burns enemy over time.",
      expandedDescription: `Lyra hurls a bolt of flame, dealing 100-220% ATK (scales with level), and
        applies Burn for 3 turns (5% enemy Max HP per turn). On Kill, restore 4-16 mana.`,

      // These arrays have 7 values: one per level
      manaCost: [10, 12, 14, 16, 18, 20, 22],
      cooldown: 1,
      currentCooldown: 0,
      damageScaling: [100, 120, 140, 160, 180, 200, 220],
      tags: ["burn", "mana_on_kill"],
    },

    // =========================================================================
    // ABILITY 2: Frost Barrier
    // =========================================================================
    {
      id: "lyra_frost_barrier",
      name: "Frost Barrier",
      description: "Shield that absorbs damage. Shatters to damage and slow.",
      expandedDescription: `Lyra conjures a frost barrier that absorbs up to 40% Max HP for 2 turns.
        When the barrier breaks or expires, it shatters, dealing 60-120% ATK to enemy and applies Chill for 2 turns 
        (enemy deals 15% less damage).`,

      manaCost: [14, 17, 20, 23, 26, 29, 32],
      cooldown: 3,
      currentCooldown: 0,
      damageScaling: [60, 70, 80, 90, 100, 110, 120],
      tags: ["shield", "chill"],
    },

    // =========================================================================
    // ABILITY 3: Pyroclasm
    // =========================================================================
    {
      id: "lyra_pyroclasm",
      name: "Pyroclasm",
      description: "Massive fire burst. Stronger against Burning enemies.",
      expandedDescription: `Lyra unleashes an explosive flame, dealing 180-360% ATK. If enemy is already Burning, 
        consumes it for bonus damage equal to remaining burn. Each cast grants her permanent 2-14 ATK and Max HP.`,

      manaCost: [24, 28, 32, 36, 40, 44, 48],
      cooldown: 4,
      currentCooldown: 0,
      damageScaling: [180, 210, 240, 270, 300, 330, 360],
      tags: ["burn_consume", "permanent_stats"],
    },
  ],
};

// =============================================================================
// LYRA-SPECIFIC CONSTANTS
// =============================================================================

// Arcane Momentum: Mana restored when resetting from max stacks
// Initial passive state when starting a run
export const LYRA_INITIAL_PASSIVE_STATE = {
  momentum: 0,
};

export const LYRA_MOMENTUM_MANA_RESTORE = [3, 6, 9, 12, 15, 18, 21];

// Arcane Momentum: Damage multiplier per stack
export const LYRA_MOMENTUM_BONUS = {
  1: 0.1, // +10%
  2: 0.2, // +20%
  3: 0.3, // +30%
};

// Arcane Momentum: Penetration at max stacks
export const LYRA_MAX_MOMENTUM_PENETRATION = 15;

// Firebolt: Mana restored on kill
export const LYRA_FIREBOLT_KILL_MANA = [4, 6, 8, 10, 12, 14, 16];

// Pyroclasm: Permanent stat gain per cast
export const LYRA_PYROCLASM_STAT_GAIN = [2, 4, 6, 8, 10, 12, 14];
