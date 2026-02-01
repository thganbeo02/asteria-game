import { beforeEach, describe, expect, it, vi } from "vitest";

import { createHeroState } from "@/data/heroes";
import { BRAN, BRAN_FORTIFY_HP_GAIN } from "@/data/heroes/bran";
import { TurnManager } from "@/systems/combat/turnManager";
import { useCombatStore, useGameStore } from "@/stores";

// Mock random for deterministic tests
const mockRandom = vi.fn();
Math.random = mockRandom;

function setRandom(val: number) {
  mockRandom.mockReturnValue(val);
}

describe("Bran Kit Tests", () => {
  beforeEach(() => {
    const combat = useCombatStore.getState();
    combat.clearCombat();

    const branState = createHeroState("bran");
    if (!branState) throw new Error("Failed to create Bran state");

    // Stable, easy-to-reason-about stats
    branState.level = 1;
    branState.stats.atk = 14;
    branState.stats.def = 24;
    branState.stats.mana = 999;
    branState.stats.maxMana = 999;
    branState.stats.hp = 999;
    branState.stats.maxHp = 999;

    useCombatStore.setState({ hero: branState });

    // Initialize Run for game store dependencies
    useGameStore.getState().startRun("bran", "easy");
    useGameStore.setState({ phase: "combat" });

    // Spawn a dummy monster (Slime)
    const monsterState = {
      definitionId: "slime" as const,
      hp: 1000,
      maxHp: 1000,
      atk: 0,
      def: 0,
      crystalReward: 10,
      expReward: 10,
      scoreReward: 2,
      statusEffects: [],
      turnCount: 0,
      patternIndex: 0,
    };
    useCombatStore.setState({ monster: monsterState });

    combat.clearLog();
    setRandom(0.99);
  });

  describe("Base Stats", () => {
    it("should have correct base stats", () => {
      const { hero } = useCombatStore.getState();
      expect(hero?.definitionId).toBe("bran");
      expect(hero?.stats.maxHp).toBe(999);
      expect(hero?.stats.atk).toBe(14);
      expect(hero?.stats.def).toBe(24);
      expect(hero?.stats.critChance).toBe(BRAN.baseStats.critChance);
      expect(hero?.stats.dodge).toBe(BRAN.baseStats.dodge);
    });
  });

  describe("Ability: Fortify", () => {
    it("should apply Fortify and track pending HP gain", () => {
      TurnManager.executeAbility(1);

      const hero = useCombatStore.getState().hero!;
      const fortify = hero.statusEffects.find((e) => e.type === "fortify");
      expect(fortify).toBeDefined();
      expect(fortify?.value).toBe(40);
      expect(fortify?.duration).toBe(3);

      expect(hero.passiveState.pendingFortifyHpGain).toBe(BRAN_FORTIFY_HP_GAIN[0]);
      expect(hero.passiveState.fortifyUses).toBe(1);
    });

    it("should grant permanent max HP when Fortify expires", () => {
      vi.useFakeTimers();
      try {
        const initialBonusMaxHp = Number(useCombatStore.getState().hero!.stats.bonusMaxHp ?? 0);

        // Cast Fortify (schedules monster turn)
        TurnManager.executeAbility(1);
        vi.advanceTimersByTime(500);

        // 2 more full rounds to tick duration 2 -> 1 -> 0 and expire
        TurnManager.executeBasicAttack();
        vi.advanceTimersByTime(500);
        TurnManager.executeBasicAttack();
        vi.advanceTimersByTime(500);

        const hero = useCombatStore.getState().hero!;
        const hpGain = BRAN_FORTIFY_HP_GAIN[0];
        expect(hero.stats.bonusMaxHp).toBe(initialBonusMaxHp + hpGain);
        expect(hero.passiveState.pendingFortifyHpGain).toBe(0);
        expect(hero.statusEffects.some((e) => e.type === "fortify")).toBe(false);

        const log = useCombatStore.getState().combatLog.find((l) => l.action === "fortify_hp_gain");
        expect(log).toBeDefined();
      } finally {
        vi.useRealTimers();
      }
    });

    it("should grant bonus stats every 5 Fortify uses", () => {
      // 1. Set uses to 4 (so next cast is the 5th)
      useCombatStore.getState().updatePassiveState({ fortifyUses: 4 });
      
      // 2. Cast 5th time
      TurnManager.executeAbility(1);
      
      // 3. Check stats (10 ATK, 5 Pen)
      // Must re-fetch state after updates
      const heroAfterFirst = useCombatStore.getState().hero!;
      expect(heroAfterFirst.stats.bonusAtk).toBe(10);
      expect(heroAfterFirst.stats.bonusPenetration).toBe(5);
      
      // 4. Set uses to 9 (so next cast is the 10th)
      useCombatStore.getState().updatePassiveState({ fortifyUses: 9 });
      
      // Force reset cooldown to cast immediately
      const hero = useCombatStore.getState().hero!;
      const abilities = [...hero.abilities];
      abilities[1] = { ...abilities[1], currentCooldown: 0 };
      useCombatStore.setState({ hero: { ...hero, abilities } });

      // 5. Cast 10th time
      TurnManager.executeAbility(1);
      
      // 6. Check stats (20 ATK, 10 Pen)
      const heroAfterSecond = useCombatStore.getState().hero!;
      expect(heroAfterSecond.stats.bonusAtk).toBe(20);
      expect(heroAfterSecond.stats.bonusPenetration).toBe(10);
    });
  });

  describe("Ability: Shield Slam", () => {
    it("should deal more damage while Fortify is active", () => {
      vi.useFakeTimers();
      try {
        // First Shield Slam without Fortify
        const hp0 = useCombatStore.getState().monster!.hp;
        TurnManager.executeAbility(0);
        const hp1 = useCombatStore.getState().monster!.hp;
        const dmg1 = hp0 - hp1;

        // Advance to next player turn
        vi.advanceTimersByTime(500);

        // Cast Fortify and advance to next player turn
        TurnManager.executeAbility(1);
        vi.advanceTimersByTime(500);

        // Second Shield Slam with Fortify active
        const hp2 = useCombatStore.getState().monster!.hp;
        TurnManager.executeAbility(0);
        const hp3 = useCombatStore.getState().monster!.hp;
        const dmg2 = hp2 - hp3;

        expect(dmg2).toBeGreaterThan(dmg1);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should not crit on abilities (even with 100% crit chance)", () => {
      vi.useFakeTimers();
      try {
        const combat = useCombatStore.getState();
        const hero = combat.hero!;

        // Force a crit if abilities were allowed to crit
        hero.stats.critChance = 100;
        hero.stats.bonusCritChance = 0;
        useCombatStore.setState({ hero: { ...hero } });
        setRandom(0.0);

        // Cast Crushing Blow (ability index 2)
        TurnManager.executeAbility(2);

        const critLog = useCombatStore
          .getState()
          .combatLog.find((l) => l.action === "bran_crushing_blow");
        expect(critLog?.isCrit).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should not crit on Shield Slam (even with 100% crit chance)", () => {
      vi.useFakeTimers();
      try {
        const combat = useCombatStore.getState();
        const hero = combat.hero!;

        // Force a crit if abilities were allowed to crit
        hero.stats.critChance = 100;
        hero.stats.bonusCritChance = 0;
        useCombatStore.setState({ hero: { ...hero } });
        setRandom(0.0);

        TurnManager.executeAbility(0);

        const log = useCombatStore
          .getState()
          .combatLog.find((l) => l.action === "bran_shield_slam");
        expect(log?.isCrit).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
