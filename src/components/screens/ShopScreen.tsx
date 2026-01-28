"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useCombatStore, useGameStore } from "@/stores";

export function ShopScreen() {
  const run = useGameStore((s) => s.run);
  const phase = useGameStore((s) => s.phase);

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

  const continueToCombat = (opts: { skip: boolean }) => {
    const game = useGameStore.getState();
    const combat = useCombatStore.getState();

    if (game.phase !== "shop" || !game.run) return;

    // Double-click guard: lock phase first.
    game.setPhase("combat");

    if (opts.skip) {
      game.skipShop();
    }

    combat.clearLog();
    combat.resetTurn();
    combat.spawnMonster(game.run.difficulty);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={cn("w-full max-w-2xl", "rounded-2xl border border-border bg-bg-panel p-6")}> 
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-text-primary">Shop (WIP)</div>
            <div className="text-text-secondary mt-2">
              Shop items are not implemented yet. You can continue the run.
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-text-muted">Currency</div>
            <div className="text-text-primary font-bold text-xl">{run.crystals}</div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-bg-dark/30 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-muted">Next Fight</div>
            <div className="text-sm font-semibold text-text-secondary">Encounter {run.encounter}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="secondary" size="lg" onClick={() => continueToCombat({ skip: true })}>
            Skip Shop
          </Button>
          <Button variant="primary" size="lg" onClick={() => continueToCombat({ skip: false })}>
            Continue to Fight
          </Button>
        </div>
      </div>
    </div>
  );
}
