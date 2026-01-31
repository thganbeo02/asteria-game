import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";

import { createHeroState } from "@/data/heroes";
import { HeroPanel } from "@/components/combat/HeroPanel";
import { AbilityTooltipContent } from "@/components/combat/ActionTooltips";
import { createStatusEffect } from "@/systems/combat/statusEffects";
import { useCombatStore } from "@/stores";

function getTooltipDamage(text: string): number {
  return Number(text.match(/\b(\d+)\s+damage\b/i)?.[1] ?? "0");
}

describe("Bran Fortify UI", () => {
  it("HeroPanel shows temporary DEF delta while Fortify is active", () => {
    const hero = createHeroState("bran");
    if (!hero) throw new Error("Failed to create Bran state");

    hero.level = 1;
    hero.stats.def = 24;
    hero.stats.bonusDef = 0;
    hero.statusEffects = [createStatusEffect("fortify", "hero", 30, 3)];

    useCombatStore.setState({ hero });

    const { getByText } = render(<HeroPanel />);
    // 24 DEF with +30% -> floor(31.2) => 31 (+7)
    getByText("31");
    getByText("(+7)");
  });

  it("Shield Slam tooltip damage increases while Fortify is active", () => {
    const hero = createHeroState("bran");
    if (!hero) throw new Error("Failed to create Bran state");

    hero.level = 1;
    hero.stats.atk = 14;
    hero.stats.def = 24;

    const before = render(
      <AbilityTooltipContent hero={hero} abilityIndex={0} mode="expanded" monster={null} />
    );
    const beforeLine = within(before.container).getByText(/\b\d+\s+damage\b/i).textContent ?? "";
    const beforeDmg = getTooltipDamage(beforeLine);

    const fortifiedHero = {
      ...hero,
      statusEffects: [createStatusEffect("fortify", "hero", 30, 3)],
    };

    const after = render(
      <AbilityTooltipContent hero={fortifiedHero} abilityIndex={0} mode="expanded" monster={null} />
    );
    const afterLine = within(after.container).getByText(/\b\d+\s+damage\b/i).textContent ?? "";
    const afterDmg = getTooltipDamage(afterLine);

    expect(afterDmg).toBeGreaterThan(beforeDmg);
  });
});
