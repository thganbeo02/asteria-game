import { CombatLog, Difficulty, HeroState, HeroStats, MonsterState, StatusEffect, TurnPhase, AnimationEvent } from "@/types";

// SLICE INTERFACES

export interface HeroSlice {
  hero: HeroState | null;

  // Actions
  initHero: (heroId: string) => void;
  dealDamageToHero: (amount: number) => void;
  healHero: (amount: number) => void;
  modifyHeroStats: (changes: Partial<HeroStats>) => void;
  addHeroBonusStats: (stat: keyof HeroStats, amount: number) => void;
  spendMana: (amount: number) => boolean;
  restoreMana: (amount: number) => void;
  applyStatusToHero: (effect: StatusEffect) => void;
  removeHeroStatus: (type: StatusEffect["type"]) => void;
  setAbilityCooldown: (index: number, cooldown: number)=>void;
  tickCooldowns:() => void;
  updatePassiveState: (updates: Record<string, number | boolean>) => void;
}

export interface MonsterSlice {
  monster: MonsterState | null;

  // Actions
  spawnMonster: (difficulty: Difficulty) => void;
  dealDamageToMonster: (amount: number) => void;
  applyStatusToMonster: (effect: StatusEffect) => void;
  healMonster: (amount: number) => void;
  removeMonsterStatus: (type: StatusEffect["type"]) => void;
  advanceMonsterPattern: () => void;
  clearMonster: () => void;
}

export interface TurnSlice {
  turnPhase: TurnPhase;
  turnCount: number;

  // Actions
  setTurnPhase: (phase: TurnPhase) => void;
  incrementTurn: () => void;
  resetTurn: () => void;
}

export interface LogSlice {
  combatLog: CombatLog[];
  animationQueue: AnimationEvent[];

  // aCTIONS
  addLogEntry: (entry: Omit<CombatLog, "turn">) => void;
  queueAnimation: (event: Omit<AnimationEvent, "id">) => void;
  clearAnimation: (id: string) => void;
  clearLog: () => void;
}

export interface CombatStore extends HeroSlice, MonsterSlice, TurnSlice, LogSlice {
  // Compound actions that span multiple multiple slices
  initCombat: (heroId: string, difficulty: Difficulty) => void;
  clearCombat: () => void;
  tickStatusEffects: () => void;
}

export type SliceCreator<T> = (
  set: (partial: Partial<CombatStore> | ((state: CombatStore) => Partial<CombatStore>)) => void,
  get: () => CombatStore
) => T;