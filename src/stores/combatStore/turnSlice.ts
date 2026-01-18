import type { TurnSlice, SliceCreator } from "./types";

// =============================================================================
// TURN SLICE
// =============================================================================

export const createTurnSlice: SliceCreator<TurnSlice> = (set, get) => ({
  turnPhase: "player_turn",
  turnCount: 1,

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
});