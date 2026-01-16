// File holds logic 

import type { MonsterDefinition, MonsterState, MonsterType, Difficulty, MonsterBaseStats } from "@/types";
import { MONSTERS, SLIME } from "./definitions";

// Spawn rates table
const SPAWN_RATES: Record<number, Record<string, number>> = {
  1: { slime: 30, wolf: 30, zombie: 24, skeleton: 16 },
  2: { slime: 26, wolf: 24, zombie: 24, skeleton: 18, mimic: 8 },
  3: { slime: 20, wolf: 25, zombie: 25, skeleton: 20, mimic: 10 },
  4: { slime: 17, wolf: 18, zombie: 23, skeleton: 22, mimic: 15, vampire: 5 },
  5: { slime: 15, wolf: 15, zombie: 18, skeleton: 20, mimic: 15, vampire: 10, orc: 7 },
  6: { slime: 10, wolf: 10, zombie: 15, skeleton: 15, mimic: 15, vampire: 15, orc: 12, dragon: 8 },
  7: { slime: 10, wolf: 10, zombie: 10, skeleton: 10, mimic: 16, vampire: 16, orc: 16, dragon: 12 },
};

export function calculateMonsterStats(
  def: MonsterDefinition,
  snapshotBase: MonsterBaseStats,
  level: number,
  internalEncounter: number,  // always >= 1
  difficulty: Difficulty
): Omit<MonsterState, "statusEffects" | "turnCount" | "patternIndex"> {
  const idx = Math.min(level-1,6);
  const g = def.growth;

  return {
    definitionId: def.id,
    maxHp: Math.round(def.baseStats.hp + g.hp[difficulty][idx] * internalEncounter),
    hp: Math.round(def.baseStats.hp + g.hp[difficulty][idx] * internalEncounter),
    atk: Math.round(def.baseStats.atk + g.atk[difficulty][idx] * internalEncounter),
    def: Math.round(def.baseStats.def + g.def[difficulty][idx] * internalEncounter),
    crystalReward: Math.round(def.baseStats.crystal + g.crystal[difficulty][idx] * internalEncounter),
    expReward: Math.round(def.baseStats.exp + g.exp[difficulty][idx] * internalEncounter),
  };
}

export function createMonsterState(
  def: MonsterDefinition,
  snapshotBase: MonsterBaseStats,
  level: number,
  internalEncounter: number,
  difficulty: Difficulty
): MonsterState {
  return {
    ...calculateMonsterStats(def, snapshotBase, level, internalEncounter, difficulty),
    statusEffects: [],
    turnCount: 0,
    patternIndex: 0,
  }
}

export function selectRandomMonster(level: number): MonsterDefinition {
  const rates = SPAWN_RATES[level] || SPAWN_RATES[7];
  const total = Object.values(rates).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const [id, rate] of Object.entries(rates)) {
    roll -= rate;
    if (roll <= 0) return MONSTERS[id as MonsterType];
  }

  return SLIME;
}

