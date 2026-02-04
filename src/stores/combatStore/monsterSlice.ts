import type { MonsterSlice, SliceCreator } from "./types";
import { createMonsterState, selectRandomMonster, MONSTERS } from "@/data/monsters";
import { useGameStore } from "@/stores/gameStore";
import { applyHealing } from "@/systems/combat/damageCalculator";
import { getUpdatedEffectsAfterApply, getUpdatedEffectsAfterRemove } from "@/systems/combat/statusEffects";

// MONSTER SLICE

export const createMonsterSlice: SliceCreator<MonsterSlice> = (set, get) => ({
  monster: null,

  spawnMonster: (difficulty) => {
    const gameStore = useGameStore.getState();
    const { run } = gameStore;

    if (!run) {
      console.error("Cannot spawn monster: no active run");
      return;
    }

    const { currentLevel, internalEncounter } = run;

    // Select random monster based on level
    const monsterDef = selectRandomMonster(currentLevel);
    get().resetSkipTurns();

    // Get snapshotted base stats
    const snapshotBase = gameStore.getMonsterSnapshot(monsterDef.id);

    set({
      monster: createMonsterState(monsterDef, snapshotBase, currentLevel, internalEncounter, difficulty),
    });


    get().addLogEntry({
      actor: "monster",
      action: "spawn",
      message: `A wild ${monsterDef.name} appears!`,
    });

    if (run.heroId === "shade") {
      gameStore.assignContract();
      const contractState = useGameStore.getState().run?.contractState;
      if (contractState) {
        get().addLogEntry({
          actor: "hero",
          action: "contract",
          message: `Contract issued: ${contractState.tier.toUpperCase()} (${contractState.currentTurnLimit} turns).`,
        });
      }
    }
  },

  dealDamageToMonster: (amount) => {
    set((state) => {
      if (!state.monster) return {};

      const newHp = Math.max(0, state.monster.hp - amount);

      return {
        monster: { ...state.monster, hp: newHp },
      };
    });
  },

  applyStatusToMonster: (effect) => {
    set((state) => {
      if (!state.monster) return {};

      const newEffects = getUpdatedEffectsAfterApply(
        state.monster.statusEffects,
        effect,
      );

      return {
        monster: { ...state.monster, statusEffects: newEffects },
      };
    });
  },

  removeMonsterStatus: (type) => {
    set((state) => {
      if (!state.monster) return {};

      const newEffects = getUpdatedEffectsAfterRemove(
        state.monster.statusEffects,
        type,
      );

      return {
        monster: {
          ...state.monster,
          statusEffects: newEffects,
        },
      };
    });
  },

  // When Vampire heals from Life Drain:
  healMonster: (amount) => {
    set((state) => {
      if (!state.monster) return state;

      // Apply Grievous Wounds if monster is burned
      const effectiveHealing = applyHealing(
        amount,
        state.monster.statusEffects,
      );
      const newHp = Math.min(
        state.monster.maxHp,
        state.monster.hp + effectiveHealing,
      );

      return {
        monster: {
          ...state.monster,
          hp: newHp,
        },
      };
    });
  },

  advanceMonsterPattern: () => {
    set((state) => {
      if (!state.monster) return {};

      const definition = MONSTERS[state.monster.definitionId];
      if (!definition?.behavior.pattern) return {};

      const patternLength = definition.behavior.pattern.length;
      const newIndex = (state.monster.patternIndex + 1) % patternLength;

      return {
        monster: {
          ...state.monster,
          patternIndex: newIndex,
          turnCount: state.monster.turnCount + 1,
        },
      };
    });
  },

  clearMonster: () => {
    set({ monster: null });
  },
});
