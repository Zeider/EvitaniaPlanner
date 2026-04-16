import { describe, it, expect } from 'vitest';
import {
  computeStats,
  computeEffectiveDPS,
  computeEffectiveHP,
  computeTimeToDie,
  computeFarmingRates,
} from './stat-engine.js';

describe('computeStats', () => {
  it('rogue with no gear returns class base stats', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
    };
    const stats = computeStats(profile);

    // Rogue base stats from classes.json
    expect(stats.hp).toBe(35);
    expect(stats.def).toBe(25);
    expect(stats.atk).toBe(14);
    expect(stats.atkPercent).toBe(15);
    expect(stats.atkSpeed).toBe(20);
    expect(stats.critChance).toBe(20);
    expect(stats.critDmg).toBe(40);
    expect(stats.mana).toBe(25);
    expect(stats.manaRegen).toBe(5);
    expect(stats.magicFind).toBe(20);
    expect(stats.bonusXp).toBe(0);

    // Default zero stats
    expect(stats.str).toBe(0);
    expect(stats.dex).toBe(0);
    expect(stats.int).toBe(0);
    expect(stats.con).toBe(0);
    expect(stats.men).toBe(0);
    expect(stats.accuracy).toBe(0);
    expect(stats.moveSpeed).toBe(0);
    expect(stats.hpRegen).toBe(0);

    // totalAtk = atk * (1 + atkPercent/100) = 14 * 1.15 = 16.1
    expect(stats.totalAtk).toBeCloseTo(16.1, 1);
  });

  it('hunter upgrades add to stats correctly', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {
        LeBabka_Str: 10,       // +10 str
        LeBabka_Dex: 5,        // +5 dex
        LeBabka_CritDamage: 3, // +6 critDmg (2 per rank)
        LeBabka_PAtk: 2,       // +20 atkPercent (10 per rank)
      },
      talents: {},
      gear: {},
    };
    const stats = computeStats(profile);

    expect(stats.str).toBe(10);
    expect(stats.dex).toBe(5);
    expect(stats.critDmg).toBe(40 + 6); // base 40 + 6 from upgrade
    expect(stats.atkPercent).toBe(15 + 20); // base 15 + 20 from upgrade

    // Rogue: ATK += DEX * 0.10 * current ATK
    // base atk = 14, dex = 5
    // after primary stat scaling: atk = 14 + 5 * 0.10 * 14 = 14 + 7 = 21
    // totalAtk = 21 * (1 + 35/100) = 21 * 1.35 = 28.35
    expect(stats.totalAtk).toBeCloseTo(28.35, 1);
  });

  it('weapon enhancement scales ATK at 27.5% per level', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {
        weapon: { name: 'Essence Sword', enhancementLevel: 5 },
      },
    };
    const stats = computeStats(profile);

    // Essence Sword base ATK = 45, +5 enhancement
    // 45 * (1 + 5 * 0.275) = 45 * 2.375 = 106.875 → 106.9
    // total weapon contribution = 106.9
    // plus rogue base atk (14) = 120.9
    expect(stats.atk).toBeCloseTo(120.9, 1);
  });

  it('armor enhancement scales DEF at 5% per level', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {
        helmet: { name: 'Bronze Helmet', enhancementLevel: 5 },
      },
    };
    const stats = computeStats(profile);

    // Bronze Helmet base DEF = 25, +5 enhancement
    // 25 * (1 + 5 * 0.05) = 25 * 1.25 = 31.25 → 31.3
    // plus rogue base def (25) = 56.3
    expect(stats.def).toBeCloseTo(56.3, 1);
  });

  it('sacrifice multipliers scale stats', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      sacrificeUpgrades: {
        'act-2-sacrifice-1': 10, // Attack Wish: x0.09 per rank, multiplier
      },
    };
    const stats = computeStats(profile);

    // Rogue base atk = 14
    // Attack Wish rank 10: multiplier = 1 + 0.09 * 10 = 1.9
    // After primary stat scaling (dex=0, no change): atk still 14
    // After sacrifice: 14 * 1.9 = 26.6
    expect(stats.atk).toBeCloseTo(26.6, 1);
  });

  it('flat sacrifice bonuses add correctly', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      sacrificeUpgrades: {
        'act-2-sacrifice-2': 15, // Wish for Luck: +1 critChance per rank, flat
      },
    };
    const stats = computeStats(profile);

    // Rogue base critChance = 20, +15 from sacrifice
    expect(stats.critChance).toBe(35);
  });

  it('bonfire buffs apply based on heat level', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      bonfireHeat: 3100, // Unlocks all bonfire buffs including Fiery Weapons (+50% ATK)
    };
    const stats = computeStats(profile);

    // Rogue base atkPercent = 15, bonfire adds +50
    expect(stats.atkPercent).toBe(65);
    // XP multi: bonfire Owl Wisdom +50%
    expect(stats.xpMulti).toBe(50);
    // Mob spawn reduction: Monster Bait -20%
    expect(stats.mobSpawnReduction).toBe(20);
  });

  it('ash upgrades add combat stats', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      ashUpgrades: {
        'ash_2_0': 3, // Crit Damage +10% per rank
        'ash_2_1': 4, // Crit Chance +1% per rank
        'ash_3_0': 1, // Attack Increase +30% ATK
      },
    };
    const stats = computeStats(profile);

    // Rogue base critDmg = 40, +30 from ash
    expect(stats.critDmg).toBe(70);
    // Rogue base critChance = 20, +4 from ash
    expect(stats.critChance).toBe(24);
    // Rogue base atkPercent = 15, +30 from ash
    expect(stats.atkPercent).toBe(45);
  });

  it('card flat bonuses apply at correct tier', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      cards: {
        'Boar': 24, // Act 1, tier thresholds [1,8,24,60] → tier index 2 (3rd tier)
      },
    };
    const stats = computeStats(profile);

    // Boar card tier 3 (index 2): HP +30
    // Rogue base HP = 35, +30 from card = 65
    expect(stats.hp).toBe(65);
  });

  it('rune individual stats apply when equipped', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      equippedRunes: ['VEX', 'ORT'], // Ironwood family: ATK +45 and +36
    };
    const stats = computeStats(profile);

    // Rogue base atk = 14, VEX (ATK +45) + ORT (ATK +36) = +81
    expect(stats.atk).toBeCloseTo(95, 1);
  });

  it('rune word bonuses apply when all runes present', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      equippedRunes: ['APEX', 'SIRC', 'WER'],
    };
    const stats = computeStats(profile);

    // Individual runes: APEX (critDmg +12), SIRC (critDmg +9), WER (physDef +8)
    // Rune word [APEX,SIRC,WER]: critChance +10, critDamage +60, magicFind +5
    // Rogue base critDmg = 40, +12 +9 (individual) +60 (word) = 121
    expect(stats.critDmg).toBe(121);
    // Rogue base critChance = 20, +10 from word = 30
    expect(stats.critChance).toBe(30);
    // Rogue base magicFind = 20, +5 from word = 25
    expect(stats.magicFind).toBe(25);
  });

  it('active pet global bonus scales linearly with level', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      activePet: { name: 'Basic Bat', level: 9 },
    };
    const stats = computeStats(profile);

    // Basic Bat global bonus: All ATK (isPercent: true, level50: 54)
    // At level 9: 54 * (0.189 + 0.0162 * 9) = 54 * 0.3348 = 18.08 → atkPercent
    // Rogue base atkPercent = 15, +18.08 = 33.08
    expect(stats.atkPercent).toBeCloseTo(33.08, 0);
  });

  it('curio multipliers apply to stats', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {},
      gear: {},
      equippedCurios: [
        { name: 'Pandemonium Egg', tier: 9 }, // Purple, critDmg +20%, tiers: t3 portalKills+3, t7 atkSpeed+6%, t9 critChance+9%
      ],
    };
    const stats = computeStats(profile);

    // Rogue base critDmg = 40, +20 from curio primary
    expect(stats.critDmg).toBe(60);
    // ATK multiplier for purple rarity: x1.13
    // Rogue base atk = 14 * 1.13 = 15.82
    expect(stats.atk).toBeCloseTo(15.82, 1);
    // Tier 7 bonus: atkSpeed +6%
    expect(stats.atkSpeed).toBe(26); // 20 base + 6
    // Tier 9 bonus: critChance +9%
    expect(stats.critChance).toBe(29); // 20 base + 9
  });

  it('talent points add bonuses', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {
        tt_rogue_1_0: 2, // Crit Chance: +2% per point, max 2 => +4 critChance
        tt_rogue_5_0: 7, // ATK Speed: +1% per point, max 7 => +7 atkSpeed
      },
      gear: {},
    };
    const stats = computeStats(profile);

    expect(stats.critChance).toBe(20 + 4); // base 20 + 4 from talent (2pts * 2%/pt)
    expect(stats.atkSpeed).toBe(20 + 7); // base 20 + 7 from talent
  });
});

describe('computeEffectiveDPS', () => {
  it('basic DPS calculation with known values', () => {
    const stats = {
      atk: 100,
      totalAtk: 100,
      atkSpeed: 50,
      critChance: 20,
      critDmg: 100,
      accuracy: 200,
    };
    const enemy = { evasion: 100 };

    // baseDPS = 100 * (1 + 50/100) = 150
    // critMult = 1 + (20/100 * 100/100) = 1.2
    // hitRate = 200 / (200 + 100) = 0.6667
    // effectiveDPS = 150 * 1.2 * 0.6667 = 120
    const dps = computeEffectiveDPS(stats, enemy);
    expect(dps).toBeCloseTo(120, 0);
  });
});

describe('computeEffectiveHP', () => {
  it('basic calculation', () => {
    const stats = { hp: 1000, def: 100 };
    const enemy = { atk: 200 };

    // damageReduction = 100 / (100 + 200) = 0.3333
    // effectiveHP = 1000 / (1 - 0.3333) = 1000 / 0.6667 ≈ 1500
    const ehp = computeEffectiveHP(stats, enemy);
    expect(ehp).toBeCloseTo(1500, 0);
  });
});

describe('computeTimeToDie', () => {
  it('basic survival time', () => {
    const stats = { hp: 1000, def: 100, hpRegen: 0 };
    const enemy = { atk: 200 };

    // damageReduction = 100 / (100 + 200) = 0.3333
    // incomingDPS = 200 * (1 - 0.3333) = 133.33
    // timeToDie = 1000 / max(0.01, 133.33 - 0) = 7.5
    const ttd = computeTimeToDie(stats, enemy);
    expect(ttd).toBeCloseTo(7.5, 1);
  });

  it('hp regen extends survival time', () => {
    const stats = { hp: 1000, def: 100, hpRegen: 33.33 };
    const enemy = { atk: 200 };

    // incomingDPS = 133.33, net = 133.33 - 33.33 = 100
    // timeToDie = 1000 / 100 = 10
    const ttd = computeTimeToDie(stats, enemy);
    expect(ttd).toBeCloseTo(10, 0);
  });
});

describe('computeFarmingRates', () => {
  it('kills per hour from DPS and enemy HP', () => {
    const effectiveDPS = 100;
    const enemy = { hp: 500, xp: 50, gold: 10 };
    const utilStats = { mobSpawnReduction: 0, moveSpeed: 0, xpMulti: 0, goldMulti: 0 };

    // timeToKill = 500 / 100 = 5
    // mobSpawnTime = 3 * (1 - 0/100) = 3
    // travelTime = 1 / (1 + 0/100) = 1
    // timePerKill = 5 + 3 + 1 = 9
    // killsPerHour = 3600 / 9 = 400
    // xpPerHour = 400 * 50 * 1 = 20000
    // goldPerHour = 400 * 10 * 1 = 4000
    const rates = computeFarmingRates(effectiveDPS, enemy, utilStats);
    expect(rates.timeToKill).toBeCloseTo(5, 1);
    expect(rates.timePerKill).toBeCloseTo(9, 1);
    expect(rates.killsPerHour).toBeCloseTo(400, 0);
    expect(rates.xpPerHour).toBeCloseTo(20000, 0);
    expect(rates.goldPerHour).toBeCloseTo(4000, 0);
  });

  it('utility stats affect farming rates', () => {
    const effectiveDPS = 200;
    const enemy = { hp: 400, xp: 100, gold: 20 };
    const utilStats = { mobSpawnReduction: 50, moveSpeed: 100, xpMulti: 50, goldMulti: 25 };

    // timeToKill = 400 / 200 = 2
    // mobSpawnTime = 3 * (1 - 50/100) = 1.5
    // travelTime = 1 / (1 + 100/100) = 0.5
    // timePerKill = 2 + 1.5 + 0.5 = 4
    // killsPerHour = 3600 / 4 = 900
    // xpPerHour = 900 * 100 * 1.5 = 135000
    // goldPerHour = 900 * 20 * 1.25 = 22500
    const rates = computeFarmingRates(effectiveDPS, enemy, utilStats);
    expect(rates.killsPerHour).toBeCloseTo(900, 0);
    expect(rates.xpPerHour).toBeCloseTo(135000, 0);
    expect(rates.goldPerHour).toBeCloseTo(22500, 0);
  });
});
