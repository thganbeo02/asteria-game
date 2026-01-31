"use client";

import { CombatHeader } from "./CombatHeader";
import { HeroPanel } from "./HeroPanel";
import { MonsterPanel } from "./MonsterPanel";
import { BattleArena } from "./BattleArena";
import { CombatLog } from "./CombatLog";
import { ActionBar } from "./ActionBar";

export function CombatLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <CombatHeader />

      {/* Main Content - Three Column Layout */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 h-full">
          {/* Left Column - Hero Panel */}
          <div className="col-span-12 lg:col-span-3">
            <HeroPanel />
          </div>

          {/* Center Column - Battle Arena + Log */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            <BattleArena />
            <CombatLog />
          </div>

          {/* Right Column - Monster Panel */}
          <div className="col-span-12 lg:col-span-3">
            <MonsterPanel />
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <ActionBar />
    </div>
  );
}
