import { calculateHeroAbility, type HeroCombatStats } from "../damageCalculator";
import { createStatusEffect, getDefenseModifier, getOutgoingDamageModifier } from "../statusEffects";
import { useCombatStore, useGameStore } from "@/stores";
import type { AbilityHandler } from "./types";
import {
  CAMIRA_FOREST_EVADE,
  CAMIRA_FOREST_HP_LEVEL,
  CAMIRA_FOREST_HP_MAX,
  CAMIRA_FOREST_HP_MIN,
  CAMIRA_FOREST_STATS,
  CAMIRA_JACKPOT_CRIT_PER_USE,
  CAMIRA_JACKPOT_CRYSTALS,
  CAMIRA_JACKPOT_MAX_STACKS,
  CAMIRA_JACKPOT_PEN,
  CAMIRA_RAPID_FIRE_HEAL,
} from "@/data/heroes/camira";
import { triggerOnCrit } from "../passives/registry";

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const camiraRapidFire: AbilityHandler = ({ hero, monster, ability }) => {
  const store = useCombatStore.getState();
  const levelIndex = Math.min(hero.level - 1, 6);
  const scaling = (ability.damageScaling?.[levelIndex] ?? 100) / 100;
  const dmgModifier = getOutgoingDamageModifier(hero.statusEffects);

  const heroStats: HeroCombatStats = {
    atk: Math.floor((hero.stats.atk + hero.stats.bonusAtk) * dmgModifier),
    bonusAtk: 0,
    critChance: hero.stats.critChance,
    bonusCritChance: hero.stats.bonusCritChance,
    critMultiplier: hero.stats.critMultiplier,
    bonusCritMultiplier: hero.stats.bonusCritMultiplier,
    penetration: hero.stats.penetration,
    bonusPenetration: hero.stats.bonusPenetration,
    dodge: hero.stats.dodge,
    bonusDodge: hero.stats.bonusDodge,
  };

  const defModifier = getDefenseModifier(monster.statusEffects);
  const effectiveDef = Math.floor(monster.def * defModifier);

  let totalDamage = 0;

  for (let i = 0; i < 2; i++) {
    const hitResult = calculateHeroAbility(heroStats, effectiveDef, scaling, 0, true);
    if (hitResult.isDodged) {
        store.addLogEntry({
            actor: "hero",
            action: ability.id,
            message: `Rapid Fire shot was dodged!`,
        });
        continue;
    }

    if (hitResult.finalDamage > 0) {
      store.dealDamageToMonster(hitResult.finalDamage);
      totalDamage += hitResult.finalDamage;

      store.addLogEntry({
        actor: "hero",
        action: ability.id,
        damage: hitResult.finalDamage,
        isCrit: hitResult.isCrit,
        message: `Rapid Fire hits for ${hitResult.finalDamage} damage!`,
      });
      store.queueAnimation({
        type: "damage",
        target: "monster",
        value: hitResult.finalDamage,
        isCrit: hitResult.isCrit,
      });

      if (hitResult.isCrit) {
        triggerOnCrit({
          hero,
          monster,
          source: "ability",
          abilityId: ability.id,
          damage: hitResult.finalDamage,
        });
      }

      const updatedMonster = useCombatStore.getState().monster;
      if (updatedMonster && updatedMonster.hp <= 0) break;
    }
  }

  const healPct = CAMIRA_RAPID_FIRE_HEAL[levelIndex];
  const healAmount = Math.floor((totalDamage * healPct) / 100);
  if (healAmount > 0) {
    store.healHero(healAmount);
    store.addLogEntry({
      actor: "hero",
      action: "lifesteal",
      message: `Rapid Fire heals you for ${healAmount} HP.`,
    });
    store.queueAnimation({ type: "heal", target: "hero", value: healAmount });
  }
};

const camiraForestAgility: AbilityHandler = ({ hero, ability }) => {
  const store = useCombatStore.getState();

  // Evasion for the next incoming attack. Duration is infinite; it's consumed on attack.
  const evade = createStatusEffect("evade", "hero", CAMIRA_FOREST_EVADE, -1);
  store.applyStatusToHero(evade);
  store.addLogEntry({
    actor: "hero",
    action: ability.id,
    statusApplied: "evade",
    message: `Forest Agility: +${CAMIRA_FOREST_EVADE}% evasion for the next attack.`,
  });
  store.queueAnimation({ type: "buff", target: "hero", value: CAMIRA_FOREST_EVADE });

  const levelIndex = Math.min(hero.level - 1, 6);
  const statGain = CAMIRA_FOREST_STATS[levelIndex];
  store.addHeroBonusStats("bonusAtk", statGain);
  store.addHeroBonusStats("bonusDef", statGain);
  store.addLogEntry({
    actor: "hero",
    action: "permanent_stats",
    message: `Forest Agility: +${statGain} ATK and +${statGain} DEF permanently.`,
  });

  if (hero.level >= CAMIRA_FOREST_HP_LEVEL) {
    const hp = randomInt(CAMIRA_FOREST_HP_MIN, CAMIRA_FOREST_HP_MAX);
    store.addHeroBonusStats("bonusMaxHp", hp);
    store.addLogEntry({
      actor: "hero",
      action: "permanent_stats",
      message: `Forest Agility: +${hp} Max HP permanently.`,
    });
  }
};

const camiraJackpotArrow: AbilityHandler = ({ hero, monster, ability }) => {
  const store = useCombatStore.getState();

  // Crit stacking on use
  const prevStacks = Number(hero.passiveState.jackpotStacks ?? 0);
  const nextStacks = Math.min(CAMIRA_JACKPOT_MAX_STACKS, prevStacks + 1);
  const delta = nextStacks - prevStacks;

  if (delta > 0) {
    store.updatePassiveState({ jackpotStacks: nextStacks });
    store.addHeroBonusStats("bonusCritChance", CAMIRA_JACKPOT_CRIT_PER_USE * delta);
    store.addHeroBonusStats(
      "bonusCritMultiplier",
      (CAMIRA_JACKPOT_CRIT_PER_USE / 100) * delta,
    );
    store.addLogEntry({
      actor: "hero",
      action: "crit_stacking",
      message: `Jackpot Arrow: +${CAMIRA_JACKPOT_CRIT_PER_USE * delta}% crit chance and +${CAMIRA_JACKPOT_CRIT_PER_USE * delta}% crit damage. (${nextStacks}/${CAMIRA_JACKPOT_MAX_STACKS})`,
    });
  }

  // Refresh hero ref after bonus stats update
  const refreshed = useCombatStore.getState().hero;
  if (!refreshed) return;

  const levelIndex = Math.min(refreshed.level - 1, 6);
  const scaling = (ability.damageScaling?.[levelIndex] ?? 100) / 100;
  const dmgModifier = getOutgoingDamageModifier(refreshed.statusEffects);

  const heroStats: HeroCombatStats = {
    atk: Math.floor((refreshed.stats.atk + refreshed.stats.bonusAtk) * dmgModifier),
    bonusAtk: 0,
    critChance: refreshed.stats.critChance,
    bonusCritChance: refreshed.stats.bonusCritChance,
    critMultiplier: refreshed.stats.critMultiplier,
    bonusCritMultiplier: refreshed.stats.bonusCritMultiplier,
    penetration: refreshed.stats.penetration,
    bonusPenetration: refreshed.stats.bonusPenetration,
    dodge: refreshed.stats.dodge,
    bonusDodge: refreshed.stats.bonusDodge,
  };

  const defModifier = getDefenseModifier(monster.statusEffects);
  const effectiveDef = Math.floor(monster.def * defModifier);
  const extraPen = CAMIRA_JACKPOT_PEN[levelIndex];

  const result = calculateHeroAbility(heroStats, effectiveDef, scaling, extraPen, true);
  
  if (result.isDodged) {
    store.addLogEntry({
        actor: "hero",
        action: ability.id,
        message: `${ability.name} was dodged!`,
    });
    return;
  }

  if (result.finalDamage > 0) {
    store.dealDamageToMonster(result.finalDamage);
    store.addLogEntry({
      actor: "hero",
      action: ability.id,
      damage: result.finalDamage,
      isCrit: result.isCrit,
      message: `${ability.name} deals ${result.finalDamage} damage!`,
    });
    store.queueAnimation({
      type: "damage",
      target: "monster",
      value: result.finalDamage,
      isCrit: result.isCrit,
    });

    if (result.isCrit) {
      triggerOnCrit({
        hero: refreshed,
        monster,
        source: "ability",
        abilityId: ability.id,
        damage: result.finalDamage,
      });
    }

    const updatedMonster = useCombatStore.getState().monster;
    if (updatedMonster && updatedMonster.hp <= 0) {
      const bonus = CAMIRA_JACKPOT_CRYSTALS[levelIndex];
      useGameStore.getState().addCrystals(bonus);
      store.addLogEntry({
        actor: "hero",
        action: "crystal_on_kill",
        message: `Jackpot! +${bonus} bonus crystals.`,
      });
    }
  }
};

export const abilityRegistry: Record<string, AbilityHandler> = {
  camira_rapid_fire: camiraRapidFire,
  camira_forest_agility: camiraForestAgility,
  camira_jackpot_arrow: camiraJackpotArrow,
};
