import recipesData from '../data/recipes.json';
import dropsData from '../data/drops.json';

/** Build a flat recipe lookup: recipeName → recipe object (from any category). */
function buildRecipeLookup() {
  const flat = {};
  for (const category of Object.values(recipesData)) {
    for (const [name, recipe] of Object.entries(category)) {
      flat[name] = recipe;
    }
  }
  return flat;
}
const recipeLookup = buildRecipeLookup();

/** Recursively expand a recipe into base materials. Returns a map of
 *  { materialName: totalNeeded } aggregated across the recursion tree.
 *  Items with no recipe are treated as base materials (leaf). */
function expandRecipe(recipeName, qty, accum = {}) {
  const recipe = recipeLookup[recipeName];
  if (!recipe) {
    accum[recipeName] = (accum[recipeName] || 0) + qty;
    return accum;
  }
  const yields = recipe.yields || 1;
  const runs = Math.ceil(qty / yields);
  for (const ing of recipe.ingredients || []) {
    expandRecipe(ing.name, ing.qty * runs, accum);
  }
  return accum;
}

/** Resolve target to recipe names (internal helper shared by orchestrators). */
function resolveRecipeNames(target, profile) {
  if (target.type === 'gearPiece') {
    return recipeLookup[target.value] ? [target.value] : [];
  }
  if (target.type === 'gearSet') {
    // tier may be a bare name ("Thorium") or "<Name> <Gen>" ("Infinite I"). The
    // generation suffix (only Infinite uses one today) lets us pick a specific
    // gen out of recipes named "Infinite Helmet I", "Infinite Helmet II", etc.
    const [tierName, gen = ''] = target.value.split(' ');
    const genSuffix = gen ? ` ${gen}` : '';
    const classWeaponSuffix = {
      warrior: ['Sword', 'Longsword'],
      rogue: ['Bow'],
      mage: ['Staff'],
    };
    const allowedWeapons = new Set(
      (classWeaponSuffix[profile.class] || []).map(s => `${tierName} ${s}${genSuffix}`)
    );
    const weaponSuffixes = new Set(['Sword', 'Longsword', 'Bow', 'Staff']);
    // Only equippable slots belong in a gear set — armor, tools, and the
    // class-appropriate weapon. Excludes intermediate crafts like "<Tier> Bar".
    const armorAndToolSuffixes = new Set([
      'Helmet', 'Chestplate', 'Gloves', 'Boots',
      'Pickaxe', 'Axe',
    ]);
    return Object.keys(recipeLookup).filter(name => {
      if (!name.startsWith(tierName + ' ')) return false;
      if (gen && !name.endsWith(genSuffix)) return false;
      const suffix = name.slice(tierName.length + 1, gen ? -genSuffix.length : undefined);
      if (weaponSuffixes.has(suffix)) return allowedWeapons.has(name);
      return armorAndToolSuffixes.has(suffix);
    });
  }
  if (target.type === 'autoNextTier') {
    // Not yet implemented — when wired, should delegate to the Upgrade Advisor's
    // next-tier suggestion and resolve to a gearSet.
    return [];
  }
  return [];
}

/** Check if a recipe piece is already owned (in gear slots). */
function isPieceOwned(recipeName, profile) {
  if (!profile.gear) return false;
  for (const slotData of Object.values(profile.gear)) {
    if (slotData?.name === recipeName) return true;
  }
  return false;
}

/**
 * Expand a progression target into a flat base-material list.
 *
 * target shape: { type, value } where type is one of:
 *   - 'gearPiece'     — value is a recipe name (e.g. "Thorium Boots")
 *   - 'gearSet'       — value is a tier name (e.g. "Thorium"); expands all
 *                       craftable items whose name starts with that tier
 *   - 'autoNextTier'  — delegates to Upgrade Advisor's next-tier suggestion
 *                       (stubbed for this MVP — returns empty until wired)
 */
export function expandTargetToMaterials(target, profile) {
  if (!target) return [];

  const recipeNames = resolveRecipeNames(target, profile);
  const accum = {};
  for (const name of recipeNames) {
    expandRecipe(name, 1, accum);
  }

  return Object.entries(accum).map(([material, totalNeeded]) => ({
    material,
    totalNeeded,
  }));
}

const ROUGH_GATHERING_RATE = 100;   // fallback nodes/hr for both mining and woodcutting
const ROUGH_BOSS_HOURS_PER_DROP = 2; // fallback boss hours per drop

/** Estimate farming hours for a single material and remaining qty. */
export function estimateMaterialEta(materialName, remainingQty, profile) {
  if (remainingQty <= 0) return { etaHrs: 0, source: 'none', location: '', isRough: false };

  const source = dropsData.resources?.[materialName];
  if (!source) {
    return { etaHrs: Infinity, source: 'unknown', location: '', isRough: true,
             reason: `no entry in drops.json resources for "${materialName}"` };
  }

  if (source.vendor) {
    if (!source.dailyLimit || source.dailyLimit <= 0) {
      // Known vendor but no daily purchase cap data — don't pretend to know the rate.
      return {
        etaHrs: Infinity,
        source: 'vendor',
        location: source.note || 'Vendor',
        isRough: true,
        reason: `vendor dailyLimit unknown for "${materialName}"`,
      };
    }
    const days = Math.ceil(remainingQty / source.dailyLimit);
    return {
      etaHrs: days * 24,
      source: 'vendor',
      location: source.note || 'Vendor',
      isRough: false,
    };
  }

  if (source.quest) {
    // One-time quest rewards. If the recipe needs more than the quest gives
    // (default: 1 drop), the surplus is genuinely unobtainable from this source
    // — don't pretend a 6-minute ETA when the player would need to repeat a
    // non-repeatable quest.
    const cap = source.questCap || 1;
    if (remainingQty > cap) {
      return {
        etaHrs: Infinity,
        source: 'quest',
        location: `Quest reward (${source.quest})`,
        isRough: true,
        reason: `quest gives ${cap} drop(s); ${remainingQty} needed — surplus not achievable from this source`,
      };
    }
    return {
      etaHrs: 0.1,
      source: 'quest',
      location: `Quest reward (${source.quest})`,
      isRough: true,
    };
  }

  // NOTE: must precede the `zone && rate` branch below — boss entries also carry `rate`.
  if (source.boss) {
    return {
      etaHrs: remainingQty * ROUGH_BOSS_HOURS_PER_DROP,
      source: 'boss',
      location: String(source.boss).replace(/^boss:/, 'Boss: '),
      isRough: true,
    };
  }

  if (source.activity === 'mining' || source.activity === 'woodcutting') {
    const observedRate = profile.observedRates?.[materialName];
    const kind = source.activity; // 'mining' or 'woodcutting'
    if (observedRate > 0) {
      return {
        etaHrs: remainingQty / observedRate,
        source: kind,
        location: `${kind} (observed ${observedRate}/hr)`,
        isRough: false,
      };
    }
    return {
      etaHrs: remainingQty / ROUGH_GATHERING_RATE,
      source: kind,
      location: `${kind} (rough estimate — enter observed rate to refine)`,
      isRough: true,
    };
  }

  if (source.zone && source.rate) {
    const kph = profile.farmingRates?.killsPerHour || 0;
    if (kph <= 0) {
      return { etaHrs: Infinity, source: 'zone', location: `Zone ${source.zone}`,
               isRough: true, reason: 'kills/hour is 0 — import save to populate' };
    }
    const dropsPerHour = kph / source.rate;
    return {
      etaHrs: remainingQty / dropsPerHour,
      source: 'zone',
      location: `Zone ${source.zone}`,
      isRough: false,
    };
  }

  return { etaHrs: Infinity, source: 'unknown', location: '', isRough: true,
           reason: 'unrecognized source shape' };
}

/**
 * Orchestrate: expand target → subtract inventory → compute ETAs → aggregate.
 *
 * Returns:
 * - `pieces[].pieceEtaHrs`: the ETA **if this piece were farmed in isolation**.
 *   Two caveats:
 *   (1) Do NOT sum pieces[].pieceEtaHrs — materials shared across pieces would
 *       be double-counted.
 *   (2) Each individual value is optimistic when pieces share materials, because
 *       the full profile inventory is subtracted from every piece independently
 *       (i.e. owning 50 Thorium Ore makes each of 7 pieces report the same 50
 *       toward their needed count, as if the ore were multiplied).
 *   For any correctness-sensitive display, use `totalEtaHrs`.
 * - Owned pieces (already equipped per `profile.gear`) return `{ owned: true,
 *   materials: [], pieceEtaHrs: 0 }` and their materials are excluded from
 *   `aggregateMaterials`. The shopping list and totals show only remaining work.
 * - `totalEtaHrs`: authoritative total, computed from aggregate deduplicated materials.
 * - `percentComplete`: 0..1, quantity-weighted (owned/needed across all materials).
 *   Per-material owned is clamped to that material's totalNeeded before summing,
 *   so excess stockpile on one material does not offset shortages on another.
 */
export function buildProgressionPlan(profile) {
  const target = profile.progressionTarget;
  const empty = {
    target: target?.value ?? null,
    pieces: [],
    aggregateMaterials: [],
    totalEtaHrs: 0,
    percentComplete: 0,
  };
  if (!target) return empty;

  // Determine the recipe names being built (for per-piece breakdown)
  const recipeNames = resolveRecipeNames(target, profile);
  if (recipeNames.length === 0) return { ...empty, target: target.value };

  const inventory = profile.inventory || {};

  // Per-piece breakdown: expand each piece separately. A piece is "done" if it
  // is either already equipped (detected from profile.gear) or manually checked
  // off by the user (profile.completedPieces[name]). Done pieces short-circuit
  // to zero — they contribute nothing to the shopping list or total work.
  const completedPieces = profile.completedPieces || {};
  const pieces = recipeNames.map(name => {
    const equipped = isPieceOwned(name, profile);
    const manuallyCompleted = !!completedPieces[name];
    if (equipped || manuallyCompleted) {
      return {
        name,
        owned: true,
        completedManually: manuallyCompleted && !equipped,
        materials: [],
        pieceEtaHrs: 0,
      };
    }
    const materials = expandRecipe(name, 1, {});
    const pieceMats = Object.entries(materials).map(([matName, needed]) => {
      const owned = inventory[matName] || 0;
      const remaining = Math.max(0, needed - owned);
      const eta = estimateMaterialEta(matName, remaining, profile);
      return { name: matName, needed, owned, remaining, eta };
    });
    const pieceEtaHrs = pieceMats
      .filter(m => isFinite(m.eta.etaHrs))
      .reduce((s, m) => s + m.eta.etaHrs, 0);
    return { name, owned: false, completedManually: false, materials: pieceMats, pieceEtaHrs };
  });

  // Aggregate across pieces, deduplicating by material name. Owned pieces
  // contribute nothing (their `materials` is []), so the shopping list and totals
  // correctly reflect only remaining work.
  const aggregateMap = {};
  for (const piece of pieces) {
    for (const m of piece.materials) {
      if (!aggregateMap[m.name]) {
        aggregateMap[m.name] = { name: m.name, totalNeeded: 0 };
      }
      aggregateMap[m.name].totalNeeded += m.needed;
    }
  }
  const aggregateMaterials = Object.values(aggregateMap).map(m => {
    const owned = inventory[m.name] || 0;
    const remaining = Math.max(0, m.totalNeeded - owned);
    const eta = estimateMaterialEta(m.name, remaining, profile);
    return {
      name: m.name,
      totalNeeded: m.totalNeeded,
      owned,
      remaining,
      etaHrs: eta.etaHrs,
      source: eta.source,
      location: eta.location,
      isRough: eta.isRough,
      reason: eta.reason,
    };
  });

  const totalEtaHrs = aggregateMaterials
    .filter(m => isFinite(m.etaHrs))
    .reduce((s, m) => s + m.etaHrs, 0);

  // percentComplete: quantity-weighted fraction of owned vs. needed
  const totalQtyNeeded = aggregateMaterials.reduce((s, m) => s + m.totalNeeded, 0);
  const totalQtyOwned = aggregateMaterials.reduce(
    (s, m) => s + Math.min(m.owned, m.totalNeeded),
    0
  );
  const percentComplete = totalQtyNeeded > 0 ? totalQtyOwned / totalQtyNeeded : 0;

  return {
    target: target.value,
    pieces,
    aggregateMaterials,
    totalEtaHrs,
    percentComplete,
  };
}
