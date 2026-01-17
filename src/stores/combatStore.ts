import { create } from "zustand";
import { createHeroState } from "@/data/heroes";
import {
  CombatLog,
  Difficulty,
  HeroState,
  HeroStats,
  MonsterState,
  StatusEffect,
  TurnPhase,
  AnimationEvent
} from "@/types";
import { useGameStore } from "./gameStore";
import { createMonsterState, selectRandomMonster } from "@/data/monsters";
import { DAMAGE_FORMULA_CONSTANT, MINIMUM_DAMAGE } from "@/lib/constants";

interface CombatStore {
  // State
  hero: HeroState | null;
  monster: MonsterState | null;
  turnPhase: TurnPhase;
  turnCount: number;
  combatLog: CombatLog[];
  animationQueue: AnimationEvent[];

  // Init
  initCombat: (heroId: string, difficulty: Difficulty) => void;
  spawnMonster: () => void;

  // Turn management
  setTurnPhase: (phase: TurnPhase) => void;
  endPlayerTurn: () => void;
  endMonsterTurn: () => void;

  // Hero actions
  basicAttack: () => void;
  useAbility: (abilityIndex: number) => void;

  // Damage and healing
  dealDamageToMonster: (amount: number, isCrit: boolean) => void;
  dealDamageToHero: (amount: number) => void;
  healHero: (amount: number) => void;

  // Stats
  modifyHeroStats: (changes: Partial<HeroStats>) => void;
  addHeroBonusStats: (stat: keyof HeroStats, amount: number) => void;

  // Status effects
  applyStatusToMonster: (effect: StatusEffect) => void;
  applyStatusToHero: (effect: StatusEffect) => void;
  tickStatusEffects: () => void;
  tickCooldowns: () => void;
  spendMana: (amount: number) => boolean;
  restoreMana: (amount: number) => void;

  // Combat log
  addLogEntry: (entry: Omit<CombatLog, "turn">) => void;

  // Animation
  queueAnimation: (event: Omit<AnimationEvent, "id">) => void;
  clearAnimation: (id: string) => void;

  // Utility
  calculateDamage: (
    attackerAtk: number,
    defenderDef: number,
    penetration: number
  ) => number;
  rollCrit: (critChance: number) => boolean;
  rollDodge: (dodgeChance: number) => boolean;

  // Cleanup
  clearCombat: () => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useCombatStore = create<CombatStore>((set, get) => ({
  // Initial state
  hero: null,
  monster: null,
  turnPhase: "player_turn",
  turnCount: 1,
  combatLog: [],
  animationQueue: [],

  // INITIALIZATION
  initCombat: (heroId, difficulty) => {
    const heroState = createHeroState(heroId);
    if (!heroState) {
      console.error(`Failed to create hero state for: ${heroId}`);
      return;
    }

    set({
      hero: heroState,
      monster: null,
      turnPhase: "player_turn",
      turnCount: 1,
      combatLog: [],
      animationQueue: [],
    });
  },

  spawnMonster: () => {
    const gameStore = useGameStore.getState();
    const { run } = gameStore;

    if (!run) {
      console.error("Cannot spawn monster: no active run");
      return;
    }

    const { currentLevel, internalEncounterCount, difficulty } = run;

    // Select random monster based on level
    const monsterDef = selectRandomMonster(currentLevel);

    // Get snapshotted base stats
    const snapshotBase = gameStore.getMonsterSnapshot(monsterDef.id);

    // Create monster state with snapshot system
    const monsterState = createMonsterState(
      monsterDef,
      snapshotBase,
      currentLevel,
      internalEncounterCount,
      difficulty
    );

    set({ monster: monsterState });

    get().addLogEntry({
      actor: "monster",
      action: "spawn",
      message: `A wild ${monsterDef.name} appears!`,
    });
  },

  // TURN MANAGEMENT

  setTurnPhase: (phase) => set({ turnPhase: phase }),

  endPlayerTurn: () => {
    const { monster } = get();

    // Check if monster is dead
    if (!monster || monster.hp <= 0) {
      set({ turnPhase: "combat_end" });
      return;
    }

    set({ turnPhase: "monster_turn" });
  },

  endMonsterTurn: () => {
    const { hero, tickCooldowns, tickStatusEffects } = get();

    // Check if hero is dead
    if (!hero || hero.stats.hp <= 0) {
      set({ turnPhase: "combat_end" });
      return;
    }

    // Process end-of-round effects
    tickStatusEffects();
    tickCooldowns();

    set((state) => ({
      turnPhase: "player_turn",
      turnCount: state.turnCount + 1,
    }));
  },

  // HERO ACTIONS

  basicAttack: () => {
    const { hero, monster, calculateDamage, rollCrit, rollDodge } = get();
    if (!hero || !monster) return;

    const { stats } = hero;
    const totalAtk = stats.atk + stats.bonusAtk;
    const totalCritChance = stats.critChance + stats.bonusCritChance;
    const totalPenetration = stats.penetration + stats.bonusPenetration;

    // Check dodge
    if (rollDodge(0)) {
      get().addLogEntry({
        actor: "hero",
        action: "basic_attack",
        message: "Attack missed!",
      });
      get().endPlayerTurn();
      return;
    }

    // Check crit
    const isCrit = rollCrit(totalCritChance);

    // Calculate damage
    let damage = calculateDamage(totalAtk, monster.def, totalPenetration);

    if (isCrit) {
      const critMult = stats.critMultiplier + stats.bonusCritMultiplier;
      damage = Math.floor(damage * critMult);
    }

    // Deal damage
    get().dealDamageToMonster(damage, isCrit);

    // Restore mana
    get().restoreMana(stats.manaRegen);

    get().addLogEntry({
      actor: "hero",
      action: "basic_attack",
      damage,
      isCrit,
      message: isCrit
        ? `Critical hit for ${damage} damage!`
        : `Attack deals ${damage} damage.`,
    });

    // Queue animation
    get().queueAnimation({
      type: "damage",
      target: "monster",
      value: damage,
      isCrit,
    });

    get().endPlayerTurn();
  },

  useAbility: (abilityIndex) => {
    const { hero, spendMana } = get();
    if (!hero) return;

    const ability = hero.abilities[abilityIndex];
    if (!ability) return;

    // Check cooldown
    if (ability.currentCooldown > 0) {
      get().addLogEntry({
        actor: "hero",
        action: ability.id,
        message: `${ability.name} is on cooldown (${ability.currentCooldown} turns remaining).`,
      });
      return;
    }

    // Get mana cost for current level
    const level = hero.level;
    const manaCost = ability.manaCost[Math.min(level - 1, 6)];

    // Check and spend mana
    if (!spendMana(manaCost)) {
      get().addLogEntry({
        actor: "hero",
        action: ability.id,
        message: `Not enough mana for ${ability.name}. Need ${manaCost}, have ${hero.stats.mana}.`,
      });
      return;
    }

    // Set cooldown
    set((state) => {
      if (!state.hero) return state;

      const newAbilities = [...state.hero.abilities];
      newAbilities[abilityIndex] = {
        ...newAbilities[abilityIndex],
        currentCooldown: ability.cooldown,
      };

      return {
        hero: {
          ...state.hero,
          abilities: newAbilities,
        },
      };
    });

    get().addLogEntry({
      actor: "hero",
      action: ability.id,
      message: `Used ${ability.name}!`,
    });

    // NOTE: Actual ability effects will be implemented in a separate
    // abilities system. For now, this just handles the mana/cooldown.
    // The combat engine will process ability.tags to determine effects.

    get().endPlayerTurn();
  },

  // DAMAGE AND HEALING

  dealDamageToMonster: (amount, isCrit) => {
    set((state) => {
      if (!state.monster) return state;

      const newHp = Math.max(0, state.monster.hp - amount);

      return {
        monster: {
          ...state.monster,
          hp: newHp,
        },
      };
    });
  },

  dealDamageToHero: (amount) => {
    set((state) => {
      if (!state.hero) return state;

      // Check for shields
      const shieldEffect = state.hero.statusEffects.find(
        (e) => e.type === "shield"
      );
      let remainingDamage = amount;
      let newStatusEffects = [...state.hero.statusEffects];

      if (shieldEffect && shieldEffect.value > 0) {
        if (shieldEffect.value >= remainingDamage) {
          // Shield absorbs all damage
          newStatusEffects = newStatusEffects.map((e) =>
            e.type === "shield" ? { ...e, value: e.value - remainingDamage } : e
          );
          remainingDamage = 0;
        } else {
          // Shield breaks, remaining damage goes through
          remainingDamage -= shieldEffect.value;
          newStatusEffects = newStatusEffects.filter(
            (e) => e.type !== "shield"
          );
        }
      }

      const newHp = Math.max(0, state.hero.stats.hp - remainingDamage);

      return {
        hero: {
          ...state.hero,
          stats: {
            ...state.hero.stats,
            hp: newHp,
          },
          statusEffects: newStatusEffects,
        },
      };
    });
  },

  healHero: (amount) => {
    set((state) => {
      if (!state.hero) return state;

      const maxHp = state.hero.stats.maxHp + state.hero.stats.bonusMaxHp;
      const newHp = Math.min(maxHp, state.hero.stats.hp + amount);

      return {
        hero: {
          ...state.hero,
          stats: {
            ...state.hero.stats,
            hp: newHp,
          },
        },
      };
    });
  },

  // STATS

  modifyHeroStats: (changes) => {
    set((state) => {
      if (!state.hero) return state;

      return {
        hero: {
          ...state.hero,
          stats: {
            ...state.hero.stats,
            ...changes,
          },
        },
      };
    });
  },

  addHeroBonusStats: (stat, amount) => {
    set((state) => {
      if (!state.hero) return state;

      return {
        hero: {
          ...state.hero,
          stats: {
            ...state.hero.stats,
            [stat]: state.hero.stats[stat] + amount,
          },
        },
      };
    });
  },

  // STATUS EFFECTS

  applyStatusToMonster: (effect) => {
    set((state) => {
      if (!state.monster) return state;

      // Check if effect already exists (for stacking)
      const existingIndex = state.monster.statusEffects.findIndex(
        (e) => e.type === effect.type
      );

      let newEffects: StatusEffect[];

      if (existingIndex >= 0) {
        // Stack or refresh existing effect
        newEffects = [...state.monster.statusEffects];
        const existing = newEffects[existingIndex];
        newEffects[existingIndex] = {
          ...existing,
          stacks: existing.stacks + effect.stacks,
          duration: Math.max(existing.duration, effect.duration),
        };
      } else {
        // Add new effect
        newEffects = [...state.monster.statusEffects, effect];
      }

      return {
        monster: {
          ...state.monster,
          statusEffects: newEffects,
        },
      };
    });
  },

  applyStatusToHero: (effect) => {
    set((state) => {
      if (!state.hero) return state;

      const existingIndex = state.hero.statusEffects.findIndex(
        (e) => e.type === effect.type
      );

      let newEffects: StatusEffect[];

      if (existingIndex >= 0) {
        newEffects = [...state.hero.statusEffects];
        const existing = newEffects[existingIndex];
        newEffects[existingIndex] = {
          ...existing,
          stacks: existing.stacks + effect.stacks,
          duration: Math.max(existing.duration, effect.duration),
        };
      } else {
        newEffects = [...state.hero.statusEffects, effect];
      }

      return {
        hero: {
          ...state.hero,
          statusEffects: newEffects,
        },
      };
    });
  },

  tickStatusEffects: () => {
    set((state) => {
      if (!state.hero || !state.monster) return state;

      // Process hero effects
      const heroEffects = state.hero.statusEffects
        .map((effect) => {
          // Apply DoT damage, etc.
          if (effect.type === "burn" || effect.type === "poison") {
            // Damage is handled in combat engine
          }

          // Decrement duration
          return {
            ...effect,
            duration: effect.duration - 1,
          };
        })
        .filter((effect) => effect.duration > 0 || effect.duration === -1);

      // Process monster effects
      const monsterEffects = state.monster.statusEffects
        .map((effect) => ({
          ...effect,
          duration: effect.duration - 1,
        }))
        .filter((effect) => effect.duration > 0 || effect.duration === -1);

      return {
        hero: {
          ...state.hero,
          statusEffects: heroEffects,
        },
        monster: {
          ...state.monster,
          statusEffects: monsterEffects,
        },
      };
    });
  },

  // COOLDOWNS AND MANA
  tickCooldowns: () => {
    set((state) => {
      if (!state.hero) return state;

      const newAbilities = state.hero.abilities.map((ability) => ({
        ...ability,
        currentCooldown: Math.max(0, ability.currentCooldown - 1),
      }));

      return {
        hero: {
          ...state.hero,
          abilities: newAbilities,
        },
      };
    });
  },

  spendMana: (amount) => {
    const { hero } = get();
    if (!hero || hero.stats.mana < amount) return false;

    set((state) => {
      if (!state.hero) return state;

      return {
        hero: {
          ...state.hero,
          stats: {
            ...state.hero.stats,
            mana: state.hero.stats.mana - amount,
          },
        },
      };
    });

    return true;
  },

  restoreMana: (amount) => {
    set((state) => {
      if (!state.hero) return state;

      const maxMana = state.hero.stats.maxMana + state.hero.stats.bonusMaxMana;
      const newMana = Math.min(maxMana, state.hero.stats.mana + amount);

      return {
        hero: {
          ...state.hero,
          stats: {
            ...state.hero.stats,
            mana: newMana,
          },
        },
      };
    });
  },

  // ---------------------------------------------------------------------------
  // COMBAT LOG
  // ---------------------------------------------------------------------------

  addLogEntry: (entry) => {
    set((state) => ({
      combatLog: [
        ...state.combatLog,
        {
          ...entry,
          turn: state.turnCount,
        },
      ],
    }));
  },

  // ---------------------------------------------------------------------------
  // ANIMATION
  // ---------------------------------------------------------------------------

  queueAnimation: (event) => {
    const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    set((state) => ({
      animationQueue: [...state.animationQueue, { ...event, id }],
    }));
  },

  clearAnimation: (id) => {
    set((state) => ({
      animationQueue: state.animationQueue.filter((e) => e.id !== id),
    }));
  },

  // ---------------------------------------------------------------------------
  // UTILITY
  // ---------------------------------------------------------------------------

  calculateDamage: (attackerAtk, defenderDef, penetration) => {
    // Apply penetration: ignore X% of defender's DEF
    const effectiveDef = defenderDef * (1 - penetration / 100);

    // Damage formula: ATK × 200 / (200 + DEF)
    const damage =
      (attackerAtk * DAMAGE_FORMULA_CONSTANT) /
      (DAMAGE_FORMULA_CONSTANT + effectiveDef);

    return Math.max(MINIMUM_DAMAGE, Math.floor(damage));
  },

  rollCrit: (critChance) => {
    return Math.random() * 100 < critChance;
  },

  rollDodge: (dodgeChance) => {
    return Math.random() * 100 < dodgeChance;
  },

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  clearCombat: () => {
    set({
      hero: null,
      monster: null,
      turnPhase: "player_turn",
      turnCount: 1,
      combatLog: [],
      animationQueue: [],
    });
  },
}));
