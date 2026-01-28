export type HeroClass = "warrior" | "mage" | "ranger" | "assassin";

export type Difficulty = "easy" | "medium" | "hard";

export type Rarity = "common" | "rare" | "epic";

export type ItemCategory = "offensive" | "defensive" | "ability";

export type AbilityTag =
  | "atk_on_kill"
  | "bleed"
  | "burn"
  | "burn_consume"
  | "chill"
  | "contract_bonus"
  | "contract_extend"
  | "crit_stacking"
  | "crystal_on_kill"
  | "def_buff"
  | "def_on_kill"
  | "def_scaling"
  | "evade_buff"
  | "execute"
  | "lifesteal"
  | "mana_on_kill"
  | "multi_hit"
  | "penetration"
  | "permanent_stats"
  | "shield"
  | "stats_on_kill"
  | "stun";

export type MonsterType = 
  | "slime" 
  | "wolf" 
  | "zombie" 
  | "skeleton" 
  | "mimic" 
  | "vampire" 
  | "orc" 
  | "dragon";

export type StatusEffectType = 
  | "burn"      // DoT
  | "chill"     // Reduces enemy damage
  | "poison"    // DoT
  | "bleed"     // DoT
  | "stun"      // Skip turn
  | "shield"    // Absorbs damage
  | "fortify"   // Bran's DEF buff
  | "momentum"  // Lyra's spell stacking
  | "evade";    // Temporary dodge boost

export type GamePhase = 
  | "hero_select" 
  | "combat" 
  | "victory" 
  | "shop" 
  | "level_up" 
  | "death" 
  | "run_summary";

export type TurnPhase =
  | "player_turn"
  | "player_animating"
  | "monster_turn"
  | "monster_animating"
  | "combat_end"
