import type { AbilityTag } from "@/types";
import { createStatusEffect } from "../statusEffects";
import { calculateBurnDamage } from "../damageCalculator";
import { useCombatStore } from "@/stores";
import type { AbilityExecutionContext } from "./types";
import { LYRA_FIREBOLT_KILL_MANA, LYRA_PYROCLASM_STAT_GAIN } from "@/data/heroes/lyra";

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

const handleManaOnKill: TagHandler = ({ ability }) => {
  const store = useCombatStore.getState();
  const { hero, monster } = store;
  if (!hero || !monster) return;

  // Currently only used by Lyra's Firebolt.
  if (hero.definitionId !== "lyra") return;
  if (ability.id !== "lyra_firebolt") return;
  if (monster.hp > 0) return;

  const idx = Math.min(hero.level - 1, 6);
  const mana = LYRA_FIREBOLT_KILL_MANA[idx] ?? 0;
  if (mana <= 0) return;

  store.restoreMana(mana);
  store.addLogEntry({
    actor: "hero",
    action: "mana_on_kill",
    message: `Firebolt kill: +${mana} Mana.`,
  });
};

const handleBurnConsume: TagHandler = ({ ability }) => {
  const store = useCombatStore.getState();
  const { hero, monster } = store;
  if (!hero || !monster) return;

  // Currently only used by Lyra's Pyroclasm.
  if (hero.definitionId !== "lyra") return;
  if (ability.id !== "lyra_pyroclasm") return;

  const burn = monster.statusEffects.find((e) => e.type === "burn");
  if (!burn) return;

  const remainingTicks = Math.max(0, burn.duration);
  if (remainingTicks <= 0) {
    store.removeMonsterStatus("burn");
    return;
  }

  const perTick = calculateBurnDamage(monster.maxHp, burn.value, monster.def);
  const bonusDamage = perTick * remainingTicks;
  if (bonusDamage <= 0) {
    store.removeMonsterStatus("burn");
    return;
  }

  store.removeMonsterStatus("burn");
  store.dealDamageToMonster(bonusDamage);
  store.addLogEntry({
    actor: "hero",
    action: "burn_consume",
    damage: bonusDamage,
    message: `Pyroclasm consumes Burn for ${bonusDamage} bonus damage!`,
  });
  store.queueAnimation({ type: "damage", target: "monster", value: bonusDamage });
};

const handlePermanentStats: TagHandler = ({ hero: ctxHero, ability }) => {
  const store = useCombatStore.getState();
  const { hero } = store;
  if (!hero) return;

  // Currently only used by Lyra's Pyroclasm.
  if (hero.definitionId !== "lyra") return;
  if (ability.id !== "lyra_pyroclasm") return;

  const idx = Math.min(ctxHero.level - 1, 6);
  const gain = LYRA_PYROCLASM_STAT_GAIN[idx] ?? 0;
  if (gain <= 0) return;

  store.addHeroBonusStats("bonusAtk", gain);
  store.addHeroBonusStats("bonusMaxHp", gain);
  useCombatStore.setState((state) => {
    if (!state.hero) return {};
    const maxHp = state.hero.stats.maxHp + state.hero.stats.bonusMaxHp;
    const nextHp = Math.min(maxHp, state.hero.stats.hp + gain);
    return { hero: { ...state.hero, stats: { ...state.hero.stats, hp: nextHp } } };
  });

  store.addLogEntry({
    actor: "hero",
    action: "permanent_stats",
    message: `Pyroclasm: +${gain} ATK and +${gain} Max HP permanently.`,
  });
  store.queueAnimation({ type: "buff", target: "hero", value: gain });
};

export const tagRegistry: Partial<Record<AbilityTag, TagHandler>> = {
  shield: handleShield,
  burn: handleBurn,
  mana_on_kill: handleManaOnKill,
  burn_consume: handleBurnConsume,
  permanent_stats: handlePermanentStats,
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
