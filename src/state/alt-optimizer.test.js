import { describe, it, expect } from 'vitest';
import { buildCapabilityMatrix, assignAlts } from './alt-optimizer.js';

describe('buildCapabilityMatrix', () => {
  it('returns eligible zones for a warrior profile', () => {
    const profile = {
      name: 'Thalin', class: 'warrior', level: 48,
      hunterUpgrades: { LeBabka_Str: 15, LeBabka_PAtk: 10 },
      talents: { tt_warrior_0_0: 5, tt_warrior_1_1: 5, novice_0_0_patk: 1, class_1_warrior: 1 },
      ashUpgrades: {}, sacrificeUpgrades: {},
      gear: { weapon: { name: 'Steel Sword', enhancementLevel: 5 } },
      currentZone: '2.1',
      miningLevel: 20, woodcuttingLevel: 15,
      farmingRates: { killsPerHour: 300, xpPerHour: 50000, goldPerHour: 100 },
    };
    const matrix = buildCapabilityMatrix(profile);

    expect(matrix.altName).toBe('Thalin');
    expect(matrix.altLevel).toBe(48);
    expect(Array.isArray(matrix.zones)).toBe(true);
    expect(matrix.zones.length).toBeGreaterThan(0);

    for (const z of matrix.zones) {
      expect(z.zone).toBeDefined();
      expect(z.killsPerHour).toBeGreaterThan(0);
      expect(z.survivalTime).toBeGreaterThanOrEqual(60);
    }

    expect(matrix.mining.level).toBe(20);
    expect(matrix.woodcutting.level).toBe(15);
  });
});

describe('assignAlts', () => {
  it('assigns alts to bottleneck zones by capability', () => {
    const bottlenecks = [
      { resource: 'Helmet', zone: '2.2', dropRate: 4, priority: 1, upgrade: 'Attack Wish (Rank 6)', needed: 6, owned: 0, powerGain: 100 },
      { resource: 'Thorium Ore', activity: 'mining', minLevel: 20, priority: 2, upgrade: 'Thorium Bow', needed: 100, owned: 0, powerGain: 50 },
    ];
    const matrices = [
      {
        altName: 'Thalin', altClass: 'warrior', altLevel: 48,
        zones: [
          { zone: '2.2', mob: 'Helmet', killsPerHour: 340, survivalTime: 180, xpPerHour: 50000 },
          { zone: '2.1', mob: 'Iceboar', killsPerHour: 400, survivalTime: 300, xpPerHour: 60000 },
        ],
        mining: { level: 25 }, woodcutting: { level: 15 },
        maxZone: '2.2', canPushTo: '2.3',
        profile: { name: 'Thalin' },
      },
      {
        altName: 'Kai', altClass: 'rogue', altLevel: 15,
        zones: [
          { zone: '1.10', mob: 'Kobold', killsPerHour: 200, survivalTime: 120, xpPerHour: 20000 },
        ],
        mining: { level: 20 }, woodcutting: { level: 10 },
        maxZone: '1.10', canPushTo: '1.11',
        profile: { name: 'Kai' },
      },
    ];

    const assignments = assignAlts(bottlenecks, matrices);
    expect(assignments.length).toBe(2);

    const thalin = assignments.find(a => a.altName === 'Thalin');
    expect(thalin.zone).toBe('2.2');
    expect(thalin.type).toBe('farm');

    const kai = assignments.find(a => a.altName === 'Kai');
    expect(kai.type).toBe('profession');
    expect(kai.activity).toBe('mining');
  });

  it('unassigned alts get push or xp assignment', () => {
    const bottlenecks = []; // no bottlenecks
    const matrices = [
      {
        altName: 'Mira', altClass: 'mage', altLevel: 20,
        zones: [{ zone: '1.8', mob: 'Crab', killsPerHour: 100, survivalTime: 90, xpPerHour: 10000 }],
        mining: { level: 5 }, woodcutting: { level: 5 },
        maxZone: '1.8', canPushTo: '1.9',
        profile: { name: 'Mira' },
      },
    ];

    const assignments = assignAlts(bottlenecks, matrices);
    expect(assignments.length).toBe(1);
    expect(assignments[0].type).toBe('push');
    expect(assignments[0].altName).toBe('Mira');
  });
});
