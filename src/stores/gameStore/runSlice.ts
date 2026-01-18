import type { RunSlice, RunState, GameSliceCreator } from "./types";
import type { Difficulty, MonsterType, MonsterBaseStats } from "@/types";
import { ALL_MONSTERS, MONSTERS } from "@/data/monsters";

// =============================================================================
// HELPERS
// =============================================================================

function createInitialMonsterSnapshots(): Record<MonsterType, MonsterBaseStats> {
  const snapshots = {} as Record<MonsterType, MonsterBaseStats>;

  for (const monster of ALL_MONSTERS) {
    snapshots[monster.id] = { ...monster.baseStats };
  }

  return snapshots;
}

function createInitialRunState(heroId: string, difficulty: Difficulty): RunState {
  return {
    heroId,
    difficulty,

    // Both counters start at 1 (first encounter)
    encounter: 1,
    internalEncounter: 1,
    currentLevel: 1,

    monsterSnapshots: createInitialMonsterSnapshots(),

    crystals: 0,
    crystalsEarned: 0,
    crystalsSpent: 0,
    gold: 0,

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

    purchasedItems: [],
    healthPotionsUsedThisLevel: 0,
    shopsSkipped: 0,

    contractState: heroId === "shade" ? {
      currentTurnLimit: 5,
      currentTurn: 0,
      crystalBonus: 0.2,
      expBonus: 0.1,
      streak: 0,
    } : undefined,
  };
}

// =============================================================================
// RUN SLICE
// =============================================================================

export const createRunSlice: GameSliceCreator<RunSlice> = (set, get) => ({
  run: null,
  phase: "hero_select",

  startRun: (heroId, difficulty) => {
    set({
      phase: "combat",
      run: createInitialRunState(heroId, difficulty),
    });
  },

  endRun: (victory) => {
    const { run } = get();
    if (!run) return;

    // Calculate gold reward based on encounters
    let goldReward = 0;
    const encounters = run.encounter;

    if (encounters >= 5 && encounters <= 10) goldReward = 10;
    else if (encounters >= 11 && encounters <= 20) goldReward = 50;
    else if (encounters >= 21 && encounters <= 40) goldReward = 150;
    else if (encounters > 40) goldReward = 300;

    // Difficulty multiplier
    const multiplier =
      run.difficulty === "easy" ? 1.0 :
      run.difficulty === "medium" ? 1.5 : 2.0;

    goldReward = Math.floor(goldReward * multiplier);

    // Add to total gold
    get().addTotalGold(goldReward + run.gold);

    set({
      phase: victory ? "run_summary" : "death",
    });
  },

  setPhase: (phase) => {
    set({ phase });
  },

  incrementEncounter: () => {
    set((state) => {
      if (!state.run) return {};

      return {
        run: {
          ...state.run,
          encounter: state.run.encounter + 1,
          internalEncounter: state.run.internalEncounter + 1,
        },
      };
    });
  },

  levelUp: () => {
    set((state) => {
      if (!state.run) return {};

      const { run } = state;
      const { difficulty, internalEncounter, monsterSnapshots, currentLevel } = run;
      const newLevel = currentLevel + 1;

      // Calculate new snapshots for all monsters
      // New base = current base + (growth × encounters since last level)
      const newSnapshots = { ...monsterSnapshots };

      for (const monster of ALL_MONSTERS) {
        const currentBase = monsterSnapshots[monster.id];
        const growth = monster.growth;
        const idx = Math.min(currentLevel - 1, 6);

        newSnapshots[monster.id] = {
          hp: currentBase.hp + growth.hp[difficulty][idx] * internalEncounter,
          atk: currentBase.atk + growth.atk[difficulty][idx] * internalEncounter,
          def: currentBase.def + growth.def[difficulty][idx] * internalEncounter,
          crystal: currentBase.crystal + growth.crystal[difficulty][idx] * internalEncounter,
          exp: currentBase.exp + growth.exp[difficulty][idx] * internalEncounter,
        };
      }

      return {
        run: {
          ...run,
          currentLevel: newLevel,
          internalEncounter: 1,
          monsterSnapshots: newSnapshots,
          healthPotionsUsedThisLevel: 0,
        },
      };
    });
  },

  recordKill: (monsterType) => {
    set((state) => {
      if (!state.run) return {};

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

  addScore: (points) => {
    set((state) => {
      if (!state.run) return {};

      return {
        run: {
          ...state.run,
          score: state.run.score + points,
        },
      };
    });
  },

  getMonsterSnapshot: (monsterType) => {
    const { run } = get();
    if (!run) {
      return MONSTERS[monsterType].baseStats;
    }
    return run.monsterSnapshots[monsterType];
  },
});