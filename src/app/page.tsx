"use client";

import { CombatLayout } from "@/components/combat";
import { useCombatStore, useGameStore } from "@/stores";
import { useEffect } from "react";

export default function Home() {
  const startRun = useGameStore((state) => state.startRun);
  const initCombat = useCombatStore((state) => state.initCombat);
  const hero = useCombatStore((state) => state.hero);

  // Auto-start a test combat on mount
  useEffect(() => {
    if (!hero) {
      // Start a test run
      startRun("lyra", "hard");
      initCombat("lyra", "hard");
    }
  }, [hero, startRun, initCombat]);

  return <CombatLayout />
}