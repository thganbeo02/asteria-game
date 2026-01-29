import type { ItemCategory, ItemDefinition } from "@/types";

function tiers(category: ItemCategory): {
  common: Pick<ItemDefinition, "rarity" | "category" | "maxStock" | "isPremium">;
  rare: Pick<ItemDefinition, "rarity" | "category" | "maxStock" | "isPremium">;
  epic: Pick<ItemDefinition, "rarity" | "category" | "maxStock" | "isPremium">;
} {
  return {
    common: { rarity: "common", category, maxStock: 2, isPremium: false },
    // GDD: rare items are 1x in shop.
    rare: { rarity: "rare", category, maxStock: 1, isPremium: false },
    epic: { rarity: "epic", category, maxStock: 1, isPremium: false },
  };
}

// =============================================================================
// RANDOM STAT ITEMS (GDD)
// =============================================================================

const OFFENSIVE = tiers("offensive");
const DEFENSIVE = tiers("defensive");
const ABILITY = tiers("ability");

export const WHETSTONE: ItemDefinition = {
  id: "whetstone",
  name: "Whetstone",
  description: "Pure ATK boost.",
  flavorText: "A simple tool for a sharper edge.",
  ...OFFENSIVE.common,
  statsPerLevel: [
    { atk: 4 },
    { atk: 6 },
    { atk: 9 },
    { atk: 12 },
    { atk: 16 },
    { atk: 20 },
    { atk: 25 },
  ],
  costPerLevel: [40, 60, 90, 115, 150, 180, 220],
};

export const SEEKERS_SIGHT: ItemDefinition = {
  id: "seekers_sight",
  name: "Seeker's Sight",
  description: "ATK + Crit Chance.",
  flavorText: "Precision over power.",
  ...OFFENSIVE.rare,
  statsPerLevel: [
    { atk: 4, critChance: 3 },
    { atk: 5, critChance: 4 },
    { atk: 6, critChance: 5 },
    { atk: 8, critChance: 6 },
    { atk: 10, critChance: 8 },
    { atk: 12, critChance: 10 },
    { atk: 15, critChance: 12 },
  ],
  costPerLevel: [70, 90, 105, 130, 160, 195, 235],
};

export const EXECUTIONERS_EDGE: ItemDefinition = {
  id: "executioners_edge",
  name: "Executioner's Edge",
  description: "ATK + Penetration.",
  flavorText: "Strike where armor fails.",
  ...OFFENSIVE.epic,
  statsPerLevel: [
    { atk: 12, penetration: 3 },
    { atk: 16, penetration: 4 },
    { atk: 21, penetration: 5 },
    { atk: 27, penetration: 6 },
    { atk: 34, penetration: 7 },
    { atk: 42, penetration: 8 },
    { atk: 52, penetration: 10 },
  ],
  costPerLevel: [145, 185, 235, 295, 365, 440, 530],
};

export const IRON_PLATE: ItemDefinition = {
  id: "iron_plate",
  name: "Iron Plate",
  description: "Pure DEF boost.",
  flavorText: "Simple protection for simple folk.",
  ...DEFENSIVE.common,
  statsPerLevel: [
    { def: 5 },
    { def: 7 },
    { def: 10 },
    { def: 13 },
    { def: 17 },
    { def: 22 },
    { def: 28 },
  ],
  costPerLevel: [45, 60, 88, 115, 150, 182, 220],
};

export const VITALITY_GEM: ItemDefinition = {
  id: "vitality_gem",
  name: "Vitality Gem",
  description: "Pure Max HP boost.",
  flavorText: "Life force crystallized.",
  ...DEFENSIVE.rare,
  statsPerLevel: [
    { maxHp: 12 },
    { maxHp: 16 },
    { maxHp: 22 },
    { maxHp: 28 },
    { maxHp: 36 },
    { maxHp: 48 },
    { maxHp: 60 },
  ],
  costPerLevel: [60, 80, 100, 125, 150, 190, 230],
};

export const GUARDIANS_BULWARK: ItemDefinition = {
  id: "guardians_bulwark",
  name: "Guardian's Bulwark",
  description: "DEF + Max HP.",
  flavorText: "An heirloom of legendary defenders.",
  ...DEFENSIVE.epic,
  statsPerLevel: [
    { maxHp: 10, def: 6 },
    { maxHp: 14, def: 9 },
    { maxHp: 18, def: 12 },
    { maxHp: 24, def: 16 },
    { maxHp: 30, def: 20 },
    { maxHp: 38, def: 24 },
    { maxHp: 50, def: 30 },
  ],
  costPerLevel: [95, 130, 160, 205, 250, 300, 375],
};

export const MANA_CRYSTAL: ItemDefinition = {
  id: "mana_crystal",
  name: "Mana Crystal",
  description: "Pure Current and Max Mana boost.",
  flavorText: "Condensed arcane energy.",
  ...ABILITY.common,
  statsPerLevel: [
    { maxMana: 6 },
    { maxMana: 8 },
    { maxMana: 11 },
    { maxMana: 14 },
    { maxMana: 18 },
    { maxMana: 23 },
    { maxMana: 30 },
  ],
  costPerLevel: [50, 65, 85, 105, 135, 165, 210],
};

export const ARCANE_FOCUS: ItemDefinition = {
  id: "arcane_focus",
  name: "Arcane Focus",
  description: "ATK + Max Mana.",
  flavorText: "Channel the ley lines themselves.",
  ...ABILITY.rare,
  statsPerLevel: [
    { atk: 2, maxMana: 5 },
    { atk: 3, maxMana: 7 },
    { atk: 4, maxMana: 9 },
    { atk: 5, maxMana: 11 },
    { atk: 7, maxMana: 14 },
    { atk: 10, maxMana: 17 },
    { atk: 14, maxMana: 23 },
  ],
  costPerLevel: [60, 85, 105, 125, 155, 195, 260],
};

export const WELLSPRING_HEART: ItemDefinition = {
  id: "wellspring_heart",
  name: "Wellspring Heart",
  description: "ATK + Max Mana + Mana Regen.",
  flavorText: "A reservoir that never runs dry.",
  ...ABILITY.epic,
  statsPerLevel: [
    { atk: 6, maxMana: 10, manaRegen: 0 },
    { atk: 8, maxMana: 14, manaRegen: 1 },
    { atk: 12, maxMana: 18, manaRegen: 1 },
    { atk: 16, maxMana: 22, manaRegen: 1 },
    { atk: 21, maxMana: 28, manaRegen: 2 },
    { atk: 26, maxMana: 34, manaRegen: 2 },
    { atk: 32, maxMana: 42, manaRegen: 3 },
  ],
  costPerLevel: [125, 195, 250, 300, 390, 450, 555],
};

export const RANDOM_STAT_ITEMS = {
  offensive: {
    common: WHETSTONE,
    rare: SEEKERS_SIGHT,
    epic: EXECUTIONERS_EDGE,
  },
  defensive: {
    common: IRON_PLATE,
    rare: VITALITY_GEM,
    epic: GUARDIANS_BULWARK,
  },
  ability: {
    common: MANA_CRYSTAL,
    rare: ARCANE_FOCUS,
    epic: WELLSPRING_HEART,
  },
} as const;
