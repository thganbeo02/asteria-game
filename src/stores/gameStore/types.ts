import type {
  ContractState,
  Difficulty,
  GamePhase,
  ItemInstance,
  MonsterBaseStats,
  MonsterType,
  RunDecisionKind,
  RunState,
} from "@/types";
import type { ShopState } from "@/types";

export type { ContractState, RunDecisionEvent, RunDecisionKind, RunState } from "@/types";

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
  assignContract: () => void;
  setContractState: (state: ContractState | undefined) => void;
  updateContractState: (
    updater: ContractState | Partial<ContractState> | ((prev: ContractState) => ContractState)
  ) => void;
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
