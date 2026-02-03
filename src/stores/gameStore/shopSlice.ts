import type { GameSliceCreator, ShopSlice } from "./types";
import { generateShopState } from "@/systems/shop/generateShopOffers";
import type { ItemInstance, ShopOffer } from "@/types";

function clampLevel(level: number): number {
  return Math.min(7, Math.max(1, Math.floor(level || 1)));
}

export const createShopSlice: GameSliceCreator<ShopSlice> = (set, get) => ({
  shop: null,

  openShop: () => {
    const state = get();
    if (!state.run) return;
    if (state.phase !== "shop") return;

    const existing = state.shop;
    if (existing && existing.generatedAtEncounter === state.run.encounter && existing.shopLevel === state.run.currentLevel) {
      return;
    }

    const shop = generateShopState({
      difficulty: state.run.difficulty,
      currentLevel: state.run.currentLevel,
      encounter: state.run.encounter,
      shopsSkippedThisLevel: state.run.shopsSkipped,
      healthPotionsUsedThisLevel: state.run.healthPotionsUsedThisLevel,
    });

    const itemOffersCount = shop.offers.filter(o => o.type === "item").length;

    set((s) => ({
      shop,
      run: s.run ? {
        ...s.run,
        totalItemsOffered: s.run.totalItemsOffered + itemOffersCount,
      } : s.run
    }));
  },

  closeShop: () => {
    const { shop, run } = get();
    if (shop && run) {
      const itemsRemaining = shop.offers.filter((o) => o.type === "item" && o.remainingStock > 0).length;
      if (itemsRemaining === 0 && shop.offers.some((o) => o.type === "item")) {
        set((s) => ({
          run: s.run ? { ...s.run, totalShopClears: s.run.totalShopClears + 1 } : s.run,
        }));
      }
    }
    set({ shop: null });
  },

  buyOffer: (offerId) => {
    const state = get();
    if (state.phase !== "shop") return { ok: false as const, reason: "Not in shop" };
    if (!state.run) return { ok: false as const, reason: "No active run" };
    if (!state.shop) return { ok: false as const, reason: "Shop not generated" };

    const offer = state.shop.offers.find((o) => o.id === offerId);
    if (!offer) return { ok: false as const, reason: "Offer not found" };

    if (offer.type === "premium_placeholder") {
      return { ok: false as const, reason: "Premium items not implemented" };
    }

    if (offer.type === "potion") {
      if (offer.remainingThisLevel <= 0) return { ok: false as const, reason: "No potions left this level" };
      const ok = state.spendCrystals(offer.cost);
      if (!ok) return { ok: false as const, reason: "Not enough crystals" };

      // Record potion usage and update offer remaining
      set((s) => {
        if (!s.run || !s.shop) return {};
        const run = {
          ...s.run,
          healthPotionsUsedThisLevel: s.run.healthPotionsUsedThisLevel + 1,
        };
        const updatedOffers = s.shop.offers.map((o) => {
          if (o.id !== offerId || o.type !== "potion") return o;
          return {
            ...o,
            remainingThisLevel: Math.max(0, o.remainingThisLevel - 1),
          };
        });
        return {
          run,
          shop: { ...s.shop, offers: updatedOffers },
        };
      });

      return { ok: true as const, kind: "potion" as const, healPercent: offer.healPercent };
    }

    // Item purchase
    if (offer.remainingStock <= 0) return { ok: false as const, reason: "Out of stock" };
    const ok = state.spendCrystals(offer.cost);
    if (!ok) return { ok: false as const, reason: "Not enough crystals" };

    const item: ItemInstance = {
      definitionId: offer.itemDefinitionId,
      purchaseLevel: clampLevel(state.run.currentLevel),
      stats: offer.stats,
    };

    state.purchaseItem(item);

    set((s) => {
      if (!s.shop) return {};
      const updatedOffers: ShopOffer[] = s.shop.offers.map((o) => {
        if (o.id !== offerId || o.type !== "item") return o;
        return { ...o, remainingStock: Math.max(0, o.remainingStock - 1) };
      });
      return { shop: { ...s.shop, offers: updatedOffers } };
    });

    return { ok: true as const, kind: "item" as const, item };
  },
});
