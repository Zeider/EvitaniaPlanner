# Progression Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Progression tab — a target-driven planner that expands a gear target (e.g. "Thorium") into base materials, subtracts the user's inventory, and shows how many hours of farming remain per material and in total.

**Architecture:** New pure module `src/state/progression-planner.js` exposes three functions (`expandTargetToMaterials`, `estimateMaterialEta`, `buildProgressionPlan`). They read from `profile.inventory`, `profile.observedRates`, `profile.progressionTarget`, and the existing `recipes.json`/`drops.json`/`gear.json`. A new top-level tab `src/tabs/Progression.jsx` consumes `buildProgressionPlan` and renders target picker, summary bar, pieces list, aggregated shopping list, and inline inventory editor.

**Tech Stack:** Preact + @preact/signals, Vitest for unit tests, Playwright for UI smoke test, existing localStorage persistence via `saveProfile()`.

**Spec reference:** `docs/superpowers/specs/2026-04-19-progression-planner-design.md`

---

## File Structure

**Create:**
- `src/state/progression-planner.js` — core engine (~250 lines)
- `src/state/progression-planner.test.js` — unit tests
- `src/tabs/Progression.jsx` — UI (~300 lines)
- `src/css/progression.css` — panel styling
- `tests/progression-tab.spec.js` — Playwright smoke test

**Modify:**
- `src/state/store.js` — extend `createDefaultProfile()` with three fields; add one-time migration from `ic-invent-v1`
- `src/components/TabNav.jsx` — add Progression tab button
- `src/app.jsx` — render `<Progression />` when `activeTab === 'progression'`
- `src/main.jsx` — import `./css/progression.css`

---

### Task 1: Add profile fields + Crafting-inventory migration

**Files:**
- Modify: `src/state/store.js`
- Test: add inline test in `src/state/store.test.js` (create if missing)

- [ ] **Step 1: Check if store.test.js exists**

Run: `ls src/state/store.test.js`

If it does not exist, create it with this scaffold:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createDefaultProfile, migrateCraftingInventory } from './store.js';

describe('createDefaultProfile', () => {
  it('returns a profile with empty inventory, null target, and empty observedRates', () => {
    const p = createDefaultProfile();
    expect(p.inventory).toEqual({});
    expect(p.progressionTarget).toBeNull();
    expect(p.observedRates).toEqual({});
  });
});

describe('migrateCraftingInventory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('copies ic-invent-v1 into the profile inventory when profile inventory is empty', () => {
    localStorage.setItem('ic-invent-v1', JSON.stringify({ 'Thorium Bar': 67 }));
    const profile = { inventory: {} };
    const migrated = migrateCraftingInventory(profile);
    expect(migrated.inventory).toEqual({ 'Thorium Bar': 67 });
  });

  it('leaves profile inventory untouched when it already has entries', () => {
    localStorage.setItem('ic-invent-v1', JSON.stringify({ 'Thorium Bar': 999 }));
    const profile = { inventory: { 'Thorium Bar': 100 } };
    const migrated = migrateCraftingInventory(profile);
    expect(migrated.inventory).toEqual({ 'Thorium Bar': 100 });
  });

  it('returns the same object reference when nothing to migrate', () => {
    const profile = { inventory: { a: 1 } };
    expect(migrateCraftingInventory(profile)).toBe(profile);
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `npm test -- store.test.js`
Expected: FAIL — `inventory is undefined` and `migrateCraftingInventory is not exported`.

- [ ] **Step 3: Extend `createDefaultProfile` in `src/state/store.js`**

Find `createDefaultProfile` (around line 17) and add the three fields:

```js
export function createDefaultProfile() {
  return {
    name: 'New Character', class: 'rogue', level: 1,
    miningLevel: 1, woodcuttingLevel: 1,
    gear: {}, talents: {}, professionSkills: {},
    hunterUpgrades: {}, ashUpgrades: {}, sacrificeUpgrades: {},
    cards: {}, bonfireHeat: 0, equippedRunes: [],
    activePet: null, petLevel: 1, equippedCurios: [],
    maxUnlockedZone: '',
    farmingRates: { killsPerHour: 0, xpPerHour: 0, goldPerHour: 0 },
    currentZone: '1.0',
    inventory: {},
    progressionTarget: null,
    observedRates: {},
  };
}
```

- [ ] **Step 4: Add `migrateCraftingInventory` export to `src/state/store.js`**

Append below `createDefaultProfile`:

```js
/** One-time migration: if profile.inventory is empty and ic-invent-v1
 *  has data, copy it over. Returns the (possibly mutated) profile.
 *  Safe to call multiple times — no-op once inventory is populated. */
export function migrateCraftingInventory(profile) {
  if (!profile.inventory) profile.inventory = {};
  if (Object.keys(profile.inventory).length > 0) return profile;
  try {
    const raw = localStorage.getItem('ic-invent-v1');
    if (!raw) return profile;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      profile.inventory = { ...parsed };
    }
  } catch (_) { /* noop */ }
  return profile;
}
```

- [ ] **Step 5: Run tests, confirm they pass**

Run: `npm test -- store.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/state/store.js src/state/store.test.js
git commit -m "feat: add inventory/progressionTarget/observedRates to profile + crafting migration"
```

---

### Task 2: `expandTargetToMaterials` — gearPiece case + recursive recipe expansion

**Files:**
- Create: `src/state/progression-planner.js`
- Create: `src/state/progression-planner.test.js`

- [ ] **Step 1: Write failing tests for `expandTargetToMaterials` (gearPiece only)**

Create `src/state/progression-planner.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { expandTargetToMaterials } from './progression-planner.js';

describe('expandTargetToMaterials — gearPiece', () => {
  const rogueProfile = { class: 'rogue' };

  it('expands a single piece to its base materials', () => {
    const target = { type: 'gearPiece', value: 'Thorium Boots' };
    const result = expandTargetToMaterials(target, rogueProfile);
    // Thorium Boots recipe: 10 Crystalized Yellow Substance, 25 Perfect Fur,
    // 2 Norse Essence, 47 Thorium Bar. Thorium Bar expands to 42 Thorium Ore +
    // 30 Chadcoal; so 47 bars = 1974 ore + 1410 Chadcoal. Chadcoal itself
    // expands to 10 Ironwood Log per bar; so 1410 Chadcoal = 14100 Ironwood Log.
    // Perfect Fur expands to Furry Fur (yields 5 per run); 25 Perfect Fur ⇒
    // ceil(25/5) = 5 runs × 30 Furry Fur = 150 Furry Fur.
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    expect(byName['Thorium Ore']).toBe(1974);
    expect(byName['Ironwood Log']).toBe(14100);
    expect(byName['Furry Fur']).toBe(150);
    expect(byName['Norse Essence']).toBe(2);
    // Crystalized Yellow Substance is a base material (no recipe) so it stays as 10.
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
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `npm test -- progression-planner.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create `src/state/progression-planner.js` with `expandTargetToMaterials`**

```js
import recipesData from '../data/recipes.json';
import gearData from '../data/gear.json';

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

  let recipeNames = [];
  if (target.type === 'gearPiece') {
    if (recipeLookup[target.value]) recipeNames = [target.value];
  } else if (target.type === 'gearSet') {
    // Placeholder — implemented in Task 3
    return [];
  } else if (target.type === 'autoNextTier') {
    // Placeholder — implemented in Task 3b (follow-up) or a later pass
    return [];
  }

  const accum = {};
  for (const name of recipeNames) {
    expandRecipe(name, 1, accum);
  }

  return Object.entries(accum).map(([material, totalNeeded]) => ({
    material,
    totalNeeded,
  }));
}
```

- [ ] **Step 4: Run tests, confirm they pass**

Run: `npm test -- progression-planner.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/progression-planner.js src/state/progression-planner.test.js
git commit -m "feat(progression): add expandTargetToMaterials for single-piece targets"
```

---

### Task 3: `expandTargetToMaterials` — gearSet case

**Files:**
- Modify: `src/state/progression-planner.js`
- Modify: `src/state/progression-planner.test.js`

- [ ] **Step 1: Add failing tests for gearSet expansion**

Append to `src/state/progression-planner.test.js`:

```js
describe('expandTargetToMaterials — gearSet', () => {
  it('expands a full Thorium set for a rogue (weapon piece = Thorium Bow)', () => {
    const target = { type: 'gearSet', value: 'Thorium' };
    const result = expandTargetToMaterials(target, { class: 'rogue' });
    expect(result.length).toBeGreaterThan(0);
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    // Armor materials (Perfect Fur expands recursively to Furry Fur — check either)
    expect(byName['Perfect Fur'] ?? byName['Furry Fur']).toBeGreaterThan(0);
    // Thorium Bow uses Furstring, which expands recursively to Yellow Feather
    expect(byName['Yellow Feather']).toBeGreaterThan(0);
    // Should NOT include sword/longsword-specific materials (Artisan's Frame is itself
    // a craftable that expands away; its presence would signal sword recipe was included)
    expect(byName['Artisan\'s Frame']).toBeUndefined();
  });

  it('filters weapon by class: warrior excludes bow/staff-only materials', () => {
    const target = { type: 'gearSet', value: 'Thorium' };
    const result = expandTargetToMaterials(target, { class: 'warrior' });
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    // No bow-specific expansion (Yellow Feather from Furstring)
    expect(byName['Yellow Feather']).toBeUndefined();
    // No staff-specific expansion (Carrot from Cryolite)
    expect(byName['Carrot']).toBeUndefined();
  });

  it('filters weapon by class: mage picks Thorium Staff (Cryolite → Carrot)', () => {
    const target = { type: 'gearSet', value: 'Thorium' };
    const result = expandTargetToMaterials(target, { class: 'mage' });
    const byName = Object.fromEntries(result.map(r => [r.material, r.totalNeeded]));
    expect(byName['Carrot']).toBeGreaterThan(0);
    // No bow-specific expansion
    expect(byName['Yellow Feather']).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests, confirm the new ones fail**

Run: `npm test -- progression-planner.test.js`
Expected: 3 FAIL (result is empty array).

- [ ] **Step 3: Implement gearSet expansion**

Replace the gearSet branch in `expandTargetToMaterials` with:

```js
  } else if (target.type === 'gearSet') {
    const tier = target.value;
    const classWeaponSuffix = {
      warrior: ['Sword', 'Longsword'],
      rogue: ['Bow'],
      mage: ['Staff'],
    };
    const allowedWeapons = new Set(
      (classWeaponSuffix[profile.class] || []).map(s => `${tier} ${s}`)
    );
    const weaponSuffixes = new Set(['Sword', 'Longsword', 'Bow', 'Staff']);
    recipeNames = Object.keys(recipeLookup).filter(name => {
      if (!name.startsWith(tier + ' ')) return false;
      const suffix = name.slice(tier.length + 1);
      if (weaponSuffixes.has(suffix)) {
        return allowedWeapons.has(name);
      }
      return true;
    });
  }
```

- [ ] **Step 4: Run tests, confirm all pass**

Run: `npm test -- progression-planner.test.js`
Expected: PASS (6 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/state/progression-planner.js src/state/progression-planner.test.js
git commit -m "feat(progression): gearSet expansion with class-filtered weapon"
```

---

### Task 4: `estimateMaterialEta` — all source types

**Files:**
- Modify: `src/state/progression-planner.js`
- Modify: `src/state/progression-planner.test.js`

- [ ] **Step 1: Add failing tests for estimateMaterialEta**

Append to `src/state/progression-planner.test.js`:

```js
import { estimateMaterialEta } from './progression-planner.js';

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
});
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `npm test -- progression-planner.test.js`
Expected: 6 FAIL — `estimateMaterialEta is not exported`.

- [ ] **Step 3: Implement `estimateMaterialEta` in progression-planner.js**

Add at top of file next to recipes import:

```js
import dropsData from '../data/drops.json';
```

And append below `expandTargetToMaterials`:

```js
const ROUGH_GATHERING_RATE = 100;       // fallback nodes/hr
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
    const dailyLimit = source.dailyLimit || 1;
    const days = Math.ceil(remainingQty / dailyLimit);
    return {
      etaHrs: days * 24,
      source: 'vendor',
      location: source.note || 'Vendor',
      isRough: false,
    };
  }

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
    if (observedRate && observedRate > 0) {
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
```

- [ ] **Step 4: Run tests, confirm they pass**

Run: `npm test -- progression-planner.test.js`
Expected: PASS (12 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/state/progression-planner.js src/state/progression-planner.test.js
git commit -m "feat(progression): estimateMaterialEta across vendor/zone/mining/wc/boss"
```

---

### Task 5: `buildProgressionPlan` aggregator

**Files:**
- Modify: `src/state/progression-planner.js`
- Modify: `src/state/progression-planner.test.js`

- [ ] **Step 1: Add failing tests for buildProgressionPlan**

Append to `src/state/progression-planner.test.js`:

```js
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

  it('reports percentComplete between 0 and 1', () => {
    const plan = buildProgressionPlan(profile);
    expect(plan.percentComplete).toBeGreaterThanOrEqual(0);
    expect(plan.percentComplete).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `npm test -- progression-planner.test.js`
Expected: 5 FAIL.

- [ ] **Step 3: Implement `buildProgressionPlan`**

Append to `src/state/progression-planner.js`:

```js
/** Orchestrate: expand target → subtract inventory → compute ETAs → aggregate. */
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

  // Per-piece breakdown: expand each piece separately
  const pieces = recipeNames.map(name => {
    const materials = expandRecipe(name, 1, {});
    const ownedThisPiece = checkPieceOwned(name, profile);
    const pieceMats = Object.entries(materials).map(([matName, needed]) => {
      const owned = inventory[matName] || 0;
      const remaining = Math.max(0, needed - owned);
      const eta = estimateMaterialEta(matName, remaining, profile);
      return { name: matName, needed, owned, remaining, eta };
    });
    const pieceEtaHrs = pieceMats
      .filter(m => isFinite(m.eta.etaHrs))
      .reduce((s, m) => s + m.eta.etaHrs, 0);
    return { name, owned: ownedThisPiece, materials: pieceMats, pieceEtaHrs };
  });

  // Aggregate across pieces, deduplicating by material name
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

  // percentComplete: fraction of aggregate materials where remaining === 0
  const satisfied = aggregateMaterials.filter(m => m.remaining === 0).length;
  const percentComplete = aggregateMaterials.length > 0
    ? satisfied / aggregateMaterials.length
    : 0;

  return {
    target: target.value,
    pieces,
    aggregateMaterials,
    totalEtaHrs,
    percentComplete,
  };
}

function resolveRecipeNames(target, profile) {
  if (target.type === 'gearPiece') {
    return recipeLookup[target.value] ? [target.value] : [];
  }
  if (target.type === 'gearSet') {
    const tier = target.value;
    const classWeaponSuffix = {
      warrior: ['Sword', 'Longsword'],
      rogue: ['Bow'],
      mage: ['Staff'],
    };
    const allowedWeapons = new Set(
      (classWeaponSuffix[profile.class] || []).map(s => `${tier} ${s}`)
    );
    const weaponSuffixes = new Set(['Sword', 'Longsword', 'Bow', 'Staff']);
    return Object.keys(recipeLookup).filter(name => {
      if (!name.startsWith(tier + ' ')) return false;
      const suffix = name.slice(tier.length + 1);
      if (weaponSuffixes.has(suffix)) return allowedWeapons.has(name);
      return true;
    });
  }
  return [];
}

function checkPieceOwned(recipeName, profile) {
  if (!profile.gear) return false;
  for (const slotData of Object.values(profile.gear)) {
    if (slotData?.name === recipeName) return true;
  }
  return false;
}
```

Refactor `expandTargetToMaterials` to use `resolveRecipeNames` (removes duplication):

```js
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
```

- [ ] **Step 4: Run all progression tests, confirm they pass**

Run: `npm test -- progression-planner.test.js`
Expected: PASS (17 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/state/progression-planner.js src/state/progression-planner.test.js
git commit -m "feat(progression): buildProgressionPlan orchestrator + per-piece breakdown"
```

---

### Task 6: Progression.jsx — target picker + summary panel

**Files:**
- Create: `src/tabs/Progression.jsx`
- Create: `src/css/progression.css`

- [ ] **Step 1: Create `src/tabs/Progression.jsx`**

```jsx
import { useMemo, useCallback } from 'preact/hooks';
import { activeProfile, activeProfileKey, saveProfile } from '../state/store.js';
import { buildProgressionPlan } from '../state/progression-planner.js';
import recipesData from '../data/recipes.json';

/** Extract gear set tier names from recipes (e.g. "Copper", "Bronze", ...). */
function getAvailableSets() {
  const crafting = recipesData.crafting || {};
  const tiers = new Set();
  for (const name of Object.keys(crafting)) {
    const match = name.match(/^(\w+)\s+(Helmet|Chestplate|Boots|Gloves)$/);
    if (match) tiers.add(match[1]);
  }
  return Array.from(tiers);
}

/** Extract all gear piece recipe names (for single-piece targets). */
function getAvailablePieces() {
  const names = [];
  for (const category of Object.values(recipesData)) {
    for (const name of Object.keys(category)) {
      names.push(name);
    }
  }
  return names.sort();
}

function fmtHours(h) {
  if (!isFinite(h)) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)} hrs`;
  return `${(h / 24).toFixed(1)} days`;
}

export function Progression() {
  const profile = activeProfile.value;
  const plan = useMemo(() => buildProgressionPlan(profile), [profile]);

  const setTarget = useCallback((type, value) => {
    const next = type === 'none' ? null : { type, value };
    saveProfile(activeProfileKey.value, { ...profile, progressionTarget: next });
  }, [profile]);

  const sets = useMemo(() => getAvailableSets(), []);
  const pieces = useMemo(() => getAvailablePieces(), []);
  const target = profile.progressionTarget;

  return (
    <div class="progression">
      <section class="progression__panel">
        <h2 class="progression__panel-title">Target</h2>
        <div class="progression__picker">
          <label>
            Set:
            <select
              value={target?.type === 'gearSet' ? target.value : ''}
              onChange={(e) => e.target.value ? setTarget('gearSet', e.target.value) : setTarget('none')}
            >
              <option value="">— none —</option>
              {sets.map(s => <option key={s} value={s}>{s} Set</option>)}
            </select>
          </label>
          <label>
            Piece:
            <select
              value={target?.type === 'gearPiece' ? target.value : ''}
              onChange={(e) => e.target.value ? setTarget('gearPiece', e.target.value) : setTarget('none')}
            >
              <option value="">— none —</option>
              {pieces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section class="progression__panel">
        <h2 class="progression__panel-title">Summary</h2>
        {!target ? (
          <p class="progression__empty">Pick a target above to see progress.</p>
        ) : (
          <div class="progression__summary">
            <div class="progression__summary-line">
              <strong>{Math.round(plan.percentComplete * 100)}% complete</strong>
              {' · '}
              <span>{fmtHours(plan.totalEtaHrs)} remaining</span>
            </div>
            <div class="progression__progress-bar">
              <div class="progression__progress-fill" style={{ width: `${plan.percentComplete * 100}%` }} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/css/progression.css`**

```css
.progression { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.progression__panel {
  background: var(--card-bg, rgba(255,255,255,0.05));
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  border-radius: 8px;
  padding: 14px 16px;
}
.progression__panel-title { margin: 0 0 10px; font-size: 0.95rem; color: var(--muted, #aab); text-transform: uppercase; letter-spacing: 0.05em; }
.progression__picker { display: flex; gap: 16px; flex-wrap: wrap; }
.progression__picker label { display: flex; gap: 6px; align-items: center; font-size: 0.9rem; }
.progression__picker select { background: rgba(0,0,0,0.3); color: inherit; border: 1px solid var(--border, rgba(255,255,255,0.15)); border-radius: 4px; padding: 4px 8px; }
.progression__empty { color: var(--muted, #aab); margin: 0; }
.progression__summary-line { font-size: 1.05rem; margin-bottom: 8px; }
.progression__progress-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
.progression__progress-fill { height: 100%; background: var(--accent, #8af); transition: width 0.2s; }
.progression__shopping-list { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.progression__shopping-list th, .progression__shopping-list td { padding: 6px 8px; text-align: left; border-bottom: 1px solid var(--border, rgba(255,255,255,0.06)); }
.progression__shopping-list th { color: var(--muted, #aab); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
.progression__mat-complete { color: var(--success, #8f8); }
.progression__mat-rough { color: var(--warn, #fb8); }
.progression__mat-unknown { color: var(--danger, #f88); }
.progression__piece { padding: 8px 0; border-bottom: 1px solid var(--border, rgba(255,255,255,0.06)); }
.progression__piece-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.progression__piece-owned { color: var(--success, #8f8); }
.progression__piece-mats { margin-top: 8px; padding-left: 16px; font-size: 0.85rem; color: var(--muted, #aab); }
.progression__inv-input { width: 60px; background: rgba(0,0,0,0.3); color: inherit; border: 1px solid var(--border, rgba(255,255,255,0.15)); border-radius: 3px; padding: 2px 6px; font-size: 0.9rem; }
.progression__observed-prompt { font-size: 0.8rem; color: var(--muted, #aab); margin-left: 8px; }
```

- [ ] **Step 3: Wire CSS import in `src/main.jsx`**

Add after line 16 (`import './css/release-notes.css';`):

```js
import './css/progression.css';
```

- [ ] **Step 4: Register the tab**

In `src/components/TabNav.jsx`, add after the alt-advisor entry:

```js
  { id: 'progression', label: 'Progression' },
```

In `src/app.jsx`, add the import:

```js
import { Progression } from './tabs/Progression.jsx';
```

And add the render line above the fallback placeholder:

```jsx
{activeTab.value === 'progression' && <Progression />}
```

And include `'progression'` in the list of activeTab.value !== ... expressions in the fallback.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`
Open `http://localhost:5173/EvitaniaPlanner/` (or whichever port vite picks).
Click "Progression" tab.
Expected: target picker renders with "none" selected, summary panel shows "Pick a target above to see progress."
Select "Thorium Set" from the Set dropdown.
Expected: summary shows a percent and hours remaining.

- [ ] **Step 6: Commit**

```bash
git add src/tabs/Progression.jsx src/css/progression.css src/main.jsx src/components/TabNav.jsx src/app.jsx
git commit -m "feat(progression): Progression tab with target picker and summary"
```

---

### Task 7: Progression.jsx — shopping list panel

**Files:**
- Modify: `src/tabs/Progression.jsx`

- [ ] **Step 1: Add shopping list section after the summary panel**

In `src/tabs/Progression.jsx`, within the returned JSX, append after the Summary `<section>`:

```jsx
      <section class="progression__panel">
        <h2 class="progression__panel-title">Shopping List</h2>
        {!target ? (
          <p class="progression__empty">—</p>
        ) : plan.aggregateMaterials.length === 0 ? (
          <p class="progression__empty">No materials required.</p>
        ) : (
          <table class="progression__shopping-list">
            <thead>
              <tr>
                <th>Material</th>
                <th>Owned / Needed</th>
                <th>ETA</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {[...plan.aggregateMaterials]
                .sort((a, b) => (b.etaHrs || 0) - (a.etaHrs || 0))
                .map(m => {
                  let className = '';
                  if (m.remaining === 0) className = 'progression__mat-complete';
                  else if (m.source === 'unknown') className = 'progression__mat-unknown';
                  else if (m.isRough) className = 'progression__mat-rough';
                  return (
                    <tr key={m.name} class={className}>
                      <td>{m.name}</td>
                      <td>{m.owned} / {m.totalNeeded}</td>
                      <td>{m.remaining === 0 ? '✓' : fmtHours(m.etaHrs)}{m.isRough && m.remaining > 0 ? ' (rough)' : ''}</td>
                      <td title={m.reason || ''}>{m.location || (m.reason ? '⚠ ' + m.reason : '—')}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </section>
```

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`
On the Progression tab with a target selected, verify the shopping list renders and sorts longest-ETA-first. Confirm mats with `remaining == 0` render in green with `✓`, and mats with no source render with a warning.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/Progression.jsx
git commit -m "feat(progression): shopping list panel sorted by ETA"
```

---

### Task 8: Progression.jsx — pieces list + inventory editor

**Files:**
- Modify: `src/tabs/Progression.jsx`

- [ ] **Step 1: Add `useState` import + expanded-pieces state**

At the top of `src/tabs/Progression.jsx`, replace the hooks import line with:

```js
import { useMemo, useCallback, useState, useEffect } from 'preact/hooks';
```

Near the other hooks inside the component:

```js
  const [expandedPieces, setExpandedPieces] = useState({});
  const toggleExpand = (name) => setExpandedPieces(p => ({ ...p, [name]: !p[name] }));

  const updateInventory = useCallback((matName, qty) => {
    const inv = { ...profile.inventory, [matName]: Math.max(0, qty | 0) };
    saveProfile(activeProfileKey.value, { ...profile, inventory: inv });
  }, [profile]);
```

- [ ] **Step 2: Add pieces list section (above Shopping List section)**

```jsx
      <section class="progression__panel">
        <h2 class="progression__panel-title">Pieces</h2>
        {!target ? (
          <p class="progression__empty">—</p>
        ) : plan.pieces.length === 0 ? (
          <p class="progression__empty">No pieces in this target.</p>
        ) : (
          plan.pieces.map(piece => (
            <div key={piece.name} class="progression__piece">
              <div class="progression__piece-header" onClick={() => toggleExpand(piece.name)}>
                <span>
                  {piece.owned ? <span class="progression__piece-owned">✓ </span> : '☐ '}
                  {piece.name}
                </span>
                <span>{piece.owned ? 'owned' : fmtHours(piece.pieceEtaHrs)}</span>
              </div>
              {expandedPieces[piece.name] && (
                <div class="progression__piece-mats">
                  {piece.materials.map(m => (
                    <div key={m.name}>
                      {m.name}: {m.owned}/{m.needed} {m.remaining > 0 && `(need ${m.remaining})`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>
```

- [ ] **Step 3: Add inventory editor section (below Shopping List)**

```jsx
      <section class="progression__panel">
        <h2 class="progression__panel-title">Inventory</h2>
        {!target ? (
          <p class="progression__empty">Pick a target to see required materials here.</p>
        ) : (
          <table class="progression__shopping-list">
            <thead>
              <tr><th>Material</th><th>Owned</th></tr>
            </thead>
            <tbody>
              {plan.aggregateMaterials.map(m => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td>
                    <input
                      type="number"
                      class="progression__inv-input"
                      min="0"
                      value={m.owned}
                      onChange={(e) => updateInventory(m.name, Number(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
```

- [ ] **Step 4: Add one-time Crafting-inventory migration effect**

At the top of the file, add `migrateCraftingInventory` to the store import:

```js
import { activeProfile, activeProfileKey, saveProfile, migrateCraftingInventory } from '../state/store.js';
```

Near the other hooks inside the component, add:

```js
  useEffect(() => {
    if (Object.keys(profile.inventory || {}).length > 0) return;
    const migrated = migrateCraftingInventory({ ...profile, inventory: {} });
    if (Object.keys(migrated.inventory).length > 0) {
      saveProfile(activeProfileKey.value, { ...profile, inventory: migrated.inventory });
    }
  }, []);
```

Rationale: `migrateCraftingInventory` already encapsulates the localStorage read + JSON parse + empty-guard logic (see `store.js`); reusing it keeps the migration logic in one place. We spread `profile` with a fresh `inventory: {}` so the helper's "already populated" guard doesn't short-circuit if the outer `useEffect` guard was already bypassed.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`
On the Progression tab with Thorium Set target, verify:
- Pieces list renders each gear piece with ETA
- Clicking a piece expands to show its materials
- Inventory editor lets you type a quantity and the shopping list updates
- First-visit migration: if you had entries in the Crafting tab, they appear here

- [ ] **Step 6: Commit**

```bash
git add src/tabs/Progression.jsx
git commit -m "feat(progression): pieces list + inventory editor + crafting migration"
```

---

### Task 9: Progression.jsx — observed-rate prompt + Playwright smoke test

**Files:**
- Modify: `src/tabs/Progression.jsx`
- Create: `tests/progression-tab.spec.js`

- [ ] **Step 1: Add updateObservedRate callback near updateInventory**

```js
  const updateObservedRate = useCallback((matName, rate) => {
    const rates = { ...profile.observedRates, [matName]: Math.max(0, Number(rate) || 0) };
    saveProfile(activeProfileKey.value, { ...profile, observedRates: rates });
  }, [profile]);
```

- [ ] **Step 2: Add observed-rate prompt column in the shopping list**

In the shopping list `<tr>` inside the `.map()`, extend with a conditional input for mining/WC materials that lack an observed rate:

```jsx
                    <tr key={m.name} class={className}>
                      <td>{m.name}</td>
                      <td>{m.owned} / {m.totalNeeded}</td>
                      <td>
                        {m.remaining === 0 ? '✓' : fmtHours(m.etaHrs)}
                        {m.isRough && m.remaining > 0 ? ' (rough)' : ''}
                      </td>
                      <td title={m.reason || ''}>
                        {m.location || (m.reason ? '⚠ ' + m.reason : '—')}
                        {(m.source === 'mining' || m.source === 'woodcutting') &&
                          !(profile.observedRates?.[m.name] > 0) && (
                          <span class="progression__observed-prompt">
                            [rate/hr:
                            <input
                              type="number"
                              class="progression__inv-input"
                              min="0"
                              onBlur={(e) => e.target.value && updateObservedRate(m.name, e.target.value)}
                            />
                            ]
                          </span>
                        )}
                      </td>
                    </tr>
```

- [ ] **Step 3: Create Playwright smoke test**

Create `tests/progression-tab.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('progression tab: target selection renders shopping list', async ({ page }) => {
  await page.goto('http://localhost:5173/EvitaniaPlanner/');
  await page.getByRole('button', { name: 'Progression' }).click();

  // Pick Thorium set
  const setSelect = page.getByRole('combobox').first();
  await setSelect.selectOption('Thorium');

  // Summary should appear
  await expect(page.getByText(/% complete/)).toBeVisible();

  // Shopping list should have at least one row
  const shoppingRows = page.locator('.progression__shopping-list tbody tr');
  await expect(shoppingRows.first()).toBeVisible();

  // Editing an inventory value should persist (reload, check still there)
  const firstInvInput = page.locator('.progression__inv-input').first();
  await firstInvInput.fill('42');
  await firstInvInput.blur();
  await page.reload();
  await page.getByRole('button', { name: 'Progression' }).click();
  await expect(page.locator('.progression__inv-input').first()).toHaveValue('42');
});
```

- [ ] **Step 4: Run Playwright test**

Run: `npm run dev` in one terminal, then in another: `npm run test:e2e -- progression-tab.spec.js`
Expected: PASS.

If the port differs (Playwright hits 5173 by default but vite may pick another), update the URL or set `baseURL` in `playwright.config.js`.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test:all`
Expected: all unit tests PASS, all Playwright tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/tabs/Progression.jsx tests/progression-tab.spec.js
git commit -m "feat(progression): observed-rate prompt + Playwright smoke test"
```

---

## Self-Review Checklist (internal to this plan)

**Spec coverage:**
- ✅ New Progression tab → Task 6
- ✅ `profile.inventory`, `profile.progressionTarget`, `profile.observedRates` → Task 1
- ✅ Crafting inventory migration → Tasks 1 + 8
- ✅ `expandTargetToMaterials` (gearPiece + gearSet) → Tasks 2, 3
- ✅ `estimateMaterialEta` (all source types) → Task 4
- ✅ `buildProgressionPlan` aggregator → Task 5
- ✅ Target picker, summary, pieces, shopping list, inventory editor → Tasks 6, 7, 8
- ✅ Observed-rate prompt → Task 9
- ✅ Unit tests + Playwright smoke test → all tasks + Task 9
- ⚠️ `autoNextTier` target type: defined in spec but left as stub; noted in Task 2 as "follow-up" since it depends on Upgrade Advisor integration; not blocking MVP
- ⚠️ Event gear enhancement scaling: called out as a known follow-up in spec, not in this plan (separate future task)

**Type consistency:**
- `{ material, totalNeeded }` from `expandTargetToMaterials` vs `{ name, totalNeeded, owned, remaining, ... }` in `aggregateMaterials` — deliberate: expand returns raw expansion; plan enriches. Documented in code comments.
- `estimateMaterialEta` always returns `{ etaHrs, source, location, isRough, reason? }` — consistent across all branches.

**No placeholders in tasks:** verified. Every step has concrete code or commands.
