import { describe, it, expect } from 'vitest';
import { canAssembleRecipe, recommendSocketableRunewords } from './runeword-recommender.js';

describe('canAssembleRecipe', () => {
  it('succeeds when exact runes are present', () => {
    expect(canAssembleRecipe(['GOR', 'MU', 'HAS'], { GOR: 1, MU: 1, HAS: 1 })).toBe(true);
  });

  it('fails when a required rune is missing entirely', () => {
    expect(canAssembleRecipe(['GOR', 'MU', 'HAS'], { GOR: 1, MU: 1 })).toBe(false);
  });

  it('succeeds by merging 6 T1 into 1 T2', () => {
    // OLU is T2 HAS-family. 6 HAS → 1 OLU.
    expect(canAssembleRecipe(['OLU'], { HAS: 6 })).toBe(true);
    expect(canAssembleRecipe(['OLU'], { HAS: 5 })).toBe(false);
  });

  it('succeeds by merging 9 T2 into 1 T3', () => {
    expect(canAssembleRecipe(['SUR'], { OLU: 9 })).toBe(true);
    expect(canAssembleRecipe(['SUR'], { OLU: 8 })).toBe(false);
  });

  it('succeeds by merging across 3 tiers (T1 → T4)', () => {
    // 1 TYR = 486 T1 = 81 T2 = 9 T3
    expect(canAssembleRecipe(['TYR'], { HAS: 486 })).toBe(true);
    expect(canAssembleRecipe(['TYR'], { HAS: 485 })).toBe(false);
  });

  it('fails when supply is stuck at a higher tier than needed (no de-merge)', () => {
    // Own 10 TYR (T4) but recipe needs SUR (T3) — can't break TYR back down
    expect(canAssembleRecipe(['SUR'], { TYR: 10 })).toBe(false);
  });

  it('handles mixed-tier recipes correctly (SUR + TYR with enough total)', () => {
    // Recipe needs 1 SUR + 1 TYR = 54 + 486 = 540 T1-eq, all HAS family
    expect(canAssembleRecipe(['SUR', 'TYR'], { HAS: 540 })).toBe(true);
    expect(canAssembleRecipe(['SUR', 'TYR'], { HAS: 539 })).toBe(false);
  });

  it('handles mixed-tier recipes where pre-tier inventory makes it tight', () => {
    // Own 1 TYR + 1 SUR directly — no merging needed
    expect(canAssembleRecipe(['SUR', 'TYR'], { SUR: 1, TYR: 1 })).toBe(true);
  });

  it('fails the "trapped high-tier" scenario: 10 TYR satisfies TYR but no SUR', () => {
    // Own only TYR (T4) — can provide 1 TYR but not 1 SUR (can't de-merge)
    expect(canAssembleRecipe(['SUR', 'TYR'], { TYR: 10 })).toBe(false);
  });

  it('accepts enough mixed tiers that flow-up satisfies both reqs', () => {
    // Own 1 TYR + 54 HAS → 1 TYR fills TYR slot, 54 HAS → 9 OLU → 1 SUR
    expect(canAssembleRecipe(['SUR', 'TYR'], { TYR: 1, HAS: 54 })).toBe(true);
    expect(canAssembleRecipe(['SUR', 'TYR'], { TYR: 1, HAS: 53 })).toBe(false);
  });

  it('handles multi-family recipes', () => {
    // GOR·MU·HAS is one of each family — own one of each
    expect(canAssembleRecipe(['GOR', 'MU', 'HAS'], { GOR: 1, MU: 1, HAS: 1 })).toBe(true);
    // Missing one family fails even if others have surplus
    expect(canAssembleRecipe(['GOR', 'MU', 'HAS'], { GOR: 100, MU: 100 })).toBe(false);
  });

  it('handles multi-copy recipes (e.g. FAL×2)', () => {
    // FAL is T4 Penguin-Draugr (MU family)
    // Need 2 FAL = 2 * 486 = 972 T1 MU
    expect(canAssembleRecipe(['FAL', 'FAL'], { FAL: 2 })).toBe(true);
    expect(canAssembleRecipe(['FAL', 'FAL'], { FAL: 1 })).toBe(false);
    expect(canAssembleRecipe(['FAL', 'FAL'], { MU: 972 })).toBe(true);
    expect(canAssembleRecipe(['FAL', 'FAL'], { MU: 971 })).toBe(false);
  });

  it('handles PRE×6 runeword (no tier structure in Shop family)', () => {
    expect(canAssembleRecipe(['PRE', 'PRE', 'PRE', 'PRE', 'PRE', 'PRE'], { PRE: 6 })).toBe(true);
    expect(canAssembleRecipe(['PRE', 'PRE', 'PRE', 'PRE', 'PRE', 'PRE'], { PRE: 5 })).toBe(false);
  });

  it('returns false on unknown rune in recipe (fail-safe)', () => {
    expect(canAssembleRecipe(['UNKNOWN_RUNE'], { PRE: 100 })).toBe(false);
  });

  it('ignores unknown runes in inventory (doesn\'t crash)', () => {
    expect(canAssembleRecipe(['PRE'], { PRE: 1, UNKNOWN: 99 })).toBe(true);
  });
});

describe('recommendSocketableRunewords', () => {
  it('returns empty when no slot is large enough', () => {
    // PRE×6 is 6 runes; with max 3-slot rows, even if you own 6 PRE, you can't socket it
    const result = recommendSocketableRunewords({
      runeInventory: { PRE: 6 },
      equippedRunes: [],
      runeSlots: { total: 9, byRow: [3, 3, 3] },
    });
    // Only runewords of length ≤ 3 that you can assemble should appear
    // GOR·MU·HAS needs GOR+MU+HAS which aren't in inventory → not craftable
    // APEX·SIRC·WER needs WOM + KI family runes → not craftable
    expect(result).toEqual([]);
  });

  it('recommends PRE×6 when you have 6 PRE and a 6-slot row', () => {
    const result = recommendSocketableRunewords({
      runeInventory: { PRE: 6 },
      equippedRunes: [],
      runeSlots: { total: 12, byRow: [6, 3, 3] },
    });
    const hasPreX6 = result.some((r) => r.runes.every((x) => x === 'PRE') && r.runes.length === 6);
    expect(hasPreX6).toBe(true);
  });

  it('counts equipped runes as available inventory', () => {
    // If 6 PRE are currently equipped (and none unequipped), we can still
    // "socket PRE×6" because the player can re-arrange.
    const result = recommendSocketableRunewords({
      runeInventory: {},
      equippedRunes: ['PRE', 'PRE', 'PRE', 'PRE', 'PRE', 'PRE'],
      runeSlots: { total: 12, byRow: [6, 3, 3] },
    });
    expect(result.some((r) => r.runes.length === 6 && r.runes.every((x) => x === 'PRE'))).toBe(true);
  });

  it('excludes runewords with missing families', () => {
    // Own only GOR and MU but not HAS — GOR·MU·HAS should not be recommended
    const result = recommendSocketableRunewords({
      runeInventory: { GOR: 1, MU: 1 },
      equippedRunes: [],
      runeSlots: { total: 9, byRow: [3, 3, 3] },
    });
    expect(result.some((r) => r.runes.join(' ') === 'GOR MU HAS')).toBe(false);
  });

  it('sorts richer runewords (more bonuses) first', () => {
    // Give everything needed for all runewords that fit in 6 slots
    const result = recommendSocketableRunewords({
      runeInventory: { GOR: 10, MU: 10, HAS: 10, PRE: 10 },
      equippedRunes: [],
      runeSlots: { total: 6, byRow: [6] },
    });
    // PRE×6 has 4 bonuses (magicFind, offline, atk, portalKills)
    // GOR·MU·HAS has 3 bonuses (hp, allExp, portalKills)
    // With more bonuses first, PRE×6 should precede GOR·MU·HAS
    const preIdx = result.findIndex((r) => r.runes[0] === 'PRE');
    const gorIdx = result.findIndex((r) => r.runes.join(' ') === 'GOR MU HAS');
    expect(preIdx).toBeGreaterThanOrEqual(0);
    expect(gorIdx).toBeGreaterThanOrEqual(0);
    expect(preIdx).toBeLessThan(gorIdx);
  });
});
