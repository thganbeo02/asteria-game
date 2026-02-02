import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCombatStore, useGameStore } from "@/stores";
import { CAMIRA } from "@/data/heroes/camira";
import { createHeroState } from "@/data/heroes";
import { TurnManager } from "@/systems/combat/turnManager";

// Mock random for deterministic tests
const mockRandom = vi.fn();
Math.random = mockRandom;

function setRandom(val: number) {
  mockRandom.mockReturnValue(val);
}

describe("Camira Kit Tests", () => {
  beforeEach(() => {
    const combat = useCombatStore.getState();
    combat.clearCombat();
    
    // Initialize Camira
    const camiraState = createHeroState("camira");
    if (!camiraState) throw new Error("Failed to create Camira state");
    
    // Set level 1 by default
    camiraState.level = 1;
    camiraState.stats.atk = 12; // Base
    
    useCombatStore.setState({ hero: camiraState });
    
    // Initialize Run for game store dependencies
    useGameStore.getState().startRun("camira", "easy");
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

    // Reset logs
    combat.clearLog();
  });

  describe("Base Stats", () => {
    it("should have correct base stats", () => {
      const { hero } = useCombatStore.getState();
      expect(hero?.stats.maxHp).toBe(CAMIRA.baseStats.maxHp);
      expect(hero?.stats.atk).toBe(CAMIRA.baseStats.atk);
      expect(hero?.stats.critChance).toBe(CAMIRA.baseStats.critChance);
      expect(hero?.stats.dodge).toBe(CAMIRA.baseStats.dodge);
    });
  });

  describe("Passive: Deadeye Hustle", () => {
    it("should trigger bonus damage on 3rd basic attack", () => {
      // Hit 1
      setRandom(0.99); // No crit
      TurnManager.executeBasicAttack();
      expect(useCombatStore.getState().hero?.passiveState.attackCount).toBe(1);
      
      // Hit 2
      setRandom(0.99); // No crit
      TurnManager.executeBasicAttack();
      expect(useCombatStore.getState().hero?.passiveState.attackCount).toBe(2);
      
      // Hit 3 (Trigger)
      setRandom(0.99); // No crit
      const initialLogLength = useCombatStore.getState().combatLog.length;
      TurnManager.executeBasicAttack();
      
      const logs = useCombatStore.getState().combatLog.slice(initialLogLength);
      const bonusLog = logs.find(l => l.action === "camira_deadeye");
      
      expect(bonusLog).toBeDefined();
      expect(useCombatStore.getState().hero?.passiveState.attackCount).toBe(0);
    });

    it("should not trigger bonus damage on abilities", () => {
      // Use ability 2 times
      // Rapid Fire is index 0
      useCombatStore.setState(state => {
        if (state.hero) {
          state.hero.abilities[0].currentCooldown = 0;
          state.hero.stats.mana = 100;
        }
        return state;
      });
      
      setRandom(0.5); 
      TurnManager.executeAbility(0); // Rapid Fire
      
      expect(useCombatStore.getState().hero?.passiveState.attackCount).toBe(0);
    });

    it("should restore mana and reduce Rapid Fire CD on crit", () => {
      // Set Rapid Fire on CD
      useCombatStore.setState(state => {
        if (state.hero) {
          state.hero.abilities[0].currentCooldown = 2;
          state.hero.stats.mana = 10;
          state.hero.stats.maxMana = 100;
        }
        return state;
      });

      // Force crit on basic attack
      setRandom(0.1); 
      
      TurnManager.executeBasicAttack();
      
      const logs = useCombatStore.getState().combatLog;
      const critLog = logs.find(l => l.action === "camira_crit");
      const cdLog = logs.find(l => l.action === "camira_cd");
      
      expect(critLog).toBeDefined();
      expect(cdLog).toBeDefined();
      
      const hero = useCombatStore.getState().hero;
      expect(hero?.abilities[0].currentCooldown).toBe(1); // Reduced from 2 to 1
      expect(hero?.stats.mana).toBeGreaterThan(10 + 4); // 4 regeneration + 2-5 bonus
    });
  });

  describe("Ability: Rapid Fire", () => {
    it("should hit twice and heal", () => {
       // Setup mana
       useCombatStore.setState(state => {
        if (state.hero) state.hero.stats.mana = 100;
        return state;
      });

      setRandom(0.5); // No crit
      
      const initialLogLength = useCombatStore.getState().combatLog.length;
      TurnManager.executeAbility(0);
      
      const logs = useCombatStore.getState().combatLog.slice(initialLogLength);
      const hits = logs.filter(l => l.action === "camira_rapid_fire");
      const heal = logs.find(l => l.action === "lifesteal");
      
      expect(hits.length).toBe(2);
      expect(heal).toBeDefined();
    });
  });

  describe("Ability: Forest Agility", () => {
    it("should apply evade and grant stats", () => {
       // Setup mana
       useCombatStore.setState(state => {
        if (state.hero) state.hero.stats.mana = 100;
        return state;
      });

      const initialAtk = useCombatStore.getState().hero!.stats.atk + useCombatStore.getState().hero!.stats.bonusAtk;
      
      TurnManager.executeAbility(1);
      
      const hero = useCombatStore.getState().hero;
      const evade = hero?.statusEffects.find(e => e.type === "evade");
      
      expect(evade).toBeDefined();
      expect(evade?.value).toBe(60);
      
      const newAtk = hero!.stats.atk + hero!.stats.bonusAtk;
      expect(newAtk).toBeGreaterThan(initialAtk);
    });
  });

  describe("Ability: Jackpot Arrow", () => {
    it("should deal damage and not crit", () => {
       // Setup mana
       useCombatStore.setState(state => {
         if (state.hero) {
          state.hero.stats.mana = 100;
          // Force a crit if abilities were allowed to crit
          state.hero.stats.critChance = 100;
          state.hero.stats.bonusCritChance = 0;
         }
         return state;
       });

       const initialCrit = useCombatStore.getState().hero!.stats.critChance + useCombatStore.getState().hero!.stats.bonusCritChance;

       setRandom(0.0);
       TurnManager.executeAbility(2);

       const hero = useCombatStore.getState().hero;
       const newCrit = hero!.stats.critChance + hero!.stats.bonusCritChance;

       expect(newCrit).toBe(initialCrit);
       expect(hero?.passiveState.jackpotStacks).toBeUndefined();

       const logs = useCombatStore.getState().combatLog;
       const jp = [...logs].reverse().find(l => l.action === "camira_jackpot_arrow");
       expect(jp).toBeDefined();
       expect(jp?.isCrit).toBe(false);
    });


    it("should grant crystals on kill", () => {
        // Setup mana and monster HP low
        useCombatStore.setState(state => {
            if (state.hero) state.hero.stats.mana = 100;
            if (state.monster) state.monster.hp = 1;
            return state;
        });

        setRandom(0.5);
        TurnManager.executeAbility(2);
        
        // Check logs for crystal_on_kill
        const logs = useCombatStore.getState().combatLog;
        const crystalLog = logs.find(l => l.action === "crystal_on_kill");
        
        expect(crystalLog).toBeDefined();
        
        // We can't easily check game.run.crystals because TurnManager.handleVictory might have triggered and cleaned up or changed phase.
        // But the log entry confirms the logic ran.
    });
  });
});
