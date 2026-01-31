"use client";

import { CombatHeader } from "@/components/combat/CombatHeader";
import { HeroPanel } from "@/components/combat/HeroPanel";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { EPIC_CHANCE_BY_SKIPS } from "@/lib/constants";
import { useCombatStore, useGameStore } from "@/stores";
import type { ItemStats, ShopOffer } from "@/types";
import { useEffect, useMemo, useState } from "react";

function formatStats(stats: ItemStats): string {
  const parts: string[] = [];
  const push = (label: string, v?: number) => {
    if (v === undefined) return;
    if (v === 0) return;
    parts.push(`${v > 0 ? "+" : ""}${v} ${label}`);
  };

  push("ATK", stats.atk);
  push("DEF", stats.def);
  push("Max HP", stats.maxHp);
  push("Max Mana", stats.maxMana);
  push("Mana Regen", stats.manaRegen);
  push("% Crit", stats.critChance);
  push("Crit Mult", stats.critMultiplier);
  push("% Dodge", stats.dodge);
  push("% Pen", stats.penetration);

  return parts.join(", ");
}

export function ShopScreen() {
  const run = useGameStore((s) => s.run);
  const phase = useGameStore((s) => s.phase);
  const shop = useGameStore((s) => s.shop);
  const buyOffer = useGameStore((s) => s.buyOffer);
  const [lastBoughtId, setLastBoughtId] = useState<string | null>(null);

  // Ensure shop is generated when we are in the shop.
  useEffect(() => {
    if (phase !== "shop") return;
    useGameStore.getState().openShop();
  }, [phase]);

  const [randomOffers, potionOffer] = useMemo(() => {
    const offers = shop?.offers ?? [];
    const random = offers.filter((o) => o.type === "item");
    const potion = offers.find((o) => o.type === "potion") ?? null;
    return [random, potion] as const;
  }, [shop?.offers]);

  if (phase !== "shop") return null;

  if (!run) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-bg-panel p-6">
          <div className="text-2xl font-bold text-text-primary">Shop</div>
          <div className="text-text-secondary mt-2">No active run.</div>
        </div>
      </div>
    );
  }

  const epicChance = EPIC_CHANCE_BY_SKIPS[Math.min(3, run.shopsSkipped)] ?? 20;
  const rareChance = 100 - epicChance;

  const continueToCombat = () => {
    const game = useGameStore.getState();
    const combat = useCombatStore.getState();

    if (game.phase !== "shop" || !game.run) return;

    // Double-click guard: lock phase first.
    game.setPhase("combat");

    game.closeShop();

    combat.clearLog();
    combat.resetTurn();
    combat.spawnMonster(game.run.difficulty);
  };

  const shopLevel = run.currentLevel;

  const onBuy = async (offer: ShopOffer) => {
    const result = buyOffer(offer.id);
    if (!result.ok) return;

    setLastBoughtId(offer.id);
    window.setTimeout(() => setLastBoughtId((cur) => (cur === offer.id ? null : cur)), 520);

    if (result.kind === "item") {
      // Apply stats immediately to hero
      useCombatStore.getState().applyItemStats(result.item.stats);
      return;
    }

    // Potion
    const currentHero = useCombatStore.getState().hero;
    if (!currentHero) return;
    const maxHp = currentHero.stats.maxHp + currentHero.stats.bonusMaxHp;
    const healAmount = Math.floor((maxHp * result.healPercent) / 100);
    useCombatStore.getState().healHero(healAmount);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <CombatHeader />

      <main className="flex-1 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 h-full min-h-0">
          {/* Left Column - Hero Panel (same slot as combat) */}
          <div className="col-span-12 lg:col-span-3">
            <HeroPanel />
          </div>

          {/* Center Column - Shop Offers */}
          <div className="col-span-12 lg:col-span-6 rounded-2xl border border-border bg-bg-panel p-4 min-h-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-text-primary">Shop</div>
                <div className="text-sm mt-1 text-[#111827] font-semibold">
                  You currently have <span className="tabular-nums">{run.crystals}</span> Crystals
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-text-muted">Skips This Level</div>
                <div className="text-text-primary font-bold text-lg tabular-nums">{run.shopsSkipped}</div>
                <div className="text-xs text-text-muted mt-1">Rare {rareChance}% / Epic {epicChance}%</div>
              </div>
            </div>

            <div className="mt-4 min-h-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">Random Stat Items</div>
                  <div className="text-xs text-text-muted mt-1">All categories, one duplicated</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {randomOffers.map((o) => {
                if (o.type !== "item") return null;
                const canBuy = o.remainingStock > 0 && run.crystals >= o.cost;
                return (
                  <div
                    key={o.id}
                    className={cn(
                      "rounded-xl border border-border bg-bg-panel/40 p-4",
                      "transition-transform duration-150",
                      lastBoughtId === o.id && "animate-[shop-buy_520ms_ease-out]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-text-primary">{o.name}</div>
                        <div className="text-xs text-text-muted mt-1" title={o.flavorText}>{o.rarity}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-text-muted">Stock {o.remainingStock}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-text-secondary leading-snug min-h-[2.5rem]">{formatStats(o.stats)}</div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm font-semibold text-text-primary tabular-nums">{o.cost}</div>
                      <Button
                        variant={canBuy ? "primary" : "secondary"}
                        size="md"
                        disabled={!canBuy}
                        onClick={() => onBuy(o)}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* Right Column - Sustain + Continue */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0">
            <div className="rounded-2xl border border-border bg-bg-panel p-4">
              <div className="text-sm font-semibold text-text-primary">Sustain</div>
              <div className="text-xs text-text-muted mt-1">Health potions reset on level-up</div>

              {potionOffer && potionOffer.type === "potion" && (
                <div className="mt-4 rounded-xl border border-border bg-bg-dark/30 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-text-primary">Health Potion</div>
                      <div className="text-xs text-text-muted mt-1">Restores {potionOffer.healPercent}% Max HP</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-text-muted">Remaining</div>
                      <div className="text-text-primary font-bold text-lg">{potionOffer.remainingThisLevel}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-text-muted">Cost</div>
                    <div className="text-sm font-semibold text-text-primary">{potionOffer.cost}</div>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant={potionOffer.remainingThisLevel > 0 && run.crystals >= potionOffer.cost ? "primary" : "secondary"}
                      size="md"
                      disabled={potionOffer.remainingThisLevel <= 0 || run.crystals < potionOffer.cost}
                      onClick={() => onBuy(potionOffer)}
                    >
                      Buy Potion
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-bg-panel p-4">
              <div className="text-sm font-semibold text-text-primary">Ready</div>
              <div className="text-xs text-text-muted mt-1">Return to combat when you’re done shopping.</div>
              <div className="mt-4">
                <Button variant="primary" size="lg" onClick={() => continueToCombat()}>
                  Continue to Fight
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
