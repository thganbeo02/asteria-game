import { useCombatStore } from "@/stores/combatStore";
import { useGameStore } from "@/stores/gameStore";
import { TurnManager } from "./turnManager";
import { DIFFICULTY_CONFIG } from "@/lib/constants";

// PUBLIC API - What UI components call

/**
 * Start a new combat encounter.
 */
export function startCombat(heroId: string): void {
  const game = useGameStore.getState();
  const combat = useCombatStore.getState();

  if (!game.run) {
    console.error("Cannot start combat: no active run");
    return;
  }

  combat.initCombat(heroId, game.run.difficulty);
  game.setPhase("combat");
}

/**
 * Player performs a basic attack.
 */
export function performBasicAttack(): void {
  const { turnPhase } = useCombatStore.getState();

  if (turnPhase !== "player_turn") {
    console.warn("Cannot attack: not player turn");
    return;
  }

  TurnManager.executeBasicAttack();
}

/**
 * Player uses an ability.
 */
export function performAbility(abilityIndex: number): void {
  const { turnPhase } = useCombatStore.getState();

  if (turnPhase !== "player_turn") {
    console.warn("Cannot use ability: not player turn");
    return;
  }

  TurnManager.executeAbility(abilityIndex);
}

/**
 * Player skips their turn (if skips remain).
 * This must also trigger the monster's turn.
 */
export function performSkipTurn(): void {
  const game = useGameStore.getState();
  const combat = useCombatStore.getState();

  if (game.phase !== "combat") {
    console.warn("Cannot skip: not in combat");
    return;
  }

  if (combat.turnPhase !== "player_turn") {
    console.warn("Cannot skip: not player turn");
    return;
  }

  const didSkip = combat.skipTurn();
  if (!didSkip) return;

  // Mirror the hero-action flow: schedule monster turn with a short delay.
  setTimeout(() => TurnManager.executeMonsterTurn(), 500);
}

/**
 * Proceed to next encounter after victory.
 */
export function proceedToNextEncounter(): void {
  const game = useGameStore.getState();
  const combat = useCombatStore.getState();

  if (!game.run) return;

  if (game.phase !== "victory" || combat.turnPhase !== "combat_end") {
    console.warn("Cannot proceed: encounter not finished");
    return;
  }

  // Increment encounter counter
  game.incrementEncounter();

  // Check for shop
  const shopFrequency = DIFFICULTY_CONFIG[game.run.difficulty].shopFrequency;
  const encounterCount = game.run.encounter;

  // Shop triggers after every N encounters (not on first)
  if ((encounterCount - 1) % shopFrequency === 0 && encounterCount > 1) {
    game.setPhase("shop");
  } else {
    // Reset encounter UI state (do not re-init hero)
    combat.clearLog();
    combat.resetTurn();

    // Spawn next monster
    combat.spawnMonster(game.run.difficulty);
    game.setPhase("combat");
  }
}

/**
 * Flee from combat (forfeit run).
 */
export function fleeCombat(): void {
  useGameStore.getState().endRun(false);
}

/**
 * Check if player can use a specific ability.
 */
export function canUseAbility(abilityIndex: number): {
  canUse: boolean;
  reason?: string;
} {
  const { hero, turnPhase } = useCombatStore.getState();

  if (turnPhase !== "player_turn") {
    return { canUse: false, reason: "Not your turn" };
  }

  if (!hero) {
    return { canUse: false, reason: "No hero" };
  }

  const ability = hero.abilities[abilityIndex];
  if (!ability) {
    return { canUse: false, reason: "Invalid ability" };
  }

  if (ability.currentCooldown > 0) {
    return { canUse: false, reason: `Cooldown: ${ability.currentCooldown} turns` };
  }

  const manaCost = ability.manaCost[Math.min(hero.level - 1, 6)];
  if (hero.stats.mana < manaCost) {
    return { canUse: false, reason: `Need ${manaCost} mana` };
  }

  return { canUse: true };
}

/**
 * Get current combat state summary for UI.
 */
export function getCombatSummary() {
  const { hero, monster, turnPhase, turnCount } = useCombatStore.getState();
  const { run } = useGameStore.getState();

  return {
    hero: hero ? {
      hp: hero.stats.hp,
      maxHp: hero.stats.maxHp + hero.stats.bonusMaxHp,
      mana: hero.stats.mana,
      maxMana: hero.stats.maxMana + hero.stats.bonusMaxMana,
      level: hero.level,
      effects: hero.statusEffects,
    } : null,
    monster: monster ? {
      id: monster.definitionId,
      hp: monster.hp,
      maxHp: monster.maxHp,
      effects: monster.statusEffects,
    } : null,
    turn: {
      phase: turnPhase,
      count: turnCount,
    },
    run: run ? {
      encounter: run.encounter,
      level: run.currentLevel,
      crystals: run.crystals,
    } : null,
  };
}
