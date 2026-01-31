import type { DamageResult, HeroCombatStats } from "../damageCalculator";
import type { HeroState, MonsterState } from "@/types";

export interface PassiveContext {
  hero: HeroState;
  monster: MonsterState;
}

export interface BasicAttackResolvedContext extends PassiveContext {
  heroStats: HeroCombatStats;
  effectiveMonsterDef: number;
  result: DamageResult;
}

export interface CritContext extends PassiveContext {
  source: "basic_attack" | "ability";
  abilityId?: string;
  damage: number;
}

export interface KillContext extends PassiveContext {
  source: "basic_attack" | "ability" | "dot";
  abilityId?: string;
}

export interface PassiveHandler {
  onBasicAttackResolved?: (ctx: BasicAttackResolvedContext) => void;
  onCrit?: (ctx: CritContext) => void;
  onKill?: (ctx: KillContext) => void;
}
