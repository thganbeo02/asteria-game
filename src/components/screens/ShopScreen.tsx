"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { EPIC_CHANCE_BY_SKIPS, EXP_THRESHOLDS, MAX_LEVEL } from "@/lib/constants";
import { useCombatStore, useGameStore } from "@/stores";
import type { ItemStats, ShopOffer } from "@/types";
import { useEffect, useMemo } from "react";

function expProgress(exp: number, level: number): { pct: number; tooltip: string } {
  if (level >= MAX_LEVEL) return { pct: 1, tooltip: "Max level" };
  const prevThreshold = (EXP_THRESHOLDS as Record<number, number>)[level] ?? 0;
  const nextThreshold = (EXP_THRESHOLDS as Record<number, number>)[level + 1] ?? prevThreshold;
  const current = Math.max(0, exp - prevThreshold);
  const needed = Math.max(1, nextThreshold - prevThreshold);
  const pct = Math.max(0, Math.min(1, current / needed));
  return { pct, tooltip: `${current} / ${needed}` };
}

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
  push("Crit%", stats.critChance);
  push("Crit Mult", stats.critMultiplier);
  push("Dodge%", stats.dodge);
  push("Pen%", stats.penetration);

  return parts.join(", ");
}

export function ShopScreen() {
  const run = useGameStore((s) => s.run);
  const phase = useGameStore((s) => s.phase);
  const shop = useGameStore((s) => s.shop);
  const buyOffer = useGameStore((s) => s.buyOffer);

  // Ensure shop is generated when we are in the shop.
  useEffect(() => {
    if (phase !== "shop") return;
    useGameStore.getState().openShop();
  }, [phase]);

  const [randomOffers, potionOffer, premiumOffers] = useMemo(() => {
    const offers = shop?.offers ?? [];
    const random = offers.filter((o) => o.type === "item");
    const potion = offers.find((o) => o.type === "potion") ?? null;
    const premium = offers.filter((o) => o.type === "premium_placeholder");
    return [random, potion, premium] as const;
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

  const hero = useCombatStore.getState().hero;
  const level = hero?.level ?? run.currentLevel;
  const xp = expProgress(run.exp ?? 0, level);
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={cn("w-full max-w-5xl", "rounded-2xl border border-border bg-bg-panel p-6")}> 
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-text-primary">Shop</div>
            <div className="text-text-secondary mt-2">
              Spend crystals for long-term power. Skipping grants bonus crystals and improves epic odds for this level.
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-text-muted">Crystals</div>
            <div className="text-text-primary font-bold text-xl tabular-nums">{run.crystals}</div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <div className="text-[10px] uppercase tracking-widest text-text-muted">EXP</div>
              <div
                className="h-2.5 w-28 rounded-full bg-bg-dark/40 overflow-hidden border border-border"
                title={xp.tooltip}
              >
                <div className="h-full bg-teal-500" style={{ width: `${xp.pct * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-border bg-bg-dark/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text-primary">Random Stat Items</div>
                <div className="text-xs text-text-muted mt-1">Level {shopLevel} • 4 offers (all categories, one duplicated)</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-text-muted">Skips This Level</div>
                <div className="text-text-primary font-bold text-lg">{run.shopsSkipped}</div>
                <div className="text-xs text-text-muted mt-1">Rare {rareChance}% / Epic {epicChance}%</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {randomOffers.map((o) => {
                if (o.type !== "item") return null;
                const canBuy = o.remainingStock > 0 && run.crystals >= o.cost;
                return (
                  <div key={o.id} className="rounded-xl border border-border bg-bg-panel/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-text-primary">{o.name}</div>
                        <div className="text-xs text-text-muted mt-1">{o.flavorText}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-widest text-text-muted">{o.rarity}</div>
                        <div className="text-xs text-text-muted mt-1">Stock {o.remainingStock}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-text-secondary">
                      {formatStats(o.stats)}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-text-muted">Cost</div>
                      <div className="text-sm font-semibold text-text-primary">{o.cost}</div>
                    </div>

                    <div className="mt-4">
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

          <div className="rounded-xl border border-border bg-bg-dark/30 p-4">
            <div className="text-sm font-semibold text-text-primary">Sustain</div>
            <div className="text-xs text-text-muted mt-1">Health potions reset on level-up</div>

            {potionOffer && potionOffer.type === "potion" && (
              <div className="mt-4 rounded-xl border border-border bg-bg-panel/40 p-4">
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

            <div className="mt-6">
              <div className="text-sm font-semibold text-text-primary">Premium</div>
              <div className="text-xs text-text-muted mt-1">Coming soon</div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                {premiumOffers.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-bg-panel/20 p-4 opacity-70">
                    <div className="text-sm font-bold text-text-primary">{p.name}</div>
                    <div className="text-xs text-text-muted mt-1">{p.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="primary" size="lg" onClick={() => continueToCombat()}>
            Continue to Fight
          </Button>
        </div>
      </div>
    </div>
  );
}
