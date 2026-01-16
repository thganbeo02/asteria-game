// Hold monster data
import type {
  MonsterDefinition,
  MonsterType,
} from "@/types";

export const SLIME: MonsterDefinition = {
  id: "slime",
  name: "Slime",
  description: "Gelatinous blob. Weak individually, dangerous in numbers.",
  minLevel: 1,

  baseStats: {
    hp: 40,
    atk: 3,
    def: 2,
    crystal: 8,
    exp: 25,
  },

  growth: {
    // Each array: [L1, L2, L3, L4, L5, L6, L7] growth per encounter
    hp: {
      easy:   [2, 4, 6, 8, 11, 14, 18],
      medium: [3, 5, 7, 10, 13, 17, 22],
      hard:   [4, 6, 9, 12, 16, 20, 26],
    },
    atk: {
      easy:   [0.8, 1.5, 2.5, 4, 6, 8, 10],
      medium: [1, 2, 3, 5, 7, 10, 13],
      hard:   [1.5, 3.5, 6, 9, 12, 16, 20],
    },
    def: {
      easy:   [0.5, 1, 1.5, 2, 3, 5, 7],
      medium: [1, 2, 3, 4, 6, 8, 10],
      hard:   [1.5, 3, 5, 7, 9, 12, 15],
    },
    crystal: {
      easy:   [1, 2, 3, 5, 7, 9, 12],
      medium: [2, 3, 5, 7, 9, 12, 15],
      hard:   [3, 5, 7, 9, 12, 16, 21],
    },
    exp: {
      easy:   [1, 1, 2, 3, 5, 7, 10],
      medium: [1, 2, 3, 5, 7, 9, 12],
      hard:   [2, 3, 5, 7, 9, 12, 16],
    },
  },

  behavior: {
    pattern: ["attack"],
  }
};

export const WOLF: MonsterDefinition = {
  id: "wolf",
  name: "Wolf",
  description: "Swift predator. Low defense, high aggression.",
  minLevel: 1,

  baseStats: {
    hp: 42,
    atk: 4,
    def: 1,
    crystal: 10,
    exp: 30,
  },

  growth: {
    hp: {
      easy:   [1.5, 3, 5, 7, 9, 12, 15],
      medium: [2.5, 4, 6, 9, 12, 15, 19],
      hard:   [3.5, 5, 8, 11, 14, 18, 23],
    },
    atk: {
      easy:   [1, 2, 3.5, 5, 7, 10, 13],
      medium: [1.5, 3, 5, 7, 10, 13, 17],
      hard:   [2, 4, 6, 9, 12, 16, 21],
    },
    def: {
      easy:   [0.4, 0.8, 1.2, 2, 3, 5, 7],
      medium: [0.5, 1, 1.5, 3, 4.5, 6, 9],
      hard:   [0.75, 1.5, 2.5, 4, 6, 8, 11],
    },
    crystal: {
      easy:   [1, 2, 3, 5, 7, 10, 13],
      medium: [2, 3, 5, 7, 10, 13, 17],
      hard:   [3, 5, 7, 10, 13, 17, 22],
    },
    exp: {
      easy:   [1, 2, 2, 3, 5, 7, 10],
      medium: [2, 2, 3, 5, 7, 10, 13],
      hard:   [2, 3, 5, 7, 10, 13, 17],
    },
  },

  behavior: {
    pattern: ["attack", "attack", "pounce"],
    specialAbility: {
      name: "Pounce",
      description: "Leaps for 150% ATK damage",
      trigger: "pattern",
      triggerValue: 3,
    },
  },
}

export const ZOMBIE: MonsterDefinition = {
  id: "zombie",
  name: "Zombie",
  description: "Shambling corpse. High HP and DEF, but slow.",
  minLevel: 1,
  
  baseStats: {
    hp: 48,
    atk: 5,
    def: 5,
    crystal: 12,
    exp: 40,
  },
  
  growth: {
    hp: {
      easy:   [3, 5, 8, 11, 15, 19, 25],
      medium: [4, 7, 10, 14, 18, 23, 30],
      hard:   [5, 9, 13, 17, 22, 28, 36],
    },
    atk: {
      easy:   [1, 2, 4, 6, 8, 11, 14],
      medium: [1.5, 3, 5, 7, 10, 14, 19],
      hard:   [2, 4, 7, 10, 14, 18, 23],
    },
    def: {
      easy:   [1, 2, 3, 5, 7, 9, 12],
      medium: [1.5, 2.5, 4, 6, 8, 11, 14],
      hard:   [2, 4, 6, 8, 11, 14, 18],
    },
    crystal: {
      easy:   [2, 3, 5, 6, 9, 11, 14],
      medium: [3, 5, 6, 8, 11, 14, 18],
      hard:   [4, 6, 8, 11, 14, 18, 23],
    },
    exp: {
      easy:   [2, 3, 4, 6, 8, 11, 15],
      medium: [3, 4, 6, 8, 11, 15, 19],
      hard:   [4, 6, 8, 11, 15, 19, 25],
    },
  },
  
  behavior: {
    pattern: ["attack"],
  },
};

export const SKELETON: MonsterDefinition = {
  id: "skeleton",
  name: "Skeleton",
  description: "Brittle undead. High ATK, very low DEF.",
  minLevel: 1,
  
  baseStats: {
    hp: 42,
    atk: 7,
    def: 1,
    crystal: 16,
    exp: 48,
  },
  
  growth: {
    hp: {
      easy:   [2, 4, 6, 8, 11, 14, 18],
      medium: [3, 5, 7, 10, 14, 18, 23],
      hard:   [4, 6, 9, 12, 16, 20, 25],
    },
    atk: {
      easy:   [2, 3, 4, 6, 9, 12, 17],
      medium: [3, 4, 6, 8, 11, 15, 22],
      hard:   [4, 6, 8, 11, 15, 20, 27],
    },
    def: {
      easy:   [0.5, 1, 1.5, 2.5, 3.5, 5, 7],
      medium: [0.75, 1.5, 2.5, 3.5, 5, 7, 9],
      hard:   [1.5, 3, 4.5, 6, 8, 10, 13],
    },
    crystal: {
      easy:   [2, 3, 5, 7, 9, 12, 16],
      medium: [3, 5, 7, 9, 12, 16, 21],
      hard:   [4, 6, 9, 12, 16, 20, 26],
    },
    exp: {
      easy:   [2, 3, 4, 6, 8, 11, 14],
      medium: [3, 4, 6, 8, 11, 15, 18],
      hard:   [4, 5, 7, 10, 14, 18, 24],
    },
  },
  
  behavior: {
    pattern: ["attack", "bone_throw", "attack"],
    specialAbility: {
      name: "Bone Throw",
      description: "Ranged attack for 120% ATK",
      trigger: "pattern",
    },
  },
};

export const MIMIC: MonsterDefinition = {
  id: "mimic",
  name: "Mimic",
  description: "Deceptive creature. High stats, high rewards.",
  minLevel: 2,
  
  baseStats: {
    hp: 56,
    atk: 9,
    def: 7,
    crystal: 32,
    exp: 52,
  },
  
  growth: {
    hp: {
      easy:   [3, 5, 8, 11, 15, 19, 24],
      medium: [4, 7, 10, 14, 18, 23, 29],
      hard:   [5, 9, 13, 17, 22, 28, 35],
    },
    atk: {
      easy:   [1.5, 3, 5, 7, 10, 13, 17],
      medium: [2, 4, 6, 9, 12, 16, 21],
      hard:   [3, 5, 8, 11, 15, 19, 25],
    },
    def: {
      easy:   [1, 2, 3, 5, 7, 9, 12],
      medium: [1.5, 3, 4.5, 6, 8, 11, 14],
      hard:   [2, 4, 6, 8, 11, 14, 18],
    },
    crystal: {
      easy:   [4, 6, 9, 12, 16, 20, 26],
      medium: [5, 8, 11, 15, 19, 25, 32],
      hard:   [6, 10, 14, 18, 24, 30, 38],
    },
    exp: {
      easy:   [3, 4, 6, 8, 11, 14, 18],
      medium: [4, 6, 8, 11, 14, 18, 23],
      hard:   [5, 7, 10, 13, 17, 22, 28],
    },
  },
  
  behavior: {
    pattern: ["wait", "wait", "surprise_attack"],
    specialAbility: {
      name: "Surprise Attack",
      description: "Lunges for 180% ATK",
      trigger: "pattern",
    },
  },
};

export const MONSTERS: Record<MonsterType, MonsterDefinition> = {
  slime: SLIME,
  wolf: WOLF,
  zombie: ZOMBIE,
  skeleton: SKELETON,
  mimic: MIMIC,
};

export const ALL_MONSTERS = Object.values(MONSTERS);
