# Asteria Game - Testing & Balancing Guide

This repo uses **Vitest** for unit tests and for headless balance benchmarks.

Note: `docs/` and `tests/` are currently gitignored in this repo, so benchmark reports are typically local-only.

## Unit tests (mechanics)

### How to run

```bash
npm run test
```

### What exists today

- Vitest config: `vitest.config.mts`
- Tests live in both:
  - `src/**.test.ts` (combat system unit tests)
  - `tests/**.test.ts` (hero kit + simulation/benchmark tests)

Examples:

- `src/systems/combat/damageCalculator.test.ts`
- `src/systems/combat/statusEffects.test.ts`
- `tests/camira.test.ts`

## Balance benchmarks (simulations)

Benchmarks simulate the combat loop many times and output a structured markdown report (split into sections, no ability-usage rate column).

### How to run (hero report)

```bash
HERO="camira" RUNS="250" SHOP_SKIP_MODE="never" npm run benchmark:hero
```

### Environment variables

- `HERO`: required to generate the full report.
- `RUNS`: runs per difficulty+strategy configuration.
- `SHOP_SKIP_MODE` (validated; invalid values hard-fail):
  - `never`: enter every shop opportunity
  - `alternate`: enter the first shop opportunity, then skip every other
  - `other`: skip the first shop opportunity, then alternate

### Output

The report is written to `docs/balance/` with filename:

`<MMDDYY>_<hero>_runs-<runs>_skip-<mode>_<HHMMSS>.md`

All timestamps use the `Asia/Ho_Chi_Minh` timezone.

### What the report includes (current)

- KPI progression distribution (AvgEnc / P50 / P90) per difficulty and strategy (level/XP included)
- Economy conversion (crystals from skipping, spent, ending)
- Shop behavior (opportunities vs entries, skip rate, zero-buy, item-only affordability)
- Affordability diagnostics (entered shops): wallet/cost bands and buyability distributions
- Survival/efficiency (turns per encounter, damage dealt/taken)
- Camira-only attribution: casts per run/enc, mana spent/restored, Rapid Fire healing, Jackpot bonus crystals
