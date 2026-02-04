import type { MonsterBaseStats, MonsterDefinition, MonsterState, MonsterType, Difficulty } from "@/types";
import { MONSTER_SPAWN_RATES } from "@/lib/constants";
import { MONSTERS, SLIME } from "./definitions";

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
    maxHp: Math.round(snapshotBase.hp + g.hp[difficulty][idx] * internalEncounter),
    hp: Math.round(snapshotBase.hp + g.hp[difficulty][idx] * internalEncounter),
    atk: Math.round(snapshotBase.atk + g.atk[difficulty][idx] * internalEncounter),
    def: Math.round(snapshotBase.def + g.def[difficulty][idx] * internalEncounter),
    crystalReward: Math.round(snapshotBase.crystal + g.crystal[difficulty][idx] * internalEncounter),
    expReward: Math.round(snapshotBase.exp + g.exp[difficulty][idx] * internalEncounter),
    scoreReward: def.baseStats.score || 0,
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
  const rates = MONSTER_SPAWN_RATES[level] || MONSTER_SPAWN_RATES[7];
  const total = Object.values(rates).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const [id, rate] of Object.entries(rates)) {
    roll -= rate;
    if (roll <= 0) return MONSTERS[id as MonsterType];
  }

  return SLIME;
}
