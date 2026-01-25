"use client";

import { useRef, useEffect } from "react";
import { useCombatStore } from "@/stores";
import { cn } from "@/lib/cn";

export function CombatLog() {
  const combatLog = useCombatStore((state) => state.combatLog);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatLog]);

  return (
    <div className="panel overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border bg-bg-hover">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
          📜 Action History
        </span>
      </div>

      {/* Log Entries */}
      <div
        ref={scrollRef}
        className="p-4 max-h-48 overflow-y-auto space-y-2"
      >
        {combatLog.length === 0 ? (
          <p className="text-text-muted text-sm italic">Combat begins...</p>
        ) : (
          combatLog.map((entry, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 text-sm",
                "border-l-2 pl-3 py-0.5",
                entry.actor === "hero"
                  ? "border-class-mage"
                  : "border-red-500"
              )}
            >
              {/* Turn Number */}
              <span className="text-text-muted font-mono text-xs w-8 shrink-0">
                [T{entry.turn}]
              </span>

              {/* Message */}
              <span
                className={cn(
                  entry.actor === "hero" ? "text-text-primary" : "text-text-secondary"
                )}
              >
                {entry.isCrit && (
                  <span className="text-amber-400 font-semibold">CRIT! </span>
                )}
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}