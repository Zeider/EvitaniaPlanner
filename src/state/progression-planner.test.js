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

describe('expandTargetToMaterials — Infinite gen-I tier', () => {
  // Regression: Infinite recipes are named "Infinite <Slot> I" (Roman-numeral
  // generation suffix), so the tier label is "Infinite I" — distinguishing
  // gen I from any future "Infinite II" set. Before the suffix-aware fix, this
  // resolved to zero pieces.
  it('expands a full Infinite I set for a rogue (weapon piece = Infinite Bow I)', () => {
    const target = { type: 'gearSet', value: 'Infinite I' };
    const result = expandTargetToMaterials(target, { class: 'rogue' });
    expect(result.length).toBeGreaterThan(0);
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    // Bow-specific material (Cactus appears only in Infinite Bow I, qty 450000)
    expect(byName['Cactus']).toBe(450000);
    // Bow-only stone (Icy Stone I qty 300000)
    expect(byName['Icy Stone I']).toBe(300000);
    // Aggregated across the 4 armor pieces
    // Helmet 30 + Chestplate 10 + Gloves 10 + Boots 10
    expect(byName['Crystallized Blue Substance']).toBe(60);
    // Helmet 72000 + Chestplate 24000 + Gloves 24000 + Boots 24000
    expect(byName['Grassy Stone I']).toBe(144000);
    // Bow 2000 + Helmet 1000 + Boots 1000
    expect(byName["The Crab's Pickaxe"]).toBe(4000);
    // Should NOT include other classes' weapon-only materials
    expect(byName['Kangaroo Boomerang']).toBeUndefined(); // Longsword
    expect(byName['Poop Ball']).toBeUndefined();          // Staff
  });

  it('filters weapon by class: warrior picks Infinite Longsword I', () => {
    const target = { type: 'gearSet', value: 'Infinite I' };
    const result = expandTargetToMaterials(target, { class: 'warrior' });
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    expect(byName['Kangaroo Boomerang']).toBe(450000);
    expect(byName['Cactus']).toBeUndefined();
    expect(byName['Poop Ball']).toBeUndefined();
  });

  it('filters weapon by class: mage picks Infinite Staff I', () => {
    const target = { type: 'gearSet', value: 'Infinite I' };
    const result = expandTargetToMaterials(target, { class: 'mage' });
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    expect(byName['Poop Ball']).toBe(450000);
    expect(byName['Cactus']).toBeUndefined();
    expect(byName['Kangaroo Boomerang']).toBeUndefined();
  });

  it('does NOT match Infinite recipes when the bare tier name is given (no gen suffix)', () => {
    // "Infinite" alone is not a valid tier label; "Infinite I" is. This guards
    // against accidentally matching all generations when the user picks a
    // would-be parent tier.
    const target = { type: 'gearSet', value: 'Infinite' };
    const result = expandTargetToMaterials(target, { class: 'rogue' });
    // Suffix check: "Infinite Helmet I" → suffix "Helmet I" ∉ armor set, so 0 pieces.
    expect(result).toEqual([]);
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
    expect(r.isRough).toBe(false);
  });

  it.skip('returns Infinity + rough flag for vendor entries with no dailyLimit', () => {
    // SKIP: every vendor entry in drops.json now has a known dailyLimit
    // (Crystallized Blue Substance was the last unknown — confirmed at 3/day,
    // 300k each, 2026-05-05). The defensive branch in estimateMaterialEta still
    // exists for future patches that introduce vendor items with unknown caps,
    // but no current fixture triggers it. Re-enable when an unmapped vendor
    // item appears, or refactor estimateMaterialEta to accept dropsData by DI.
    const r = estimateMaterialEta('Crystallized Blue Substance', 100, profile);
    expect(r.source).toBe('vendor');
    expect(r.etaHrs).toBe(Infinity);
    expect(r.isRough).toBe(true);
    expect(r.reason).toMatch(/dailyLimit/);
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

  it('returns small ETA with source "quest" for quest-reward materials within cap', () => {
    const r = estimateMaterialEta('Animal Bone', 1, profile);
    expect(r.source).toBe('quest');
    expect(r.etaHrs).toBeLessThan(1);
    expect(r.isRough).toBe(true);
  });

  it('returns Infinity + reason for quest-reward materials beyond cap (one-time drops)', () => {
    // Animal Bone drops once from the boar-kill quest — asking for 5 is not achievable.
    const r = estimateMaterialEta('Animal Bone', 5, profile);
    expect(r.source).toBe('quest');
    expect(r.etaHrs).toBe(Infinity);
    expect(r.isRough).toBe(true);
    expect(r.reason).toMatch(/quest gives/);
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

import { buildProgressionPlan } from './progression-planner.js';

describe('buildProgressionPlan', () => {
  const profile = {
    class: 'rogue',
    miningLevel: 42,
    woodcuttingLevel: 1,
    farmingRates: { killsPerHour: 1000, xpPerHour: 0, goldPerHour: 0 },
    observedRates: { 'Thorium Ore': 420 },
    inventory: { 'Thorium Ore': 500 },
    progressionTarget: { type: 'gearPiece', value: 'Thorium Boots' },
    gear: {},
  };

  it('returns null-shaped result when target is null', () => {
    const plan = buildProgressionPlan({ ...profile, progressionTarget: null });
    expect(plan.target).toBeNull();
    expect(plan.pieces).toEqual([]);
    expect(plan.aggregateMaterials).toEqual([]);
  });

  it('subtracts inventory before computing ETA', () => {
    const plan = buildProgressionPlan(profile);
    const thoriumOre = plan.aggregateMaterials.find(m => m.name === 'Thorium Ore');
    expect(thoriumOre.owned).toBe(500);
    expect(thoriumOre.remaining).toBe(thoriumOre.totalNeeded - 500);
    expect(thoriumOre.etaHrs).toBeCloseTo(thoriumOre.remaining / 420, 1);
  });

  it('deduplicates materials across pieces in aggregateMaterials', () => {
    const setTarget = { type: 'gearSet', value: 'Thorium' };
    const plan = buildProgressionPlan({ ...profile, progressionTarget: setTarget, inventory: {} });
    const thoriumBarOccurrences = plan.aggregateMaterials.filter(m => m.name === 'Thorium Ore');
    expect(thoriumBarOccurrences.length).toBe(1);
  });

  it('reports totalEtaHrs as sum of aggregate ETAs', () => {
    const plan = buildProgressionPlan(profile);
    const expected = plan.aggregateMaterials
      .filter(m => isFinite(m.etaHrs))
      .reduce((s, m) => s + m.etaHrs, 0);
    expect(plan.totalEtaHrs).toBeCloseTo(expected, 1);
  });

  it('reports quantity-weighted percentComplete over base materials only (intermediates would double-count)', () => {
    // Thorium Boots needs ~1974 Thorium Ore + other mats, user owns 500 Thorium Ore
    // and nothing else. Under quantity-weighting over BASES the ratio is nonzero
    // (~500/totalBaseNeeded). Including intermediates in the denominator would
    // inflate it (every intermediate is already represented by its base ingredients).
    // Under material-count-weighting it would be 0 (zero materials fully satisfied).
    const plan = buildProgressionPlan(profile);
    const baseMats = plan.aggregateMaterials.filter(m => !m.isIntermediate);
    const totalQtyNeeded = baseMats.reduce((s, m) => s + m.totalNeeded, 0);
    const totalQtyOwned = baseMats.reduce(
      (s, m) => s + Math.min(m.owned, m.totalNeeded), 0
    );
    const expected = totalQtyNeeded > 0 ? totalQtyOwned / totalQtyNeeded : 0;
    expect(plan.percentComplete).toBeCloseTo(expected, 5);
    // Also verify it's strictly > 0 (proves we're not using the material-count formula,
    // which would yield exactly 0 in this scenario).
    expect(plan.percentComplete).toBeGreaterThan(0);
  });

  it('reports percentComplete = 1 when everything is owned', () => {
    // Massive inventory covering all realistic Thorium Boots needs.
    const overStocked = {
      ...profile,
      inventory: {
        'Thorium Ore': 999999,
        'Ironwood Log': 999999,
        'Norse Essence': 999999,
        'Crystalized Yellow Substance': 999999,
        'Perfect Fur': 999999,
        'Furry Fur': 999999,
      },
    };
    const plan = buildProgressionPlan(overStocked);
    expect(plan.percentComplete).toBe(1);
  });

  it('reports percentComplete = 0 when nothing is owned', () => {
    const plan = buildProgressionPlan({ ...profile, inventory: {} });
    expect(plan.percentComplete).toBe(0);
  });

  it('credits intermediate inventory: owning Thorium Bars reduces required raw ore', () => {
    // Thorium Boots wants 47 Thorium Bars. User has 30 → 17 still need crafting.
    // Each bar costs 42 Thorium Ore + 30 Chadcoal, so raw ore drops from
    // 47*42=1974 to 17*42=714. The bars also surface as an intermediate row in
    // aggregateMaterials so the user sees their stockpile in context.
    const withBars = {
      ...profile,
      progressionTarget: { type: 'gearPiece', value: 'Thorium Boots' },
      inventory: { 'Thorium Bar': 30 },
    };
    const plan = buildProgressionPlan(withBars);

    const ore = plan.aggregateMaterials.find(m => m.name === 'Thorium Ore');
    expect(ore.totalNeeded).toBe(714); // was 1974 with no bar inventory
    expect(ore.isIntermediate).toBe(false);

    const bar = plan.aggregateMaterials.find(m => m.name === 'Thorium Bar');
    expect(bar).toBeDefined();
    expect(bar.isIntermediate).toBe(true);
    expect(bar.totalNeeded).toBe(47);
    expect(bar.owned).toBe(30);
    expect(bar.remaining).toBe(17);
    // Intermediates have no direct farming source — ETA is skipped (set to 0
    // with source 'craft') so it doesn't double-count with the ingredient rows.
    expect(bar.etaHrs).toBe(0);
    expect(bar.source).toBe('craft');
  });

  it('fully-stocked intermediate short-circuits its sub-tree', () => {
    // 50 Thorium Bars covers all 47 needed → no Thorium Ore or Chadcoal sub-tree
    // gets walked, so those bases shouldn't appear in aggregateMaterials at all.
    const fullyStocked = {
      ...profile,
      progressionTarget: { type: 'gearPiece', value: 'Thorium Boots' },
      inventory: { 'Thorium Bar': 50 },
    };
    const plan = buildProgressionPlan(fullyStocked);

    expect(plan.aggregateMaterials.find(m => m.name === 'Thorium Ore')).toBeUndefined();
    expect(plan.aggregateMaterials.find(m => m.name === 'Chadcoal')).toBeUndefined();
    expect(plan.aggregateMaterials.find(m => m.name === 'Ironwood Log')).toBeUndefined();

    const bar = plan.aggregateMaterials.find(m => m.name === 'Thorium Bar');
    expect(bar.totalNeeded).toBe(47);
    expect(bar.remaining).toBe(0); // all need is covered by 47 of the 50 owned
  });

  it('shares intermediate inventory greedily across pieces in a set', () => {
    // For a set target, two pieces both want Thorium Bars. With 30 bars on
    // hand and a SHARED consumed pool, they're allocated to the first piece
    // and the second piece must craft from raw — i.e. intermediate inventory
    // is not double-spent across pieces.
    const setTarget = {
      ...profile,
      class: 'rogue',
      progressionTarget: { type: 'gearSet', value: 'Thorium' },
      inventory: { 'Thorium Bar': 30 },
    };
    const planNoBars = buildProgressionPlan({ ...setTarget, inventory: {} });
    const planWithBars = buildProgressionPlan(setTarget);

    const oreNoBars = planNoBars.aggregateMaterials.find(m => m.name === 'Thorium Ore').totalNeeded;
    const oreWithBars = planWithBars.aggregateMaterials.find(m => m.name === 'Thorium Ore').totalNeeded;
    // 30 bars saves exactly 30*42=1260 Thorium Ore, no more (the bars are
    // greedily allocated; remaining piece-bars are crafted from raw).
    expect(oreNoBars - oreWithBars).toBe(30 * 42);
  });

  it('intermediate stockpile counts toward percentComplete via raw-savings credit', () => {
    // No raw bases owned, but 30 Thorium Bars in stockpile. The bars represent
    // 30*42=1260 Thorium Ore + 30*30=900 Chadcoal worth of work that's already
    // been done — percentComplete should reflect that, not be 0%.
    const withBars = {
      ...profile,
      progressionTarget: { type: 'gearPiece', value: 'Thorium Boots' },
      inventory: { 'Thorium Bar': 30 },
    };
    const planEmpty = buildProgressionPlan({ ...withBars, inventory: {} });
    const planWithBars = buildProgressionPlan(withBars);

    expect(planEmpty.percentComplete).toBe(0);
    expect(planWithBars.percentComplete).toBeGreaterThan(0);
    // The credit is the raw work the bars stand in for, divided by total raw work.
    // Chadcoal expands to ironwood log, so total raw "saved" = 1260 ore + 900*10 logs.
    const totalRawNeeded = planEmpty.aggregateMaterials
      .filter(m => !m.isIntermediate)
      .reduce((s, m) => s + m.totalNeeded, 0);
    const expectedSavings = 30 * 42 /* ore */ + 30 * 30 * 10 /* chadcoal → ironwood log */;
    expect(planWithBars.percentComplete).toBeCloseTo(expectedSavings / totalRawNeeded, 5);
  });

  it('excludes owned pieces from aggregateMaterials and totalEtaHrs', () => {
    // User owns Thorium Boots — the Thorium-set plan should not ask them to farm
    // boots materials (Crystalized Yellow Substance, Perfect Fur, etc.) just for
    // that piece. Other pieces still contribute.
    const setTarget = { type: 'gearSet', value: 'Thorium' };
    const withOwned = {
      ...profile,
      progressionTarget: setTarget,
      inventory: {},
      gear: { boots: { name: 'Thorium Boots' } },
    };
    const withoutOwned = { ...withOwned, gear: {} };
    const planOwned = buildProgressionPlan(withOwned);
    const planFresh = buildProgressionPlan(withoutOwned);

    // The owned piece is flagged and has no material breakdown
    const bootsPiece = planOwned.pieces.find(p => p.name === 'Thorium Boots');
    expect(bootsPiece.owned).toBe(true);
    expect(bootsPiece.materials).toEqual([]);
    expect(bootsPiece.pieceEtaHrs).toBe(0);

    // Every material needed for Thorium Boots should be reduced in totalNeeded
    // (since the boots piece no longer contributes). Thorium Ore is the clearest:
    // it's in nearly every piece so the delta should be exactly the boots recipe.
    const oreOwned = planOwned.aggregateMaterials.find(m => m.name === 'Thorium Ore');
    const oreFresh = planFresh.aggregateMaterials.find(m => m.name === 'Thorium Ore');
    expect(oreOwned.totalNeeded).toBeLessThan(oreFresh.totalNeeded);
    expect(planOwned.totalEtaHrs).toBeLessThan(planFresh.totalEtaHrs);
  });
});
