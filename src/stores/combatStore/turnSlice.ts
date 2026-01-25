import type { TurnSlice, SliceCreator } from "./types";

// =============================================================================
// TURN SLICE
// =============================================================================

export const createTurnSlice: SliceCreator<TurnSlice> = (set, get) => ({
  turnPhase: "player_turn",
  turnCount: 1,
  skipTurnsUsed: 0,

  setTurnPhase: (phase) => {
    set({ turnPhase: phase });
  },

  incrementTurn: () => {
    set((state) => ({
      turnCount: state.turnCount + 1,
    }));
  },

  resetTurn: () => {
    set({
      turnPhase: "player_turn",
      turnCount: 1,
    });
  },

  skipTurn: () => {
    const { skipTurnsUsed, turnPhase } = get();

    if (turnPhase !== "player_turn") {
      console.warn("Cannot skip: not player turn");
      return false;
    }

    if (skipTurnsUsed >= 3) {
      get().addLogEntry({
        actor: "hero",
        action: "skip_failed",
        message: "No skips remaining this encounter!",
      });
      return false;
    }

    set({ skipTurnsUsed: skipTurnsUsed + 1 });

    get().addLogEntry({
      actor: "hero",
      action: "skip",
      message: `Turn skipped. (${3 - skipTurnsUsed - 1} skips remaining)`,
    });

    // End player turn, go to monster turn
    set({ turnPhase: "monster_turn" });

    return true;
  },

  resetSkipTurns: () => {
    set({ skipTurnsUsed: 0 });
  },
});
