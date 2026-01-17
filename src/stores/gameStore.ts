import { ALL_MONSTERS, MONSTERS } from "@/data/monsters";
import {
  Difficulty,
  GamePhase,
  GameState,
  ItemInstance,
  MonsterBaseStats,
  MonsterType,
  RunState,
} from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GameStore extends GameState {
  // Phase transition
  setPhase: (phase: GamePhase) => void;

  // Run management
  startRun: (heroId: string, difficulty: Difficulty) => void;
  endRun: (victory: boolean) => void;

  // Encounter tracking
  incrementEncounter: () => void;

  // Level management
  levelUp: () => void;

  // Economy
  addCrystals: (amount: number) => void;
  spendCrystals: (amount: number) => boolean;
  addGold: (amount: number) => void;

  // Inventory
  purchaseItem: (item: ItemInstance) => void;
  useHealthPotion: () => boolean;
  skipShop: () => void;

  // Monster tracking
  recordKill: (monsterType: MonsterType) => void;

  // Score
  addScore: (points: number) => void;

  // Meta progression
  unlockHero: (heroId: string) => void;

  // Utility
  getMonsterSnapshot: (monsterType: MonsterType) => MonsterBaseStats;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Create initial monster snapshots from base definitions.
 * Called when a new run starts.
 */
function createInitialMonsterSnapshots(): Record<
  MonsterType,
  MonsterBaseStats
> {
  const snapshots = {} as Record<MonsterType, MonsterBaseStats>;

  for (const monster of ALL_MONSTERS) {
    snapshots[monster.id] = { ...monster.baseStats };
  }

  return snapshots;
}

/**
 * Create fresh RunState for a new run
 */
function createInitialRunState(
  heroId: string,
  difficulty: Difficulty
): RunState {
  return {
    heroId,
    difficulty,

    encounterCount: 1,
    internalEncounterCount: 1,
    currentLevel: 1,

    monsterSnapshots: createInitialMonsterSnapshots(),

    crystals: 0,
    crystalsEarned: 0,
    crystalsSpent: 0,
    gold: 0,

    // Tracking
    score: 0,
    monstersKilled: {
      slime: 0,
      wolf: 0,
      zombie: 0,
      skeleton: 0,
      mimic: 0,
      vampire: 0,
      orc: 0,
      dragon: 0,
    },

    // Inventory
    purchasedItems: [],
    healthPotionsUsedThisLevel: 0,
    shopsSkipped: 0,

    // Shade contract (initialized if hero is Shade)
    contractState:
      heroId === "shade"
        ? {
            currentTurnLimit: 5,
            currentTurn: 0,
            crystalBonus: 0.2,
            expBonus: 0.1,
            streak: 0,
          }
        : undefined,
  };
}

const INITIAL_GAME_STATE: GameState = {
  phase: "hero_select",
  run: null,

  totalGold: 0,
  unlockedHeroes: ["lyra", "bran", "shade", "camira"],

  settings: {
    soundEnabled: true,
    musicEnabled: true,
    animationSpeed: "normal",
  },
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_GAME_STATE,

      // PHASE TRANSITIONS
      setPhase: (phase) => set({ phase }),

      // RUN MANAGEMENT
      startRun: (heroId, difficulty) => {
        set({
          phase: "combat",
          run: createInitialRunState(heroId, difficulty),
        });
      },

      endRun: (victory) => {
        const { run, totalGold } = get();
        if (!run) return;

        // Gold reward
        let goldReward = 0;
        const encounters = run.encounterCount;

        if (encounters >= 5 && encounters <= 10) goldReward = 10;
        else if (encounters >= 11 && encounters <= 20) goldReward = 50;
        else if (encounters >= 21 && encounters <= 40) goldReward = 150;
        else if (encounters > 40) goldReward = 300;

        // Apply difficulty multiplier
        const difficultyMultiplier =
          run.difficulty === "easy"
            ? 1.0
            : run.difficulty === "medium"
            ? 1.5
            : 2.0;

        goldReward = Math.floor(goldReward * difficultyMultiplier);

        set({
          phase: victory ? "run_summary" : "death",
          totalGold: totalGold + goldReward + run.gold,
        });
      },

      // ENCOUNTER TRACKING

      incrementEncounter: () => {
        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              encounterCount: state.run.encounterCount + 1,
              internalEncounterCount: state.run.internalEncounterCount + 1,
            },
          };
        });
      },

      // LEVEL MANAGEMENT
      levelUp: () => {
        set((state) => {
          if (!state.run) return state;

          const { run } = state;
          const { difficulty, internalEncounterCount, monsterSnapshots } = run;
          const currentLevel = run.currentLevel;
          const newLevel = currentLevel + 1;

          // Calculate new snapshots for all monsters
          const newSnapshots = { ...monsterSnapshots };

          for (const monster of ALL_MONSTERS) {
            const currentBase = monsterSnapshots[monster.id];
            const growth = monster.growth;
            const idx = Math.min(currentLevel - 1, 6);

            newSnapshots[monster.id] = {
              hp:
                currentBase.hp +
                growth.hp[difficulty][idx] * internalEncounterCount,
              atk:
                currentBase.atk +
                growth.atk[difficulty][idx] * internalEncounterCount,
              def:
                currentBase.def +
                growth.def[difficulty][idx] * internalEncounterCount,
              crystal:
                currentBase.crystal +
                growth.crystal[difficulty][idx] * internalEncounterCount,
              exp:
                currentBase.exp +
                growth.exp[difficulty][idx] * internalEncounterCount,
            };
          }

          return {
            run: {
              ...run,
              currentLevel: newLevel,
              internalEncounterCount: 1,
              monsterSnapshots: newSnapshots,
              healthPotionsUsedThisLevel: 0,
            },
          };
        });
      },

      addCrystals: (amount) => {
        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              crystals: state.run.crystals + amount,
              crystalsEarned: state.run.crystalsEarned + amount,
            },
          };
        });
      },

      spendCrystals: (amount) => {
        const { run } = get();
        if (!run || run.crystals < amount) return false;

        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              crystals: state.run.crystals - amount,
              crystalsSpent: state.run.crystalsSpent + amount,
            },
          };
        });

        return true;
      },

      addGold: (amount) => {
        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              gold: state.run.gold + amount,
            },
          };
        });
      },

      // INVENTORY

      purchaseItem: (item) => {
        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              purchasedItems: [...state.run.purchasedItems, item],
            },
          };
        });
      },

      useHealthPotion: () => {
        const { run } = get();
        if (!run || run.healthPotionsUsedThisLevel >= 3) return false;

        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              healthPotionsUsedThisLevel:
                state.run.healthPotionsUsedThisLevel + 1,
            },
          };
        });

        return true;
      },

      skipShop: () => {
        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              shopsSkipped: state.run.shopsSkipped + 1,
            },
          };
        });
      },

      // MONSTER TRACKING

      recordKill: (monsterType) => {
        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              monstersKilled: {
                ...state.run.monstersKilled,
                [monsterType]: state.run.monstersKilled[monsterType] + 1,
              },
            },
          };
        });
      },

      // SCORE

      addScore: (points) => {
        set((state) => {
          if (!state.run) return state;

          return {
            run: {
              ...state.run,
              score: state.run.score + points,
            },
          };
        });
      },

      // META PROGRESSION

      unlockHero: (heroId) => {
        set((state) => ({
          unlockedHeroes: state.unlockedHeroes.includes(heroId)
            ? state.unlockedHeroes
            : [...state.unlockedHeroes, heroId],
        }));
      },

      // UTILITY

      getMonsterSnapshot: (monsterType) => {
        const { run } = get();
        if (!run) {
          // Fallback to base stats if no run active
          return MONSTERS[monsterType].baseStats;
        }
        return run.monsterSnapshots[monsterType];
      },
    }),
    {
      name: "asteria-game-storage",
      // Only persist meta-progression, not active runs
      partialize: (state) => ({
        totalGold: state.totalGold,
        unlockedHeroes: state.unlockedHeroes,
        settings: state.settings,
      }),
    }
  )
);
