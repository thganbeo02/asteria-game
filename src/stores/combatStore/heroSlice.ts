import { createHeroState, getHeroDefinition } from "@/data/heroes";
import { HeroSlice, SliceCreator } from "./types";
import { StatusEffect } from "@/types";

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
      const newHp = Math.min(maxHp, state.hero.stats.hp + amount);

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