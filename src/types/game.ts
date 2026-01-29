import { Difficulty, GamePhase, MonsterType } from "./common";
import { ItemInstance } from "./item";
import { MonsterBaseStats } from "./monster";

/**
 * Persistent state across an entire run.
 * Created on "Start Run", destroyed on death/summary.
 */
export interface RunState {
  heroId: string;
  difficulty: Difficulty;

  // Counters
  encounterCount: number;         // Start from 1, total this run
  internalEncounterCount: number; // Resets to 1 on level up
  currentLevel: number;

  // Monster scaling - snapshotted bases for each monster type
  // Initialized to original baseStats at run start
  // Updated on level-up to capture current encounter's stats as new stats
  monsterSnapshots: Record<MonsterType, MonsterBaseStats>;

  // Economy
  crystals: number;
  crystalsEarned: number;
  crystalsSpent: number;
  gold: number;  // Awarded at run end

  // Progression
  exp: number;

  // Tracking
  score: number;
  monstersKilled: Record<MonsterType, number>;

  // Inventory
  purchasedItems: ItemInstance[];
  healthPotionsUsedThisLevel: number;
  shopsSkipped: number;

  // Shade-specific
  contractState?: {
    currentTurnLimit: number;
    currentTurn: number;
    crystalBonus: number;
    expBonus: number;
    streak: number;
  }

}

/**
 * Top level game state.
 * Always exists. Persists across runs. Contains RunState as a child.
 */
export interface GameState {
  phase: GamePhase;
  run: RunState | null; // null when not in a run

  // Meta progression (persisted)
  totalGold: number;
  unlockedHeroes: string[];

  // Settings (unplanned)
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    animationSpeed: "slow" | "normal" | "fast";
  }
}
