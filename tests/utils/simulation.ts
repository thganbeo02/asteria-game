import { useCombatStore, useGameStore } from "@/stores";
import { TurnManager } from "@/systems/combat/turnManager";
import { proceedToNextEncounter } from "@/systems/combat/combatActions";
import { DAMAGE_FORMULA_CONSTANT, DIFFICULTY_CONFIG, EXP_THRESHOLDS, MAX_LEVEL } from "@/lib/constants";
import {
  getDefenseModifier,
  getOutgoingDamageModifier,
} from "@/systems/combat/statusEffects";
import type { HeroState, MonsterState, ShopOffer } from "@/types";

import {
  decideActionForHero,
  desiredPotionThreshold,
  estimateIncomingDamage,
  getItemWeights,
  type SimulationContext,
  type Strategy,
} from "./strategyProfiles";

// Mock setTimeout to be immediate
// @ts-expect-error - test simulation override
global.setTimeout = (fn: () => void) => {
  fn();
  return 0 as unknown as ReturnType<typeof setTimeout>;
};

type ShopSkipMode = "never" | "always" | "alternate" | "other";

function parseShopSkipMode(): ShopSkipMode {
  const raw = (process.env.SHOP_SKIP_MODE || "never").trim().toLowerCase();
  const mode = (raw || "never") as string;
  if (mode === "never" || mode === "always" || mode === "alternate" || mode === "other") return mode;
  throw new Error(`Invalid SHOP_SKIP_MODE: '${raw}'. Allowed: never | always | alternate | other`);
}

export interface SimulationResult {
  encounters: number;
  score: number;
  crystalsEarned: number;
  crystalsSpent: number;
  crystalsEnd: number;
  shopsSkipped: number;
  finalLevel: number;
  expIntoLevel: number;
  endedIn: "death" | "clear";
  purchasedItemIds: string[];
  metrics: {
    actions: {
      basic: number;
      abilities: Record<string, number>;
    };
    abilities: {
      castsById: Record<string, number>;
      manaSpentById: Record<string, number>;
    };
    mana: {
      spentTotal: number;
      restoredObservedTotal: number;
      restoredFromCritTotal: number;
      regenPotentialFromBasicsTotal: number;
      rapidFireHealTotal: number;
      jackpotBonusCrystalsTotal: number;
    };
    combat: {
      crits: number;
      dodges: {
        hero: number;
        monster: number;
      };
    };
    kills: {
      total: number;
      jackpot: number;
    };

    bran: {
      fortify: {
        hpGainTotal: number;
        masteryUnlocks: number;
      };
      ironWill: {
        healTotal: number;
        penetrationUnlocks: number;
      };
      crushingBlow: {
        killCount: number;
        statGainTotal: number;
      };
      shieldSlam: {
        stunsApplied: number;
      };
    };
    shop: {
      itemsPurchased: number;
      potionsPurchased: number;
      shopVisits: number;
      shopSkips: number;
      shopOpportunities: number;

      crystalsFromSkips: number;

      zeroBuyShops: number;
      noAffordableShops: number;
      offersTotal: number;
      affordableOffersTotal: number;

      // Per-entered-shop diagnostics
      walletAtEntry: number[];
      minItemCost: number[];
      maxItemCost: number[];
      affordableItemsCount: number[];
      bestAffordableItemScore: number[];
      secondAffordableItemScore: number[];
      zeroBuyReasons: Record<string, number>;
      itemsByCategory: Record<string, number>;
      itemsByRarity: Record<string, number>;
      statsGained: {
        atk: number;
        def: number;
        maxHp: number;
        maxMana: number;
        manaRegen: number;
        critChance: number;
        critMultiplier: number;
        dodge: number;
        penetration: number;
      };
    };
    efficiency: {
      encountersCount: number;
      turnsTotal: number;
      dmgDealtTotal: number;
      dmgTakenTotal: number;
    };
  };
}

function getExpIntoLevel(totalExp: number, level: number): number {
  if (level >= MAX_LEVEL) return 0;
  const prev = (EXP_THRESHOLDS as Record<number, number>)[level] ?? 0;
  return Math.max(0, totalExp - prev);
}

// -----------------------------------------------------------------------------
// DECISION ENGINE
// -----------------------------------------------------------------------------

function estimateAbilityDamage(
  hero: HeroState,
  monster: MonsterState,
  scaling: number,
  extraPen = 0,
  hits = 1,
): { min: number; expected: number } {
  const dmgMod = getOutgoingDamageModifier(hero.statusEffects);
  const defMod = getDefenseModifier(monster.statusEffects);

  const atk = Math.floor((hero.stats.atk + hero.stats.bonusAtk) * dmgMod);
  const def = Math.floor(monster.def * defMod);

  const pen = hero.stats.penetration + hero.stats.bonusPenetration + extraPen;
  const effectiveDef = Math.max(0, def * (1 - pen / 100));

  const mitigation =
    DAMAGE_FORMULA_CONSTANT / (DAMAGE_FORMULA_CONSTANT + effectiveDef);
  const rawDamage = Math.floor(atk * scaling * mitigation);

  const min = Math.max(1, rawDamage) * hits;

  const critChance =
    Math.min(100, hero.stats.critChance + hero.stats.bonusCritChance) / 100;
  const critMult = hero.stats.critMultiplier + hero.stats.bonusCritMultiplier;
  const expected =
    Math.max(1, rawDamage * (1 + critChance * (critMult - 1))) * hits;

  return { min, expected };
}

function decideAction(heroId: string, strategy: Strategy, context: SimulationContext): number | "basic" {
  const store = useCombatStore.getState();
  const { hero, monster } = store;
  if (!hero || !monster) return "basic";

  const levelIdx = Math.min(hero.level - 1, 6);
  const maxHp = hero.stats.maxHp + hero.stats.bonusMaxHp;
  const hpPct = maxHp > 0 ? (hero.stats.hp / maxHp) * 100 : 0;
  const monsterHp = monster.hp;

  const currentMana = hero.stats.mana;
  const maxMana = hero.stats.maxMana + hero.stats.bonusMaxMana;
  const manaPct = maxMana > 0 ? (currentMana / maxMana) * 100 : 0;

  const canUse = (idx: number) => {
    const ab = hero.abilities[idx];
    if (!ab) return false;
    const cost = ab.manaCost[levelIdx];
    return ab.currentCooldown === 0 && hero.stats.mana >= cost;
  };

  const costOf = (idx: number) => hero.abilities[idx]?.manaCost[levelIdx] ?? Infinity;

  return decideActionForHero({
    heroId,
    strategy,
    hero,
    monster,
    context,
    levelIdx,
    maxHp,
    hpPct,
    manaPct,
    currentMana,
    monsterHp,
    canUse,
    costOf,
    estimateAbilityDamage,
    estimateIncomingDamage,
  });
}

function hpPercent(hero: HeroState): number {
  const maxHp = hero.stats.maxHp + hero.stats.bonusMaxHp;
  if (maxHp <= 0) return 0;
  return (hero.stats.hp / maxHp) * 100;
}

function itemScore(heroId: string, strategy: Strategy, offer: Extract<ShopOffer, { type: "item" }>): number {
  const s = offer.stats;

  const w = getItemWeights(heroId, strategy);

  const value =
    (s.atk ?? 0) * w.atk +
    (s.def ?? 0) * w.def +
    (s.maxHp ?? 0) * w.maxHp +
    (s.maxMana ?? 0) * w.maxMana +
    (s.manaRegen ?? 0) * w.manaRegen +
    (s.critChance ?? 0) * w.critChance +
    (s.critMultiplier ?? 0) * w.critMultiplier +
    (s.dodge ?? 0) * w.dodge +
    (s.penetration ?? 0) * w.penetration;

  if (offer.cost <= 0) return 0;
  return value / offer.cost;
}

function addStatsGained(
  acc: SimulationResult["metrics"]["shop"]["statsGained"],
  stats: {
    atk?: number;
    def?: number;
    maxHp?: number;
    maxMana?: number;
    manaRegen?: number;
    critChance?: number;
    critMultiplier?: number;
    dodge?: number;
    penetration?: number;
  } | undefined,
): void {
  if (!stats) return;

  acc.atk += stats.atk ?? 0;
  acc.def += stats.def ?? 0;
  acc.maxHp += stats.maxHp ?? 0;
  acc.maxMana += stats.maxMana ?? 0;
  acc.manaRegen += stats.manaRegen ?? 0;
  acc.critChance += stats.critChance ?? 0;
  acc.critMultiplier += stats.critMultiplier ?? 0;
  acc.dodge += stats.dodge ?? 0;
  acc.penetration += stats.penetration ?? 0;
}

function simulateShop(
  heroId: string,
  strategy: Strategy,
  difficulty: "easy" | "medium" | "hard",
  metrics: SimulationResult["metrics"],
): void {
  const game = useGameStore.getState();
  const combat = useCombatStore.getState();
  if (!game.run) return;

  metrics.shop.shopVisits++;

  game.openShop();

  const beforeItems = metrics.shop.itemsPurchased;
  const beforePotions = metrics.shop.potionsPurchased;

  const opened = useGameStore.getState().shop;
  const openedRun = useGameStore.getState().run;
  const openedHero = useCombatStore.getState().hero;
  const hpAtEntry = openedHero ? hpPercent(openedHero) : 100;
  const wantsPotion = openedHero ? hpAtEntry < desiredPotionThreshold(heroId, strategy) : false;
  let potionAffordableAtEntry = false;
  let affordableItemsAtEntry = 0;
  if (opened && openedRun) {
    const offers = opened.offers;
    const crystals = openedRun.crystals;

    metrics.shop.walletAtEntry.push(crystals);

    const items = offers.filter((o): o is Extract<ShopOffer, { type: "item" }> => o.type === "item");
    if (items.length) {
      const costs = items.map((i) => i.cost);
      metrics.shop.minItemCost.push(Math.min(...costs));
      metrics.shop.maxItemCost.push(Math.max(...costs));

      const affordableItems = items.filter((i) => i.remainingStock > 0 && crystals >= i.cost);
      affordableItemsAtEntry = affordableItems.length;
      metrics.shop.affordableItemsCount.push(affordableItemsAtEntry);

      // NoAffordable is item-only (potion excluded).
      if (affordableItemsAtEntry === 0) metrics.shop.noAffordableShops++;

      // Best/second-best item score among AFFORDABLE items (most actionable).
      if (affordableItems.length) {
        const scores = affordableItems
          .map((i) => itemScore(heroId, strategy, i))
          .sort((a, b) => b - a);
        metrics.shop.bestAffordableItemScore.push(scores[0] ?? 0);
        if (scores.length > 1) metrics.shop.secondAffordableItemScore.push(scores[1] ?? 0);
      }
    }

    const potion = offers.find((o) => o.type === "potion");
    if (potion && potion.type === "potion") {
      potionAffordableAtEntry = potion.remainingThisLevel > 0 && crystals >= potion.cost;
    }

    const buyableOffers = offers.filter((o) => {
      if (o.type === "item") return o.remainingStock > 0 && crystals >= o.cost;
      if (o.type === "potion") return o.remainingThisLevel > 0 && crystals >= o.cost;
      return false;
    });

    const countOffers = offers.filter((o) => o.type !== "premium_placeholder").length;
    metrics.shop.offersTotal += countOffers;
    metrics.shop.affordableOffersTotal += buyableOffers.length;
  }

  let safety = 0;
  while (safety++ < 30) {
    const { shop, run } = useGameStore.getState();
    const hero = useCombatStore.getState().hero;
    if (!shop || !run || !hero) break;

    const potion = shop.offers.find((o) => o.type === "potion");
    if (potion && potion.type === "potion") {
      const threshold = desiredPotionThreshold(heroId, strategy);
      const currentHpPct = hpPercent(hero);
      if (currentHpPct < threshold && potion.remainingThisLevel > 0 && run.crystals >= potion.cost) {
        const result = game.buyOffer(potion.id);
        if (result.ok && result.kind === "potion") {
          const maxHp = hero.stats.maxHp + hero.stats.bonusMaxHp;
          const healAmount = Math.floor((maxHp * result.healPercent) / 100);
          combat.healHero(healAmount);
          metrics.shop.potionsPurchased++;
          continue;
        }
      }
    }

    const items = shop.offers.filter((o): o is Extract<ShopOffer, { type: "item" }> => o.type === "item");
    const affordable = items.filter((o) => o.remainingStock > 0 && run.crystals >= o.cost);
    if (affordable.length === 0) break;

    let best: Extract<ShopOffer, { type: "item" }> | null = null;
    let bestScore = 0;

    for (const o of affordable) {
      const score = itemScore(heroId, strategy, o);
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    }

    if (!best || bestScore <= 0) break;

    const result = game.buyOffer(best.id);
    if (!result.ok || result.kind !== "item") break;

    combat.applyItemStats(result.item.stats);
    metrics.shop.itemsPurchased++;
    addStatsGained(metrics.shop.statsGained, result.item.stats);
    metrics.shop.itemsByCategory[best.category] = (metrics.shop.itemsByCategory[best.category] ?? 0) + 1;
    metrics.shop.itemsByRarity[best.rarity] = (metrics.shop.itemsByRarity[best.rarity] ?? 0) + 1;
  }

  // Leave shop -> next fight
  const g = useGameStore.getState();
  const c = useCombatStore.getState();
  if (!g.run) return;

  const boughtThisShop = (metrics.shop.itemsPurchased - beforeItems) + (metrics.shop.potionsPurchased - beforePotions);
  if (boughtThisShop === 0) {
    metrics.shop.zeroBuyShops++;

    let reason = "unknown";
    if (affordableItemsAtEntry === 0) {
      if (potionAffordableAtEntry && !wantsPotion) {
        reason = "potion_only_affordable";
      } else {
        reason = "no_affordable_item";
      }
    } else {
      // There were affordable items, but we did not buy.
      // In current logic this implies no item had a positive value score.
      reason = "no_positive_score_item";
    }

    metrics.shop.zeroBuyReasons[reason] = (metrics.shop.zeroBuyReasons[reason] ?? 0) + 1;
  }

  g.closeShop();
  c.clearLog();
  c.resetTurn();
  c.spawnMonster(difficulty);
  g.setPhase("combat");
}

// -----------------------------------------------------------------------------
// SIMULATION RUNNER
// -----------------------------------------------------------------------------

export function runSimulation(
  heroId: string,
  difficulty: "easy" | "medium" | "hard",
  strategy: Strategy,
): SimulationResult {
  const combat = useCombatStore.getState();
  const game = useGameStore.getState();

  // Reset stores
  combat.clearCombat();
  useGameStore.setState({ run: null, phase: "hero_select" });

  // Start run
  game.startRun(heroId, difficulty);
  combat.initCombat(heroId, difficulty);

  const metrics = {
    actions: { basic: 0, abilities: {} as Record<string, number> },
    abilities: { castsById: {} as Record<string, number>, manaSpentById: {} as Record<string, number> },
    mana: {
      spentTotal: 0,
      restoredObservedTotal: 0,
      restoredFromCritTotal: 0,
      regenPotentialFromBasicsTotal: 0,
      rapidFireHealTotal: 0,
      jackpotBonusCrystalsTotal: 0,
    },
    combat: { crits: 0, dodges: { hero: 0, monster: 0 } },
    kills: { total: 0, jackpot: 0 },
    bran: {
      fortify: { hpGainTotal: 0, masteryUnlocks: 0 },
      ironWill: { healTotal: 0, penetrationUnlocks: 0 },
      crushingBlow: { killCount: 0, statGainTotal: 0 },
      shieldSlam: { stunsApplied: 0 },
    },
    shop: {
      itemsPurchased: 0,
      potionsPurchased: 0,
      shopVisits: 0,
      shopSkips: 0,
      shopOpportunities: 0,

      crystalsFromSkips: 0,

      zeroBuyShops: 0,
      noAffordableShops: 0,
      offersTotal: 0,
      affordableOffersTotal: 0,

      walletAtEntry: [],
      minItemCost: [],
      maxItemCost: [],
      affordableItemsCount: [],
      bestAffordableItemScore: [],
      secondAffordableItemScore: [],
      zeroBuyReasons: {},
      itemsByCategory: {},
      itemsByRarity: {},
      statsGained: {
        atk: 0,
        def: 0,
        maxHp: 0,
        maxMana: 0,
        manaRegen: 0,
        critChance: 0,
        critMultiplier: 0,
        dodge: 0,
        penetration: 0,
      },
    },
    efficiency: {
      encountersCount: 0,
      turnsTotal: 0,
      dmgDealtTotal: 0,
      dmgTakenTotal: 0,
    },
  };

  let encounters = 0;
  const MAX_ENCOUNTERS = 100;
  let lastLogCount = 0;
  let turnsThisFight = 0;
  let monsterTurnsThisFight = 0;
  let dmgDealtThisFight = 0;
  let dmgTakenThisFight = 0;

  let prevMana: number | null = null;

  let shopOpportunityIndex = 0;
  const shopSkipMode = parseShopSkipMode();

  const purchasedItemIds = new Set<string>();

  while (
    useGameStore.getState().phase !== "death" &&
    useGameStore.getState().phase !== "run_summary" &&
    encounters < MAX_ENCOUNTERS
  ) {
    const currentState = useCombatStore.getState();
    const gamePhase = useGameStore.getState().phase;

    // Track observed mana restoration via state deltas (capped by max mana).
    if (currentState.hero) {
      const manaNow = currentState.hero.stats.mana;
      if (prevMana !== null) {
        const delta = manaNow - prevMana;
        if (delta > 0) metrics.mana.restoredObservedTotal += delta;
      }
      prevMana = manaNow;
    }

    // Process logs for metrics
    const currentLogs = currentState.combatLog;
    if (currentLogs.length < lastLogCount) {
      // Combat log can be cleared between encounters (e.g. shop skip path).
      // Reset our cursor to keep metrics accurate.
      lastLogCount = 0;
    }
    if (currentLogs.length > lastLogCount) {
      const newLogs = currentLogs.slice(lastLogCount);
      for (const log of newLogs) {
        if (log.isCrit) metrics.combat.crits++;

        // Dodge detection
        if (
          log.actor === "hero" &&
          (log.message.includes("dodged") || log.message.includes("missed"))
        ) {
          metrics.combat.dodges.monster++;
        }
        if (log.actor === "monster" && log.message.includes("dodged")) {
          metrics.combat.dodges.hero++;
        }

        if (log.action === "crystal_on_kill") {
          metrics.kills.jackpot++;

          // Bonus crystals from Camira's Jackpot Arrow
          const m = log.message.match(/\+(\d+)\s+bonus\s+crystals/i);
          if (m) {
            metrics.mana.jackpotBonusCrystalsTotal += Number(m[1]);
          }
        }

        // Mana restored on crit (Camira passive)
        if (log.action === "camira_crit") {
          const m = log.message.match(/\+(\d+)\s+mana/i);
          if (m) {
            metrics.mana.restoredFromCritTotal += Number(m[1]);
          }
        }

        // Rapid Fire lifesteal healing
        if (log.action === "lifesteal") {
          const m = log.message.match(/heals\s+you\s+for\s+(\d+)\s+HP/i);
          if (m) {
            metrics.mana.rapidFireHealTotal += Number(m[1]);
          }
        }

        // Bran instrumentation (only meaningful for Bran runs, but safe to collect)
        if (log.action === "bran_iron_will") {
          const m = log.message.match(/Healed\s+(\d+)\s+HP/i);
          if (m) metrics.bran.ironWill.healTotal += Number(m[1]);
        }

        if (log.action === "bran_penetration_unlock") {
          metrics.bran.ironWill.penetrationUnlocks++;
        }

        if (log.action === "fortify_hp_gain") {
          const m = log.message.match(/\+(\d+)\s+Max\s+HP/i);
          if (m) metrics.bran.fortify.hpGainTotal += Number(m[1]);
        }

        if (log.action === "fortify_mastery") {
          metrics.bran.fortify.masteryUnlocks++;
        }

        if (log.action === "crushing_blow_kill") {
          metrics.bran.crushingBlow.killCount++;
          const m = log.message.match(/\+(\d+)\s+ATK\s+and\s+\+(\d+)\s+DEF/i);
          if (m) metrics.bran.crushingBlow.statGainTotal += Number(m[1]) + Number(m[2]);
        }

        if (log.action === "stun" && log.statusApplied === "stun") {
          metrics.bran.shieldSlam.stunsApplied++;
        }

        if (typeof log.damage === "number") {
          if (log.actor === "hero") dmgDealtThisFight += log.damage;
          if (log.actor === "monster" && log.action !== "attack_shield") dmgTakenThisFight += log.damage;
        }
      }
      lastLogCount = currentLogs.length;
    }

    if (gamePhase === "shop") {
      simulateShop(heroId, strategy, difficulty, metrics);
      lastLogCount = 0;
      turnsThisFight = 0;
      monsterTurnsThisFight = 0;
      dmgDealtThisFight = 0;
      dmgTakenThisFight = 0;
      continue;
    }

    if (gamePhase === "victory") {
      metrics.kills.total++;

      // Commit this encounter's totals
      metrics.efficiency.encountersCount++;
      metrics.efficiency.turnsTotal += turnsThisFight + monsterTurnsThisFight;
      metrics.efficiency.dmgDealtTotal += dmgDealtThisFight;
      metrics.efficiency.dmgTakenTotal += dmgTakenThisFight;

      turnsThisFight = 0;
      monsterTurnsThisFight = 0;
      dmgDealtThisFight = 0;
      dmgTakenThisFight = 0;

      const run = useGameStore.getState().run;
      const hero = useCombatStore.getState().hero;
      if (run && hero) {
        const nextEncounter = run.encounter + 1;
        const shopFrequency = DIFFICULTY_CONFIG[run.difficulty].shopFrequency;
        const willShop = (nextEncounter - 1) % shopFrequency === 0 && nextEncounter > 1;

        if (willShop) {
          metrics.shop.shopOpportunities++;

          const idx = shopOpportunityIndex;
          shopOpportunityIndex++;

          const enter =
            shopSkipMode === "always"
              ? false
              : shopSkipMode === "other"
                ? (idx % 2 === 1) // skip the first opportunity, then alternate
                : shopSkipMode === "alternate"
                  ? (idx % 2 === 0) // enter the first opportunity, then alternate
                  : true;

          if (!enter) {
            metrics.shop.shopSkips++;
            const bonus = DIFFICULTY_CONFIG[run.difficulty].skipBonus * run.currentLevel;
            metrics.shop.crystalsFromSkips += bonus;
          }
          proceedToNextEncounter(enter ? "shop" : "skip_shop");
        } else {
          proceedToNextEncounter();
        }
      } else {
        proceedToNextEncounter();
      }
      continue;
    }

    if (gamePhase === "combat") {
      if (currentState.turnPhase === "combat_end") {
        if (useGameStore.getState().phase === "death") break;
        if (currentState.monster && currentState.monster.hp <= 0) {
          turnsThisFight = 0;
          monsterTurnsThisFight = 0;
          dmgDealtThisFight = 0;
          dmgTakenThisFight = 0;
          TurnManager.handleVictory();
        } else if (currentState.hero && currentState.hero.stats.hp <= 0) {
          // Commit this encounter's totals before ending
          metrics.efficiency.encountersCount++;
          metrics.efficiency.turnsTotal += turnsThisFight + monsterTurnsThisFight;
          metrics.efficiency.dmgDealtTotal += dmgDealtThisFight;
          metrics.efficiency.dmgTakenTotal += dmgTakenThisFight;

          turnsThisFight = 0;
          monsterTurnsThisFight = 0;
          dmgDealtThisFight = 0;
          dmgTakenThisFight = 0;
          TurnManager.handleDefeat();
        }
        continue;
      }

      if (currentState.turnPhase === "player_turn") {
        turnsThisFight++;
        const action = decideAction(heroId, strategy, { turnsThisFight });

        if (action === "basic") {
          metrics.actions.basic++;
          if (currentState.hero) {
            metrics.mana.regenPotentialFromBasicsTotal += currentState.hero.stats.manaRegen;
          }
          TurnManager.executeBasicAttack();
        } else {
          const abId = currentState.hero?.abilities[action]?.id || "unknown";
          metrics.actions.abilities[abId] =
            (metrics.actions.abilities[abId] || 0) + 1;

          const ability = currentState.hero?.abilities[action];
          if (ability && currentState.hero) {
            const levelIdx = Math.min(currentState.hero.level - 1, 6);
            const cost = ability.manaCost?.[levelIdx] ?? 0;
            metrics.abilities.castsById[ability.id] = (metrics.abilities.castsById[ability.id] || 0) + 1;
            metrics.abilities.manaSpentById[ability.id] = (metrics.abilities.manaSpentById[ability.id] || 0) + cost;
            metrics.mana.spentTotal += cost;
          }

          TurnManager.executeAbility(action);
        }
      } else if (currentState.turnPhase === "monster_turn") {
        monsterTurnsThisFight++;
        TurnManager.executeMonsterTurn();
      }
    }

    const newEncounters = useGameStore.getState().run?.encounter || 0;
    if (newEncounters > encounters) encounters = newEncounters;
    if (encounters >= MAX_ENCOUNTERS) {
      // Treat reaching MAX_ENCOUNTERS as a clear condition for benchmarking.
      useGameStore.getState().endRun(true);
      break;
    }
  }

  const finalRun = useGameStore.getState().run;
  const finalHero = useCombatStore.getState().hero;
  const finalLevel = finalHero?.level ?? finalRun?.currentLevel ?? 1;
  const expIntoLevel = getExpIntoLevel(finalRun?.exp ?? 0, finalLevel);

  const finalPhase = useGameStore.getState().phase;
  const endedIn: SimulationResult["endedIn"] = finalPhase === "death" ? "death" : "clear";

  // Collect purchased items from run state if available
  const purchased = finalRun?.purchasedItems ?? [];
  for (const it of purchased) {
    if (it.definitionId) purchasedItemIds.add(it.definitionId);
  }

  const crystalsEnd = finalRun?.crystals ?? 0;
  return {
    encounters: finalRun?.encounter || 0,
    score: finalRun?.score || 0,
    crystalsEarned: finalRun?.crystalsEarned || 0,
    crystalsSpent: finalRun?.crystalsSpent || 0,
    crystalsEnd,
    shopsSkipped: finalRun?.shopsSkipped || 0,
    finalLevel,
    expIntoLevel,
    endedIn,
    purchasedItemIds: Array.from(purchasedItemIds),
    metrics,
  };
}
