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
    crystal: 10,
    exp: 27,
    score: 2,
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
    crystal: 12,
    exp: 32,
    score: 2,
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
    crystal: 14,
    exp: 42,
    score: 3,
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
    crystal: 18,
    exp: 50,
    score: 3,
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
    crystal: 34,
    exp: 54,
    score: 5,
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

export const VAMPIRE: MonsterDefinition = {
  id: "vampire",
  name: "Vampire",
  description: "Undead noble. Drains life to sustain itself.",
  minLevel: 4,
  
  baseStats: {
    hp: 50,
    atk: 12,
    def: 6,
    crystal: 40,
    exp: 66,
    score: 7,
  },
  
  growth: {
    hp: {
      easy:   [2, 4, 7, 10, 14, 18, 23],
      medium: [3, 6, 9, 13, 17, 22, 28],
      hard:   [4, 8, 12, 16, 21, 27, 34],
    },
    atk: {
      easy:   [2, 4, 6, 9, 12, 16, 21],
      medium: [3, 5, 8, 11, 15, 20, 26],
      hard:   [4, 7, 10, 14, 19, 25, 32],
    },
    def: {
      easy:   [1, 2, 3, 4, 6, 8, 10],
      medium: [1.5, 2.5, 4, 5.5, 7, 9, 12],
      hard:   [2, 3.5, 5, 7, 9, 12, 15],
    },
    crystal: {
      easy:   [5, 8, 11, 15, 19, 24, 30],
      medium: [6, 10, 14, 18, 23, 29, 37],
      hard:   [8, 12, 17, 22, 28, 36, 45],
    },
    exp: {
      easy:   [4, 6, 8, 11, 14, 18, 23],
      medium: [5, 7, 10, 13, 17, 22, 28],
      hard:   [6, 9, 12, 16, 21, 27, 34],
    },
  },
  
  behavior: {
    pattern: ["attack", "life_drain", "attack", "life_drain"],
    specialAbility: {
      name: "Life Drain",
      description: "80% ATK damage, heals 50% of damage dealt",
      trigger: "pattern",
    },
  },
};

export const ORC: MonsterDefinition = {
  id: "orc",
  name: "Orc",
  description: "Berserker. Gets stronger as HP drops.",
  minLevel: 5,
  
  baseStats: {
    hp: 68,
    atk: 15,
    def: 8,
    crystal: 30,
    exp: 80,
    score: 8,
  },
  
  growth: {
    hp: {
      easy:   [4, 7, 11, 15, 20, 26, 33],
      medium: [5, 9, 14, 19, 25, 32, 40],
      hard:   [7, 12, 17, 23, 30, 38, 48],
    },
    atk: {
      easy:   [3, 5, 8, 11, 15, 20, 26],
      medium: [4, 7, 10, 14, 19, 25, 32],
      hard:   [5, 9, 13, 18, 24, 31, 40],
    },
    def: {
      easy:   [1, 2, 3.5, 5, 7, 9, 12],
      medium: [1.5, 3, 4.5, 6.5, 8.5, 11, 14],
      hard:   [2, 4, 6, 8, 11, 14, 18],
    },
    crystal: {
      easy:   [3, 5, 7, 10, 13, 17, 22],
      medium: [4, 6, 9, 12, 16, 21, 27],
      hard:   [5, 8, 11, 15, 20, 26, 33],
    },
    exp: {
      easy:   [5, 7, 10, 14, 18, 23, 29],
      medium: [6, 9, 12, 16, 21, 27, 34],
      hard:   [8, 11, 15, 20, 26, 33, 42],
    },
  },
  
  behavior: {
    pattern: ["attack"],
    specialAbility: {
      name: "Berserker Rage",
      description: "At 50% HP: +30% ATK, attacks twice",
      trigger: "hp_threshold",
      triggerValue: 50,
    },
  },
};

export const DRAGON: MonsterDefinition = {
  id: "dragon",
  name: "Dragon",
  description: "Apex predator. Massive stats, devastating breath.",
  minLevel: 6,
  
  baseStats: {
    hp: 78,
    atk: 20,
    def: 12,
    crystal: 47,
    exp: 101,
    score: 10,
  },
  
  growth: {
    hp: {
      easy:   [5, 9, 14, 19, 25, 32, 40],
      medium: [7, 12, 18, 24, 31, 39, 49],
      hard:   [9, 15, 22, 29, 38, 48, 60],
    },
    atk: {
      easy:   [4, 7, 11, 15, 20, 26, 33],
      medium: [5, 9, 14, 19, 25, 32, 40],
      hard:   [7, 12, 18, 24, 31, 40, 50],
    },
    def: {
      easy:   [2, 3.5, 5, 7, 9, 12, 15],
      medium: [2.5, 4.5, 6.5, 9, 12, 15, 19],
      hard:   [3.5, 6, 8.5, 11.5, 15, 19, 24],
    },
    crystal: {
      easy:   [6, 9, 13, 17, 22, 28, 35],
      medium: [8, 12, 16, 21, 27, 34, 43],
      hard:   [10, 15, 20, 26, 34, 43, 54],
    },
    exp: {
      easy:   [6, 9, 13, 17, 22, 28, 35],
      medium: [8, 12, 16, 21, 27, 34, 43],
      hard:   [10, 14, 19, 25, 32, 40, 50],
    },
  },
  
  behavior: {
    pattern: ["attack", "attack", "fire_breath"],
    specialAbility: {
      name: "Fire Breath",
      description: "200% ATK + applies Burn for 3 turns",
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
  vampire: VAMPIRE,
  orc: ORC,
  dragon: DRAGON,
};

export const ALL_MONSTERS = Object.values(MONSTERS);
