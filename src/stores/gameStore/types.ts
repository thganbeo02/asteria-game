import { Difficulty, GamePhase, ItemInstance, MonsterBaseStats, MonsterType, TurnPhase } from "@/types";
import type { ShopState } from "@/types";

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
  contractState?: {
    currentTurnLimit: number;
    currentTurn: number;
    crystalBonus: number;
    expBonus: number;
    streak: number;
  };

}

export interface ShopSlice {
  shop: ShopState | null;

  openShop: () => void;
  closeShop: () => void;
  buyOffer: (offerId: string) =>
    | { ok: true; kind: "item"; item: ItemInstance }
    | { ok: true; kind: "potion"; healPercent: number }
    | { ok: false; reason: string };
}

// SLICE INTERFACES

export interface RunSlice {
  run: RunState | null;
  phase: GamePhase;

  // Actions
  startRun: (heroId: string, difficulty: Difficulty) => void;
  endRun: (victory: boolean) => void;
  setPhase: (phase: GamePhase) => void;
  incrementEncounter: () => void;
  levelUp: () => void;
  recordKill: (monsterType: MonsterType) => void;
  addScore: (points: number) => void;
  addExp: (amount: number) => void;
  getMonsterSnapshot: (monsterType: MonsterType) => MonsterBaseStats;
  recordDecision: (kind: RunDecisionKind, payload?: Record<string, unknown>) => void;
}

export interface EconomySlice {
  // Actions (operate on run.crystals, run.gold, etc.)
  addCrystals: (amount: number) => void;
  spendCrystals: (amount: number) => boolean;
  addGold: (amount: number) => void;
  purchaseItem: (item: ItemInstance) => void;
  useHealthPotion: () => boolean;
  skipShop: () => void;
}

export interface MetaSlice {
  totalGold: number;
  unlockedHeroes: string[];
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    animationSpeed: "slow" | "normal" | "fast";
  };

  // Actions
  addTotalGold: (amount: number) => void;
  unlockHero: (heroId: string) => void;
  updateSettings: (settings: Partial<MetaSlice["settings"]>) => void;
}

export interface GameStore extends RunSlice, EconomySlice, MetaSlice, ShopSlice {}


export type GameSliceCreator<T> = (
  set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void,
  get: () => GameStore
) => T;
