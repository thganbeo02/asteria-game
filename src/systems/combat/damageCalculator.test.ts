import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateDamage, DamageContext, calculateEffectiveDef, applyDamageFormula } from './damageCalculator';
import { MINIMUM_DAMAGE } from '@/lib/constants';

describe('damageCalculator', () => {
  describe('calculateEffectiveDef', () => {
    it('reduces defense by penetration percentage', () => {
      expect(calculateEffectiveDef(100, 0)).toBe(100);
      expect(calculateEffectiveDef(100, 20)).toBe(80);
      expect(calculateEffectiveDef(100, 50)).toBe(50);
      expect(calculateEffectiveDef(100, 100)).toBe(0);
    });

    it('clamps penetration between 0 and 100', () => {
      expect(calculateEffectiveDef(100, -10)).toBe(100);
      expect(calculateEffectiveDef(100, 150)).toBe(0);
    });
  });

  describe('applyDamageFormula', () => {
    it('calculates damage based on standard formula', () => {
      // Formula: ATK * 200 / (200 + DEF)
      // If DEF is 0, damage = ATK
      expect(applyDamageFormula(100, 0)).toBe(100);

      // If DEF is 200, damage = ATK * 200 / 400 = ATK / 2
      expect(applyDamageFormula(100, 200)).toBe(50);

      // If DEF is 600, damage = ATK * 200 / 800 = ATK / 4
      expect(applyDamageFormula(100, 600)).toBe(25);
    });
  });

  describe('calculateDamage', () => {
    const baseContext: DamageContext = {
      attackerAtk: 100,
      defenderDef: 0,
      penetration: 0,
      critChance: 0,
      critMultiplier: 2,
      dodgeChance: 0,
      damageMultiplier: 1,
      bonusFlatDmage: 0,
    };

    beforeEach(() => {
      vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns raw attack as damage when def is 0 and no modifiers', () => {
      // Math.random returns 0.5 (safe default for tests usually, but we spy it)
      vi.mocked(Math.random).mockReturnValue(0.99); // No crit, no dodge

      const result = calculateDamage(baseContext);
      expect(result.finalDamage).toBe(100);
      expect(result.isCrit).toBe(false);
      expect(result.isDodged).toBe(false);
    });

    it('applies defense mitigation', () => {
      vi.mocked(Math.random).mockReturnValue(0.99);
      const result = calculateDamage({ ...baseContext, defenderDef: 200 });
      // 100 * 200 / (200 + 200) = 50
      expect(result.finalDamage).toBe(50);
    });

    it('applies penetration', () => {
      vi.mocked(Math.random).mockReturnValue(0.99);
      const result = calculateDamage({ ...baseContext, defenderDef: 200, penetration: 50 });
      // Effective Def = 200 * (1 - 0.5) = 100
      // Damage = 100 * 200 / (200 + 100) = 66.66 -> floor(66.66) = 66
      expect(result.finalDamage).toBe(66);
      expect(result.defIgnored).toBe(100);
    });

    it('handles critical hits', () => {
      // Crit check is: Math.random() * 100 < critChance
      // We want crit, so random() should be low.
      vi.mocked(Math.random).mockReturnValue(0.01); // 1 < 10

      const result = calculateDamage({ 
        ...baseContext, 
        critChance: 10, 
        critMultiplier: 2.0 
      });

      expect(result.isCrit).toBe(true);
      expect(result.finalDamage).toBe(200);
    });

    it('handles dodge', () => {
      // Dodge check is first: Math.random() * 100 < dodgeChance
      vi.mocked(Math.random).mockReturnValue(0.01); // 1 < 10

      const result = calculateDamage({ 
        ...baseContext, 
        dodgeChance: 10 
      });

      expect(result.isDodged).toBe(true);
      expect(result.finalDamage).toBe(0);
    });

    it('applies damage multiplier', () => {
      vi.mocked(Math.random).mockReturnValue(0.99);
      const result = calculateDamage({ ...baseContext, damageMultiplier: 1.5 });
      expect(result.finalDamage).toBe(150);
    });

    it('applies flat bonus damage after multipliers', () => {
      vi.mocked(Math.random).mockReturnValue(0.99);
      const result = calculateDamage({ ...baseContext, bonusFlatDmage: 10 });
      expect(result.finalDamage).toBe(110);
    });

    it('never returns below MINIMUM_DAMAGE', () => {
      vi.mocked(Math.random).mockReturnValue(0.99);
      // Extremely high defense
      const result = calculateDamage({ ...baseContext, defenderDef: 99999 });
      expect(result.finalDamage).toBeGreaterThanOrEqual(MINIMUM_DAMAGE);
    });

    it('invariant: finalDamage is non-negative', () => {
      vi.mocked(Math.random).mockReturnValue(0.99);
      const result = calculateDamage({ ...baseContext, bonusFlatDmage: -500 }); // Should be clamped
      expect(result.finalDamage).toBeGreaterThanOrEqual(MINIMUM_DAMAGE);
    });
    
    it('calculates damage correctly with mixed stats', () => {
        // Complex case:
        // Atk: 100
        // Def: 100
        // Pen: 20%
        // Crit: 50%
        // Crit Mult: 1.5
        // Dodge: 0
        // Multiplier: 1.2
        
        // 1. Dodge: false (rng 0.4)
        // 2. Base Damage: 100 * 1.2 = 120
        // 3. Effective Def: 100 * (1 - 0.2) = 80
        // 4. Mitigated: 120 * 200 / (200 + 80) = 120 * 200 / 280 = 85.714...
        // 5. Crit: true (rng 0.4 < 0.5)
        // 6. After Crit: 85.714 * 1.5 = 128.57...
        // 7. Final: floor(128.57) = 128
        
        vi.mocked(Math.random).mockReturnValue(0.4); 
        
        const result = calculateDamage({
            attackerAtk: 100,
            defenderDef: 100,
            penetration: 20,
            critChance: 50,
            critMultiplier: 1.5,
            dodgeChance: 0,
            damageMultiplier: 1.2
        });
        
        expect(result.isCrit).toBe(true);
        expect(result.defIgnored).toBe(20);
        expect(result.finalDamage).toBe(128);
    });
  });
});
