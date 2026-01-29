import { RANDOM_STAT_ITEMS } from "@/data/items";
import { DIFFICULTY_CONFIG, EPIC_CHANCE_BY_SKIPS, HEALTH_POTION } from "@/lib/constants";
import type { Difficulty, ItemCategory, ItemStats, Rarity, ShopOffer, ShopState } from "@/types";

function clampShopLevel(level: number): number {
  return Math.min(7, Math.max(1, Math.floor(level || 1)));
}

function rollChance(pct: number): boolean {
  return Math.random() * 100 < pct;
}

function rarityForSecondSlot(shopsSkipped: number): "rare" | "epic" {
  const key = Math.min(3, Math.max(0, Math.floor(shopsSkipped || 0)));
  const epicChance = EPIC_CHANCE_BY_SKIPS[key] ?? 20;
  return rollChance(epicChance) ? "epic" : "rare";
}

function offerId(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}`;
}

function pickDuplicateCategory(): ItemCategory {
  const cats: ItemCategory[] = ["offensive", "defensive", "ability"];
  return cats[Math.floor(Math.random() * cats.length)]!;
}

function levelIndex(level: number): number {
  return clampShopLevel(level) - 1;
}

function buildItemOffer(opts: {
  itemId: string;
  name: string;
  description: string;
  flavorText: string;
  rarity: Rarity;
  category: ItemCategory;
  cost: number;
  stats: ItemStats;
  remainingStock: number;
}): ShopOffer {
  return {
    id: offerId(`item_${opts.itemId}`),
    type: "item",
    itemDefinitionId: opts.itemId,
    name: opts.name,
    description: opts.description,
    flavorText: opts.flavorText,
    rarity: opts.rarity,
    category: opts.category,
    cost: opts.cost,
    stats: opts.stats,
    remainingStock: opts.remainingStock,
  };
}

export function generateShopState(params: {
  difficulty: Difficulty;
  currentLevel: number;
  encounter: number;
  shopsSkippedThisLevel: number;
  healthPotionsUsedThisLevel: number;
}): ShopState {
  const shopLevel = clampShopLevel(params.currentLevel);
  const idx = levelIndex(shopLevel);

  const duplicate = pickDuplicateCategory();

  const categories: ItemCategory[] = ["offensive", "defensive", "ability", duplicate];

  const offers: ShopOffer[] = [];

  // 4 Random Stat items (GDD)
  const firstSeen: Record<ItemCategory, boolean> = {
    offensive: false,
    defensive: false,
    ability: false,
  };

  for (const cat of categories) {
    const isFirst = !firstSeen[cat];
    firstSeen[cat] = true;

    const tier: "common" | "rare" | "epic" = isFirst
      ? "common"
      : rarityForSecondSlot(params.shopsSkippedThisLevel);

    const def = RANDOM_STAT_ITEMS[cat][tier];
    offers.push(
      buildItemOffer({
        itemId: def.id,
        name: def.name,
        description: def.description,
        flavorText: def.flavorText,
        rarity: def.rarity,
        category: def.category,
        cost: def.costPerLevel[idx] ?? def.costPerLevel[def.costPerLevel.length - 1] ?? 0,
        stats: def.statsPerLevel[idx] ?? def.statsPerLevel[def.statsPerLevel.length - 1] ?? {},
        remainingStock: def.maxStock,
      }),
    );
  }

  // 1 Health Potion
  const potionRemaining = Math.max(0, HEALTH_POTION.maxPerLevel - params.healthPotionsUsedThisLevel);
  offers.push({
    id: offerId("potion"),
    type: "potion",
    name: "Health Potion",
    healPercent: HEALTH_POTION.healPercent[idx] ?? HEALTH_POTION.healPercent[HEALTH_POTION.healPercent.length - 1] ?? 25,
    cost: HEALTH_POTION.cost[idx] ?? HEALTH_POTION.cost[HEALTH_POTION.cost.length - 1] ?? 0,
    remainingThisLevel: potionRemaining,
  });

  // 3 Premium placeholders (until premium tables are implemented)
  offers.push({
    id: offerId("premium_placeholder"),
    type: "premium_placeholder",
    name: "Premium Slot",
    description: "Class premium items coming soon.",
  });
  offers.push({
    id: offerId("premium_placeholder"),
    type: "premium_placeholder",
    name: "Premium Slot",
    description: "Class premium items coming soon.",
  });
  offers.push({
    id: offerId("premium_placeholder"),
    type: "premium_placeholder",
    name: "Premium Slot",
    description: "Class premium items coming soon.",
  });

  return {
    shopLevel,
    offers,
    generatedAtEncounter: params.encounter,
  };
}

export function getSkipBonusCrystals(difficulty: Difficulty): number {
  return DIFFICULTY_CONFIG[difficulty].skipBonus;
}

export function getSkipBonusCrystalsForLevel(difficulty: Difficulty, level: number): number {
  return getSkipBonusCrystals(difficulty) * clampShopLevel(level);
}
