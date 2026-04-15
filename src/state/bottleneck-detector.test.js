import { describe, it, expect } from 'vitest';
import { detectBottlenecks } from './bottleneck-detector.js';

describe('detectBottlenecks', () => {
  const baseProfile = {
    class: 'rogue',
    level: 69,
    hunterUpgrades: { LeBabka_Str: 10 },
    talents: { tt_rogue_0_0: 5, novice_0_0_patk: 1, class_1_rogue: 1 },
    ashUpgrades: {},
    sacrificeUpgrades: { 'act-2-sacrifice-1': 5 },
    gear: { weapon: { name: 'Steel Bow', enhancementLevel: 6 } },
    currentZone: '2.1',
  };

  it('returns bottleneck resources sorted by priority', () => {
    const bottlenecks = detectBottlenecks(baseProfile);
    expect(Array.isArray(bottlenecks)).toBe(true);
    expect(bottlenecks.length).toBeGreaterThan(0);

    for (const b of bottlenecks) {
      expect(b.upgrade).toBeDefined();
      expect(b.resource).toBeDefined();
      expect(typeof b.needed).toBe('number');
      expect(b.needed).toBeGreaterThan(0);
      expect(typeof b.priority).toBe('number');
    }

    // Should be sorted by priority ascending
    for (let i = 1; i < bottlenecks.length; i++) {
      expect(bottlenecks[i].priority).toBeGreaterThanOrEqual(bottlenecks[i - 1].priority);
    }
  });

  it('includes zone or activity source for each resource', () => {
    const bottlenecks = detectBottlenecks(baseProfile);
    for (const b of bottlenecks) {
      const hasZone = b.zone !== undefined;
      const hasBoss = b.boss !== undefined;
      const hasActivity = b.activity !== undefined;
      expect(hasZone || hasBoss || hasActivity).toBe(true);
    }
  });

  it('sacrifice upgrades include costItem as bottleneck', () => {
    const profile = {
      ...baseProfile,
      sacrificeUpgrades: { 'act-2-sacrifice-1': 1 },
    };
    const bottlenecks = detectBottlenecks(profile);
    const resources = bottlenecks.map(b => b.resource);
    // Attack Wish (act-2-sacrifice-1) needs "Helmet" as costItem
    // Should appear if Attack Wish is ranked highly enough
    const hasHelmet = resources.includes('Helmet');
    const hasSoul = resources.includes('Mammoth Soul');
    expect(hasHelmet || hasSoul).toBe(true);
  });
});
