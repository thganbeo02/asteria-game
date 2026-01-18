import type { MonsterSlice, SliceCreator } from "./types";
import type { StatusEffect, Difficulty } from "@/types";
import { selectRandomMonster, MONSTERS } from "@/data/monsters";
import { useGameStore } from "@/stores/gameStore";

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

    // Get snapshotted base stats
    const snapshotBase = gameStore.getMonsterSnapshot(monsterDef.id);

    // Calculate final stats: snapshot + (growth × encounters)
    const idx = Math.min(currentLevel - 1, 6);
    const growth = monsterDef.growth;

    // encounters start at 1, so first monster gets growth * 1
    const encounters = internalEncounter;

    const finalStats = {
      hp: Math.round(snapshotBase.hp + growth.hp[difficulty][idx] * encounters),
      atk: Math.round(snapshotBase.atk + growth.atk[difficulty][idx] * encounters),
      def: Math.round(snapshotBase.def + growth.def[difficulty][idx] * encounters),
      crystal: Math.round(snapshotBase.crystal + growth.crystal[difficulty][idx] * encounters),
      exp: Math.round(snapshotBase.exp + growth.exp[difficulty][idx] * encounters),
    };

    set({
      monster: {
        definitionId: monsterDef.id,
        maxHp: finalStats.hp,
        hp: finalStats.hp,
        atk: finalStats.atk,
        def: finalStats.def,
        crystalReward: finalStats.crystal,
        expReward: finalStats.exp,
        statusEffects: [],
        turnCount: 0,
        patternIndex: 0,
      },
    });

    get().addLogEntry({
      actor: "monster",
      action: "spawn",
      message: `A wild ${monsterDef.name} appears!`,
    });
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

      const existingIndex = state.monster.statusEffects.findIndex(
        e => e.type === effect.type
      );

      let newEffects: StatusEffect[];

      if (existingIndex >= 0) {
        newEffects = [...state.monster.statusEffects];
        const existing = newEffects[existingIndex];
        newEffects[existingIndex] = {
          ...existing,
          stacks: existing.stacks + effect.stacks,
          duration: Math.max(existing.duration, effect.duration),
        };
      } else {
        newEffects = [...state.monster.statusEffects, effect];
      }

      return {
        monster: { ...state.monster, statusEffects: newEffects },
      };
    });
  },

  removeMonsterStatus: (type) => {
    set((state) => {
      if (!state.monster) return {};

      return {
        monster: {
          ...state.monster,
          statusEffects: state.monster.statusEffects.filter(e => e.type !== type),
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