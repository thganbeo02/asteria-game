import { describe, it } from "vitest";
import { runSimulation, SimulationResult } from "./utils/simulation";
import {
  DEFAULT_STRATEGIES,
  formatStrategy,
  getHeroKitSummary,
  getStrategyMeaning,
  type Strategy,
} from "./utils/strategyProfiles";
import fs from "fs";
import path from "path";
import { DIFFICULTY_CONFIG } from "@/lib/constants";

type Difficulty = "easy" | "medium" | "hard";

type ShopSkipMode = "never" | "always" | "alternate" | "other";

function parseShopSkipMode(): ShopSkipMode {
  const raw = (process.env.SHOP_SKIP_MODE || "never").trim().toLowerCase();
  const mode = (raw || "never") as string;
  if (mode === "never" || mode === "always" || mode === "alternate" || mode === "other") return mode;
  throw new Error(`Invalid SHOP_SKIP_MODE: '${raw}'. Allowed: never | always | alternate | other`);
}

const SIM_COUNT = 10;

function hashStringToUint32(input: string): number {
  // FNV-1a
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentileInt(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return Math.round(sorted[idx]!);
}

function percentileNum(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx] ?? null;
}

function roundMaybe(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

function fmtMult(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) => {
    let w = h.length;
    for (const r of rows) w = Math.max(w, (r[i] ?? "").length);
    return w;
  });

  const pad = (s: string, w: number) => s.padEnd(w);

  const headerLine = `| ${headers.map((h, i) => pad(h, widths[i]!)).join(" | ")} |`;
  const sepLine = `| ${headers.map((_, i) => "-".repeat(widths[i]!)).join(" | ")} |`;
  const rowLines = rows.map(
    (r) => `| ${r.map((c, i) => pad(c, widths[i]!)).join(" | ")} |`,
  );

  return [headerLine, sepLine, ...rowLines].join("\n");
}

function formatDateHCM(d: Date): { dateMMDDYY: string; timeHHMMSS: string; timestamp: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const mm = get("month");
  const dd = get("day");
  const yy = get("year");
  const hh = get("hour");
  const min = get("minute");
  const sec = get("second");

  const dateMMDDYY = `${mm}${dd}${yy}`;
  const timeHHMMSS = `${hh}${min}${sec}`;
  const timestamp = `20${yy}-${mm}-${dd} ${hh}:${min}:${sec}`;

  return { dateMMDDYY, timeHHMMSS, timestamp };
}

function uniqueReportPath(dir: string, baseName: string): string {
  const candidate = path.join(dir, baseName);
  if (!fs.existsSync(candidate)) return candidate;

  const ext = path.extname(baseName);
  const stem = baseName.slice(0, Math.max(0, baseName.length - ext.length));
  for (let i = 1; i <= 999; i++) {
    const suffix = String(i).padStart(2, "0");
    const next = path.join(dir, `${stem}_${suffix}${ext}`);
    if (!fs.existsSync(next)) return next;
  }

  // Extremely unlikely; fall back to timestamp-based uniqueness.
  return path.join(dir, `${stem}_${Date.now()}${ext}`);
}

const SCORE_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

const ITEM_NAMES: Record<string, string> = {
  whetstone: "Whetstone",
  seekers_sight: "Seeker's Sight",
  executioners_edge: "Executioner's Edge",
  iron_plate: "Iron Plate",
  vitality_gem: "Vitality Gem",
  guardians_bulwark: "Guardian's Bulwark",
  mana_crystal: "Mana Crystal",
  arcane_focus: "Arcane Focus",
  wellspring_heart: "Wellspring Heart",
};

type ResultsByDiffStrat = Record<Difficulty, Record<Strategy, SimulationResult[]>>;

function emptyResultsByDiffStrat(): ResultsByDiffStrat {
  const emptyStrat = (): Record<Strategy, SimulationResult[]> => ({
    survival: [],
    balanced: [],
    greed: [],
    apex: [],
  });

  return {
    easy: emptyStrat(),
    medium: emptyStrat(),
    hard: emptyStrat(),
  };
}

describe("Hero Balance Benchmark", () => {
  it(
    "runs simulations for heroes",
    () => {
      // If process.env.HERO is set, run only that hero
      const targetHero = process.env.HERO;
    const heroes = targetHero ? [targetHero] : ["camira", "lyra", "bran", "shade"];
    
    // Config via env or default
    const difficulties: Difficulty[] = process.env.DIFF
      ? [process.env.DIFF as Difficulty]
      : ["easy", "medium", "hard"];
    const strategies: Strategy[] = process.env.STRAT
      ? [process.env.STRAT as Strategy]
      : DEFAULT_STRATEGIES;
    const runs = process.env.RUNS ? parseInt(process.env.RUNS) : SIM_COUNT;

    const isHeroReportMode = Boolean(targetHero) && !process.env.DIFF && !process.env.STRAT;
    const now = new Date();
    const hcm = formatDateHCM(now);

    // Hard-fail on unknown shop skip modes (prevents silent "never" fallbacks).
    const shopSkipMode = parseShopSkipMode();

    // Collect results
    const byHero: Record<string, ResultsByDiffStrat> = {};

    for (const hero of heroes) {
      byHero[hero] = emptyResultsByDiffStrat();

      for (const diff of difficulties) {
        for (const strat of strategies) {
          const results: SimulationResult[] = [];

          for (let i = 0; i < runs; i++) {
            const seed = hashStringToUint32(`${hero}|${diff}|${strat}|${i}|runs=${runs}`);
            const rng = mulberry32(seed);
            const originalRandom = Math.random;
            Math.random = rng;
            try {
              results.push(runSimulation(hero, diff, strat));
            } catch {
              // Swallow simulation errors for benchmark aggregation.
            } finally {
              Math.random = originalRandom;
            }
          }

          byHero[hero]![diff]![strat] = results;
        }
      }
    }

    // Report generator (hero mode)
    if (isHeroReportMode && targetHero) {
      const hero = targetHero;
      const data = byHero[hero];
      if (!data) throw new Error(`No data for hero: ${hero}`);

      const difficultiesAll: Difficulty[] = ["easy", "medium", "hard"];
      const strategiesAll: Strategy[] = DEFAULT_STRATEGIES;

      type Agg = {
        n: number;
        avgEnc: number;
        p50: number | null;
        p90: number | null;

        avgFinalLevel: number;
        avgExpIntoLevel: number;
        avgScore: number;
        normScore: number;
        crysPerEnc: number;
        avgCrysEnd: number;
        avgCrysEarn: number;
        avgCrysSpent: number;
        avgCrysSkip: number;
        avgShopVisits: number;
        avgShopOpportunities: number;
        expectedShops: number;
        buysPerShop: number | null;
        skipOpportunityPct: number | null;
        zeroBuyShopPct: number | null;
        noAffordableShopPct: number | null;
        avgOffersPerShop: number | null;
        avgAffordableOffersPerShop: number | null;

        // Shop affordability distributions (entered shops)
        shopEntryCount: number;
        walletP50: number | null;
        walletP90: number | null;
        minItemCostP50: number | null;
        maxItemCostP50: number | null;
        affItemsMin: number | null;
        affItemsAvg: number | null;
        affItemsP50: number | null;
        affItemsP90: number | null;
        bestScoreP50: number | null;
        bestScoreP90: number | null;
        secondScoreP50: number | null;
        topZeroBuyReason: string | null;
        avgAtk: number;
        avgDef: number;
        avgHp: number;
        avgMana: number;
        turnsPerEnc: number | null;
        dmgTakenPerEnc: number | null;
        dmgDealtPerEnc: number | null;

        // Ability + mana attribution (Camira)
        rfCastsPerRun: number;
        agiCastsPerRun: number;
        jpCastsPerRun: number;
        rfCastsPerEnc: number | null;
        agiCastsPerEnc: number | null;
        jpCastsPerEnc: number | null;
        manaSpentPerEnc: number | null;
        manaCritPerEnc: number | null;
        manaRegenPotPerEnc: number | null;
        rfHealPerEnc: number | null;
        jpBonusCrysPerEnc: number | null;

        // Ability + kit attribution (Bran)
        ssCastsPerRun: number;
        fortifyCastsPerRun: number;
        crushingCastsPerRun: number;
        ssCastsPerEnc: number | null;
        fortifyCastsPerEnc: number | null;
        crushingCastsPerEnc: number | null;
        fortifyHpGainPerEnc: number | null;
        fortifyMasteryPerRun: number;
        ironWillHealPerEnc: number | null;
        ironWillPenUnlocksPerRun: number;
        crushingKillsPerEnc: number | null;
        crushingStatGainPerEnc: number | null;
        stunsPerEnc: number | null;
      };

      const aggByDiffStrat: Record<Difficulty, Record<Strategy, Agg>> = {
        easy: {} as Record<Strategy, Agg>,
        medium: {} as Record<Strategy, Agg>,
        hard: {} as Record<Strategy, Agg>,
      };

      for (const diff of difficultiesAll) {
        for (const strat of strategiesAll) {
          const results = data[diff]?.[strat] ?? [];
          const n = results.length;
          const encs = results.map((r) => r.encounters);
          const avgEnc = n ? encs.reduce((a, b) => a + b, 0) / n : 0;
          const p50 = percentileInt(encs, 0.5);
          const p90 = percentileInt(encs, 0.9);

          const avgFinalLevel = n ? results.reduce((a, r) => a + (r.finalLevel ?? 1), 0) / n : 0;
          const avgExpIntoLevel = n ? results.reduce((a, r) => a + (r.expIntoLevel ?? 0), 0) / n : 0;

          const scoreMult = SCORE_MULTIPLIER[diff] ?? 1;
          const avgScore = n ? results.reduce((a, r) => a + r.score, 0) / n : 0;
          const normScore = scoreMult ? avgScore / scoreMult : avgScore;

          const avgCrysEarn = n ? results.reduce((a, r) => a + r.crystalsEarned, 0) / n : 0;
          const avgCrysSpent = n ? results.reduce((a, r) => a + r.crystalsSpent, 0) / n : 0;
          const avgCrysEnd = n ? results.reduce((a, r) => a + r.crystalsEnd, 0) / n : 0;
          const avgCrysSkip = n ? results.reduce((a, r) => a + (r.metrics.shop.crystalsFromSkips ?? 0), 0) / n : 0;
          const crysPerEnc = avgEnc > 0 ? avgCrysEarn / avgEnc : 0;

          const cadence = DIFFICULTY_CONFIG[diff]?.shopFrequency ?? 1;

          const totalVisits = results.reduce((a, r) => a + (r.metrics.shop.shopVisits ?? 0), 0);
          const totalSkips = results.reduce((a, r) => a + (r.metrics.shop.shopSkips ?? 0), 0);
          const totalOpportunities = results.reduce((a, r) => a + (r.metrics.shop.shopOpportunities ?? 0), 0);
          const totalZeroBuy = results.reduce((a, r) => a + (r.metrics.shop.zeroBuyShops ?? 0), 0);
          const totalNoAffordable = results.reduce((a, r) => a + (r.metrics.shop.noAffordableShops ?? 0), 0);
          const totalOffers = results.reduce((a, r) => a + (r.metrics.shop.offersTotal ?? 0), 0);
          const totalAffordableOffers = results.reduce((a, r) => a + (r.metrics.shop.affordableOffersTotal ?? 0), 0);

          const totalBuys = results.reduce(
            (a, r) => a + (r.metrics.shop.itemsPurchased + r.metrics.shop.potionsPurchased),
            0,
          );
          const avgShopVisits = n ? totalVisits / n : 0;
          const avgShopOpportunities = n ? totalOpportunities / n : 0;
          const expectedShops = n
            ? results.reduce((a, r) => a + Math.floor(Math.max(0, (r.encounters - 1)) / cadence), 0) / n
            : 0;
          const buysPerShop = totalVisits > 0 ? totalBuys / totalVisits : null;
          const skipOpportunityPct = totalOpportunities > 0 ? (totalSkips / totalOpportunities) * 100 : null;
          const zeroBuyShopPct = totalVisits > 0 ? (totalZeroBuy / totalVisits) * 100 : null;
          const noAffordableShopPct = totalVisits > 0 ? (totalNoAffordable / totalVisits) * 100 : null;
          const avgOffersPerShop = totalVisits > 0 ? totalOffers / totalVisits : null;
          const avgAffordableOffersPerShop = totalVisits > 0 ? totalAffordableOffers / totalVisits : null;

          const shopWallets = results.flatMap((r) => r.metrics.shop.walletAtEntry ?? []);
          const shopMinCosts = results.flatMap((r) => r.metrics.shop.minItemCost ?? []);
          const shopMaxCosts = results.flatMap((r) => r.metrics.shop.maxItemCost ?? []);
          const shopAffCounts = results.flatMap((r) => r.metrics.shop.affordableItemsCount ?? []);
          const shopBestScores = results.flatMap((r) => r.metrics.shop.bestAffordableItemScore ?? []);
          const shopSecondScores = results.flatMap((r) => r.metrics.shop.secondAffordableItemScore ?? []);
          const shopEntryCount = shopWallets.length;

          const walletP50 = percentileNum(shopWallets, 0.5);
          const walletP90 = percentileNum(shopWallets, 0.9);
          const minItemCostP50 = percentileNum(shopMinCosts, 0.5);
          const maxItemCostP50 = percentileNum(shopMaxCosts, 0.5);
          const affItemsMin = shopAffCounts.length ? Math.min(...shopAffCounts) : null;
          const affItemsAvg = shopAffCounts.length
            ? shopAffCounts.reduce((a, b) => a + b, 0) / shopAffCounts.length
            : null;
          const affItemsP50 = percentileNum(shopAffCounts, 0.5);
          const affItemsP90 = percentileNum(shopAffCounts, 0.9);
          const bestScoreP50 = percentileNum(shopBestScores, 0.5);
          const bestScoreP90 = percentileNum(shopBestScores, 0.9);
          const secondScoreP50 = percentileNum(shopSecondScores, 0.5);

          const zeroBuyReasons: Record<string, number> = {};
          for (const r of results) {
            const reasons = r.metrics.shop.zeroBuyReasons ?? {};
            for (const [k, v] of Object.entries(reasons)) {
              zeroBuyReasons[k] = (zeroBuyReasons[k] ?? 0) + v;
            }
          }
          const topZeroBuyReason = Object.entries(zeroBuyReasons)
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

          const avgAtk = n ? results.reduce((a, r) => a + r.metrics.shop.statsGained.atk, 0) / n : 0;
          const avgDef = n ? results.reduce((a, r) => a + r.metrics.shop.statsGained.def, 0) / n : 0;
          const avgHp = n ? results.reduce((a, r) => a + r.metrics.shop.statsGained.maxHp, 0) / n : 0;
          const avgMana = n ? results.reduce((a, r) => a + r.metrics.shop.statsGained.maxMana, 0) / n : 0;

          const effEnc = results.reduce((a, r) => a + (r.metrics.efficiency.encountersCount ?? 0), 0);
          const effTurns = results.reduce((a, r) => a + (r.metrics.efficiency.turnsTotal ?? 0), 0);
          const effTaken = results.reduce((a, r) => a + (r.metrics.efficiency.dmgTakenTotal ?? 0), 0);
          const effDealt = results.reduce((a, r) => a + (r.metrics.efficiency.dmgDealtTotal ?? 0), 0);
          const turnsPerEnc = effEnc > 0 ? effTurns / effEnc : null;
          const dmgTakenPerEnc = effEnc > 0 ? effTaken / effEnc : null;
          const dmgDealtPerEnc = effEnc > 0 ? effDealt / effEnc : null;

          // Ability + mana attribution (Camira)
          const rfId = "camira_rapid_fire";
          const agiId = "camira_forest_agility";
          const jpId = "camira_jackpot_arrow";

          // Ability + kit attribution (Bran)
          const ssId = "bran_shield_slam";
          const fortifyId = "bran_fortify";
          const crushingId = "bran_crushing_blow";

          const rfCastsTotal = results.reduce((a, r) => a + (r.metrics.abilities.castsById[rfId] ?? 0), 0);
          const agiCastsTotal = results.reduce((a, r) => a + (r.metrics.abilities.castsById[agiId] ?? 0), 0);
          const jpCastsTotal = results.reduce((a, r) => a + (r.metrics.abilities.castsById[jpId] ?? 0), 0);

          const ssCastsTotal = results.reduce((a, r) => a + (r.metrics.abilities.castsById[ssId] ?? 0), 0);
          const fortifyCastsTotal = results.reduce((a, r) => a + (r.metrics.abilities.castsById[fortifyId] ?? 0), 0);
          const crushingCastsTotal = results.reduce((a, r) => a + (r.metrics.abilities.castsById[crushingId] ?? 0), 0);

          const rfCastsPerRun = n ? rfCastsTotal / n : 0;
          const agiCastsPerRun = n ? agiCastsTotal / n : 0;
          const jpCastsPerRun = n ? jpCastsTotal / n : 0;

          const ssCastsPerRun = n ? ssCastsTotal / n : 0;
          const fortifyCastsPerRun = n ? fortifyCastsTotal / n : 0;
          const crushingCastsPerRun = n ? crushingCastsTotal / n : 0;

          const rfCastsPerEnc = effEnc > 0 ? rfCastsTotal / effEnc : null;
          const agiCastsPerEnc = effEnc > 0 ? agiCastsTotal / effEnc : null;
          const jpCastsPerEnc = effEnc > 0 ? jpCastsTotal / effEnc : null;

          const ssCastsPerEnc = effEnc > 0 ? ssCastsTotal / effEnc : null;
          const fortifyCastsPerEnc = effEnc > 0 ? fortifyCastsTotal / effEnc : null;
          const crushingCastsPerEnc = effEnc > 0 ? crushingCastsTotal / effEnc : null;

          const manaSpentTotal = results.reduce((a, r) => a + (r.metrics.mana.spentTotal ?? 0), 0);
          const manaCritTotal = results.reduce((a, r) => a + (r.metrics.mana.restoredFromCritTotal ?? 0), 0);
          const manaRegenPotTotal = results.reduce((a, r) => a + (r.metrics.mana.regenPotentialFromBasicsTotal ?? 0), 0);
          const rfHealTotal = results.reduce((a, r) => a + (r.metrics.mana.rapidFireHealTotal ?? 0), 0);
          const jpBonusCrysTotal = results.reduce((a, r) => a + (r.metrics.mana.jackpotBonusCrystalsTotal ?? 0), 0);

          const fortifyHpGainTotal = results.reduce((a, r) => a + (r.metrics.bran.fortify.hpGainTotal ?? 0), 0);
          const fortifyMasteryTotal = results.reduce((a, r) => a + (r.metrics.bran.fortify.masteryUnlocks ?? 0), 0);
          const ironWillHealTotal = results.reduce((a, r) => a + (r.metrics.bran.ironWill.healTotal ?? 0), 0);
          const ironWillPenUnlocksTotal = results.reduce((a, r) => a + (r.metrics.bran.ironWill.penetrationUnlocks ?? 0), 0);
          const crushingKillsTotal = results.reduce((a, r) => a + (r.metrics.bran.crushingBlow.killCount ?? 0), 0);
          const crushingStatGainTotal = results.reduce((a, r) => a + (r.metrics.bran.crushingBlow.statGainTotal ?? 0), 0);
          const stunsTotal = results.reduce((a, r) => a + (r.metrics.bran.shieldSlam.stunsApplied ?? 0), 0);

          const manaSpentPerEnc = effEnc > 0 ? manaSpentTotal / effEnc : null;
          const manaCritPerEnc = effEnc > 0 ? manaCritTotal / effEnc : null;
          const manaRegenPotPerEnc = effEnc > 0 ? manaRegenPotTotal / effEnc : null;
          const rfHealPerEnc = effEnc > 0 ? rfHealTotal / effEnc : null;
          const jpBonusCrysPerEnc = effEnc > 0 ? jpBonusCrysTotal / effEnc : null;

          const fortifyHpGainPerEnc = effEnc > 0 ? fortifyHpGainTotal / effEnc : null;
          const fortifyMasteryPerRun = n ? fortifyMasteryTotal / n : 0;
          const ironWillHealPerEnc = effEnc > 0 ? ironWillHealTotal / effEnc : null;
          const ironWillPenUnlocksPerRun = n ? ironWillPenUnlocksTotal / n : 0;
          const crushingKillsPerEnc = effEnc > 0 ? crushingKillsTotal / effEnc : null;
          const crushingStatGainPerEnc = effEnc > 0 ? crushingStatGainTotal / effEnc : null;
          const stunsPerEnc = effEnc > 0 ? stunsTotal / effEnc : null;

          aggByDiffStrat[diff][strat] = {
            n,
            avgEnc,
            p50,
            p90,

            avgFinalLevel,
            avgExpIntoLevel,
            avgScore,
            normScore,
            crysPerEnc,
            avgCrysEnd,
            avgCrysEarn,
            avgCrysSpent,
            avgCrysSkip,
            avgShopVisits,
            avgShopOpportunities,
            expectedShops,
            buysPerShop,
            skipOpportunityPct,
            zeroBuyShopPct,
            noAffordableShopPct,
            avgOffersPerShop,
            avgAffordableOffersPerShop,

            shopEntryCount,
            walletP50,
            walletP90,
            minItemCostP50,
            maxItemCostP50,
            affItemsMin,
            affItemsAvg,
            affItemsP50,
            affItemsP90,
            bestScoreP50,
            bestScoreP90,
            secondScoreP50,
            topZeroBuyReason,
            avgAtk,
            avgDef,
            avgHp,
            avgMana,
            turnsPerEnc,
            dmgTakenPerEnc,
            dmgDealtPerEnc,

            rfCastsPerRun,
            agiCastsPerRun,
            jpCastsPerRun,
            rfCastsPerEnc,
            agiCastsPerEnc,
            jpCastsPerEnc,
            manaSpentPerEnc,
            manaCritPerEnc,
            manaRegenPotPerEnc,
            rfHealPerEnc,
            jpBonusCrysPerEnc,

            ssCastsPerRun,
            fortifyCastsPerRun,
            crushingCastsPerRun,
            ssCastsPerEnc,
            fortifyCastsPerEnc,
            crushingCastsPerEnc,
            fortifyHpGainPerEnc,
            fortifyMasteryPerRun,
            ironWillHealPerEnc,
            ironWillPenUnlocksPerRun,
            crushingKillsPerEnc,
            crushingStatGainPerEnc,
            stunsPerEnc,
          };
        }
      }

      // Top purchased items per difficulty (percent of runs with item purchased at least once)
      const topItemsByDiff: Record<Difficulty, Array<{ id: string; pct: number }>> = {
        easy: [],
        medium: [],
        hard: [],
      };

      for (const diff of difficultiesAll) {
        const counts: Record<string, number> = {};
        let denom = 0;
        for (const strat of strategiesAll) {
          const results = data[diff]?.[strat] ?? [];
          denom += results.length;
          for (const r of results) {
            const set = new Set(r.purchasedItemIds ?? []);
            for (const id of set) counts[id] = (counts[id] ?? 0) + 1;
          }
        }

        const sorted = Object.entries(counts)
          .map(([id, c]) => ({ id, pct: denom > 0 ? (c / denom) * 100 : 0 }))
          .sort((a, b) => (b.pct - a.pct) || a.id.localeCompare(b.id));

        topItemsByDiff[diff] = sorted.slice(0, 3);
      }

      // Highlights & balance flags (simple heuristics)
      const highlights: string[] = [];
      const flags: string[] = [];

      for (const diff of difficultiesAll) {
        let best: { strat: Strategy; avgEnc: number } | null = null;
        for (const strat of strategiesAll) {
          const a = aggByDiffStrat[diff][strat];
          if (!a.n) continue;
          if (!best || a.avgEnc > best.avgEnc) best = { strat, avgEnc: a.avgEnc };
        }
        if (best) {
          highlights.push(
            `${diff}: best survivability is ${formatStrategy(hero, best.strat)} at ${best.avgEnc.toFixed(1)} avg encounters.`,
          );
        }
      }

      const easyApex = aggByDiffStrat.easy.apex;
      const easyBalanced = aggByDiffStrat.easy.balanced;
      if (easyApex.n && easyBalanced.n) {
        const delta = easyApex.avgEnc - easyBalanced.avgEnc;
        if (delta >= 5) flags.push(`easy: apex outpaces balanced by ${delta.toFixed(1)} avg encounters (may be too dominant).`);
      }

      for (const diff of difficultiesAll) {
        for (const strat of strategiesAll) {
          const a = aggByDiffStrat[diff][strat];
          if (!a.n) continue;
          if (a.expectedShops <= 0) continue;
          const gap = a.expectedShops - a.avgShopOpportunities;
          if (gap > 0.3) {
            flags.push(
               `${diff}/${formatStrategy(hero, strat)}: shop opportunities/run (${a.avgShopOpportunities.toFixed(1)}) below expected (${a.expectedShops.toFixed(1)}) by ${gap.toFixed(1)}.`,
             );
           }
         }
       }

      // Clamp counts
      const finalHighlights = highlights.slice(0, 6);
      const finalFlags = flags.slice(0, 5);

      // Build report
      const lines: string[] = [];
      lines.push(`Hero: ${hero}`);
      lines.push(`Runs: ${runs}`);
      lines.push(`Generated: ${hcm.timestamp} (Asia/Ho_Chi_Minh)`);
      lines.push("");

      lines.push("## 1) Highlights & balance flags");
      lines.push("");

      lines.push(`Shop skip mode: ${shopSkipMode}`);
      lines.push("");

      lines.push("**Highlights**");
      for (const h of (finalHighlights.length ? finalHighlights : ["—"])) lines.push(`- ${h}`);
      lines.push("");

      lines.push("**Strategies**");
      for (const s of strategiesAll) lines.push(`- ${formatStrategy(hero, s)}`);
      lines.push("");

      lines.push("**AI behavior**");
      lines.push(getHeroKitSummary(hero));
      for (const s of strategiesAll) {
        lines.push(`- ${formatStrategy(hero, s)}: ${getStrategyMeaning(hero, s)}`);
      }
      lines.push("");

      lines.push("**Balance flags**");
      for (const f of (finalFlags.length ? finalFlags : ["—"])) lines.push(`- ${f}`);
      lines.push("");

      lines.push("## 2) KPI snapshot (3 difficulties)");
      lines.push("");

      for (const diff of difficultiesAll) {
        const mult = SCORE_MULTIPLIER[diff] ?? 1;
        const cadence = DIFFICULTY_CONFIG[diff]?.shopFrequency ?? "—";
        lines.push(`### ${diff[0].toUpperCase()}${diff.slice(1)} (score x${fmtMult(mult)}, shop every ${cadence} encounters)`);
        lines.push("");

        const headers = [
          "Strategy",
          "AvgEnc",
          "EncP50",
          "EncP90",
          "Lvl",
          "XP",
          "Score",
          "NormScore",
          "Crys/Enc",
          "CrysEnd",
        ];
        const rows: string[][] = [];
        for (const strat of strategiesAll) {
          const a = aggByDiffStrat[diff][strat];
          if (!a.n) {
            rows.push([formatStrategy(hero, strat), "—", "—", "—", "—", "—", "—", "—", "—", "—"]);
            continue;
          }
          rows.push([
            formatStrategy(hero, strat),
            a.avgEnc.toFixed(1),
            a.p50 === null ? "—" : String(a.p50),
            a.p90 === null ? "—" : String(a.p90),
            a.avgFinalLevel ? a.avgFinalLevel.toFixed(1) : "—",
            a.avgExpIntoLevel ? String(Math.round(a.avgExpIntoLevel)) : "0",
            roundMaybe(a.avgScore),
            roundMaybe(a.normScore),
            a.avgEnc > 0 ? (a.crysPerEnc).toFixed(1) : "—",
            String(Math.round(a.avgCrysEnd)),
          ]);
        }
        lines.push(renderTable(headers, rows));
        lines.push("");
      }

      lines.push("## 3) Economy & shop summary");
      lines.push("");

      lines.push("Shop trigger rule: after completing encounter N, a shop opportunity appears when N % cadence == 0.");
      lines.push("Definitions: Shops/Run = entered shop state; SkipOpportunity% = skipped / opportunities; ZeroBuyShop% = entered shop, bought 0; NoAff% = entered shop, affordable ITEMS == 0 (potion excluded). ");
      lines.push("");

      lines.push("**Economy conversion**");
      {
        const headers = [
          "Difficulty",
          "Strategy",
          "CrysSkip",
          "CrysSpent",
          "CrysEnd",
        ];
        const rows: string[][] = [];
          for (const diff of difficultiesAll) {
          for (const strat of strategiesAll) {
            const a = aggByDiffStrat[diff][strat];
            if (!a.n) {
              rows.push([diff, formatStrategy(hero, strat), "—", "—", "—"]);
              continue;
            }
            rows.push([
              diff,
              formatStrategy(hero, strat),
              String(Math.round(a.avgCrysSkip)),
              String(Math.round(a.avgCrysSpent)),
              String(Math.round(a.avgCrysEnd)),
            ]);
          }
        }
        lines.push(renderTable(headers, rows));
        lines.push("");
      }

      lines.push("**Shop behavior**");
      {
        const headers = [
          "Difficulty",
          "Strategy",
          "ShopOpp/Run",
          "Shops/Run",
          "ExpectedShops/Run",
          "SkipOpp%",
          "NoAff%",
          "ZeroBuy%",
        ];
        const rows: string[][] = [];
          for (const diff of difficultiesAll) {
          for (const strat of strategiesAll) {
            const a = aggByDiffStrat[diff][strat];
            if (!a.n) {
              rows.push([diff, formatStrategy(hero, strat), "—", "—", "—", "—", "—", "—"]);
              continue;
            }

            rows.push([
              diff,
              formatStrategy(hero, strat),
              a.avgShopOpportunities.toFixed(1),
              a.avgShopVisits.toFixed(1),
              a.expectedShops.toFixed(1),
              a.skipOpportunityPct === null ? "—" : pct(a.skipOpportunityPct),
              a.noAffordableShopPct === null ? "—" : pct(a.noAffordableShopPct),
              a.zeroBuyShopPct === null ? "—" : pct(a.zeroBuyShopPct),
            ]);
          }
        }
        lines.push(renderTable(headers, rows));
        lines.push("");
      }

      lines.push("**Affordability diagnostics (entered shops)**");
      {
        const headers = [
          "Difficulty",
          "Strategy",
          "ShopEntries",
          "WalletP50",
          "WalletP90",
          "MinCostP50",
          "AffItemsMin",
          "AffItemsAvg",
          "AffItemsP90",
          "BestScoreP50",
          "ZeroBuyTopReason",
        ];

        const rows: string[][] = [];
          for (const diff of difficultiesAll) {
          for (const strat of strategiesAll) {
            const a = aggByDiffStrat[diff][strat];
            if (!a.n || a.shopEntryCount === 0) {
              rows.push([diff, formatStrategy(hero, strat), "0", "—", "—", "—", "—", "—", "—", "—", "—"]);
              continue;
            }

            rows.push([
              diff,
              formatStrategy(hero, strat),
              String(a.shopEntryCount),
              a.walletP50 === null ? "—" : String(Math.round(a.walletP50)),
              a.walletP90 === null ? "—" : String(Math.round(a.walletP90)),
              a.minItemCostP50 === null ? "—" : String(Math.round(a.minItemCostP50)),
              a.affItemsMin === null ? "—" : String(Math.round(a.affItemsMin)),
              a.affItemsAvg === null ? "—" : a.affItemsAvg.toFixed(1),
              a.affItemsP90 === null ? "—" : String(Math.round(a.affItemsP90)),
              a.bestScoreP50 === null ? "—" : a.bestScoreP50.toFixed(3),
              a.topZeroBuyReason ?? "—",
            ]);
          }
        }

        lines.push(renderTable(headers, rows));
        lines.push("");
      }

      {
        const headers = ["Difficulty", "Strategy", "+ATK", "+DEF", "+HP", "+Mana"];
        const rows: string[][] = [];
          for (const diff of difficultiesAll) {
          for (const strat of strategiesAll) {
            const a = aggByDiffStrat[diff][strat];
            if (!a.n) {
              rows.push([diff, formatStrategy(hero, strat), "—", "—", "—", "—"]);
              continue;
            }
            rows.push([
              diff,
              formatStrategy(hero, strat),
              String(Math.round(a.avgAtk)),
              String(Math.round(a.avgDef)),
              String(Math.round(a.avgHp)),
              String(Math.round(a.avgMana)),
            ]);
          }
        }
        lines.push(renderTable(headers, rows));
        lines.push("");
      }

      for (const diff of difficultiesAll) {
        lines.push(`### Top purchased items (${diff[0].toUpperCase()}${diff.slice(1)})`);
        lines.push("Computed across all strategies for this difficulty.");
        const items = topItemsByDiff[diff];
        if (!items.length) {
          lines.push("- —");
          lines.push("");
        } else {
          for (const it of items) {
            const name = ITEM_NAMES[it.id] ?? it.id;
            lines.push(`- ${name} (${it.id}): ${Math.round(it.pct)}% of runs`);
          }
          lines.push("");
        }

        const stratParts: string[] = [];
        for (const strat of strategiesAll) {
          const results = data[diff]?.[strat] ?? [];
          if (!results.length) {
            stratParts.push(`${formatStrategy(hero, strat)}=—`);
            continue;
          }
          const counts: Record<string, number> = {};
          for (const r of results) {
            const set = new Set(r.purchasedItemIds ?? []);
            for (const id of set) counts[id] = (counts[id] ?? 0) + 1;
          }
          const top = Object.entries(counts)
            .map(([id, c]) => ({ id, pct: (c / results.length) * 100 }))
            .sort((a, b) => (b.pct - a.pct) || a.id.localeCompare(b.id))[0];
          if (!top) {
            stratParts.push(`${formatStrategy(hero, strat)}=—`);
          } else {
            const name = ITEM_NAMES[top.id] ?? top.id;
            stratParts.push(`${formatStrategy(hero, strat)}=${name} (${Math.round(top.pct)}%)`);
          }
        }
        lines.push(`Most purchased item by strategy: ${stratParts.join(", ")}`);
        lines.push("");
      }

      lines.push("## 4) Survival & efficiency (why runs end)");
      lines.push("");

      lines.push("Progress distribution (pooled across strategies)");
      {
        const headers = ["Difficulty", "TotalRuns (all strategies)", "EncP50", "EncP90"];
        const rows: string[][] = [];
        for (const diff of difficultiesAll) {
          const pooled: SimulationResult[] = [];
          for (const strat of strategiesAll) pooled.push(...(data[diff]?.[strat] ?? []));
          const encs = pooled.map((r) => r.encounters);
          const p50 = percentileInt(encs, 0.5);
          const p90 = percentileInt(encs, 0.9);
          rows.push([
            diff,
            String(pooled.length),
            p50 === null ? "—" : String(p50),
            p90 === null ? "—" : String(p90),
          ]);
        }
        lines.push(renderTable(headers, rows));
        lines.push("");
      }

      {
        const headers = ["Difficulty", "Strategy", "Turns/Enc", "DmgTaken/Enc", "DmgDealt/Enc"];
        const rows: string[][] = [];
        for (const diff of difficultiesAll) {
          for (const strat of strategiesAll) {
            const a = aggByDiffStrat[diff][strat];
            rows.push([
              diff,
              formatStrategy(hero, strat),
              a.turnsPerEnc === null ? "—" : a.turnsPerEnc.toFixed(1),
              a.dmgTakenPerEnc === null ? "—" : Math.round(a.dmgTakenPerEnc).toString(),
              a.dmgDealtPerEnc === null ? "—" : Math.round(a.dmgDealtPerEnc).toString(),
            ]);
          }
        }
        lines.push(renderTable(headers, rows));
        lines.push("");
      }

      if (hero === "camira") {
        lines.push("Ability & mana economy (Camira)");
        {
          const headers = [
            "Difficulty",
            "Strategy",
            "RF/run",
            "Agi/run",
            "JP/run",
            "RF/enc",
            "Agi/enc",
            "JP/enc",
          ];
          const rows: string[][] = [];
          for (const diff of difficultiesAll) {
            for (const strat of strategiesAll) {
              const a = aggByDiffStrat[diff][strat];
              rows.push([
                diff,
                formatStrategy(hero, strat),
                a.rfCastsPerRun.toFixed(1),
                a.agiCastsPerRun.toFixed(1),
                a.jpCastsPerRun.toFixed(1),
                a.rfCastsPerEnc === null ? "—" : a.rfCastsPerEnc.toFixed(2),
                a.agiCastsPerEnc === null ? "—" : a.agiCastsPerEnc.toFixed(2),
                a.jpCastsPerEnc === null ? "—" : a.jpCastsPerEnc.toFixed(2),
              ]);
            }
          }
          lines.push(renderTable(headers, rows));
          lines.push("");
        }

        {
          const headers = [
            "Difficulty",
            "Strategy",
            "ManaSpent/enc",
            "ManaCrit/enc",
            "ManaRegenPot/enc",
            "RFHeal/enc",
            "JPBonusCrys/enc",
          ];
          const rows: string[][] = [];
          for (const diff of difficultiesAll) {
            for (const strat of strategiesAll) {
              const a = aggByDiffStrat[diff][strat];
              rows.push([
                diff,
                formatStrategy(hero, strat),
                a.manaSpentPerEnc === null ? "—" : a.manaSpentPerEnc.toFixed(1),
                a.manaCritPerEnc === null ? "—" : a.manaCritPerEnc.toFixed(1),
                a.manaRegenPotPerEnc === null ? "—" : a.manaRegenPotPerEnc.toFixed(1),
                a.rfHealPerEnc === null ? "—" : Math.round(a.rfHealPerEnc).toString(),
                a.jpBonusCrysPerEnc === null ? "—" : Math.round(a.jpBonusCrysPerEnc).toString(),
              ]);
            }
          }
          lines.push(renderTable(headers, rows));
          lines.push("");
        }
      }

      if (hero === "bran") {
        lines.push("Ability & kit economy (Bran)");
        {
          const headers = [
            "Difficulty",
            "Strategy",
            "SS/run",
            "Fort/run",
            "CB/run",
            "SS/enc",
            "Fort/enc",
            "CB/enc",
          ];
          const rows: string[][] = [];
          for (const diff of difficultiesAll) {
            for (const strat of strategiesAll) {
              const a = aggByDiffStrat[diff][strat];
              rows.push([
                diff,
                formatStrategy(hero, strat),
                a.ssCastsPerRun.toFixed(1),
                a.fortifyCastsPerRun.toFixed(1),
                a.crushingCastsPerRun.toFixed(1),
                a.ssCastsPerEnc === null ? "—" : a.ssCastsPerEnc.toFixed(2),
                a.fortifyCastsPerEnc === null ? "—" : a.fortifyCastsPerEnc.toFixed(2),
                a.crushingCastsPerEnc === null ? "—" : a.crushingCastsPerEnc.toFixed(2),
              ]);
            }
          }
          lines.push(renderTable(headers, rows));
          lines.push("");
        }

        {
          const headers = [
            "Difficulty",
            "Strategy",
            "FortHP/enc",
            "Mastery/run",
            "IronWillHeal/enc",
            "PenUnlock/run",
            "CBKills/enc",
            "CBStat/enc",
            "Stuns/enc",
          ];
          const rows: string[][] = [];
          for (const diff of difficultiesAll) {
            for (const strat of strategiesAll) {
              const a = aggByDiffStrat[diff][strat];
              rows.push([
                diff,
                formatStrategy(hero, strat),
                a.fortifyHpGainPerEnc === null ? "—" : a.fortifyHpGainPerEnc.toFixed(1),
                a.fortifyMasteryPerRun.toFixed(2),
                a.ironWillHealPerEnc === null ? "—" : Math.round(a.ironWillHealPerEnc).toString(),
                a.ironWillPenUnlocksPerRun.toFixed(2),
                a.crushingKillsPerEnc === null ? "—" : a.crushingKillsPerEnc.toFixed(2),
                a.crushingStatGainPerEnc === null ? "—" : a.crushingStatGainPerEnc.toFixed(1),
                a.stunsPerEnc === null ? "—" : a.stunsPerEnc.toFixed(2),
              ]);
            }
          }
          lines.push(renderTable(headers, rows));
          lines.push("");
        }
      }

      const outDir = path.resolve(process.cwd(), "docs", "balance");
      fs.mkdirSync(outDir, { recursive: true });

      const baseName = `${hcm.dateMMDDYY}_${hero}_runs-${runs}_skip-${shopSkipMode}_${hcm.timeHHMMSS}.md`;
      const reportPath = uniqueReportPath(outDir, baseName);
      fs.writeFileSync(reportPath, lines.join("\n"));

      console.log(`\nWrote benchmark summary report: ${reportPath}`);
    } else {
      // Non-hero mode: keep previous simple output (optional)
      console.log("\n--- HERO BALANCE BENCHMARK ---\n");
      console.log(`Runs per config: ${runs}`);
      if (targetHero) console.log(`Target Hero: ${targetHero}`);
      console.log("(Tip: set HERO and omit DIFF/STRAT to generate the full markdown report.)");
    }
    },
    // Benchmark runs can be intentionally large (e.g. RUNS=300), so use a generous timeout.
    10 * 60 * 1000,
  );
});
