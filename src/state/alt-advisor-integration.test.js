import { describe, it, expect } from 'vitest';
import { detectBottlenecks } from './bottleneck-detector.js';
import { buildCapabilityMatrix, assignAlts } from './alt-optimizer.js';

describe('Alt Advisor integration', () => {
  const mainProfile = {
    name: 'Zeider', class: 'rogue', level: 69,
    hunterUpgrades: { LeBabka_Str: 8, LeBabka_PAtk: 15, LeBabka_Dex: 5 },
    talents: { tt_rogue_0_0: 5, tt_rogue_8_1: 1, tt_rogue_8_0: 5, novice_0_0_patk: 1, class_1_rogue: 1 },
    ashUpgrades: { ash_0_0: 1 },
    sacrificeUpgrades: { 'act-2-sacrifice-1': 5, 'act-2-sacrifice-0': 3 },
    gear: { weapon: { name: 'Steel Bow', enhancementLevel: 6 } },
    currentZone: '2.1',
    miningLevel: 18, woodcuttingLevel: 21,
    farmingRates: { killsPerHour: 149, xpPerHour: 23698, goldPerHour: 0 },
  };

  const altProfile = {
    name: 'Thalin', class: 'warrior', level: 48,
    hunterUpgrades: { LeBabka_Str: 8, LeBabka_PAtk: 15 },
    talents: { tt_warrior_0_0: 5, tt_warrior_1_1: 5, novice_0_0_patk: 1, class_1_warrior: 1 },
    ashUpgrades: { ash_0_0: 1 },
    sacrificeUpgrades: { 'act-2-sacrifice-1': 5 },
    gear: { weapon: { name: 'Copper Sword', enhancementLevel: 3 } },
    currentZone: '1.8',
    miningLevel: 10, woodcuttingLevel: 5,
    farmingRates: { killsPerHour: 50, xpPerHour: 1000, goldPerHour: 10 },
  };

  it('full flow: detect bottlenecks → build matrix → assign', () => {
    const bottlenecks = detectBottlenecks(mainProfile);
    expect(bottlenecks.length).toBeGreaterThan(0);

    const matrix = buildCapabilityMatrix(altProfile);
    expect(matrix.zones.length).toBeGreaterThan(0);

    const assignments = assignAlts(bottlenecks, [matrix]);
    expect(assignments.length).toBe(1);
    expect(assignments[0].altName).toBe('Thalin');
    expect(['farm', 'profession', 'push', 'xp']).toContain(assignments[0].type);
  });

  it('bottlenecks include farmable resources with source info', () => {
    const bottlenecks = detectBottlenecks(mainProfile);
    for (const b of bottlenecks) {
      expect(b.resource).toBeDefined();
      expect(b.priority).toBeDefined();
      const hasSource = b.zone !== undefined || b.boss !== undefined || b.activity !== undefined;
      expect(hasSource).toBe(true);
    }
  });

  it('capability matrix reflects alt power level', () => {
    const matrix = buildCapabilityMatrix(altProfile);
    // Alt with Copper Sword +3 should survive early zones but not late Act 2
    const hasAct1Zones = matrix.zones.some(z => z.zone.startsWith('1.'));
    expect(hasAct1Zones).toBe(true);
    // Shouldn't be able to farm late Act 2 zones
    const canFarm212 = matrix.zones.some(z => z.zone === '2.12');
    expect(canFarm212).toBe(false);
  });
});
