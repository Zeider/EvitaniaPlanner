import { describe, it, expect } from 'vitest';
import { scoreUpgrade, rankAllUpgrades, autoCalibrate } from './upgrade-scorer.js';
import { computeStats } from './stat-engine.js';

// Minimal profile that produces deterministic stats through the stat engine
const baseProfile = {
  class: 'rogue',
  level: 10,
  talents: {},
  hunterUpgrades: { LeBabka_Accuracy: 40 },
  ashUpgrades: {},
  sacrificeUpgrades: {},
  gear: {},
  cards: {},
  equippedRunes: [],
  equippedCurios: [],
  activePet: null,
  bonfireHeat: 0,
};

const baseStats = computeStats(baseProfile);

const enemy = { hp: 1000, atk: 50, evasion: 0, xp: 500, gold: 10 };

const defaultWeights = { offenseWeight: 0.8, defenseWeight: 0.2 };

describe('scoreUpgrade', () => {
  it('hunter upgrade with positive offense delta and nonzero farm time returns positive finite score', () => {
    const upgrade = {
      type: 'hunter',
      id: 'LeBabka_PAtk',
      name: 'ATK Boost',
      statChanges: { atk: 5 },
      materialCost: { 'Mini Plant': 450 },
      farmTimeHours: 0.3,
    };

    const result = scoreUpgrade(baseProfile, baseStats, upgrade, enemy, defaultWeights);

    expect(result.offenseDelta).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).not.toBe(Infinity);
    expect(result.id).toBe('LeBabka_PAtk');
    expect(result.name).toBe('ATK Boost');
  });

  it('talent point with 0 farm time returns Infinity score', () => {
    const upgrade = {
      type: 'talent',
      id: 'tt_rogue_1_1',
      name: 'Attack! (rogue)',
      statChanges: { atk: 1 },
      materialCost: {},
      farmTimeHours: 0,
    };

    const result = scoreUpgrade(baseProfile, baseStats, upgrade, enemy, defaultWeights);

    expect(result.powerDelta).toBeGreaterThan(0);
    expect(result.score).toBe(Infinity);
  });

  it('defense upgrade increases defenseDelta', () => {
    const upgrade = {
      type: 'talent',
      id: 'tt_rogue_1_2',
      name: 'Defence (rogue)',
      statChanges: { def: 1 },
      materialCost: {},
      farmTimeHours: 0,
    };

    const result = scoreUpgrade(baseProfile, baseStats, upgrade, enemy, defaultWeights);

    expect(result.defenseDelta).toBeGreaterThan(0);
  });

  it('talent power gain reflects multiplier interactions', () => {
    // Give the profile some atkPercent so flat ATK gets amplified
    const profileWithPercent = {
      ...baseProfile,
      ashUpgrades: { ash_3_0: 1 }, // +30% ATK
    };
    const statsWithPercent = computeStats(profileWithPercent);

    const upgrade = {
      type: 'talent',
      id: 'tt_rogue_1_1',
      name: 'Attack! (rogue)',
      statChanges: { atk: 1 },
      materialCost: {},
      farmTimeHours: 0,
    };

    const resultBase = scoreUpgrade(baseProfile, baseStats, upgrade, enemy, defaultWeights);
    const resultWithPercent = scoreUpgrade(profileWithPercent, statsWithPercent, upgrade, enemy, defaultWeights);

    // With 30% ATK bonus, adding 1 flat ATK should produce a larger power gain
    expect(resultWithPercent.powerDelta).toBeGreaterThan(resultBase.powerDelta);
  });
});

describe('rankAllUpgrades', () => {
  it('returns sorted by score descending, infinity first sorted by powerDelta', () => {
    const upgrades = [
      {
        type: 'hunter', id: 'LeBabka_PAtk', name: 'Small ATK',
        statChanges: { atk: 2 }, materialCost: {}, farmTimeHours: 1.0,
      },
      {
        type: 'talent', id: 'tt_rogue_1_1', name: 'Free ATK',
        statChanges: { atk: 1 }, materialCost: {}, farmTimeHours: 0,
      },
      {
        type: 'hunter', id: 'LeBabka_PDef', name: 'Big ATK',
        statChanges: { def: 5 }, materialCost: {}, farmTimeHours: 0.5,
      },
    ];

    const ranked = rankAllUpgrades(baseProfile, baseStats, upgrades, enemy, defaultWeights);

    expect(ranked).toHaveLength(3);
    // Infinity scores first
    expect(ranked[0].score).toBe(Infinity);
    expect(ranked[0].id).toBe('tt_rogue_1_1');
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
