import type { LogSlice, SliceCreator } from "./types";

// =============================================================================
// LOG SLICE
// =============================================================================

export const createLogSlice: SliceCreator<LogSlice> = (set, get) => ({
  combatLog: [],
  animationQueue: [],

  addLogEntry: (entry) => {
    set((state) => ({
      combatLog: [
        ...state.combatLog,
        {
          ...entry,
          turn: state.turnCount,
        },
      ],
    }));
  },

  queueAnimation: (event) => {
    const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    set((state) => ({
      animationQueue: [...state.animationQueue, { ...event, id }],
    }));
  },

  clearAnimation: (id) => {
    set((state) => ({
      animationQueue: state.animationQueue.filter(e => e.id !== id),
    }));
  },

  clearLog: () => {
    set({
      combatLog: [],
      animationQueue: [],
    });
  },
});