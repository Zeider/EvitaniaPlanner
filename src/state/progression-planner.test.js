import { describe, it, expect } from 'vitest';
import { expandTargetToMaterials } from './progression-planner.js';

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
