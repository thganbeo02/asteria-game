"use client";

import { CombatLayout } from "@/components/combat";
import { useCombatStore, useGameStore } from "@/stores";
import { useEffect } from "react";

export default function Home() {
  const startRun = useGameStore((state) => state.startRun);
  const initCombat = useCombatStore((state) => state.initCombat);
  const spawnMonster = useCombatStore((state) => state.spawnMonster);
  const hero = useCombatStore((state) => state.hero);

  // Auto-start a test combat on mount
  useEffect(() => {
    if (!hero) {
      // Start a test run
      startRun("lyra", "easy");
      initCombat("lyra", "easy");
      spawnMonster("easy");
    }
  }, [hero, startRun, initCombat, spawnMonster]);

  return <CombatLayout />
}