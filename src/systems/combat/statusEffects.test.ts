import { describe, it, expect, vi } from 'vitest';
import { 
  createStatusEffect, 
  applyEffect, 
  processEffectTick, 
  tickEffectDurations, 
  getOutgoingDamageModifier,
  getDefenseModifier,
  processShieldAbsorption,
  TickContext
} from './statusEffects';
import { StatusEffect } from '@/types';
import * as damageCalculator from './damageCalculator';

describe('statusEffects', () => {
  describe('createStatusEffect', () => {
    it('creates an effect with default duration', () => {
      const effect = createStatusEffect('burn', 'hero', 5);
      expect(effect.type).toBe('burn');
      expect(effect.duration).toBe(3); // Default from definitions
      expect(effect.value).toBe(5);
    });

    it('clamps stacks to max stacks', () => {
      const effect = createStatusEffect('poison', 'hero', 5, undefined, 10);
      expect(effect.stacks).toBe(5); // Poison max stacks is 5
    });
  });

  describe('applyEffect', () => {
    it('adds new effect if not present', () => {
      const current: StatusEffect[] = [];
      const newEffect = createStatusEffect('burn', 'hero', 5);
      const updated = applyEffect(current, newEffect);
      expect(updated).toHaveLength(1);
      expect(updated[0]).toEqual(newEffect);
    });

    it('refreshes duration for non-stackable effects', () => {
        // Burn is not stackable
        const oldEffect = createStatusEffect('burn', 'hero', 5, 1);
        const newEffect = createStatusEffect('burn', 'hero', 5, 3);
        const updated = applyEffect([oldEffect], newEffect);
        
        expect(updated).toHaveLength(1);
        expect(updated[0].duration).toBe(3);
    });

    it('stacks stackable effects', () => {
        // Poison is stackable
        const oldEffect = createStatusEffect('poison', 'hero', 2, 2, 2);
        const newEffect = createStatusEffect('poison', 'hero', 2, 4, 1);
        const updated = applyEffect([oldEffect], newEffect);
        
        expect(updated).toHaveLength(1);
        expect(updated[0].stacks).toBe(3); // 2 + 1
        expect(updated[0].duration).toBe(4); // Takes max duration
    });

    it('caps stacks at max', () => {
        const oldEffect = createStatusEffect('poison', 'hero', 2, 2, 4);
        const newEffect = createStatusEffect('poison', 'hero', 2, 4, 2);
        const updated = applyEffect([oldEffect], newEffect);
        
        expect(updated[0].stacks).toBe(5); // Max is 5
    });
  });

  describe('processEffectTick', () => {
    // Mock damage calculator functions to ensure we are testing the orchestration
    // rather than the math (which is tested in damageCalculator.test.ts)
    
    it('processes burn at end of turn', () => {
      const burnEffect = createStatusEffect('burn', 'hero', 5); // 5% max HP
      const context: TickContext = { maxHp: 100, currentHp: 100, def: 0 };
      
      // We expect calculateBurnDamage to be called.
      // For this test, let's just rely on the real calculation since it's simple enough
      // 5% of 100 = 5 damage. Def 0 means 5 damage.
      
      const result = processEffectTick([burnEffect], context, 'end');
      
      expect(result.damage).toBe(5);
      expect(result.messages[0]).toMatch(/Burn deals 5 damage/);
    });

    it('ignores effects with wrong timing', () => {
      const burnEffect = createStatusEffect('burn', 'hero', 5); // timing: 'end'
      const context: TickContext = { maxHp: 100, currentHp: 100, def: 0 };
      
      const result = processEffectTick([burnEffect], context, 'start');
      
      expect(result.damage).toBe(0);
    });

    it('processes stun at start of turn', () => {
      const stunEffect = createStatusEffect('stun', 'monster', 1);
      const context: TickContext = { maxHp: 100, currentHp: 100, def: 0 };
      
      const result = processEffectTick([stunEffect], context, 'start');
      
      expect(result.skipTurn).toBe(true);
    });
  });

  describe('tickEffectDurations', () => {
    it('decrements duration', () => {
      const effect = createStatusEffect('burn', 'hero', 5, 2);
      const { remaining, expired } = tickEffectDurations([effect]);
      
      expect(remaining).toHaveLength(1);
      expect(remaining[0].duration).toBe(1);
      expect(expired).toHaveLength(0);
    });

    it('removes expired effects', () => {
      const effect = createStatusEffect('burn', 'hero', 5, 1);
      const { remaining, expired } = tickEffectDurations([effect]);
      
      expect(remaining).toHaveLength(0);
      expect(expired).toHaveLength(1);
      expect(expired[0]).toBe('burn');
    });

    it('does not decrement duration for infinite effects (-1)', () => {
      // Assuming -1 is infinite based on code reading, though definitions don't use it yet
      // momentum uses -1
      const effect = createStatusEffect('momentum', 'hero', 10, -1);
      const { remaining } = tickEffectDurations([effect]);
      
      expect(remaining[0].duration).toBe(-1);
    });
  });

  describe('Modifiers', () => {
    it('calculates outgoing damage modifier (chill)', () => {
      const chill = createStatusEffect('chill', 'monster', 20); // 20% reduced damage
      const mod = getOutgoingDamageModifier([chill]);
      expect(mod).toBe(0.8);
    });

    it('calculates defense modifier (fortify)', () => {
      const fortify = createStatusEffect('fortify', 'hero', 50); // 50% increased def
      const mod = getDefenseModifier([fortify]);
      expect(mod).toBe(1.5);
    });
  });

  describe('Shields', () => {
    it('absorbs damage', () => {
      const shield = createStatusEffect('shield', 'hero', 50);
      const { remainingDamage, newEffects, absorbed, shieldBroken } = processShieldAbsorption([shield], 30);
      
      expect(remainingDamage).toBe(0);
      expect(absorbed).toBe(30);
      expect(shieldBroken).toBe(false);
      expect(newEffects[0].value).toBe(20);
    });

    it('breaks shield when damage exceeds value', () => {
      const shield = createStatusEffect('shield', 'hero', 50);
      const { remainingDamage, newEffects, absorbed, shieldBroken } = processShieldAbsorption([shield], 70);
      
      expect(remainingDamage).toBe(20);
      expect(absorbed).toBe(50);
      expect(shieldBroken).toBe(true);
      expect(newEffects[0].value).toBe(0);
    });
  });
});
