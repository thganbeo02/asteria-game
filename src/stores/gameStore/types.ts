import { Difficulty, GamePhase, ItemInstance, MonsterBaseStats, MonsterType } from "@/types";

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

  // Tracking
  score: number;
  monstersKilled: Record<MonsterType, number>;

  // Inventory
  purchasedItems: ItemInstance[];
  healthPotionsUsedThisLevel: number;
  shopsSkipped: number;

  // Hero-specific (Shade contracts, etc.)
  contractState?: {
    currentTurnLimit: number;
    currentTurn: number;
    crystalBonus: number;
    expBonus: number;
    streak: number;
  };

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
  getMonsterSnapshot: (monsterType: MonsterType) => MonsterBaseStats;
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

export interface GameStore extends RunSlice, EconomySlice, MetaSlice {}

export type GameSliceCreator<T> = (
  set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void,
  get: () => GameStore
) => T;