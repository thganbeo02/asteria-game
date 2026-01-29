import { createHeroState } from "@/data/heroes";
import { HeroSlice, SliceCreator } from "./types";
import { ItemStats, StatusEffect } from "@/types";
import { applyHealing } from "@/systems/combat/damageCalculator";

export const createHeroSlice: SliceCreator<HeroSlice> = (set,get) => ({
  hero: null,

  initHero: (heroId) => {
    const heroState = createHeroState(heroId);
    if (!heroState) {
      console.error(`Failed to create hero state for: ${heroId}`);
      return;
    }
    set({ hero: heroState });
  },

  dealDamageToHero: (amount) => {
    set((state) => {
      if (!state.hero) return {};

      // Check for shields first
      const shieldEffect = state.hero.statusEffects.find(e => e.type === "shield");
      let remainingDamage = amount;
      let newStatusEffects = [...state.hero.statusEffects];

      if (shieldEffect && shieldEffect.value > 0) {
        if (shieldEffect.value >= remainingDamage) {
          // Shield absorbs all damage
          newStatusEffects = newStatusEffects.map(e =>
            e.type === "shield"
              ? { ...e, value: e.value - remainingDamage }
              : e
          );
          remainingDamage = 0;
        } else {
          // Shield breaks
          remainingDamage -= shieldEffect.value;
          newStatusEffects = newStatusEffects.filter(e => e.type !== "shield");
        }
      }

      const newHp = Math.max(0, state.hero.stats.hp - remainingDamage);

      return {
        hero: {
          ...state.hero,
          stats: { ...state.hero.stats, hp: newHp },
          statusEffects: newStatusEffects,
        },
      };
    });
  },

  healHero: (amount) => {
    set((state) => {
      if (!state.hero) return {};

      const maxHp = state.hero.stats.maxHp + state.hero.stats.bonusMaxHp;
      const effectiveHealing = applyHealing(amount, state.hero.statusEffects);
      const newHp = Math.min(maxHp, state.hero.stats.hp + effectiveHealing);


      return {
        hero: {
          ...state.hero,
          stats: { ...state.hero.stats, hp: newHp },
        },
      };
    });
  },

  modifyHeroStats: (changes) => {
    set((state) => {
      if (!state.hero) return {};

      return {
        hero: {
          ...state.hero,
          stats: { ...state.hero.stats, ...changes },
        },
      };
    });
  },

  addHeroBonusStats: (stat, amount) => {
    set((state) => {
      if (!state.hero) return {};

      return {
        hero: {
          ...state.hero,
          stats: {
            ...state.hero.stats,
            [stat]: (state.hero.stats[stat] as number) + amount,
          },
        },
      };
    });
  },

  applyItemStats: (stats: ItemStats) => {
    set((state) => {
      if (!state.hero) return {};

      const h = state.hero;
      const s = h.stats;

      const bonusAtk = s.bonusAtk + (stats.atk ?? 0);
      const bonusDef = s.bonusDef + (stats.def ?? 0);
      const bonusMaxHp = s.bonusMaxHp + (stats.maxHp ?? 0);
      const bonusMaxMana = s.bonusMaxMana + (stats.maxMana ?? 0);
      const manaRegen = s.manaRegen + (stats.manaRegen ?? 0);
      const bonusCritChance = s.bonusCritChance + (stats.critChance ?? 0);
      const bonusCritMultiplier = s.bonusCritMultiplier + (stats.critMultiplier ?? 0);
      const bonusDodge = s.bonusDodge + (stats.dodge ?? 0);
      const bonusPenetration = s.bonusPenetration + (stats.penetration ?? 0);

      const oldMaxHp = s.maxHp + s.bonusMaxHp;
      const oldMaxMana = s.maxMana + s.bonusMaxMana;
      const newMaxHp = s.maxHp + bonusMaxHp;
      const newMaxMana = s.maxMana + bonusMaxMana;

      // GDD: buying max HP / max Mana also increases current HP / Mana by the same delta.
      const hpDelta = (stats.maxHp ?? 0);
      const manaDelta = (stats.maxMana ?? 0);

      const newHp = Math.min(newMaxHp, Math.max(0, s.hp + hpDelta));
      const newMana = Math.min(newMaxMana, Math.max(0, s.mana + manaDelta));

      // Clamp in case an item ever reduces maxima (shouldn't happen with current content)
      const clampedHp = Math.min(newMaxHp, newHp);
      const clampedMana = Math.min(newMaxMana, newMana);

      return {
        hero: {
          ...h,
          stats: {
            ...s,
            manaRegen,
            bonusAtk,
            bonusDef,
            bonusMaxHp,
            bonusMaxMana,
            bonusCritChance,
            bonusCritMultiplier,
            bonusDodge,
            bonusPenetration,
            hp: oldMaxHp === newMaxHp ? s.hp : clampedHp,
            mana: oldMaxMana === newMaxMana ? s.mana : clampedMana,
          },
        },
      };
    });
  },

  spendMana: (amount) => {
    const { hero } = get();
    if (!hero || hero.stats.mana < amount) return false;

    set((state) => {
      if (!state.hero) return {};

      return {
        hero: {
          ...state.hero,
          stats: { ...state.hero.stats, mana: state.hero.stats.mana - amount },
        },
      };
    });

    return true;
  },

  restoreMana: (amount) => {
    set((state) => {
      if (!state.hero) return {};

      const maxMana = state.hero.stats.maxMana + state.hero.stats.bonusMaxMana;
      const newMana = Math.min(maxMana, state.hero.stats.mana + amount);

      return {
        hero: {
          ...state.hero,
          stats: { ...state.hero.stats, mana: newMana },
        },
      };
    });
  },

  applyStatusToHero: (effect) => {
    set((state) => {
      if (!state.hero) return {};

      const existingIndex = state.hero.statusEffects.findIndex(
        e => e.type === effect.type
      );

      let newEffects: StatusEffect[];

      if (existingIndex >= 0) {
        // Stack or refresh existing
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
        hero: { ...state.hero, statusEffects: newEffects },
      };
    });
  },

  removeHeroStatus: (type) => {
    set((state) => {
      if (!state.hero) return {};

      return {
        hero: {
          ...state.hero,
          statusEffects: state.hero.statusEffects.filter(e => e.type !== type),
        },
      };
    });
  },

  setAbilityCooldown: (index, cooldown) => {
    set((state) => {
      if (!state.hero) return {};

      const newAbilities = [...state.hero.abilities];
      if (newAbilities[index]) {
        newAbilities[index] = {
          ...newAbilities[index],
          currentCooldown: cooldown,
        };
      }

      return {
        hero: { ...state.hero, abilities: newAbilities },
      };
    });
  },

  tickCooldowns: () => {
    set((state) => {
      if (!state.hero) return {};

      const newAbilities = state.hero.abilities.map(ability => ({
        ...ability,
        currentCooldown: Math.max(0, ability.currentCooldown - 1),
      }));

      return {
        hero: { ...state.hero, abilities: newAbilities },
      };
    });
  },

  updatePassiveState: (updates) => {
    set((state) => {
      if (!state.hero) return {};

      return {
        hero: {
          ...state.hero,
          passiveState: { ...state.hero.passiveState, ...updates },
        },
      };
    });
  },
})
