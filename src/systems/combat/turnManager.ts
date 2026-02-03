import { useCombatStore } from "@/stores/combatStore";
import { useGameStore } from "@/stores/gameStore";
import {
  calculateHeroAbility,
  calculateHeroBasicAttack,
  calculateMonsterAttack,
  HeroCombatStats,
} from "./damageCalculator";
import {
  createStatusEffect,
  getEffectModifiers,
  getDefenseModifier,
  getDodgeBonus,
  getOutgoingDamageModifier,
  hasEffect,
  processEffectTick,
  processShieldAbsorption,
  tickEffectDurations,
} from "./statusEffects";
import { abilityRegistry } from "./abilities/registry";
import { applyAbilityTags } from "./abilities/tags";
import { triggerOnBasicAttackResolved, triggerOnCrit, triggerOnKill } from "./passives/registry";
import { getHeroDefinition } from "@/data/heroes";
import { LYRA_MOMENTUM_MANA_RESTORE } from "@/data/heroes/lyra";
import { EXP_THRESHOLDS, MAX_LEVEL } from "@/lib/constants";
import {
  getEffectiveMonsterAtk,
  getMonsterAction,
  shouldDoubleAttack,
} from "./monsterAI";

/**
 * Orchestrates combat flow
 * Reads from stores, calls systems for calculation, write results back to stores
 */
export class TurnManager {
  // PLAYER TURN

  /**
   * Execute player's basic attack
   */
  static executeBasicAttack(): void {
    const store = useCombatStore.getState();
    const { hero, monster } = store;

    if (!hero || !monster) return;

    // Class innates: basic attack scaling by class.
    // Currently: mages deal reduced basic attack damage.
    const heroDef = getHeroDefinition(hero.definitionId);
    const basicAtkMultiplier = heroDef?.class === "mage" ? 0.75 : 1;

    // Build stats object for dmg calc
    const heroStats: HeroCombatStats = {
      atk: Math.floor(hero.stats.atk * basicAtkMultiplier),
      bonusAtk: Math.floor(hero.stats.bonusAtk * basicAtkMultiplier),
      critChance: hero.stats.critChance,
      bonusCritChance: hero.stats.bonusCritChance,
      critMultiplier: hero.stats.critMultiplier,
      bonusCritMultiplier: hero.stats.bonusCritMultiplier,
      penetration: hero.stats.penetration,
      bonusPenetration: hero.stats.bonusPenetration,
      dodge: hero.stats.dodge,
      bonusDodge: hero.stats.bonusDodge,
    };

    // apply def modifier from monster effects
    const defModifier = getDefenseModifier(monster.statusEffects);
    const effectiveDef = Math.floor(monster.def * defModifier);
    const result = calculateHeroBasicAttack(heroStats, effectiveDef);

    // Update store with results
    if (!result.isDodged) {
      store.dealDamageToMonster(result.finalDamage);

      store.addLogEntry({
        actor: "hero",
        action: "basic_attack",
        damage: result.finalDamage,
        isCrit: result.isCrit,
        message: result.isCrit
          ? `Critical hit for ${result.finalDamage} damage!`
          : `Attack deals ${result.finalDamage} damage.`,
      });

      store.queueAnimation({
        type: "damage",
        target: "monster",
        value: result.finalDamage,
        isCrit: result.isCrit,
      });

      if (result.isCrit && result.finalDamage > 0) {
        triggerOnCrit({
          hero,
          monster,
          source: "basic_attack",
          damage: result.finalDamage,
        });
      }

      triggerOnBasicAttackResolved({
        hero,
        monster,
        heroStats,
        effectiveMonsterDef: effectiveDef,
        result,
      });
    } else {
      store.addLogEntry({
        actor: "hero",
        action: "basic_attack",
        message: "Attack missed!",
      });
    }

    // Lyra: Basic attacks reset Arcane Momentum.
    if (hero.definitionId === "lyra") {
      const prev = Math.max(0, Math.min(3, Number(hero.passiveState.momentum ?? 0)));
      if (prev > 0) {
        // Reset effect + passive state
        store.updatePassiveState({ momentum: 0 });
        useCombatStore.setState((state) => {
          if (!state.hero) return {};
          return {
            hero: {
              ...state.hero,
              statusEffects: state.hero.statusEffects.filter((e) => e.type !== "momentum"),
            },
          };
        });

        if (prev >= 3) {
          const idx = Math.min(hero.level - 1, 6);
          const manaRestore = LYRA_MOMENTUM_MANA_RESTORE[idx] ?? 0;
          if (manaRestore > 0) {
            store.restoreMana(manaRestore);
            store.addLogEntry({
              actor: "hero",
              action: "momentum_reset",
              message: `Arcane Momentum reset: +${manaRestore} Mana.`,
            });
          }
        }
      }
    }

    // Restore mana on basic attack
    store.restoreMana(hero.stats.manaRegen);

    // Check victory or continue
    this.checkVictoryOrContinue();
  }

  /**
   * Execute player's ability
   */
  static executeAbility(abilityIndex: number): void {
    const store = useCombatStore.getState();
    const { hero, monster } = store;

    if (!hero || !monster) return;

    const ability = hero.abilities[abilityIndex];
    if (!ability) return;

    // Check cd
    if (ability.currentCooldown > 0) {
      store.addLogEntry({
        actor: "hero",
        action: ability.id,
        message: `${ability.name} is on cooldown!`,
      });
      return;
    }

    // Check and spend mana
    const manaCost = ability.manaCost[Math.min(hero.level - 1, 6)];
    if (!store.spendMana(manaCost)) {
      store.addLogEntry({
        actor: "hero",
        action: ability.id,
        message: `Not enough mana for ${ability.name}!`,
      });
      return;
    }

    store.setAbilityCooldown(abilityIndex, ability.cooldown);

    // Lyra: Arcane Momentum stacks on consecutive abilities.
    // Apply BEFORE damage so this cast benefits from the new stack.
    if (hero.definitionId === "lyra") {
      const prev = Math.max(0, Math.min(3, Number(hero.passiveState.momentum ?? 0)));
      const next = Math.max(0, Math.min(3, prev + 1));

      if (next !== prev) {
        store.updatePassiveState({ momentum: next });
      }

      // Keep a momentum status effect in sync for damage modifiers.
      useCombatStore.setState((state) => {
        if (!state.hero) return {};

        const without = state.hero.statusEffects.filter((e) => e.type !== "momentum");
        if (next <= 0) {
          return { hero: { ...state.hero, statusEffects: without } };
        }

        return {
          hero: {
            ...state.hero,
            statusEffects: [...without, createStatusEffect("momentum", "hero", 0, -1, next)],
          },
        };
      });
    }

    // Refresh refs after any momentum updates.
    const refreshed = useCombatStore.getState();
    const heroNow = refreshed.hero;
    const monsterNow = refreshed.monster;
    if (!heroNow || !monsterNow) return;

    const abilityHandler = abilityRegistry[ability.id];
    if (abilityHandler) {
      abilityHandler({ hero: heroNow, monster: monsterNow, ability, abilityIndex });
      this.checkVictoryOrContinue();
      return;
    }

    // Calculate dmg
    const scaling =
      (ability.damageScaling?.[Math.min(heroNow.level - 1, 6)] ?? 100) / 100;
    const dmgModifier = getOutgoingDamageModifier(heroNow.statusEffects);
    const extraPen = getEffectModifiers(heroNow.statusEffects).penetrationBonus;

    const heroStats: HeroCombatStats = {
      atk: Math.floor((heroNow.stats.atk + heroNow.stats.bonusAtk) * dmgModifier),
      bonusAtk: 0, // Already applied above
      critChance: heroNow.stats.critChance,
      bonusCritChance: heroNow.stats.bonusCritChance,
      critMultiplier: heroNow.stats.critMultiplier,
      bonusCritMultiplier: heroNow.stats.bonusCritMultiplier,
      penetration: heroNow.stats.penetration,
      bonusPenetration: heroNow.stats.bonusPenetration,
      dodge: heroNow.stats.dodge,
      bonusDodge: heroNow.stats.bonusDodge,
    };

    const defModifier = getDefenseModifier(monsterNow.statusEffects);
    const effectiveDef = Math.floor(monsterNow.def * defModifier);

    const result = calculateHeroAbility(heroStats, effectiveDef, scaling, extraPen);

    // Shield abilities (like Frost Barrier) don't deal damage on cast
    // They deal damage when the shield breaks or expires
    const isShieldAbility = ability.tags?.includes("shield") ?? false;

    // Apply damage (skip for shield abilities)
    if (!isShieldAbility) {
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
            hero: heroNow,
            monster: monsterNow,
            source: "ability",
            abilityId: ability.id,
            damage: result.finalDamage,
          });
        }
      }
    }

    // Tag-driven effects
    if (ability.tags?.length) {
      applyAbilityTags(ability.tags, { hero: heroNow, monster: monsterNow, ability, abilityIndex, abilityScaling: scaling });
    }

    // Check victory or continue
    this.checkVictoryOrContinue();
  }

  // Tag processing has been moved to src/systems/combat/abilities

  /**
   * Handle Frost Barrier shatter effect (when shield breaks or expires)
   */
  private static handleShieldShatter(shatterDamage: number, reason: "broken" | "expired"): void {
    const store = useCombatStore.getState();
    const { monster } = store;

    if (!monster) return;

    const reasonText = reason === "broken" ? "Shield broken!" : "Shield expired!";

    // Deal shatter damage to monster
    if (shatterDamage > 0) {
      store.dealDamageToMonster(shatterDamage);
      store.addLogEntry({
        actor: "hero",
        action: "shield_shatter",
        damage: shatterDamage,
        message: `${reasonText} Frost Barrier shatters for ${shatterDamage} damage!`,
      });
      store.queueAnimation({
        type: "damage",
        target: "monster",
        value: shatterDamage,
      });

      // If the shatter kills the monster (common on expiry), end combat immediately.
      const after = useCombatStore.getState().monster;
      if (after && after.hp <= 0) {
        this.handleVictory();
        return;
      }
    }

    // Apply Chill to monster: 15% less damage for 2 turns
    const chillEffect = createStatusEffect("chill", "hero", 15, 2);
    store.applyStatusToMonster(chillEffect);
    store.addLogEntry({
      actor: "hero",
      action: "chill",
      statusApplied: "chill",
      message: "Enemy is chilled! Dealing 15% less damage.",
    });
  }

  // MONSTER TURN

  /**
   * Execute monster's turn
   */
  static executeMonsterTurn(): void {
    const store = useCombatStore.getState();
    const game = useGameStore.getState();
    const { hero, monster } = store;

    if (game.phase !== "combat") return;
    if (store.turnPhase !== "monster_turn") return;
    if (!hero || !monster) return;
    if (hero.stats.hp <= 0 || monster.hp <= 0) return;

    // Check if stunned
    if (hasEffect(monster.statusEffects, "stun")) {
      store.addLogEntry({
        actor: "monster",
        action: "stunned",
        message: "Monster is stunned and cannot act!",
      });
      this.endRound();
      return;
    }

    const decision = getMonsterAction(monster);

    // Execute based on action type
    if (decision.action.type === "wait") {
      store.addLogEntry({
        actor: "monster",
        action: "wait",
        message: decision.message,
      });
    } else {
      // Attack or special
      this.executeMonsterAttack(decision.action.multiplier);

      // Monster can die from reactive effects (e.g. Lyra Frost Barrier shatter).
      const afterAttack = useCombatStore.getState().monster;
      if (!afterAttack || afterAttack.hp <= 0) {
        this.handleVictory();
        return;
      }

      // Handle special effects
      if (decision.action.effect) {
        this.handleMonsterEffect(decision.action.effect);
      }

      // Double attack for Orc
      if (shouldDoubleAttack(monster)) {
        store.addLogEntry({
          actor: "monster",
          action: "rage",
          message: "Berserker Rage! Attacking again!",
        });
        this.executeMonsterAttack(decision.action.multiplier);
      }
    }

    // Advance pattern
    store.advanceMonsterPattern();

    // Check defeat or continue
    const updated = useCombatStore.getState();
    if (updated.hero && updated.hero.stats.hp <= 0) {
      this.handleDefeat();
    } else {
      this.endRound();
    }
  }

  /**
   * Execute a single monster attack
   */
  private static executeMonsterAttack(multiplier: number): void {
    const store = useCombatStore.getState();
    const { hero, monster } = store;

    if (!hero || !monster) return;

    const hadEvade = hero.statusEffects.some((e) => e.type === "evade");

    // Get effective stats
    const monsterAtk = getEffectiveMonsterAtk(monster);
    const chillModifier = getOutgoingDamageModifier(monster.statusEffects);
    const effectiveAtk = Math.floor(monsterAtk * chillModifier);

    const heroDef = hero.stats.def + hero.stats.bonusDef;
    const defModifier = getDefenseModifier(hero.statusEffects);
    const effectiveDef = Math.floor(heroDef * defModifier);

    const heroDodge =
      hero.stats.dodge +
      hero.stats.bonusDodge +
      getDodgeBonus(hero.statusEffects);

    const result = calculateMonsterAttack(
      effectiveAtk,
      effectiveDef,
      heroDodge,
      multiplier,
    );

    if (result.isDodged) {
      if (hadEvade) {
        store.removeHeroStatus("evade");
      }
      store.addLogEntry({
        actor: "monster",
        action: "attack",
        message: "You dodged the attack!",
      });
      return;
    }

    if (hadEvade) {
      store.removeHeroStatus("evade");
    }

    // Check for existing shield before processing
    const existingShield = hero.statusEffects.find((e) => e.type === "shield");
    const shatterDamage = existingShield?.snapshotAtk ?? 0;

    // Process shield absorption
    const shieldResult = processShieldAbsorption(
      hero.statusEffects,
      result.finalDamage,
    );

    if (shieldResult.absorbed > 0) {
      store.addLogEntry({
        actor: "monster",
        action: "attack_shield",
        damage: shieldResult.absorbed,
        message: `Shield absorbs ${shieldResult.absorbed} damage!`,
      });

      // Update hero's shield status (reduced to 0 if broken, for UI animation)
      useCombatStore.setState((state) => ({
        hero: state.hero
          ? { ...state.hero, statusEffects: shieldResult.newEffects }
          : null,
      }));
    }

    if (shieldResult.remainingDamage > 0) {
      store.dealDamageToHero(shieldResult.remainingDamage);

      store.addLogEntry({
        actor: "monster",
        action: "attack",
        damage: shieldResult.remainingDamage,
        message: `Monster deals ${shieldResult.remainingDamage} damage!`,
      });

      store.queueAnimation({
        type: "damage",
        target: "hero",
        value: shieldResult.remainingDamage,
      });
    }

    // Trigger shatter effect if shield was broken
    if (shieldResult.shieldBroken) {
      // Remove shield after animation completes (350ms for CSS transition)
      setTimeout(() => {
        useCombatStore.setState((state) => ({
          hero: state.hero
            ? {
                ...state.hero,
                statusEffects: state.hero.statusEffects.filter((e) => e.type !== "shield"),
              }
            : null,
        }));
      }, 350);

      this.handleShieldShatter(shatterDamage, "broken");
    }
  }

  /**
   * Handle monster special effects
   */
  private static handleMonsterEffect(effect: string): void {
    const store = useCombatStore.getState();

    switch (effect) {
      case "apply_burn":
        const burn = createStatusEffect("burn", "monster", 5, 3);
        store.applyStatusToHero(burn);
        store.addLogEntry({
          actor: "monster",
          action: "burn",
          statusApplied: "burn",
          message: "You are burning!",
        });
        break;

      case "lifesteal_50":
        // TODO: Implement lifesteal - monster heals for 50% of damage dealt
        // Requires tracking monster's last damage dealt to hero
        break;

      case "double_attack":
        // Handled in executeMonsterTurn
        break;
    }
  }

  // ROUND END

  private static endRound(): void {
    const store = useCombatStore.getState();
    const { hero, monster } = store;

    if (!hero || !monster) return;

    // Process end-of-turn DoTs for hero
    const heroMaxHp = hero.stats.maxHp + hero.stats.bonusMaxHp;
    const heroDef = hero.stats.def + hero.stats.bonusDef;
    const heroTick = processEffectTick(
      hero.statusEffects,
      { maxHp: heroMaxHp, currentHp: hero.stats.hp, def: heroDef },
      "end",
    );

    if (heroTick.damage > 0) {
      store.dealDamageToHero(heroTick.damage);
      heroTick.messages.forEach((msg) => {
        store.addLogEntry({
          actor: "hero",
          action: "dot_damage",
          damage: heroTick.damage,
          message: msg,
        });
      });
    }

    // Process end-of-turn DoTs for monster
    const monsterTick = processEffectTick(
      monster.statusEffects,
      { maxHp: monster.maxHp, currentHp: monster.hp, def: monster.def },
      "end",
    );

    if (monsterTick.damage > 0) {
      store.dealDamageToMonster(monsterTick.damage);
      monsterTick.messages.forEach((msg) => {
        store.addLogEntry({
          actor: "monster",
          action: "dot_damage",
          damage: monsterTick.damage,
          message: msg,
        });
      });
    }

    // Tick durations
    const heroEffectResult = tickEffectDurations(hero.statusEffects);
    const monsterEffectResult = tickEffectDurations(monster.statusEffects);

    // Check if fortify expired (for Bran's HP gain)
    const fortifyExpired = heroEffectResult.expired.includes("fortify");
    if (fortifyExpired) {
      const currentHero = useCombatStore.getState().hero;
      if (currentHero?.definitionId === "bran") {
        const hpGain = Number(currentHero.passiveState.pendingFortifyHpGain ?? 0);
        if (hpGain > 0) {
          store.addHeroBonusStats("bonusMaxHp", hpGain);
          store.addLogEntry({
            actor: "hero",
            action: "fortify_hp_gain",
            message: `Fortify expires: +${hpGain} Max HP permanently.`,
          });
          store.updatePassiveState({ pendingFortifyHpGain: 0 });
        }
      }
    }

    // Check if shield expired
    const shieldExpired = heroEffectResult.expired.includes("shield");

    if (shieldExpired) {
      // Shield expired - need to animate in two steps:
      // 1. First let monster attack animation complete (shield already reduced)
      // 2. Then animate shield going to 0 (expiration)
      // 3. Then remove shield and trigger shatter

      // Get fresh state to capture shield value after monster attack
      const freshHero = useCombatStore.getState().hero;
      const currentShield = freshHero?.statusEffects.find((e) => e.type === "shield");
      const shatterDamage = currentShield?.snapshotAtk ?? 0;

      // Update other effects (not shield) immediately
      const otherEffects = heroEffectResult.remaining.filter((e) => e.type !== "shield");

      useCombatStore.setState((state) => ({
        hero: state.hero
          ? {
              ...state.hero,
              // Keep shield as-is for now (shows damage absorbed), remove other expired
              statusEffects: state.hero.statusEffects.filter(
                (e) => e.type === "shield" || otherEffects.some((o) => o.type === e.type)
              )
            }
          : null,
        monster: state.monster
          ? { ...state.monster, statusEffects: monsterEffectResult.remaining }
          : null,
      }));

      // Step 1: After monster attack animation completes, set shield to 0
      setTimeout(() => {
        useCombatStore.setState((state) => ({
          hero: state.hero
            ? {
                ...state.hero,
                statusEffects: state.hero.statusEffects.map((e) =>
                  e.type === "shield" ? { ...e, value: 0 } : e
                ),
              }
            : null,
        }));

        // Step 2: After shield-to-0 animation completes, remove shield
        setTimeout(() => {
          useCombatStore.setState((state) => ({
            hero: state.hero
              ? {
                  ...state.hero,
                  statusEffects: state.hero.statusEffects.filter((e) => e.type !== "shield"),
                }
              : null,
          }));
          this.handleShieldShatter(shatterDamage, "expired");
        }, 350);
      }, 350);
    } else {
      // No shield expiration, update normally
      useCombatStore.setState((state) => ({
        hero: state.hero
          ? { ...state.hero, statusEffects: heroEffectResult.remaining }
          : null,
        monster: state.monster
          ? { ...state.monster, statusEffects: monsterEffectResult.remaining }
          : null,
      }));
    }

    // Tick cooldowns
    store.tickCooldowns();

    // Check for deaths from DoT
    const updated = useCombatStore.getState();

    if (updated.hero && updated.hero.stats.hp <= 0) {
      this.handleDefeat();
      return;
    }

    if (updated.monster && updated.monster.hp <= 0) {
      this.handleVictory();
      return;
    }

    // Start next player turn
    store.setTurnPhase("player_turn");
    store.incrementTurn();
  }

  // VICTORY / DEFEAT

  private static checkVictoryOrContinue(): void {
    const { monster } = useCombatStore.getState();

    if (monster && monster.hp <= 0) {
      this.handleVictory();
    } else {
      useCombatStore.getState().setTurnPhase("monster_turn");
      setTimeout(() => this.executeMonsterTurn(), 500);
    }
  }

  static handleVictory(): void {
    const combat = useCombatStore.getState();
    const game = useGameStore.getState();
    const { hero, monster } = combat;
    const { run } = game;

    if (!monster || !run || !hero) return;

    // Trigger passive onKill hook before rewards
    triggerOnKill({ hero, monster, source: "ability" });

    game.recordKill(monster.definitionId);

    game.addCrystals(monster.crystalReward);

    game.addExp(monster.expReward);

    const scoreMultiplier =
      run.difficulty === "easy" ? 1.0 : run.difficulty === "medium" ? 1.5 : 2.0;
    
    // Score based on monster base score * difficulty
    const baseScore = monster.scoreReward || 10; // Fallback to 10 if missing
    game.addScore(Math.floor(baseScore * scoreMultiplier));

    combat.addLogEntry({
      actor: "hero",
      action: "victory",
      message: `Victory! Earned ${monster.crystalReward} crystals.`,
    });

    // Level-up check (uses cumulative EXP thresholds)
    while (true) {
      const currentHero = useCombatStore.getState().hero;
      const currentRun = useGameStore.getState().run;
      if (!currentHero || !currentRun) break;

      if (currentHero.level >= MAX_LEVEL) break;
      const nextLevel = currentHero.level + 1;
      const threshold = EXP_THRESHOLDS[nextLevel as keyof typeof EXP_THRESHOLDS];
      if (!threshold) break;

      if (currentRun.exp < threshold) break;

      const def = getHeroDefinition(currentHero.definitionId);
      if (!def) break;

      // Update run-level state (shop/potion resets, monster snapshotting)
      useGameStore.getState().levelUp();

      // Apply hero level scaling gains (index 1 corresponds to level 2 gain)
      // The arrays are length 7, where index 0 is unused/level 1 placeholder.
      const gainIdx = Math.max(0, Math.min(6, nextLevel - 1));
      const scaling = def.levelScaling;

        useCombatStore.setState((state) => {
          if (!state.hero) return {};
          const h = state.hero;
          const maxHp = h.stats.maxHp + (scaling.maxHp[gainIdx] ?? 0);
          const atk = h.stats.atk + (scaling.atk[gainIdx] ?? 0);
          const defStat = h.stats.def + (scaling.def[gainIdx] ?? 0);
          const maxMana = h.stats.maxMana + (scaling.maxMana[gainIdx] ?? 0);
          const manaRegen = h.stats.manaRegen + (scaling.manaRegen[gainIdx] ?? 0);

          const maxManaTotal = maxMana + h.stats.bonusMaxMana;
          const preservedMana = Math.min(maxManaTotal, h.stats.mana);

          return {
            hero: {
              ...h,
              level: nextLevel,
              stats: {
                ...h.stats,
                maxHp,
                atk,
                def: defStat,
                maxMana,
                manaRegen,
                hp: maxHp + h.stats.bonusMaxHp,
                // Leveling up should not refill mana to full.
                mana: preservedMana,
              },
            },
          };
        });

      useCombatStore.getState().addLogEntry({
        actor: "hero",
        action: "level_up",
        message: `Level up! You reached level ${nextLevel}.`,
      });
    }

    combat.setTurnPhase("combat_end");
    game.setPhase("victory");
  }

  static handleDefeat(): void {
    const combat = useCombatStore.getState();
    const game = useGameStore.getState();

    combat.addLogEntry({
      actor: "hero",
      action: "defeat",
      message: "You have been defeated...",
    });

    combat.setTurnPhase("combat_end");
    game.endRun(false);
  }
}
