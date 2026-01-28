import type { Ability, HeroState, MonsterState } from "@/types";

export interface AbilityExecutionContext {
  hero: HeroState;
  monster: MonsterState;
  ability: Ability;
  abilityIndex: number;
}

export type AbilityHandler = (ctx: AbilityExecutionContext) => void;
