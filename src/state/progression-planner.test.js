import { describe, it, expect } from 'vitest';
import { expandTargetToMaterials, estimateMaterialEta } from './progression-planner.js';

describe('expandTargetToMaterials — gearPiece', () => {
  const rogueProfile = { class: 'rogue' };

  it('expands a single piece to its base materials', () => {
    const target = { type: 'gearPiece', value: 'Thorium Boots' };
    const result = expandTargetToMaterials(target, rogueProfile);
    // Thorium Boots recipe: 10 Crystalized Yellow Substance, 25 Perfect Fur,
    // 2 Norse Essence, 47 Thorium Bar.
    // Thorium Bar (yields 1) needs 42 Thorium Ore + 30 Chadcoal.
    // For 47 bars: 47*42=1974 ore, 47*30=1410 chadcoal.
    // Chadcoal (yields 1) needs 10 Ironwood Log.
    // For 1410 chadcoal: 1410*10=14100 ironwood log.
    // Perfect Fur (yields 5) needs 30 Furry Fur.
    // For 25 perfect fur: ceil(25/5)=5 runs, 5*30=150 furry fur.
    // Norse Essence has no recipe, so it stays as-is (2).
    // Crystalized Yellow Substance has no recipe, so it stays as-is (10).
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    expect(byName['Thorium Ore']).toBe(1974);
    expect(byName['Ironwood Log']).toBe(14100);
    expect(byName['Furry Fur']).toBe(150);
    expect(byName['Norse Essence']).toBe(2);
    expect(byName['Crystalized Yellow Substance']).toBe(10);
  });

  it('returns empty array when target is null', () => {
    expect(expandTargetToMaterials(null, rogueProfile)).toEqual([]);
  });

  it('returns empty array when target piece has no recipe', () => {
    const target = { type: 'gearPiece', value: 'Nonexistent Item' };
    expect(expandTargetToMaterials(target, rogueProfile)).toEqual([]);
  });
});

describe('expandTargetToMaterials — gearSet', () => {
  it('expands a full Thorium set for a rogue (weapon piece = Thorium Bow)', () => {
    const target = { type: 'gearSet', value: 'Thorium' };
    const result = expandTargetToMaterials(target, { class: 'rogue' });
    expect(result.length).toBeGreaterThan(0);
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    // Should include armor materials
    expect(byName['Perfect Fur'] ?? byName['Furry Fur']).toBeGreaterThan(0);
    // Should include weapon materials (Thorium Bow uses Furstring which expands to Yellow Feather)
    expect(byName['Yellow Feather']).toBeGreaterThan(0);
    // Should NOT include sword/longsword weapon-specific materials
    // (Thorium Sword/Longsword use Artisan's Frame which expands to different materials)
    expect(byName['Artisan\'s Frame']).toBeUndefined();
  });

  it('filters weapon by class: warrior picks Thorium Sword', () => {
    const target = { type: 'gearSet', value: 'Thorium' };
    const result = expandTargetToMaterials(target, { class: 'warrior' });
    expect(result.length).toBeGreaterThan(0);
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    // Artisan's Frame expands to Chadcoal and Steel Bar; Chadcoal fully expands to Ironwood Log
    expect(byName['Ironwood Log']).toBeGreaterThan(0);
    expect(byName['Thorium Ore']).toBeGreaterThan(0);
    // Should NOT have Rogue/Mage specific materials
    expect(byName['Yellow Feather']).toBeUndefined();
    expect(byName['Carrot']).toBeUndefined();
  });

  it('filters weapon by class: mage picks Thorium Staff', () => {
    const target = { type: 'gearSet', value: 'Thorium' };
    const result = expandTargetToMaterials(target, { class: 'mage' });
    expect(result.length).toBeGreaterThan(0);
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    // Cryolite expands to Cryolite Ore, Norse Essence, Carrot
    expect(byName['Carrot']).toBeGreaterThan(0);
    // Should not have rogue-specific materials
    expect(byName['Yellow Feather']).toBeUndefined();
  });
});

describe('estimateMaterialEta', () => {
  const profile = {
    class: 'rogue',
    miningLevel: 42,
    woodcuttingLevel: 1,
    farmingRates: { killsPerHour: 1000, xpPerHour: 0, goldPerHour: 0 },
    observedRates: { 'Thorium Ore': 420 },
  };

  it('computes vendor ETA as days × 24 using dailyLimit', () => {
    // Yellow Substance: { vendor: true, dailyLimit: 50 }
    const r = estimateMaterialEta('Yellow Substance', 200, profile);
    expect(r.source).toBe('vendor');
    // ceil(200 / 50) = 4 days = 96 hrs
    expect(r.etaHrs).toBe(96);
  });

  it('computes zone ETA as qty × rate / killsPerHour', () => {
    // Wolf Fang: { zone: "1.5", rate: 4 }  → 1000/4 = 250 drops/hr
    const r = estimateMaterialEta('Wolf Fang', 1000, profile);
    expect(r.source).toBe('zone');
    expect(r.location).toBe('Zone 1.5');
    expect(r.etaHrs).toBeCloseTo(4, 1); // 1000 / 250
  });

  it('uses observedRates when available for mining materials', () => {
    // Thorium Ore: observed 420/hr
    const r = estimateMaterialEta('Thorium Ore', 1974, profile);
    expect(r.source).toBe('mining');
    expect(r.isRough).toBe(false);
    expect(r.etaHrs).toBeCloseTo(1974 / 420, 1);
  });

  it('falls back to rough placeholder for mining when no observed rate', () => {
    // Copper Ore: activity mining, but no observedRates['Copper Ore']
    const r = estimateMaterialEta('Copper Ore', 100, profile);
    expect(r.source).toBe('mining');
    expect(r.isRough).toBe(true);
    expect(r.etaHrs).toBeGreaterThan(0);
  });

  it('returns boss placeholder for boss drops', () => {
    const r = estimateMaterialEta('Mammoth Soul', 5, profile);
    expect(r.source).toBe('boss');
    expect(r.isRough).toBe(true);
  });

  it('returns Infinity with reason for unmapped materials', () => {
    const r = estimateMaterialEta('No Such Material', 1, profile);
    expect(r.etaHrs).toBe(Infinity);
    expect(r.reason).toBeDefined();
  });

  it('returns 0 ETA with source "none" when remainingQty is 0', () => {
    const r = estimateMaterialEta('Yellow Substance', 0, profile);
    expect(r.etaHrs).toBe(0);
    expect(r.source).toBe('none');
  });

  it('returns 0 ETA with source "none" when remainingQty is negative', () => {
    const r = estimateMaterialEta('Yellow Substance', -5, profile);
    expect(r.etaHrs).toBe(0);
    expect(r.source).toBe('none');
  });
});
