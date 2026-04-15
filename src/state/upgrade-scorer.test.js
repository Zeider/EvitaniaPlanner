import { describe, it, expect } from 'vitest';
import { scoreUpgrade, rankAllUpgrades, autoCalibrate } from './upgrade-scorer.js';

const baseStats = {
  atk: 100, totalAtk: 100, atkSpeed: 0, critChance: 0, critDmg: 0,
  accuracy: 100, hp: 500, def: 50, hpRegen: 0,
};

const enemy = { hp: 1000, atk: 50, evasion: 100, accuracy: 100, xp: 500, gold: 10 };

const defaultWeights = { offenseWeight: 0.8, defenseWeight: 0.2 };

describe('scoreUpgrade', () => {
  it('hunter upgrade with positive offense delta and nonzero farm time returns positive finite score', () => {
    const upgrade = {
      type: 'hunter',
      id: 'atk1',
      name: 'ATK Boost',
      statChanges: { atk: 5 },
      materialCost: { 'Mini Plant': 450 },
      farmTimeHours: 0.3,
    };

    const result = scoreUpgrade(baseStats, upgrade, enemy, defaultWeights);

    expect(result.offenseDelta).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).not.toBe(Infinity);
    expect(result.id).toBe('atk1');
    expect(result.name).toBe('ATK Boost');
  });

  it('talent point with 0 farm time returns Infinity score', () => {
    const upgrade = {
      type: 'talent',
      id: 'talent_atk',
      name: 'Attack Talent',
      statChanges: { atk: 3 },
      materialCost: {},
      farmTimeHours: 0,
    };

    const result = scoreUpgrade(baseStats, upgrade, enemy, defaultWeights);

    expect(result.powerDelta).toBeGreaterThan(0);
    expect(result.score).toBe(Infinity);
  });

  it('defense upgrade increases defenseDelta', () => {
    const upgrade = {
      type: 'gear',
      id: 'def_armor',
      name: 'Iron Plate',
      statChanges: { def: 20 },
      materialCost: { 'Iron Ore': 100 },
      farmTimeHours: 1.0,
    };

    const result = scoreUpgrade(baseStats, upgrade, enemy, defaultWeights);

    expect(result.defenseDelta).toBeGreaterThan(0);
  });
});

describe('rankAllUpgrades', () => {
  it('returns sorted by score descending, infinity first', () => {
    const upgrades = [
      {
        type: 'hunter', id: 'u1', name: 'Small ATK',
        statChanges: { atk: 2 }, materialCost: {}, farmTimeHours: 1.0,
      },
      {
        type: 'talent', id: 'u2', name: 'Free ATK',
        statChanges: { atk: 3 }, materialCost: {}, farmTimeHours: 0,
      },
      {
        type: 'gear', id: 'u3', name: 'Big ATK',
        statChanges: { atk: 10 }, materialCost: {}, farmTimeHours: 0.5,
      },
    ];

    const ranked = rankAllUpgrades(baseStats, upgrades, enemy, defaultWeights);

    expect(ranked).toHaveLength(3);
    // Infinity scores first
    expect(ranked[0].score).toBe(Infinity);
    expect(ranked[0].id).toBe('u2');
    // Remaining sorted descending
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });
});

describe('autoCalibrate', () => {
  it('returns heavy defense weights when alive < 90%', () => {
    const weights = autoCalibrate(85);
    expect(weights.offenseWeight).toBe(0.4);
    expect(weights.defenseWeight).toBe(0.6);
  });

  it('returns balanced weights when alive >= 90% and < 95%', () => {
    const weights = autoCalibrate(92);
    expect(weights.offenseWeight).toBe(0.6);
    expect(weights.defenseWeight).toBe(0.4);
  });

  it('returns heavy offense weights when alive >= 95%', () => {
    const weights = autoCalibrate(98);
    expect(weights.offenseWeight).toBe(0.8);
    expect(weights.defenseWeight).toBe(0.2);
  });

  it('returns heavy offense weights at exactly 95%', () => {
    const weights = autoCalibrate(95);
    expect(weights.offenseWeight).toBe(0.8);
    expect(weights.defenseWeight).toBe(0.2);
  });

  it('returns balanced weights at exactly 90%', () => {
    const weights = autoCalibrate(90);
    expect(weights.offenseWeight).toBe(0.6);
    expect(weights.defenseWeight).toBe(0.4);
  });
});
