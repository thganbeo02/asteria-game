export type HeroClass = "warrior" | "mage" | "ranger" | "assassin";

export type Difficulty = "easy" | "medium" | "hard";

export type Rarity = "common" | "rare" | "epic";

export type ItemCategory = "offensive" | "defensive" | "ability";

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