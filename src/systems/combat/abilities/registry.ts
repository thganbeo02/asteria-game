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
  CAMIRA_JACKPOT_CRYSTALS,
  CAMIRA_JACKPOT_CRIT_PER_USE,
  CAMIRA_JACKPOT_MAX_STACKS,
  CAMIRA_JACKPOT_PEN,
  CAMIRA_RAPID_FIRE_HEAL,
} from "@/data/heroes/camira";
import {
  BRAN_SHIELD_SLAM_DEF_SCALE,
  BRAN_FORTIFY_DEF_BONUS,
  BRAN_FORTIFY_HP_GAIN,
  BRAN_FORTIFY_THRESHOLD,
  BRAN_FORTIFY_BONUS_ATK,
  BRAN_FORTIFY_BONUS_PEN,
  BRAN_CRUSHING_BLOW_MISSING_HP,
  BRAN_CRUSHING_BLOW_KILL_STATS,
} from "@/data/heroes/bran";
import {
  SHADE_COLLECT_CONTRACT_CRYSTALS,
  SHADE_COLLECT_DEF_GAIN,
  SHADE_COLLECT_PENETRATION,
  SHADE_PHANTOM_EVADE,
  SHADE_QUICKBLADE_ATK_GAIN,
  SHADE_QUICKBLADE_CONTRACT_PEN,
} from "@/data/heroes/shade";
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

  // Jackpot Arrow cannot crit.
  const result = calculateHeroAbility(heroStats, effectiveDef, scaling, extraPen, false);
  
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

// =============================================================================
// BRAN ABILITIES
// =============================================================================

const branShieldSlam: AbilityHandler = ({ hero, monster, ability }) => {
  const store = useCombatStore.getState();
  const levelIndex = Math.min(hero.level - 1, 6);
  const scaling = (ability.damageScaling?.[levelIndex] ?? 110) / 100;
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

  // Bran abilities do not crit (basic attacks can still crit).
  const result = calculateHeroAbility(heroStats, effectiveDef, scaling, 0, false);

  // DEF scaling: +25% of hero's DEF as flat bonus damage
  const baseHeroDef = hero.stats.def + hero.stats.bonusDef;
  const heroDefModifier = getDefenseModifier(hero.statusEffects);
  const effectiveHeroDef = Math.floor(baseHeroDef * heroDefModifier);
  const defBonus = Math.floor(effectiveHeroDef * (BRAN_SHIELD_SLAM_DEF_SCALE / 100));
  const totalDamage = result.finalDamage + defBonus;

  if (result.isDodged) {
    store.addLogEntry({
      actor: "hero",
      action: ability.id,
      message: `${ability.name} was dodged!`,
    });
    return;
  }

  if (totalDamage > 0) {
    store.dealDamageToMonster(totalDamage);
    store.addLogEntry({
      actor: "hero",
      action: ability.id,
      damage: totalDamage,
      isCrit: result.isCrit,
      message: `${ability.name} deals ${totalDamage} damage! (+${defBonus} from DEF)`,
    });
    store.queueAnimation({
      type: "damage",
      target: "monster",
      value: totalDamage,
      isCrit: result.isCrit,
    });

    if (result.isCrit) {
      triggerOnCrit({
        hero,
        monster,
        source: "ability",
        abilityId: ability.id,
        damage: totalDamage,
      });
    }
  }

  // Apply stun for 1 turn
  const stunEffect = createStatusEffect("stun", "hero", 0, 1);
  store.applyStatusToMonster(stunEffect);
  store.addLogEntry({
    actor: "hero",
    action: "stun",
    statusApplied: "stun",
    message: "Enemy is stunned for 1 turn!",
  });
};

const branFortify: AbilityHandler = ({ hero, ability }) => {
  const store = useCombatStore.getState();
  const levelIndex = Math.min(hero.level - 1, 6);

  // Apply DEF buff
  const defBonus = BRAN_FORTIFY_DEF_BONUS[levelIndex];
  const fortifyEffect = createStatusEffect("fortify", "hero", defBonus, 3);
  store.applyStatusToHero(fortifyEffect);
  store.addLogEntry({
    actor: "hero",
    action: ability.id,
    statusApplied: "fortify",
    message: `Fortify: +${defBonus}% DEF for 3 turns.`,
  });
  store.queueAnimation({ type: "buff", target: "hero", value: defBonus });

  // Store the HP gain for when buff expires
  const hpGain = BRAN_FORTIFY_HP_GAIN[levelIndex];
  store.updatePassiveState({ pendingFortifyHpGain: hpGain });

  // Track fortify uses for threshold bonus
  const prevUses = Number(hero.passiveState.fortifyUses ?? 0);
  const newUses = prevUses + 1;
  store.updatePassiveState({ fortifyUses: newUses });

  // Check threshold (every 5 uses) -> grant permanent bonuses
  // No cap on stacks for now
  if (newUses > 0 && newUses % BRAN_FORTIFY_THRESHOLD === 0) {
    store.addHeroBonusStats("bonusAtk", BRAN_FORTIFY_BONUS_ATK);
    store.addHeroBonusStats("bonusPenetration", BRAN_FORTIFY_BONUS_PEN);
    // fortifyBonusUnlocked is legacy/unused for the repeatable version but we can keep it true if needed for other checks
    // or just ignore it.
    store.updatePassiveState({ fortifyBonusUnlocked: true }); 
    store.addLogEntry({
      actor: "hero",
      action: "fortify_mastery",
      message: `Fortify Mastery! +${BRAN_FORTIFY_BONUS_ATK} ATK and +${BRAN_FORTIFY_BONUS_PEN}% Penetration permanently!`,
    });
  }
};

const branCrushingBlow: AbilityHandler = ({ hero, monster, ability }) => {
  const store = useCombatStore.getState();
  const levelIndex = Math.min(hero.level - 1, 6);
  const scaling = (ability.damageScaling?.[levelIndex] ?? 160) / 100;
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

  // Bran abilities do not crit (basic attacks can still crit).
  const result = calculateHeroAbility(heroStats, effectiveDef, scaling, 0, false);

  // Execute damage: +25% of enemy's MISSING HP
  const monsterMissingHp = monster.maxHp - monster.hp;
  const executeBonus = Math.floor(monsterMissingHp * (BRAN_CRUSHING_BLOW_MISSING_HP / 100));
  const totalDamage = result.finalDamage + executeBonus;

  if (result.isDodged) {
    store.addLogEntry({
      actor: "hero",
      action: ability.id,
      message: `${ability.name} was dodged!`,
    });
    return;
  }

  if (totalDamage > 0) {
    store.dealDamageToMonster(totalDamage);
    store.addLogEntry({
      actor: "hero",
      action: ability.id,
      damage: totalDamage,
      isCrit: result.isCrit,
      message: `${ability.name} deals ${totalDamage} damage! (+${executeBonus} execute)`,
    });
    store.queueAnimation({
      type: "damage",
      target: "monster",
      value: totalDamage,
      isCrit: result.isCrit,
    });

    if (result.isCrit) {
      triggerOnCrit({
        hero,
        monster,
        source: "ability",
        abilityId: ability.id,
        damage: totalDamage,
      });
    }

    // Check for kill and grant permanent stats
    const updatedMonster = useCombatStore.getState().monster;
    if (updatedMonster && updatedMonster.hp <= 0) {
      const statGain = BRAN_CRUSHING_BLOW_KILL_STATS[levelIndex];
      store.addHeroBonusStats("bonusAtk", statGain);
      store.addHeroBonusStats("bonusDef", statGain);
      store.addLogEntry({
        actor: "hero",
        action: "crushing_blow_kill",
        message: `Crushing Blow kill! +${statGain} ATK and +${statGain} DEF permanently.`,
      });
    }
  }
};

// =============================================================================
// SHADE ABILITIES
// =============================================================================

const shadeQuickblade: AbilityHandler = ({ hero, monster, ability }) => {
  const store = useCombatStore.getState();
  const run = useGameStore.getState().run;

  const levelIndex = Math.min(hero.level - 1, 6);
  const scaling = (ability.damageScaling?.[levelIndex] ?? 120) / 100;
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

  const remainingTurns = run?.contractState
    ? Math.max(0, run.contractState.currentTurnLimit - run.contractState.currentTurn)
    : null;
  const extraPen = remainingTurns != null && remainingTurns <= 2
    ? SHADE_QUICKBLADE_CONTRACT_PEN
    : 0;

  const result = calculateHeroAbility(heroStats, effectiveDef, scaling, extraPen, false);

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
        hero,
        monster,
        source: "ability",
        abilityId: ability.id,
        damage: result.finalDamage,
      });
    }

    const updatedMonster = useCombatStore.getState().monster;
    if (updatedMonster && updatedMonster.hp <= 0) {
      const atkGain = SHADE_QUICKBLADE_ATK_GAIN[levelIndex] ?? 0;
      if (atkGain > 0) {
        store.addHeroBonusStats("bonusAtk", atkGain);
        store.addLogEntry({
          actor: "hero",
          action: "quickblade_kill",
          message: `Quickblade kill! +${atkGain} ATK permanently.`,
        });
      }
    }
  }
};

const shadePhantomStep: AbilityHandler = ({ hero, monster, ability }) => {
  const store = useCombatStore.getState();
  const game = useGameStore.getState();

  const levelIndex = Math.min(hero.level - 1, 6);
  const scaling = (ability.damageScaling?.[levelIndex] ?? 80) / 100;
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
  const result = calculateHeroAbility(heroStats, effectiveDef, scaling, 0, false);

  if (result.isDodged) {
    store.addLogEntry({
      actor: "hero",
      action: ability.id,
      message: `${ability.name} was dodged!`,
    });
  } else if (result.finalDamage > 0) {
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
        hero,
        monster,
        source: "ability",
        abilityId: ability.id,
        damage: result.finalDamage,
      });
    }
  }

  const evadeEffect = createStatusEffect("evade", "hero", SHADE_PHANTOM_EVADE, 1);
  store.applyStatusToHero(evadeEffect);
  store.addLogEntry({
    actor: "hero",
    action: ability.id,
    statusApplied: "evade",
    message: `Phantom Step: +${SHADE_PHANTOM_EVADE}% Evasion for 1 turn.`,
  });
  store.queueAnimation({ type: "buff", target: "hero", value: SHADE_PHANTOM_EVADE });

  if (game.run?.contractState) {
    game.updateContractState((prev) => ({
      ...prev,
      currentTurnLimit: prev.currentTurnLimit + 1,
    }));
    store.addLogEntry({
      actor: "hero",
      action: "contract_extend",
      message: "Contract extended by 1 turn.",
    });
  }
};

const shadeCollect: AbilityHandler = ({ hero, monster, ability }) => {
  const store = useCombatStore.getState();
  const game = useGameStore.getState();
  const run = game.run;

  const levelIndex = Math.min(hero.level - 1, 6);
  const scaling = (ability.damageScaling?.[levelIndex] ?? 180) / 100;
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
  const result = calculateHeroAbility(
    heroStats,
    effectiveDef,
    scaling,
    SHADE_COLLECT_PENETRATION,
    false,
  );

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
        hero,
        monster,
        source: "ability",
        abilityId: ability.id,
        damage: result.finalDamage,
      });
    }

    const updatedMonster = useCombatStore.getState().monster;
    if (updatedMonster && updatedMonster.hp <= 0) {
      const defGain = SHADE_COLLECT_DEF_GAIN[levelIndex] ?? 0;
      if (defGain > 0) {
        store.addHeroBonusStats("bonusDef", defGain);
        store.addLogEntry({
          actor: "hero",
          action: "collect_kill",
          message: `Collect kill! +${defGain} DEF permanently.`,
        });
      }

      if (run?.contractState && useCombatStore.getState().turnCount <= run.contractState.currentTurnLimit) {
        const bonusCrystals = SHADE_COLLECT_CONTRACT_CRYSTALS[levelIndex] ?? 0;
        if (bonusCrystals > 0) {
          game.addCrystals(bonusCrystals);
          store.addLogEntry({
            actor: "hero",
            action: "contract_bonus",
            message: `Collect Contract bonus: +${bonusCrystals} Crystals.`,
          });
        }
      }
    }
  }
};

export const abilityRegistry: Record<string, AbilityHandler> = {
  camira_rapid_fire: camiraRapidFire,
  camira_forest_agility: camiraForestAgility,
  camira_jackpot_arrow: camiraJackpotArrow,
  // Bran
  bran_shield_slam: branShieldSlam,
  bran_fortify: branFortify,
  bran_crushing_blow: branCrushingBlow,
  // Shade
  shade_quickblade: shadeQuickblade,
  shade_phantom_step: shadePhantomStep,
  shade_collect: shadeCollect,
};
