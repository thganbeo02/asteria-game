import { calculateHeroAbility, type HeroCombatStats } from "../damageCalculator";
import { useCombatStore } from "@/stores";
import type { PassiveHandler, BasicAttackResolvedContext, CritContext } from "./types";
import {
  CAMIRA_CRIT_CD_REDUCTION,
  CAMIRA_CRIT_MANA_MAX,
  CAMIRA_CRIT_MANA_MIN,
  CAMIRA_PASSIVE_BONUS,
  CAMIRA_PASSIVE_HIT_COUNT,
} from "@/data/heroes/camira";

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const camiraPassives: PassiveHandler = {
  onCrit: () => {
    const store = useCombatStore.getState();
    const { hero } = store;
    if (!hero || hero.definitionId !== "camira") return;

    const mana = randomInt(CAMIRA_CRIT_MANA_MIN, CAMIRA_CRIT_MANA_MAX);
    store.restoreMana(mana);
    store.addLogEntry({
      actor: "hero",
      action: "camira_crit",
      message: `Deadeye Hustle: +${mana} mana (crit)!`,
    });

    // Reduce Rapid Fire CD by 1.
    const rapidFireIndex = hero.abilities.findIndex((a) => a.id === "camira_rapid_fire");
    if (rapidFireIndex >= 0) {
      const current = hero.abilities[rapidFireIndex]?.currentCooldown ?? 0;
      const next = Math.max(0, current - CAMIRA_CRIT_CD_REDUCTION);
      if (next !== current) {
        store.setAbilityCooldown(rapidFireIndex, next);
        store.addLogEntry({
          actor: "hero",
          action: "camira_cd",
          message: "Deadeye Hustle: Rapid Fire cooldown -1.",
        });
      }
    }
  },

  onBasicAttackResolved: (ctx: BasicAttackResolvedContext) => {
    const store = useCombatStore.getState();
    const { hero, monster } = store;
    
    // Debug logging
    // console.log("Passive trigger check:", { heroId: hero?.definitionId, isDodged: ctx.result.isDodged, damage: ctx.result.finalDamage });

    if (!hero || !monster) return;
    if (hero.definitionId !== "camira") return;
    if (ctx.result.isDodged || ctx.result.finalDamage <= 0) return;

    const levelIndex = Math.min(hero.level - 1, 6);
    const prev = Number(hero.passiveState.attackCount ?? 0);
    const next = prev + 1;

    if (next >= CAMIRA_PASSIVE_HIT_COUNT) {
      const bonusPct = CAMIRA_PASSIVE_BONUS[levelIndex];
      const bonusScaling = bonusPct / 100;

      // Bonus shot uses the same heroStats used for basic attack (no crit).
      const bonusResult = calculateHeroAbility(
        ctx.heroStats as HeroCombatStats,
        ctx.effectiveMonsterDef,
        bonusScaling,
        0,
        false,
      );

      if (!bonusResult.isDodged && bonusResult.finalDamage > 0) {
        store.dealDamageToMonster(bonusResult.finalDamage);
        store.addLogEntry({
          actor: "hero",
          action: "camira_deadeye",
          damage: bonusResult.finalDamage,
          message: `Deadeye Hustle! Bonus shot deals ${bonusResult.finalDamage} damage.`,
        });
        store.queueAnimation({
          type: "damage",
          target: "monster",
          value: bonusResult.finalDamage,
          isCrit: false,
        });
      }

      store.updatePassiveState({ attackCount: 0 });
    } else {
      store.updatePassiveState({ attackCount: next });
    }
  },
};

export const passiveRegistry: Record<string, PassiveHandler> = {
  camira: camiraPassives,
};

export function triggerOnBasicAttackResolved(ctx: BasicAttackResolvedContext): void {
  passiveRegistry[ctx.hero.definitionId]?.onBasicAttackResolved?.(ctx);
}

export function triggerOnCrit(ctx: CritContext): void {
  passiveRegistry[ctx.hero.definitionId]?.onCrit?.(ctx);
}
