import type { ItemCategory, Rarity } from "./common";
import type { ItemStats } from "./item";

export type ShopOfferType = "item" | "potion" | "premium_placeholder";

export interface ShopItemOffer {
  id: string;
  type: "item";
  itemDefinitionId: string;
  name: string;
  description: string;
  flavorText: string;
  rarity: Rarity;
  category: ItemCategory;
  cost: number;
  stats: ItemStats;
  remainingStock: number;
}

export interface ShopPotionOffer {
  id: string;
  type: "potion";
  name: "Health Potion";
  healPercent: number;
  cost: number;
  remainingThisLevel: number;
}

export interface ShopPremiumPlaceholderOffer {
  id: string;
  type: "premium_placeholder";
  name: string;
  description: string;
}

export type ShopOffer = ShopItemOffer | ShopPotionOffer | ShopPremiumPlaceholderOffer;

export interface ShopState {
  shopLevel: number;
  offers: ShopOffer[];
  generatedAtEncounter: number;
}
