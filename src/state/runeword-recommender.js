/**
 * Runeword recommendations: which runewords can you assemble from your
 * current rune inventory, allowing one-way merges (t1 → t2 → t3 → t4)?
 *
 * Design decisions (session 2026-04-22):
 * - Recipes require **exact** rune names (e.g. "GOR · MU · HAS" needs literally
 *   GOR+MU+HAS, not any T2+ from those families). Confirmed against game.
 * - Merging is one-way: lower tiers can be combined into higher tiers at fixed
 *   ratios (6 T1 → 1 T2, 9 T2 → 1 T3, 9 T3 → 1 T4), but higher tiers can't be
 *   split down. This constrains craftability.
 */

import runeData from '../data/runes.json';

const TIER_KEYS = ['t1', 't2', 't3', 't4'];
const T1_EQ = [1, 6, 54, 486]; // t1-equivalent value of each tier

// Build RUNE_NAME → { family, tier } lookup once at module load.
const FAMILY_TIER_MAP = (() => {
  const map = {};
  for (const fam of runeData.families) {
    for (const [tierKey, tierInfo] of Object.entries(fam.tiers)) {
      const tierIdx = TIER_KEYS.indexOf(tierKey);
      if (tierIdx < 0 || !tierInfo?.rune) continue;
      map[tierInfo.rune] = { family: fam.name, tier: tierIdx };
    }
  }
  return map;
})();

/**
 * Given a list of required rune names and an inventory of runes, return true
 * if the inventory can satisfy the recipe (with merging allowed).
 *
 * @param {string[]} recipe - Array of exact rune names required.
 * @param {Object<string, number>} inventory - Map of rune name → count.
 * @returns {boolean}
 */
export function canAssembleRecipe(recipe, inventory) {
  // Group recipe by family and tier.
  const reqByFamily = {};
  for (const runeName of recipe) {
    const ft = FAMILY_TIER_MAP[runeName];
    if (!ft) return false; // unknown rune in recipe — can't judge, fail safe
    if (!reqByFamily[ft.family]) reqByFamily[ft.family] = [0, 0, 0, 0];
    reqByFamily[ft.family][ft.tier]++;
  }

  // Group inventory by family and tier.
  const supplyByFamily = {};
  for (const [runeName, count] of Object.entries(inventory || {})) {
    if (!count || count <= 0) continue;
    const ft = FAMILY_TIER_MAP[runeName];
    if (!ft) continue; // unknown rune in inventory — ignore
    if (!supplyByFamily[ft.family]) supplyByFamily[ft.family] = [0, 0, 0, 0];
    supplyByFamily[ft.family][ft.tier] += count;
  }

  // Cumulative T1-equivalent check per family.
  // For each tier T, sum of supply at tier ≤ T must cover sum of req at tier ≤ T.
  // This correctly models one-way merging: lower-tier supply can flow up to
  // satisfy higher-tier reqs, but higher-tier supply can't flow down.
  for (const [famName, req] of Object.entries(reqByFamily)) {
    const supply = supplyByFamily[famName] || [0, 0, 0, 0];
    let cumReq = 0;
    let cumSupply = 0;
    for (let t = 0; t < 4; t++) {
      cumReq += req[t] * T1_EQ[t];
      cumSupply += supply[t] * T1_EQ[t];
      if (cumSupply < cumReq) return false;
    }
  }
  return true;
}

/**
 * Given a player's rune state (inventory, equipped runes, slot capacity),
 * return the subset of runewords from runes.json that they can both assemble
 * and fit into at least one row.
 *
 * Equipped runes are counted as "owned" — the player can freely un-equip to
 * reassemble a different runeword.
 *
 * @param {Object} state
 * @param {Object<string, number>} state.runeInventory - unequipped rune counts
 * @param {string[]} state.equippedRunes - currently-slotted runes (counted as owned)
 * @param {Object} state.runeSlots - { total, byRow }
 * @returns {Array<{runes: string[], bonuses: object, rowFit: number}>} sorted by bonus richness
 */
export function recommendSocketableRunewords({ runeInventory, equippedRunes, runeSlots } = {}) {
  const totalInventory = { ...(runeInventory || {}) };
  for (const rune of equippedRunes || []) {
    totalInventory[rune] = (totalInventory[rune] || 0) + 1;
  }

  const maxRowSlots = Math.max(0, ...((runeSlots?.byRow) || [0]));
  const recommendations = [];
  for (const rw of runeData.runeWords || []) {
    if (rw.runes.length > maxRowSlots) continue;
    if (!canAssembleRecipe(rw.runes, totalInventory)) continue;
    recommendations.push({
      runes: [...rw.runes],
      bonuses: { ...rw.bonuses },
      rowFit: rw.runes.length,
    });
  }
  // Sort by bonus count descending (more bonuses = richer runeword), then by length.
  recommendations.sort((a, b) => {
    const bonusDelta = Object.keys(b.bonuses).length - Object.keys(a.bonuses).length;
    return bonusDelta !== 0 ? bonusDelta : b.rowFit - a.rowFit;
  });
  return recommendations;
}
