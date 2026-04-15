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

  it('talent points add bonuses', () => {
    const profile = {
      class: 'rogue',
      hunterUpgrades: {},
      talents: {
        tt_rogue_0_0: 3, // DEX I: 2 per point => +6 dex
        tt_rogue_1_1: 5, // ATKSPD I: 2 per point => +10 atkSpeed
      },
      gear: {},
    };
    const stats = computeStats(profile);

    expect(stats.dex).toBe(6);
    expect(stats.atkSpeed).toBe(20 + 10); // base 20 + 10 from talent
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
