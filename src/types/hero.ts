/**
 * Base stats that define a hero's starting power.
 * These come from the GDD and don't change during a run.
 */

import { HeroClass } from "./common";

export interface HeroBaseStats {
  maxHp: number;
  hp: number;             // Starting HP, equals maxHp
  atk: number;
  def: number;
  maxMana: number;
  mana: number;           // Starting mana, significantly less than max mana
  manaRegen: number;      // Mana restored per Basic Attack
  critChance: number;     // 0-100%
  critMultiplier: number; // eg. 1.5x means 150% damage
  dodge: number;          // 0-50%
  penetration: number;    // 0-100% (% enemy DEF ignored)
}

/**
 * Runtime stats include bonuses from items and buffs.
 * During combat, we use baseValue + bonusValue for calculations.
 */
export interface HeroStats extends HeroBaseStats {
  // Bonuses from items, abilities, or permanent gains
  bonusAtk: number;
  bonusDef: number;
  bonusMaxHp: number;
  bonusMaxMana: number;
  bonusCritChance: number;
  bonusCritMultiplier: number;
  bonusDodge: number;
  bonusPenetration: number;
}

/**
 * Stat gains per level. Array index = level - 1.
 * So index 0 is the gain from level 1 → 2.
 */

export interface HeroLevelScaling {
  maxHp: number[];
  atk: number[];
  def: number[];
  maxMana: number[];
  manaRegen: number[];
}

/**
 * An ability's static definition
 */
export interface Ability {
  id: string;
  name: string;
  description: string;

  // Scaling arrays: index = level - 1
  manaCost: number[];       // Mana cost at each level
  cooldown: number;         // Base cooldown (turns)
  currentCooldown: number;  // Turns until usable

  damageScaling?: number[];
  tags?: string[];
}

/**
 * Complete hero definition - the "template" loaded from data files.
 */
export interface HeroDefinition {
  id: string;
  name: string;
  title: string;           // "The Ember Scholar"
  class: HeroClass;
  difficulty: 1 | 2 | 3 | 4 | 5;  // Star rating
  unlockMethod: string;
  quote: string;
  lore: string;
  
  baseStats: HeroBaseStats;
  levelScaling: HeroLevelScaling;
  
  passive: {
    name: string;
    description: string;
    expandedDescription: string;  // Full tooltip text
  };
  
  abilities: [Ability, Ability, Ability];  // Always exactly 3
}

/**
 * Runtime hero state during a run.
 * Created fresh when a run starts, mutated during combat
 */
export interface HeroState {
  definitionId: string; // Reference back to HeroDefinition
  level: number;
  stats: HeroStats;
  abilities: Ability[]; // Runtime copies with currentCooldown
  statusEffects: StatusEffect[];

  // Passive-specific tracking. Flexible because passive works differently
  passiveState: Record<string, number | boolean>;
}