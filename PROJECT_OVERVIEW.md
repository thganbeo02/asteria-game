# Project Overview: Asteria

**Asteria** is a turn-based roguelike combat game built with Next.js 16, React 19, Zustand, and Tailwind v4.

---

## What It Is

A single-player RPG where you:
1. Select a hero (4 available: Lyra, Bran, Camira, Shade)
2. Fight through escalating monster encounters
3. Earn crystals/gold, buy items at shops
4. Level up (7 levels max)
5. Survive as long as possible (roguelike - death ends the run)

**Core mechanics:**
- Turn-based combat with basic attacks + 3 abilities per hero
- Status effects (burn, poison, bleed, chill, stun, shield, etc.)
- Monster AI with attack patterns (slime, wolf, zombie, skeleton, mimic + 3 more planned)
- Damage formula: `ATK × 200 / (200 + DEF)` with penetration, crits, dodge
- Difficulty scaling (easy/medium/hard) affects monster growth and rewards
- Meta progression: gold persists between runs for unlocking heroes

---

## Architecture & Dev Flow

```
src/
├── app/              # Next.js App Router (page.tsx, layout.tsx)
├── components/
│   ├── combat/       # CombatLayout, ActionBar, HeroPanel, MonsterPanel, etc.
│   └── ui/           # Reusable: Button, HealthBar, Tooltip, StatDisplay
├── data/
│   ├── heroes/       # Hero definitions (lyra.ts, bran.ts, etc.)
│   └── monsters/     # Monster definitions
├── stores/
│   ├── combatStore/  # Slices: hero, monster, turn, log
│   └── gameStore/    # Slices: run, economy, meta (persisted)
├── systems/combat/   # Pure logic: damageCalculator, statusEffects, turnManager, monsterAI
├── types/            # TypeScript interfaces
└── lib/              # Utilities (cn, constants)
```

**State pattern:** Zustand stores split into slices, combined with `create()`. GameStore persists meta-progression; CombatStore is ephemeral.

**Combat flow:**
1. `TurnManager.executeBasicAttack()` or `executeAbility()`
2. Damage calculator computes result
3. Store updates (HP, effects, log entries)
4. Check victory → `TurnManager.executeMonsterTurn()` → Monster AI picks action → end round → tick DoTs → next turn

---

## User Flow (Intended)

```
hero_select → combat → victory → shop → combat → ... → level_up → combat → ... → death → run_summary
```

Currently only **combat** phase is implemented in the UI. The page auto-starts a test run with Lyra on easy.

---

## Component Status Overview

### Combat UI Components — ✅ Complete

| Component | Status | Notes |
|-----------|--------|-------|
| `CombatLayout` | ✅ | Grid orchestration, responsive |
| `CombatHeader` | ✅ | Turn counter, encounter info, theme toggle |
| `HeroPanel` | ✅ | HP/mana bars, shield integration, stats, status effects |
| `MonsterPanel` | ✅ | Mirrors hero panel, rewards preview |
| `BattleArena` | ✅ | Central visual, turn phase highlighting |
| `ActionBar` | ✅ | Basic attack, abilities with cooldown/mana, skip turn |
| `CombatLog` | ✅ | Scrollable history, color-coded entries |

### Reusable UI Components — ✅ Complete

| Component | Status | Notes |
|-----------|--------|-------|
| `Button` | ✅ | Variants, sizes, disabled states |
| `HealthBar` | ✅ | HP/mana/shield layers, animations |
| `StatDisplay` | ✅ | Flexible grid for stats |
| `Tooltip` | ✅ | Position-aware, configurable delay |
| `ThemeToggle` | ✅ | Light/dark mode |

### State Management — ✅ Complete

| Store/Slice | Status | Notes |
|-------------|--------|-------|
| `combatStore` | ✅ | Slice composition pattern |
| `heroSlice` | ✅ | Damage, healing, shields, effects, cooldowns |
| `monsterSlice` | ✅ | Spawning, scaling, pattern advancement |
| `turnSlice` | ✅ | Turn counter, phases, skip mechanics |
| `logSlice` | ✅ | Entries, animation queue |
| `gameStore` | ✅ | Persisted meta-progression |
| `runSlice` | ✅ | Run init, level-up, rewards |
| `economySlice` | ✅ | Crystals, gold, items |
| `metaSlice` | ✅ | Unlocks, settings |

### Combat Systems — ✅ Complete

| System | Status | Notes |
|--------|--------|-------|
| `turnManager` | ✅ | Full combat loop, victory/defeat |
| `damageCalculator` | ✅ | ATK/DEF formula, crit, pen, dodge, DoTs |
| `statusEffects` | ✅ | 9 effects, stacking, shield absorption |
| `monsterAI` | ✅ | Pattern-based, HP triggers, specials |

### Data Definitions — ✅ Mostly Complete

| Data | Status | Notes |
|------|--------|-------|
| Heroes (4) | ✅ | Bran, Lyra, Camira, Shade fully defined |
| Monsters (5) | ⚠️ | slime, wolf, zombie, skeleton, mimic — 3 more in types but not defined |

### Ability Effects — ⚠️ Partial

| Effect | Status | Notes |
|--------|--------|-------|
| `burn` tag | ✅ | Applies 5% max HP burn for 3 turns |
| `shield` tag | ✅ | Frost Barrier: 40% max HP shield, shatter + chill |
| `chill` tag | ✅ | Applied on shield break/expire |
| `stun` tag | ❌ | Not wired up (Bran's Shield Slam) |
| `bleed` tag | ❌ | Not wired up |
| `fortify` tag | ❌ | Not wired up (Bran's Fortify) |

### Missing Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Hero select screen | **P1** | Hardcoded to start combat immediately |
| Victory/death screens | **P1** | Phase transitions exist but no UI |
| Shop UI | **P2** | Types exist, no component or items data |
| Keyboard controls | **P2** | ActionBar hints SPACE but no listener |
| Hero passives | **P2** | Defined but not triggered |
| Animation system | **P3** | framer-motion installed, queue exists, nothing consumes it |
| Sound system | **P3** | Settings exist, no audio |
| Missing monsters | **P3** | vampire, orc, dragon in types but not defined |
| Items data | **P3** | Only types exist |

---

## Priority Recommendations

| Priority | Task |
|----------|------|
| **P1** | Add hero select screen |
| **P1** | Build victory/death screens |
| **P1** | Wire up remaining ability tags (stun, bleed, fortify) |
| **P2** | Add keyboard shortcuts (SPACE to skip, 1-3 for abilities) |
| **P2** | Implement hero passives |
| **P2** | Build shop UI and items data |
| **P3** | Hook up animation system |
| **P3** | Add remaining monsters |
| **P3** | Add sound system |
