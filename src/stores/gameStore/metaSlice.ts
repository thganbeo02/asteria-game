import type { MetaSlice, GameSliceCreator } from "./types";

// META SLICE

export const createMetaSlice: GameSliceCreator<MetaSlice> = (set) => ({
  totalGold: 0,
  unlockedHeroes: ["lyra", "bran", "shade", "camira"],  // Starters
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    animationSpeed: "normal",
  },

  addTotalGold: (amount) => {
    set((state) => ({
      totalGold: state.totalGold + amount,
    }));
  },

  unlockHero: (heroId) => {
    set((state) => ({
      unlockedHeroes: state.unlockedHeroes.includes(heroId)
        ? state.unlockedHeroes
        : [...state.unlockedHeroes, heroId],
    }));
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },
});
