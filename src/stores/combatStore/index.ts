import { create } from "zustand";
import type { CombatStore } from "./types";
import { createHeroSlice } from "./heroSlice";
import { createMonsterSlice } from "./monsterSlice";
import { createTurnSlice } from "./turnSlice";
import { createLogSlice } from "./logSlice";

// =============================================================================
// COMBINED COMBAT STORE
// =============================================================================

export const useCombatStore = create<CombatStore>((set, get) => ({
  // Combine all slices
  ...createHeroSlice(set, get),
  ...createMonsterSlice(set, get),
  ...createTurnSlice(set, get),
  ...createLogSlice(set, get),

  // -------------------------------------------------------------------------
  // COMPOUND ACTIONS (span multiple slices)
  // -------------------------------------------------------------------------

  initCombat: (heroId, difficulty) => {
    // Reset everything
    get().clearLog();
    get().resetTurn();
    get().clearMonster();

    // Initialize hero
    get().initHero(heroId);

    // Spawn first monster
    get().spawnMonster(difficulty);
  },

  clearCombat: () => {
    set({
      hero: null,
      monster: null,
      turnPhase: "player_turn",
      turnCount: 1,
      combatLog: [],
      animationQueue: [],
    });
  },

  tickStatusEffects: () => {
    const { hero, monster } = get();

    // Process hero effects
    if (hero) {
      const newEffects = hero.statusEffects
        .map(effect => ({
          ...effect,
          duration: effect.duration === -1 ? -1 : effect.duration - 1,
        }))
        .filter(effect => effect.duration > 0 || effect.duration === -1);

      set((state) => ({
        hero: state.hero ? { ...state.hero, statusEffects: newEffects } : null,
      }));
    }

    // Process monster effects
    if (monster) {
      const newEffects = monster.statusEffects
        .map(effect => ({
          ...effect,
          duration: effect.duration === -1 ? -1 : effect.duration - 1,
        }))
        .filter(effect => effect.duration > 0 || effect.duration === -1);

      set((state) => ({
        monster: state.monster ? { ...state.monster, statusEffects: newEffects } : null,
      }));
    }
  },
}));

// Re-export types
export type { CombatStore } from "./types";