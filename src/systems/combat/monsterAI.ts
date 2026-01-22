import { MONSTERS } from "@/data/monsters";
import { MonsterDefinition, MonsterState } from "@/types";

export type MonsterActionType = "attack" | "special" | "wait";

export interface MonsterAction {
  type: MonsterActionType;
  name: string;
  multiplier: number;
  effect?: string; // eg. "apply_burn", "lifesteal_50"
}

export interface AIDecision {
  action: MonsterAction;
  message: string;
}

// AI DECISION MAKING

/**
 * Determine what action the monster takes this turn.
 * Pure function, no side effects
 */

export function getMonsterAction(monster: MonsterState): AIDecision {
  const definition = MONSTERS[monster.definitionId];

  if (!definition) {
    return createBasicAttack("Monster");
  }

  const { behavior } = definition;

  // Check hp threshold triggers first
  if (behavior.specialAbility?.trigger === "hp_threshold") {
    const hpPercent = (monster.hp / monster.maxHp) * 100;
    const threshold = behavior.specialAbility.triggerValue ?? 50;

    if (hpPercent <= threshold) {
      return handleHpThresholdAbility(definition, monster);
    }
  }

  // Follow pattern if defined
  if (behavior.pattern && behavior.pattern.length > 0) {
    const patternAction = behavior.pattern[monster.patternIndex];
    return resolvePatternAction(definition, patternAction);
  }

  // Default to basic attack
  return createBasicAttack(definition.name);
}

function createBasicAttack(monsterName: string): AIDecision {
  return {
    action: {
      type: "attack",
      name: "Attack",
      multiplier: 1.0,
    },
    message: `${monsterName} attacks!`,
  };
}

function handleHpThresholdAbility(
  definition: MonsterDefinition,
  monster: MonsterState,
): AIDecision {
  switch (definition.id) {
    case "orc":
      return {
        action: {
          type: "special",
          name: "Berserker Rage",
          multiplier: 1.3,
          effect: "double_attack",
        },
        message: `${definition.name} enters BERSERKERR RAGE!`,
      };

    default:
      return createBasicAttack(definition.name);
  }
}

function resolvePatternAction(
  definition: MonsterDefinition,
  patternAction: string,
): AIDecision {
  const name = definition.name;

  switch (name) {
    case "attack":
      return createBasicAttack(name);

    case "wait":
      return {
        action: { type: "wait", name: "Wait", multiplier: 0 },
        message: `${name} is waiting...`,
      };

    case "pounce":
      return {
        action: { type: "special", name: "Pounce", multiplier: 1.5 },
        message: `${name} pounces!`,
      };

    case "bone_throw":
      return {
        action: { type: "special", name: "Bone Throw", multiplier: 1.2 },
        message: `${name} throws a bone!`,
      };

    case "surprise_attack":
      return {
        action: { type: "special", name: "Surprise Attack", multiplier: 1.8 },
        message: `${name} lunges with a surprise attack!`,
      };

    case "life_drain":
      return {
        action: {
          type: "special",
          name: "Life Drain",
          multiplier: 0.8,
          effect: "lifesteal_50",
        },
        message: `${name} drains your life force!`,
      };

    case "fire_breath":
      return {
        action: {
          type: "special",
          name: "Fire Breath",
          multiplier: 2.0,
          effect: "apply_burn",
        },
        message: `${name} breathes fire!`,
      };

    default:
      return createBasicAttack(name);
  }
}

// ULTILITY FUNCTIONS

export function getNextPatternIndex(monster: MonsterState): number {
  const definition = MONSTERS[monster.definitionId];

  if (!definition?.behavior.pattern) {
    return 0;
  }

  const patternLength = definition.behavior.pattern.length;
  return (monster.patternIndex + 1) % patternLength;
}

/**
 * Get monster's effective ATK (including rage bonuses)
 */
export function getEffectiveMonsterAtk(monster: MonsterState): number {
  let atk = monster.atk;

  const definition = MONSTERS[monster.definitionId];

  // Orc rage: +30% ATK below 50% HP
  if (definition?.id === "orc") {
    const hpPercent = (monster.hp / monster.maxHp) * 100;
    if (hpPercent <= 50) {
      atk *= 1.3;
    }
  }

  return Math.floor(atk);
}

/**
 * Check if monster should attack twice (Orc rage).
 */
export function shouldDoubleAttack(monster: MonsterState): boolean {
  const definition = MONSTERS[monster.definitionId];

  if (definition?.id !== "orc") return false;

  const hpPercent = (monster.hp / monster.maxHp) * 100;
  return hpPercent <= 50;
}