import type { AbilityTag } from "@/types";
import { createStatusEffect } from "../statusEffects";
import { useCombatStore } from "@/stores";
import type { AbilityExecutionContext } from "./types";

export type TagHandler = (ctx: AbilityExecutionContext & { abilityScaling: number }) => void;

const handleShield: TagHandler = ({ hero, abilityScaling }) => {
  const store = useCombatStore.getState();

  // Frost Barrier: Shield absorbs 40% of max HP for 2 turns.
  // Shatter damage stored in snapshotAtk for when shield breaks/expires.
  const maxHp = hero.stats.maxHp + hero.stats.bonusMaxHp;
  const heroAtk = hero.stats.atk + hero.stats.bonusAtk;
  const shieldValue = Math.floor(maxHp * 0.4);
  const shatterDamage = Math.floor(heroAtk * abilityScaling);

  const shieldEffect = createStatusEffect(
    "shield",
    "hero",
    shieldValue,
    2,
    1,
    shatterDamage,
  );
  store.applyStatusToHero(shieldEffect);
  store.addLogEntry({
    actor: "hero",
    action: "shield",
    statusApplied: "shield",
    message: `Frost Barrier absorbs up to ${shieldValue} damage!`,
  });
  store.queueAnimation({
    type: "buff",
    target: "hero",
    value: shieldValue,
  });
};

const handleBurn: TagHandler = () => {
  const store = useCombatStore.getState();
  const burnEffect = createStatusEffect("burn", "hero", 5, 3);
  store.applyStatusToMonster(burnEffect);
  store.addLogEntry({
    actor: "hero",
    action: "burn",
    statusApplied: "burn",
    message: "Enemy is burning!",
  });
};

export const tagRegistry: Partial<Record<AbilityTag, TagHandler>> = {
  shield: handleShield,
  burn: handleBurn,
};

export function applyAbilityTags(
  tags: AbilityTag[],
  ctx: AbilityExecutionContext & { abilityScaling: number },
): void {
  for (const tag of tags) {
    const handler = tagRegistry[tag];
    if (!handler) continue;
    handler(ctx);
  }
}
