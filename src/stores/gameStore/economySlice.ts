import type { EconomySlice, GameSliceCreator } from "./types";
import { getSkipBonusCrystalsForLevel } from "@/systems/shop/generateShopOffers";

// ECONOMY SLICE

export const createEconomySlice: GameSliceCreator<EconomySlice> = (set, get) => ({
  addCrystals: (amount) => {
    set((state) => {
      if (!state.run) return {};

      return {
        run: {
          ...state.run,
          crystals: state.run.crystals + amount,
          crystalsEarned: state.run.crystalsEarned + amount,
          crystalsEarnedPerLevel: {
            ...state.run.crystalsEarnedPerLevel,
            [state.run.currentLevel]: (state.run.crystalsEarnedPerLevel[state.run.currentLevel] || 0) + amount,
          },
        },
      };
    });
  },

  spendCrystals: (amount) => {
    const { run } = get();
    if (!run || run.crystals < amount) return false;

    set((state) => {
      if (!state.run) return {};

      return {
        run: {
          ...state.run,
          crystals: state.run.crystals - amount,
          crystalsSpent: state.run.crystalsSpent + amount,
          crystalsSpentPerLevel: {
            ...state.run.crystalsSpentPerLevel,
            [state.run.currentLevel]: (state.run.crystalsSpentPerLevel[state.run.currentLevel] || 0) + amount,
          },
        },
      };
    });

    return true;
  },

  addGold: (amount) => {
    set((state) => {
      if (!state.run) return {};

      return {
        run: {
          ...state.run,
          gold: state.run.gold + amount,
        },
      };
    });
  },

  purchaseItem: (item) => {
    set((state) => {
      if (!state.run) return {};

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
    if (!run || run.healthPotionsUsedThisLevel >= 4) return false;

    set((state) => {
      if (!state.run) return {};

      return {
        run: {
          ...state.run,
          healthPotionsUsedThisLevel: state.run.healthPotionsUsedThisLevel + 1,
        },
      };
    });

    return true;
  },

  skipShop: () => {
    set((state) => {
      if (!state.run) return {};

      const bonus = getSkipBonusCrystalsForLevel(state.run.difficulty, state.run.currentLevel);

      return {
        run: {
          ...state.run,
          crystals: state.run.crystals + bonus,
          crystalsEarned: state.run.crystalsEarned + bonus,
          crystalsEarnedPerLevel: {
            ...state.run.crystalsEarnedPerLevel,
            [state.run.currentLevel]: (state.run.crystalsEarnedPerLevel[state.run.currentLevel] || 0) + bonus,
          },
          shopsSkipped: state.run.shopsSkipped + 1,
        },
      };
    });
  },
});
