# Asteria

## 1. Executive Summary

### 1. Overview

Asteria is a fantasy roguelike where players choose from unique characters, battle through monsters, and build their collections through skill-based combat and strategic resource management.

### 2. Target Platforms

- **Primary:** Web app ([Next.js](https://nextjs.org), desktop browser)

- **Secondary:** Mobile app

- **Future/Not planned:** Steam

### 3. Target Audience

**Primary:** Players aged **15-30** who enjoy **run-based roguelikes** and **strategy-heavy combat** (e.g., Slay the Spire, Hades, ARPG/roguelite fans). They mainly play on **PC/laptop browsers** and like games they can play in **short sessions**.

**Player type:** **Mid-core** players who enjoy **build-crafting**, **min-maxing**, and **optimizing runs**, but don’t want super-hardcore execution (simple controls, depth comes from decisions).

**Motivations:**

- Experimenting with **different heroes/classes** and synergies

- **Collecting** heroes, skins, and achievements over many runs

- Beating **challenging content**, climbing **leaderboards**, and comparing stats

**Secondary:** Casual fantasy/RPG fans who are attracted by **hero art**, **simple controls**, and **progression systems**, and are okay with learning roguelike mechanics over time.

### 4. Unique Selling Points (USP)

- **Hero-driven roguelike:** Each run is anchored around distinct heroes with their own identities and playstyles, so switching heroes feels like learning a new mini-game.

- **Multiple modes for different player types:** Endless runs, collection/gallery, idle mode, so different enjoyers share one interconnected progression system.

- **Per-hero mastery and monuments:** League-style Eternals for each hero that track unique stats and milestones, so your “main” becomes a persona legend with endless goals. *Who is your main? Prove it.*

- **Strong collection fantasy:** Players gradually build a personal gallery of heroes, skins, cards, and achievements.

- **Short runs, long-term growth:** Designed for 5-20 min sessions, while persistent account progression, unlockable content, and higher tiers keep players invested over the long term.

- **Decision-focused combat:** Players must manage skills, cooldowns, resources, and must make meaningful trade-offs both during runs and in between runs (upgrades, unlocks, difficulty).

- **Web first, low friction:** Runs directly in the browser with no install or high-end hardware needed, making it easy to jump in from anywhere and share the game with friends.

## 2. Game Concept

### 1. Core Concept

A turn based roguelike where you select a hero, battle through escalating encounters, make tactical shop decisions with limited resources, and chase long-term collection goals. Death is expected, as progress comes from unlocking new heroes, skins, and cards across runs.

**Minute-to-minute:** Turn-based combat against monsters. Choose when to attack, use skills, manage mana/cooldowns, and survive encounters.

**Session-to-session:** Complete runs (or die trying), earn gold/essence, unlock new content, and try different heroes or difficulties or game modes.

**Week-to-week:** Master favorite heroes, complete card and skin collection, climb leaderboards.

### 2. Design Pillars

- **Character-driven attachment** - Named heroes with personalities, not generic classes. Players connect with characters, build “mains”.

- **Meaningful choices over execution** - Turn-based combat = time to think, make meaningful decisions (when to skill, what to buy)

- **Respectful monetization** - Free core game, infinite replayability. Premium content = new experiences, not pay to win.

- **Multi-layered progression**:

- Run progression → level up

- Account progression → unlock heroes

- Hero mastery → personal stat monuments

- **Interconnected modes** - All modes feed the same progression (gold, cards, essence). Play your way: Endless for competition, or Gallery for collection

### 3. Core Loop

Select hero → Choose difficulty → Start run

↓

Combat encounter → Victory → Earn rewards (Crystals, EXP, Gold)

↓

Hero level up? Restore HP, Stat Boost, More items in shop

↓

Shop encounter (every 3 encounters) → Spend Crystals OR Skip for bonus

↓

Repeat until death/forfeit → Summary of run

↓

Return to hub → Spend Gold/Essence on Heroes/Cards/Skins

↓

Check gallery/leaderboard → Start new run

### 4. Session Structure

**Quick Session (5-15min):** 3-5 encounters/run. Earn quick Gold. Complete daily quest. Open a daily chest for cards/skins.

**Medium Session (15-30min):** Full run to level 5. Meaningful progression. Earn more Gold and even Essence, and a higher chance to get better card/skin.

**Long Session (30min+):** Deep run to level 6-7, all systems engaged, leaderboard-worthy score. Maybe even try multiple heroes and unlock some easter eggs? Earn way more Gold and Essence, and guaranteed Epic+ loot.

## 3. Competitive Analysis

### 1. Direct Competitors

**Slay the Spire:**

- Elements used: Turn-based roguelike structure, dual currency economy (run currency + permanent currency), shop system, difficulty scaling through levels

- Asteria’s advantage: Hero-driven characters with personalities (vs. generic classes), simpler combat mechanics (no deck-building complexity)

**Hades:**

- Elements used: Named characters with distinct personalities/traits, hub-based structure between runs, character-driven progression, cosmetic skin system

- Asteria’s advantage: Turn-based accessibility (no twitch reflex needed), truly endless progression goals, free-to-play

**Monster train:**

- Elements used: Covenant/difficulty modifier system, class-based synergies and builds, endless challenge modes

- Asteria’s advantage: Simpler core mechanics (easier onboarding), character-driven attachment, broader casual appeal

**League of Legends:**

- Elements used: Champion mastery system, Eternals-style stat tracking per hero, “main” culture, cosmetic progression

- Asteria’s advantage: PvE roguelike (no toxic matchmaking), solo-focus gameplay, web-accessible without large download

### 2. Market Positioning

**We are:** A turn-based roguelike that combines strategic depth with various heroes, designed for web session and long-term mastery, monetized purely for cosmetics without pay-to-win.

**We are NOT:** A real time action game requiring fast reflexes, a competitive multiplayer experience, a deck-building game, or a gacha/pay-to-win monetization.

## 4. Game World and Settings

### 1. World Overview

### 2. Tone and Atmosphere

### 3. Factions

## 5. Heroes System

### 1. Overview

Heroes are the heart of Asteria, and each hero in Asteria is a named character with a distinct personality, backstory, and mechanical identity. This creates the "main culture" familiar to players of games like League of Legends - players develop emotional attachments to their favorite heroes and express themselves through mastery.

The hero system is designed around a simple principle: **switching heroes should feel like learning a new mini-game**. While the core combat loop remains consistent, each hero's passive ability fundamentally changes how players approach encounters.

### 2. Hero Structure

Every hero follows a template that players can learn and understand quickly: 

**Identity Elements:**

- **Name and Title:** Name paired with a descriptive title (Eg. Lyra - The Ember Scholar)

- **Class:** One of the four classes (Warrior, Mage, Ranger, Assassin)

- **Difficulty Rating:** 1-5 stars indicating mechanical complexity

- **Unlock Method:** How the hero is obtained (Starter, Gold, Essence, Achievement, Campaign, In-game purchase,...)

**Combat Kit:**

- **Passive Ability:** An always-active effect that defines the hero's playstyle

- **Ability 1:** Low mana cost, low cooldown – the bread-and-butter skill used frequently

- **Ability 2:** Medium cost, utility or defensive – provides survivability or tactical options

- **Ability 3:** High cost, high impact – the signature move that defines clutch moments

### 3. Hero Unlock Methods

| Method | Purpose | Examples |
| :---- | :---- | :---- |
| **Starter (Free)** | Immediate engagement, no barrier | Camira, Bran, Lyra, Shade |
| **Gold purchase** | Reward for run completion, mid-term goal | 500-2500 Gold |
| **Essence purchase** | Reward for challenging content | 500+ Essence |
| **Achievement unlock** | Skill recognition, mastery reward | “Defeat 100 Elites” |
| **Campaign reward** | Story engagement incentive | Complete Chapter 3 |

## 6. Classes

Four core classes form the foundation, with heroes being distinct variables.

1. **Ranger (Ranged DPS, crit-focused)** - Glass cannons with high damage output and mobility

2. **Warrior (Tank, frontline)** - High survivability, protective playstyle, lower DPS but forgiving

3. **Mage (Spellcaster, burst damage)** - High mana pool, powerful spells, very fragile

4. **Assassin (Burst damage, execute)** - Highest single target damage, requires careful timing and execution

_Future: Monk, Summoner_

## 7. Game Modes

### 1. Endless Mode (MVP)

- **Goal:** Survive as long as possible against infinite, progressively difficult encounters

- **Structure:** Combat → Shop (every 3 encounters) → Level up → Repeat until death

- **Progression:** 7 run levels, each level unlocks new monsters, mechanics

- **Rewards:** Crystals (run-only), Gold (permanent), Essence (rare), Cards (RNG drops)

- **Appeal:** Competitive players, leaderboard chasers, skill expression

### 2. Campaign Mode

- **Goal:** Linear story-driven chapters with narrative and bosses, and unlocking more heroes to play in Endless mode

- **Structure:** 5-7 chapters, 10-15 encounters + boss per chapter

- **Narrative:** Hero backstories, world lore, character interactions

- **Rewards:** Exclusive skins, lore unlocks, chapter bonuses, playable heroes

- **Appeal:** Narrative-focused players, completionists

### 3. Idle Gold

- **Goal:** Passive gold generation, both online and offline

- **Structure:** Assign heroes to mine, collect gold, upgrade efficiency, chance to mine cards

- **Integration:** Feeds Gold into main economy (buy skins/cards/heroes)

- **Appeal:** Casual players, those who want progress without active play

### 4. Future Modes

- **Expeditions:** Send heroes on timed quests for rewards

- **Boss Rush:** Fight only bosses, leaderboard for clear times

## 8. Core Gameplay

### 1. Combat System

   Structure: Turn-based, 1v1 (player vs monster)

   Turn order:

1. Player turn → Choose basic attack or skill

2. Monster turn → AI chooses action (only attack at lower level)

3. Turn end → Process DoTs, buffs, cooldowns

4. Repeat until victory or defeat

5. Shop after every 3 encounters (MVP)

### 2. Stats Explained

1. **Primary Stats:**

- **HP (Health Points):** Survive until this reaches 0. Persists between encounters

- **Max HP:** Upper limit for healing

- **ATK (Attack):** Base damage output

- **DEF (Defense):** Reduces incoming damage

- **Mana:** Resources for skills

- **Max Mana:** Mana pool size

- **Mana Regen:** Amount gained after a basic attack


2. **Secondary Stats**

- **Crit Chance (%):** Probability to deal critical damage 

- **Crit Multiplier:** Damage boost on crit (default 1.5x)

- **Dodge (%):** Chance to completely avoid attack, taking 0 damage

- **Penetration (%):** Ignore X% of enemy’s DEF

### 3. Damage Calculation

```text
Damage = ATK * (200 / (200 + DEF))
```

   

### 4. Skills

   Each hero has one passive, and 3 skills.

- Skill properties:

  - Mana cost: 0-50
  - Cooldown: 1-6 turns
  - Effects: Damage, buffs, debuffs, heals, shields, DoTs (Poison, Bleed, Burn), crowd controls

### 5. Status Effects (Implemented)

| Effect | Type | Duration | Stacks | Tick | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Burn | DoT + heal reduction | 3 | Not stackable | End | Deals % Max HP fire damage (reduced by DEF). Target receives 40% less healing while Burned. |
| Poison | DoT | 4 | Stackable (max 5) | End | Deals % Current HP as poison damage per stack (true damage). |
| Bleed | DoT | 3 | Not stackable | End | Deals % of attacker's ATK (snapshotted on application) as true damage. |
| Chill | Debuff | 2 | Not stackable | None | Target deals % less damage. |
| Stun | CC | 1 | Not stackable | Start | Target cannot act; turn is skipped. |
| Shield | Buff | 2 | Not stackable | None | Absorbs up to X incoming damage (shield value). |
| Fortify | Buff | 3 | Not stackable | None | Increases DEF by X%. |
| Arcane Momentum | Buff | Permanent (-1) | Stackable (max 3) | None | Ability damage +10% per stack. |
| Evasion | Buff | 1 | Not stackable | None | Adds X% dodge chance (typically for the next incoming attack). |

### 6. Leveling System

The leveling system provides structured power growth within each run. Players earn EXP from defeating monsters and level up at defined thresholds. Each level-up is a significant moment—a power spike that includes healing, stat boosts, and ability improvements.

1. **EXP Thresholds**

| Level | EXP to next level | Cumulative EXP |
| :---- | :---- | :---- |
| **1→2** | 1000 | 1000 |
| **2→3** | 1750 | 2750 |
| **3→4** | 2750 | 5500 |
| **4→5** | 4000 | 9500 |
| **5→6** | 5500 | 15000 |
| **6→7** | 7500 | 22500 |

2. **Level-up Rewards**

When a player levels up, they receive a package of rewards designed to create a significant power spike:

**Immediate Effects:**

- HP Restore: FULL HP restored (encourages aggression before level-up)\!

- Shop Refresh: New items available at next shop

**Stat Increases:** Increases Max HP, ATK, DEF, Mana Regen, differed for each hero.

**Ability Power:** All hero abilities scale to the new level, increasing damage output and effects.

3. **Monster Unlocks by level**

New monster types become available as players progress, introducing fresh challenges and preventing encounters from being repetitive.

| Level | New Monsters Available | Encounter Feel |
| ----- | ----- | ----- |
| **1** | Slime, Wolf, Zombie, Skeleton | Learning the basics |
| **2** | Mimic joins pool | First tricky enemy |
| **3** | — | Familiar enemies, higher stats |
| **4** | Vampire joins pool | Sustain threats appear |
| **5** | Orc joins pool | Berserker pressure |
| **6** | Dragon joins pool | Mini-boss encounters |
| **7** | Full pool, max scaling | Ultimate challenge |

4. **Encounter Counter System**

The game tracks encounters in two ways:

- **Display Counter (Player-Facing):** Shows the total number of encounters survived. Used for run summary, achievements, and leaderboards. Never resets during a run.

- **Internal Counter (Backend):** Resets to 1 when the player levels up. Used for monster stat calculations via the snapshot system. This allows stats to scale appropriately within each level segment.

### 7. Difficulty Settings

| Difficulty | Shop Frequency | Skip Bonus |
| :---- | :---- | :---- |
| Easy | 3 encounters  | +20 per level |
| Medium | 3 encounters | +40 per level |
| Hard | 3 encounters | +60 per level |

## 9. Monsters and Enemies

### 1. Monster Design Philosophy

Monsters in Asteria are designed around a core principle: **every monster should teach the player something or test a specific skill**. Early monsters introduce basic concepts, while later monsters combine mechanics and punish poor play.

**Guiding Principles:**

- **Readable Intent:** Players should be able to predict monster behavior patterns. A Wolf always Pounces on turn 3. A Skeleton always uses Bone Throw on turn 2. This predictability enables strategic play.

- **Counterplay Exists:** Every monster has a "correct" way to fight them. Zombies reward ability usage over basic attacks. Mimics reward patience. Vampires require sustained DPS.

- **Hero Differentiation:** Some monsters are easier or harder for certain heroes. Lyra struggles against high-DEF Zombies but excels against low-HP Wolves. This creates variety across runs.

- **Escalating Complexity:** Early monsters test single mechanics. Late-game monsters combine multiple mechanics and require resource management.


### 2. Monster Spawn rates and Base stats

#### 1. Spawn rates

```ts
const MONSTER_SPAWN_RATES = {
  // Level: { monster: percentage }
  1: { slime: 30, wolf: 30, zombie: 24, skeleton: 16 },
  2: { slime: 26, wolf: 24, zombie: 24, skeleton: 18, mimic: 8 },
  3: { slime: 20, wolf: 25, zombie: 25, skeleton: 20, mimic: 10 },
  4: { slime: 17, wolf: 18, zombie: 23, skeleton: 22, mimic: 15, vampire: 5 },
  5: { slime: 15, wolf: 15, zombie: 18, skeleton: 20, mimic: 15, vampire: 10, orc: 7 },
  6: { slime: 10, wolf: 10, zombie: 15, skeleton: 15, mimic: 15, vampire: 15, orc: 12, dragon: 8 },
  7: { slime: 10, wolf: 10, zombie: 10, skeleton: 10, mimic: 16, vampire: 16, orc: 16, dragon: 12 },
};
```

#### 2. Base stats

```ts
const MONSTER_BASE_STATS = {
  slime: { score: 2, hp: 40, atk: 3, def: 2, crystal: 10, exp: 27 },
  wolf: { score: 2, hp: 42, atk: 4, def: 1, crystal: 12, exp: 32 },
  zombie: { score: 3, hp: 48, atk: 5, def: 5, crystal: 14, exp: 42 },
  skeleton: { score: 3, hp: 42, atk: 7, def: 1, crystal: 18, exp: 50 },
  mimic: { score: 5, hp: 56, atk: 9, def: 7, crystal: 34, exp: 54 },
  vampire: { score: 7, hp: 50, atk: 12, def: 6, crystal: 40, exp: 66 },
  orc: { score: 8, hp: 68, atk: 15, def: 8, crystal: 30, exp: 80 },
  dragon: { score: 10, hp: 78, atk: 20, def: 12, crystal: 47, exp: 101 },
};
```

Note: Crystal rewards are not strictly monotonic by "threat." Some monsters (e.g., Mimic, Vampire) are treasure-bearers by design/lore and intentionally pay out more Crystals than similarly-leveled combatants.

### 3. Monster Growth Arrays

Growth values are per-encounter. Array index = Level - 1 (so index 0 = Level 1).

```ts
const SLIME_GROWTH = { hp: { easy: [2, 4, 6, 8, 11, 14, 18], medium: [3, 5, 7, 10, 13, 17, 22], hard: [4, 6, 9, 12, 16, 20, 26] }, atk: { easy: [0.8, 1.5, 2.5, 4, 6, 8, 10], medium: [1, 2, 3, 5, 7, 10, 13], hard: [1.5, 3.5, 6, 9, 12, 16, 20] }, def: { easy: [0.5, 1, 1.5, 2, 3, 5, 7], medium: [1, 2, 3, 4, 6, 8, 10], hard: [1.5, 3, 5, 7, 9, 12, 15] }, crystal: { easy: [1, 2, 3, 5, 7, 9, 12], medium: [2, 3, 5, 7, 9, 12, 15], hard: [3, 5, 7, 9, 12, 16, 21] }, exp: { easy: [1, 1, 2, 3, 5, 7, 10], medium: [1, 2, 3, 5, 7, 9, 12], hard: [2, 3, 5, 7, 9, 12, 16] } };
const WOLF_GROWTH = { hp: { easy: [1.5, 3, 5, 7, 9, 12, 15], medium: [2.5, 4, 6, 9, 12, 15, 19], hard: [3.5, 5, 8, 11, 14, 18, 23] }, atk: { easy: [1, 2, 3.5, 5, 7, 10, 13], medium: [1.5, 3, 5, 7, 10, 13, 17], hard: [2, 4, 6, 9, 12, 16, 21] }, def: { easy: [0.4, 0.8, 1.2, 2, 3, 5, 7], medium: [0.5, 1, 1.5, 3, 4.5, 6, 9], hard: [0.75, 1.5, 2.5, 4, 6, 8, 11] }, crystal: { easy: [1, 2, 3, 5, 7, 10, 13], medium: [2, 3, 5, 7, 10, 13, 17], hard: [3, 5, 7, 10, 13, 17, 22] }, exp: { easy: [1, 2, 2, 3, 5, 7, 10], medium: [2, 2, 3, 5, 7, 10, 13], hard: [2, 3, 5, 7, 10, 13, 17] } };
const ZOMBIE_GROWTH = { hp: { easy: [3, 5, 8, 11, 15, 19, 25], medium: [4, 7, 10, 14, 18, 23, 30], hard: [5, 9, 13, 17, 22, 28, 36] }, atk: { easy: [1, 2, 4, 6, 8, 11, 14], medium: [1.5, 3, 5, 7, 10, 14, 19], hard: [2, 4, 7, 10, 14, 18, 23] }, def: { easy: [1, 2, 3, 5, 7, 9, 12], medium: [1.5, 2.5, 4, 6, 8, 11, 14], hard: [2, 4, 6, 8, 11, 14, 18] }, crystal: { easy: [2, 3, 5, 6, 9, 11, 14], medium: [3, 5, 6, 8, 11, 14, 18], hard: [4, 6, 8, 11, 14, 18, 23] }, exp: { easy: [2, 3, 4, 6, 8, 11, 15], medium: [3, 4, 6, 8, 11, 15, 19], hard: [4, 6, 8, 11, 15, 19, 25] } };
const SKELETON_GROWTH = { hp: { easy: [2, 4, 6, 8, 11, 14, 18], medium: [3, 5, 7, 10, 14, 18, 23], hard: [4, 6, 9, 12, 16, 20, 25] }, atk: { easy: [2, 3, 4, 6, 9, 12, 17], medium: [3, 4, 6, 8, 11, 15, 22], hard: [4, 6, 8, 11, 15, 20, 27] }, def: { easy: [0.5, 1, 1.5, 2.5, 3.5, 5, 7], medium: [0.75, 1.5, 2.5, 3.5, 5, 7, 9], hard: [1.5, 3, 4.5, 6, 8, 10, 13] }, crystal: { easy: [2, 3, 5, 7, 9, 12, 16], medium: [3, 5, 7, 9, 12, 16, 21], hard: [4, 6, 9, 12, 16, 20, 26] }, exp: { easy: [2, 3, 4, 6, 8, 11, 14], medium: [3, 4, 6, 8, 11, 15, 18], hard: [4, 5, 7, 10, 14, 18, 24] } };
const MIMIC_GROWTH = { hp: { easy: [3, 5, 8, 11, 15, 19, 24], medium: [4, 7, 10, 14, 18, 23, 29], hard: [5, 9, 13, 17, 22, 28, 35] }, atk: { easy: [1.5, 3, 5, 7, 10, 13, 17], medium: [2, 4, 6, 9, 12, 16, 21], hard: [3, 5, 8, 11, 15, 19, 25] }, def: { easy: [1, 2, 3, 5, 7, 9, 12], medium: [1.5, 3, 4.5, 6, 8, 11, 14], hard: [2, 4, 6, 8, 11, 14, 18] }, crystal: { easy: [4, 6, 9, 12, 16, 20, 26], medium: [5, 8, 11, 15, 19, 25, 32], hard: [6, 10, 14, 18, 24, 30, 38] }, exp: { easy: [3, 4, 6, 8, 11, 14, 18], medium: [4, 6, 8, 11, 14, 18, 23], hard: [5, 7, 10, 13, 17, 22, 28] } };
const VAMPIRE_GROWTH = { hp: { easy: [2, 4, 7, 10, 14, 18, 23], medium: [3, 6, 9, 13, 17, 22, 28], hard: [4, 8, 12, 16, 21, 27, 34] }, atk: { easy: [2, 4, 6, 9, 12, 16, 21], medium: [3, 5, 8, 11, 15, 20, 26], hard: [4, 7, 10, 14, 19, 25, 32] }, def: { easy: [1, 2, 3, 4, 6, 8, 10], medium: [1.5, 2.5, 4, 5.5, 7, 9, 12], hard: [2, 3.5, 5, 7, 9, 12, 15] }, crystal: { easy: [5, 8, 11, 15, 19, 24, 30], medium: [6, 10, 14, 18, 23, 29, 37], hard: [8, 12, 17, 22, 28, 36, 45] }, exp: { easy: [4, 6, 8, 11, 14, 18, 23], medium: [5, 7, 10, 13, 17, 22, 28], hard: [6, 9, 12, 16, 21, 27, 34] } };
const ORC_GROWTH = { hp: { easy: [4, 7, 11, 15, 20, 26, 33], medium: [5, 9, 14, 19, 25, 32, 40], hard: [7, 12, 17, 23, 30, 38, 48] }, atk: { easy: [3, 5, 8, 11, 15, 20, 26], medium: [4, 7, 10, 14, 19, 25, 32], hard: [5, 9, 13, 18, 24, 31, 40] }, def: { easy: [1, 2, 3.5, 5, 7, 9, 12], medium: [1.5, 3, 4.5, 6.5, 8.5, 11, 14], hard: [2, 4, 6, 8, 11, 14, 18] }, crystal: { easy: [3, 5, 7, 10, 13, 17, 22], medium: [4, 6, 9, 12, 16, 21, 27], hard: [5, 8, 11, 15, 20, 26, 33] }, exp: { easy: [5, 7, 10, 14, 18, 23, 29], medium: [6, 9, 12, 16, 21, 27, 34], hard: [8, 11, 15, 20, 26, 33, 42] } };
const DRAGON_GROWTH = { hp: { easy: [5, 9, 14, 19, 25, 32, 40], medium: [7, 12, 18, 24, 31, 39, 49], hard: [9, 15, 22, 29, 38, 48, 60] }, atk: { easy: [4, 7, 11, 15, 20, 26, 33], medium: [5, 9, 14, 19, 25, 32, 40], hard: [7, 12, 18, 24, 31, 40, 50] }, def: { easy: [2, 3.5, 5, 7, 9, 12, 15], medium: [2.5, 4.5, 6.5, 9, 12, 15, 19], hard: [3.5, 6, 8.5, 11.5, 15, 19, 24] }, crystal: { easy: [6, 9, 13, 17, 22, 28, 35], medium: [8, 12, 16, 21, 27, 34, 43], hard: [10, 15, 20, 26, 34, 43, 54] }, exp: { easy: [6, 9, 13, 17, 22, 28, 35], medium: [8, 12, 16, 21, 27, 34, 43], hard: [10, 14, 19, 25, 32, 40, 50] } };
```

### 4. Monster Stat System

Monster stats use a **snapshot growth system** that scales with encounter count, level, and difficulty.

- **Base Stats:** Each monster has base HP, ATK, DEF, Crystal reward, and EXP reward defined at Level 1.

- **Growth Per Encounter:** Stats increase each encounter based on growth tables specific to each monster, level, and difficulty.

- **Snapshot on Level-Up:** When the player levels up, current monster stats are "snapshotted" and become the new base for the next level. This creates smooth scaling without sudden difficulty spikes.

- **Display vs Backend:** Stats are calculated with decimal precision internally but displayed as rounded whole numbers to players. Death occurs when HP drops below 1.

| Monster | HP | ATK | DEF | Crystal | EXP |
| ----- | ----- | ----- | ----- | ----- | ----- |
| **Slime** | 40 | 3 | 2 | 10 | 27 |
| **Wolf** | 42 | 4 | 1 | 12 | 32 |
| **Zombie** | 48 | 5 | 5 | 14 | 42 |
| **Skeleton** | 42 | 7 | 1 | 18 | 50 |
| **Mimic** | 56 | 9 | 7 | 34 | 54 |
| **Vampire** | 50 | 12 | 6 | 40 | 66 |
| **Orc** | 68 | 15 | 8 | 30 | 80 |
| **Dragon** | 78 | 20 | 12 | 47 | 101 |

### 5. Monster Behaviours

### 6. Score System

Each monster has a Score value representing its challenge level. When defeated, the player earns points based on Score multiplied by difficulty: **Easy – 1x, Med – 1.5x, Hard – 2x.**

Score is used for leaderboards and end-of-run rankings, creating competitive incentive to fight harder monsters on higher difficulties.

## 10. Economy and Currencies

### 1. Gold (Permanent Global)

**Earning:**

- 1-5 Gold (scales with tier)

- Run completion: Bonus gold based on encounters threshold, times difficulty multiplier (Easy 1x, Medium 1.5x, Hard 2x). 

- For example, a player finishing a game within:

- 5-10 Encounters: 10 Gold

- 11-20 Encounters: 50 Gold

- 21-40 Encounters: 150 Gold

- 41+ Encounters: 300 Gold

- Achievements: 25-500 Gold

**Spending:**

- Hero Skins: 1000-5000 Gold

- Hero Unlocks: 500-2500 Gold

- Gallery Cards: 50-200 Gold/card

### 2. Crystals (Run-only Tactical)

**Earning:**

- Subsequent encounters generally give more Crystals (based on monster type, level, and difficulty)

- Difficulty multiplier: Easy 1x, Medium 1.5x, Hard 2x

- Skip shop bonus: +20/40/60, based on difficulty

**Spending:**

- Stat Upgrades

- Items

- Health Potion (heals a % of Max HP based on shop level; max 3 uses per level)

**Reset** Crystals to 0 on run end

**Track** `crystals_earned`, `crystals_spent` for analytics

### 3. Essence (Premium Global)

**Earning:**

- Elite kills: 2-8 Essence

- Bosses: 10-25 Essence

- Achievements: 10-100 Essence

- Campaign (future): 50-100 Essence per Chapter

- NOT purchasable with real money

**Spending:**

- Premium Heroes: 500+ Essence or $1.99-3.99

- Prestige Skins: 1000+ Essence or $3.99

- Legendary Cards: 50-200 Essence/Card


## 11. Shop Systems

### 1. Overview and Design Goals

The Shop appears between combat encounters and is the primary place where players convert **Crystals** into long-term power. Because Crystals are limited, players must make deliberate trade-offs between offense, defense, sustain, and class synergy.

**Design Goals:**

- Enforce meaningful resource allocation

- Support multiple build paths (offense / defense / ability usage)

- Provide class-specific customization

- Create tension between shopping now vs. saving for later

### 2. Shop Frequency and Skipping

Shops appear at fixed intervals based on difficulty:

| Difficulty | Encounters Between Shops |
| :---- | :---- |
| **Easy** | 3 |
| **Medium** | 3 |
| **Hard** | 3 |

Players may **skip a shop** to gain bonus Crystals:

| Difficulty | Skip Bonus (per level) |
| :---- | :---- |
| **Easy** | +20 |
| **Medium** | +40 |
| **Hard** | +60 |

Strategic Effects of Skipping:

- Increases Epic item chance in the next shop

- Skipped items are lost and changed to a different rotation next shop

- Enables larger future purchases

- Risk: delayed healing or power spikes

### 3. Shop Structure and Contents

Each shop always contains **exactly 8 items**:

- 4 Random Stat items

- 1 Health Potion

- 3 Premium slots (placeholders in MVP)

#### 1. Random Stat Items (Core Upgrade System)

Random items are drawn from three stat categories. Each shop guarantees **all three categories** among its four random items. One category appears twice (randomized evenly).

| Category | Focus | Stats |
| :---- | :---- | :---- |
| **Offensive** | Damage | ATK, Crit, Crit Mult, Pen |
| **Defensive** | Survivability | DEF, Max HP, Dodge |
| **Ability Usage** | Casting | Max Mana, Mana Regen |

Each category has 3 tiers. The first item in a category is always **Common**, and the second item, if present, is **Rare or Epic.**

| Tier | Stock | Efficiency | Characteristics |
| :---- | :---- | :---- | :---- |
| **Common** | 2 | ~100-120% | Single stat, cheapest |
| **Rare** | 1 | ~100-125% | Dual stat or premium single stat |
| **Epic** | 1 | ~110-135% | Best efficiency |



Skipping Shops increases Epic chance for the next shop:

| Shops Skipped | Rare Chance | Epic Chance |
| :---- | :---- | :---- |
| **0** | 80% | 20% |
| **1** | 70% | 30% |
| **2** | 60% | 40% |
| **3+** | 50% | 50% |

#### 2. Health Potion (Sustain Control)

- Always available in every shop

- Restores 25-50% Max HP

- Limited to 3 purchases per level

- Stock resets on level-up

- Heal amount and cost scale with level

#### 3. Premium Items (Class Identity)

Each shop includes 3 Premium slots in the UI, but these are placeholders in the MVP build (class premium tables are not implemented yet).

### 4. Shop Generation Summary

When a shop is generated:

1. Determine player's current level (shop level)  
2. Pick which category duplicates (offensive/defensive/ability)  
3. For each category slot:  
- First item: Common tier  
- Second item (if any): Roll Rare vs Epic based on skip count  
4. Add Health Potion (check remaining stock for this level)  
5. Add 3 Premium placeholder slots  
6. Apply level scaling to all items



## 12. Items and Relics

### 1. Item System Overview

Items provide permanent stat bonuses purchased with Crystals. The system is built around **efficiency trade-offs**: cheaper items are weaker per Crystal, while expensive items offer better long-term value.

**Item Types**

- Random Stat Items (core progression)  
- Consumables (Health Potion)  
- Premium Items (class-specific)


### 2. Efficiency System

Efficiency measures **value-per-Crystal** relative to a baseline.

**Baseline Stat Values (100%)**

- 1 ATK = 10 C  
- 1 DEF = 9 C  
- 1 Max HP = 5 C  
- 1% Crit = 12 C  
- 0.1x Crit Mult = 8 C  
- 1 Max Mana = 8 C  
- 1 Mana Regen = 30 C  
- 1% Pen = 15 C  
- 1% Dodge = 10 C

**Efficiency Formula**

Efficiency = (Total Stat Value / Cost) * 100%

**Target Efficiency by Tier**

* Common: ~100 → 113%  
* Rare: ~100 → 125%  
* Epic: ~110 → 135%

### 3. Random Stat Items

#### 1. Offensive Items

**Whetstone (Common, 2x) –** *“A simple tool for a sharper edge.”*

Pure ATK boost. Establishes the baseline Crystal/ATK ratio.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +4 ATK | 40 |
| **2** | +6 ATK | 60 |
| **3** | +9 ATK | 90 |
| **4** | +12 ATK | 115 |
| **5** | +16 ATK | 150 |
| **6** | +20 ATK | 180 |
| **7** | +25 ATK | 220 |

**Seeker’s Sight (Rare, 1x) –** *“Precision over power.”*

ATK + Crit Chance. Enables crit-focused builds.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +4 ATK, +3% Crit Chance | 70 |
| **2** | +5 ATK, +4% Crit Chance | 90 |
| **3** | +6 ATK, +5% Crit Chance | 105 |
| **4** | +8 ATK, +6% Crit Chance | 130 |
| **5** | +10 ATK, +8% Crit Chance | 160 |
| **6** | +12 ATK, +10% Crit Chance | 195 |
| **7** | +15 ATK, +12% Crit Chance | 235 |

**Executioner’s Edge (Epic, 1x) –** *“Strike where armor fails.”*

ATK + Penetration. Best offensive item, counters high-DEF enemies.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +12 ATK, +3% Penetration | 145 |
| **2** | +16 ATK, +4% Penetration | 185 |
| **3** | +21 ATK, +5% Penetration | 235 |
| **4** | +27 ATK, +6% Penetration | 295 |
| **5** | +34 ATK, +7% Penetration | 365 |
| **6** | +42 ATK, +8% Penetration | 440 |
| **7** | +52 ATK, +10% Penetration | 530 |

#### 2. Defensive Items

**Iron Plate (Common, 2x) –** *“Simple protection for simple folk”*

Pure DEF boost. Baseline defensive option.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +5 DEF | 45 |
| **2** | +7 DEF | 60 |
| **3** | +10 DEF | 88 |
| **4** | +13 DEF | 115 |
| **5** | +17 DEF | 150 |
| **6** | +22 DEF | 182 |
| **7** | +28 DEF | 220 |

**Vitality Gem (Rare, 1x) –** *“Life force crystallized.”*

Pure Max HP boost. Enables high-HP builds.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +12 Max HP | 60 |
| **2** | +16 Max HP | 80 |
| **3** | +22 Max HP | 100 |
| **4** | +28 Max HP | 125 |
| **5** | +36 Max HP | 150 |
| **6** | +48 Max HP | 190 |
| **7** | +60 Max HP | 230 |

**Guardian’s Bulwark (Epic, 1x) –** *“An heirloom of legendary defenders.”*

DEF + Max HP. Best defensive item, provides layered protection.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +10 Max HP, +6 DEF | 95 |
| **2** | +14 Max HP, +9 DEF | 130 |
| **3** | +18 Max HP, +12 DEF | 160 |
| **4** | +24 Max HP, +16 DEF | 205 |
| **5** | +30 Max HP, +20 DEF | 250 |
| **6** | +38 Max HP, +24 DEF | 300 |
| **7** | +50 Max HP, +30 DEF | 375 |

#### 3. Ability Usage Items

**Mana Crystal (Common, 2x) –** *“Condensed arcane energy.”*

Pure Current and Max Mana boost. Expands ability pool size.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +6 Max Mana | 50 |
| **2** | +8 Max Mana | 65 |
| **3** | +11 Max Mana | 85 |
| **4** | +14 Max Mana | 105 |
| **5** | +18 Max Mana | 135 |
| **6** | +23 Max Mana | 165 |
| **7** | +30 Max Mana | 210 |

**Arcane Focus (Rare, 1x) –** *“Channel the ley lines themselves.”*

ATK + Max Mana. Spell power with an expanded pool.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +2 ATK, +5 Max Mana | 60 |
| **2** | +3 ATK, +7 Max Mana | 85 |
| **3** | +4 ATK, +9 Max Mana | 105 |
| **4** | +5 ATK, +11 Max Mana | 125 |
| **5** | +7 ATK, +14 Max Mana | 155 |
| **6** | +10 ATK, +17 Max Mana | 195 |
| **7** | +14 ATK, +23 Max Mana | 260 |

**Wellspring Heart (Epic, 1x) –** *“A reservoir that never runs dry.”*

ATK + Max Mana + Mana Regen. The complete caster package for sustained ability spam.

| Level | Stats | Cost (Crystals) |
| :---- | :---- | :---- |
| **1** | +6 ATK, +10 Max Mana, +0 Mana Regen | 125 |
| **2** | +8 ATK, +14 Max Mana, +1 Mana Regen | 195 |
| **3** | +12 ATK, +18 Max Mana, +1 Mana Regen | 250 |
| **4** | +16 ATK, +22 Max Mana, +1 Mana Regen | 300 |
| **5** | +21 ATK, +28 Max Mana, +2 Mana Regen | 390 |
| **6** | +26 ATK, +34 Max Mana, +2 Mana Regen | 450 |
| **7** | +32 ATK, +42 Max Mana, +3 Mana Regen | 555 |

### 4. Premium Items

Premium items are designed with specific classes in mind, but they are not exclusive. While each class has three premium items that reinforce its intended playstyle, players are free to mix and match for creative builds.

#### 1. Warrior Premium Items

**Ironheart Charm** – “The heart that refuses to stop beating.”

- Cost: 420 Crystals  
- Stats: +50 Max HP, +5% Dodge Chance  
- Effect: **Last Stand – At 25% HP, gains a 25% Max HP shield that lasts until broken. This effect can happen once every 4 encounters.**

  **Stalwart Shield** – “Turn their strength into their downfall.”

- Cost: 560 Crystals  
- Stats: +60 Max HP, +18 DEF, +8% Penetration  
- Effect: **Spiked Rim – Reflect 10% of pre-mitigation damage**

**Ironblood Sigil** – “Forged in the blood of those who endured.”

- Cost: 1250 Crystals  
- Stats: +110 Max HP, +32 ATK  
- Effect: **Desperation – While below 35% HP, Basic Attack heals 8% Missing HP.**

#### 2. Ranger Premium Items

   **Glacial Quiver** – “Ice in your veins, frost in their armor.”

- Cost: 450 Crystals  
- Stats: +24 ATK, +10% Penetration  
- Effect: **Frostbite – Basic attacks apply Frost. At 3 stacks of Frost, enemy became Frostbitten, losing 20% DEF.**

**Swiftfoot Boots** – “Dodge the strike, deliver the storm.”

- Cost: 690 Crystals  
- Stats: +25 ATK, +15% Crit Chance, +8% Dodge Chance  
- Effect: **Evasive Steps – After Crit, the next instance of damage dealt by enemy is reduced by 12%. Additionally on Dodge, gains 10 ATK per current level.**

 

**Colossus Piercer** – “No giant is too tall to fall.”

- Cost: 1150 Crystals  
- Stats: +40 Max HP, +45 ATK, +15% Penetration  
- Effect: **Giant Slayer – Basic Attacks deal bonus TRUE DAMAGE equal to 4% enemy’s Current HP (capped at 120 damage).**

#### 3. Mage Premium Items

   **Mana Capacitor** – “Pain is merely fuel for the spark.”

- Cost: 380 Crystals  
- Stats: +30 Max HP, +30 Max Mana  
- Effect: **Kinetic Charge – Restores 4 Mana upon taken damage (once per turn), increases to 6 Mana when below 30% HP.** 

**Spellweaver’s Orb** – “Weave your spells into every strike.”

- Cost: 750 Crystals  
- Stats: +36 ATK, +50 Max Mana  
- Effect: **Echoes of Magic – After using an ability, your next Basic Attack does 120% ATK and restores 2 Mana.**

 

**Void Heart** – “A vessel for the infinite emptiness.”

- Cost: 1250 Crystals  
- Stats: +60 Max HP, +55 ATK, +60 Max Mana  
- Effect: **Underload – While below 30% Mana, gains 3 Mana Regen. Overload – While above 90% Mana, your next ability does 50% bonus damage and Stuns enemy for a turn.** 

#### 4. Assassin Premium Items

   **Shadowblade** – “End the fight before it truly begins.”

- Cost: 450 Crystals  
- Stats: +22 ATK, +8% Penetration  
- Effect: **Ambush – The first Basic Attack in each encounter ignores 50% enemy DEF.**

**Ghost Veil** – “Now you see me, now you're dead.”

- Cost: 650 Crystals  
- Stats: +40 Max HP, +15 ATK, +20 Max Mana, +7% Dodge Chance  
- Effects: Shadowstep – **After using an ability, gains 15% Dodge Chance for 1 turn.**

**Sanguine Dagger** – “Drink deep from the wounds of foes.”

- Cost: 1200 Crystals  
- Stats: +54 ATK, +15% Crit Chance, +0.25x Crit Multiplier  
- Effect: **Vampiric Crit – Basic Attack heals for 3% damage dealt, and increases to 10% on Crits.**

## 13. Progression Systems

### 1. Run Progression (MVP)

- Runs track `encounter` (player-facing) and `internalEncounter` (resets on level-up) to support per-level scaling.
- Run levels go from 1 to 7. Level-ups reset per-level counters (shop skips, potion uses) and snapshot monster stats for the next level.
- EXP is tracked cumulatively during the run.

### 2. Meta Progression + Persistence (MVP)

The game uses local persistence for meta progression only:

- Persisted: `totalGold`, `unlockedHeroes`, `settings`.
- Not persisted: active run state (closing/refreshing mid-run resets the run).

## 14. Statistics and Tracking

### 1. Run Tracking (MVP)

Tracked per-run stats (used for summary/analytics/leaderboards):

- `score`
- `crystalsEarned`, `crystalsSpent`
- `shopsSkipped`
- `monstersKilled` (by monster type)

## 15. Leaderboards

MVP note: leaderboard submission is not implemented yet, but the run tracks `score` and encounter count for future ranking.

## 16. Gallery and Collection

MVP note: gallery/collection UI is not implemented yet. Meta progression currently persists unlocked heroes and total gold.

## 17. User Interface and User Experience

### 1. Combat HUD (MVP)

- Combat Header shows turn counter, encounter + level, crystals, and an EXP progress bar.
- Theme toggle is available in the header.

### 2. Combat Log (MVP)

- A scrollable action history shows turn-stamped entries.
- Entries are visually differentiated for hero vs monster actions and call out crits.

### 3. Run Summary (MVP)

- Run Summary displays encounter reached, score, crystals earned, and total monsters killed.
