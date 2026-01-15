import { HeroClass, ItemCategory, Rarity } from "./common";

/**
 * Stats an item provide
 * All fields optional because items don't boost everything.
 */
export interface ItemStats {
  atk?: number;
  def?: number;
  maxHp?: number;
  maxMana?: number;
  manaRegen?: number;
  critChance?: number;
  critMultiplier?: number;
  dodge?: number;
  penetration?: number;
}

/**
 * Item definition - the template
 */
export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  flavorText: string;

  rarity: Rarity;
  category: ItemCategory;
  maxStock: number;   // How many can be bought per shop

  // Stats and cost scale with player level
  statsPerLevel: ItemStats[]; // Index = level - 1
  costPerLevel: number[];

  // Premium item fields
  isPremium: boolean;
  classRestriction?: HeroClass;
  specialEffect?: {
    name: string;
    description: string;
  }
}

/**
 * A purchased item instance.
 */
export interface ItemInstance {
  definitionId: string;
  purchaseLevel: number;  // Level when bought (affects stats)
  stats: ItemStats;       // Snapshot of stats at purchase
}