import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameStore } from "./types";
import { createRunSlice } from "./runSlice";
import { createEconomySlice } from "./economySlice";
import { createMetaSlice } from "./metaSlice";
import { createShopSlice } from "./shopSlice";

// =============================================================================
// COMBINED GAME STORE
// =============================================================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Combine all slices
      ...createRunSlice(set, get),
      ...createEconomySlice(set, get),
      ...createMetaSlice(set, get),
      ...createShopSlice(set, get),
    }),
    {
      name: "asteria-game-storage",
      // Only persist meta progression, not active runs
      partialize: (state) => ({
        totalGold: state.totalGold,
        unlockedHeroes: state.unlockedHeroes,
        settings: state.settings,
      }),
    }
  )
);

// Re-export types
export type { GameStore, RunState } from "./types";
