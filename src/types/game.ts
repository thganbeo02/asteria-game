import { Difficulty, GamePhase, MonsterType } from "./common";
import { ItemInstance } from "./item";

/**
 * Persistent state across an entire run.
 * Created on "Start Run", destroyed on death/summary.
 */
export interface RunState {
  heroId: string;
  difficulty: Difficulty;

  // Counters
  encounterCount: number;         // Start from 1, total this run
  internalEncounterCount: number; // Resets on level up
  currentLevel: number;

  // Economy
  crystals: number;
  crystalsEarned: number;
  crystalsSpent: number;
  gold: number;  // Awarded at run end

  // Tracking
  score: number;
  monstersKilled: Record<MonsterType, number>;

  // Inventory
  purchasedItems: ItemInstance[];
  healthPotionsUsedThisLevel: number;
  shopsSkipped: number;

  // Shade-specific
  contractState?: {
    currentTurnLiimit: number;
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