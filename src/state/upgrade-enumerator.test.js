import { describe, it, expect } from 'vitest';
import { enumerateAllUpgrades } from './upgrade-enumerator.js';

describe('enumerateAllUpgrades', () => {
  it('returns upgrades for a rogue profile with gear', () => {
    const profile = {
      class: 'rogue',
      level: 10,
      hunterUpgrades: { LeBabka_Str: 5 },
      talents: { novice_0_0_patk: 1 },
      ashUpgrades: {},
      sacrificeUpgrades: {},
      gear: {
        weapon: { name: 'Copper Bow', enhancementLevel: 0 },
      },
    };
    const upgrades = enumerateAllUpgrades(profile);

    const types = new Set(upgrades.map(u => u.type));
    expect(types.has('hunter')).toBe(true);
    expect(types.has('talent')).toBe(true);
    expect(types.has('gear')).toBe(true);

    // Talent upgrades should only be novice + rogue
    const talentUpgrades = upgrades.filter(u => u.type === 'talent');
    const hasWarrior = talentUpgrades.some(u => u.id.startsWith('tt_warrior'));
    expect(hasWarrior).toBe(false);

    // Gear: bow should suggest next bow (Steel Bow), not a sword
    const gearUpgrades = upgrades.filter(u => u.type === 'gear');
    const bowUpgrade = gearUpgrades.find(u => u.name === 'Steel Bow');
    expect(bowUpgrade).toBeDefined();
    const swordUpgrade = gearUpgrades.find(u => u.name === 'Wooden Sword');
    expect(swordUpgrade).toBeUndefined();
  });

  it('each hunter upgrade has materialCost', () => {
    const profile = {
      class: 'rogue', level: 10,
      hunterUpgrades: {}, talents: {},
      ashUpgrades: {}, sacrificeUpgrades: {}, gear: {},
    };
    const upgrades = enumerateAllUpgrades(profile);
    const hunterUpgrades = upgrades.filter(u => u.type === 'hunter');
    for (const hu of hunterUpgrades) {
      expect(hu.materialCost).toBeDefined();
      expect(Object.keys(hu.materialCost).length).toBeGreaterThan(0);
    }
  });
});
