import type { Difficulty, GamePhase, MonsterType, TurnPhase } from "./common";
import type { ItemInstance } from "./item";
import type { MonsterBaseStats } from "./monster";

/**
 * Persistent state across an entire run.
 * Created on "Start Run", destroyed on death/summary.
 */
export type RunDecisionKind =
  | "basic_attack"
  | "cast_ability"
  | "skip_turn"
  | "end_run"
  | "next_encounter"
  | "enter_shop"
  | "skip_shop"
  | "shop_buy_offer"
  | "shop_buy_potion"
  | "shop_continue";

export interface RunDecisionEvent {
  seq: number;
  at: string; // ISO timestamp
  kind: RunDecisionKind;
  phase: GamePhase;
  heroId: string;
  difficulty: Difficulty;
  encounter: number;
  internalEncounter: number;
  currentLevel: number;
  turnCount?: number;
  turnPhase?: TurnPhase;
  payload?: Record<string, unknown>;
}

export interface ContractState {
  tier: "casual" | "standard" | "rush" | "impossible";
  currentTurnLimit: number;
  currentTurn: number;
  crystalBonus: number;
  expBonus: number;
  goldBonus: number;
  streak: number;
  completed: number;
}

/**
 * Persistent state across an entire run.
 * Created on "Start Run", destroyed on death/summary.
 */
export interface RunState {
  heroId: string;
  difficulty: Difficulty;

  // Counters
  encounter: number;
  internalEncounter: number;
  currentLevel: number;

  // Monster snapshots, captured at level up
  monsterSnapshots: Record<MonsterType, MonsterBaseStats>;

  // Economy
  crystals: number;
  crystalsEarned: number;
  crystalsSpent: number;
  gold: number;

  // Progression
  exp: number;

  // Tracking
  score: number;
  monstersKilled: Record<MonsterType, number>;
  totalItemsOffered: number;
  totalShopClears: number;

  // Inventory
  purchasedItems: ItemInstance[];
  healthPotionsUsedThisLevel: number;
  shopsSkipped: number;

  // Balancing / analytics (not persisted)
  decisionLog: RunDecisionEvent[];
  crystalsEarnedPerLevel: Record<number, number>;
  crystalsSpentPerLevel: Record<number, number>;

  // Hero-specific (Shade contracts, etc.)
  contractState?: ContractState;
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
