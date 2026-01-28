import { StatusEffect } from "./combat";
import { MonsterType } from "./common";

/**
 * Base stats for a monster at encounter 0.
 * NOTE: Monsters never appear with exactly these stats since
 * encounters start at 1, not 0.
 */
export interface MonsterBaseStats {
  hp: number;
  atk: number;
  def: number;
  crystal: number;  // Crystal reward
  exp: number;      // EXP reward
  score?: number;   // Score reward
}

/**
 * Growth per encounter, separated by difficulty.
 * Each array has 7 values (one per level).
 */
export interface MonsterGrowth {
  hp: { easy: number[]; medium: number[]; hard: number[] };
  atk: { easy: number[]; medium: number[]; hard: number[] };
  def: { easy: number[]; medium: number[]; hard: number[] };
  crystal: { easy: number[]; medium: number[]; hard: number[] };
  exp: { easy: number[]; medium: number[]; hard: number[] };
}

/**
 * Monster AI behavior
 */
export interface MonsterBehavior {
  // Patterns of actions, eg. ["attack","attack","special"] if applicable
  pattern?: string[];

  // Special ability details
  specialAbility?: {
    name: string;
    description: string;
    trigger: "turn" | "hp_threshold" | "pattern";
    triggerValue?: number,  // Which turn, or HP percentage
  };
}

/** 
 * Complete monster definition 
 */
export interface MonsterDefinition {
  id: MonsterType;
  name: string;
  description: string;
  minLevel: number; // Earliest level this monster can appear

  baseStats: MonsterBaseStats;
  growth: MonsterGrowth;
  behavior: MonsterBehavior;
}

/**
 * Runtime monster state during combat.
 */
export interface MonsterState {
  definitionId: MonsterType;
  
  // Calculated stats (snapshotBase + growth * internalEncounter)
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  crystalReward: number;
  expReward: number;
  scoreReward: number;
  
  statusEffects: StatusEffect[];
  
  // AI tracking
  turnCount: number;
  patternIndex: number;
}