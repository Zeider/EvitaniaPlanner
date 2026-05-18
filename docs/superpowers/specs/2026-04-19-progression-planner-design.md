# Progression Planner — Design Spec

**Date:** 2026-04-19
**Status:** Approved for implementation
**Spec #:** 1 of 3 (see "Future specs" below)

## Overview

A new "Progression" tab that takes a target gear set or piece (e.g. "Thorium") and shows:
- What materials it requires
- How many you already own
- How many hours of farming stand between you and the goal
- Where to farm each material

This spec delivers the target-driven progress view. Later specs layer on a DPS-per-hour efficiency ranking across all upgrade types (spec #2) and multi-alt assignment of the farming plan (spec #3). All three share the inventory and ETA engine introduced here.

## Goals

- Connect the existing Upgrade Advisor, Crafting calculator, and save-decoded profile data into a single goal-oriented view
- Provide a concrete answer to "how close am I to full Thorium, and where do I farm next?"
- Establish the inventory + ETA substrate that specs #2 and #3 will build on

## Non-Goals (Spec #1)

- Card synergy in upgrade ranking — spec #2
- Unified "all upgrade types sorted by DPS/hour" list — spec #2
- Multi-alt farming assignment — spec #3
- Automatic inventory sync from save file (still GUID-blocked — see `project_guid_mapping.md`)
- Mining/Woodcutting talent tree data completeness — consulted if already present, gaps flagged
- Event gear enhancement-level scaling fix — separate follow-up (see "Known Follow-Ups")

## Data Model

Three new profile fields, all persisted to localStorage via existing `saveProfile()`:

```js
// Shared material inventory. Seeded from Crafting tab's ic-invent-v1
// on first visit, then edited inline in the Progression tab.
profile.inventory = {
  "Thorium Bar": 67,
  "Thorium Ore": 140,
  "Yellow Substance": 0,
  // ...
}

// The user's chosen progression goal. null means no active target.
profile.progressionTarget = {
  type: "gearSet" | "gearPiece" | "autoNextTier",
  value: "Thorium" | "Thorium Sword" | null,
} | null

// Observed per-hour rates for mining/WC materials. Entered by the user
// from the in-game live readout. Keyed by material name.
profile.observedRates = {
  "Thorium Ore": 420,
  "Copper Ore": 850,
  "Normal Wood": 300,
  // ...
}
```

**Migration:** on first load of the Progression tab, if `profile.inventory` is empty and `localStorage['ic-invent-v1']` has data, copy it in. One-time; subsequent edits in either location don't sync automatically (Crafting tab continues to use its own LS key for its standalone calculator use case).

**Observed rate invalidation:** when `profile.miningLevel` or `profile.woodcuttingLevel` changes, the associated observed rates are not deleted but the UI flags them as "needs refresh" and prompts for re-entry on next tab visit.

## Core Engine (`src/state/progression-planner.js`)

A new pure module with three exports.

### `expandTargetToMaterials(target, profile) → MaterialList`

Given a `progressionTarget`, returns the flat base-material cost of reaching it.

- `type: "gearSet"` → sum the recipes of every craftable item whose name starts with the set tier (e.g. "Thorium" matches Thorium Helmet, Chestplate, Gloves, Boots, Sword/Bow/Staff per class, Axe, Pickaxe). Different tiers cover different slots; accessories like belts and amulets have their own progression tiers. The set expansion uses whatever `recipes.json` actually contains.
  - Weapon piece is filtered by `profile.class` (warrior → Sword/Longsword, rogue → Bow, mage → Staff)
- `type: "gearPiece"` → expand that single piece's recipe
- `type: "autoNextTier"` → delegate to the Upgrade Advisor's next-tier suggestion, resolve to a gear set

Recipe expansion recursively follows `recipes.json`. Intermediate crafts (Thorium Bar → Thorium Ore + Chadcoal) are expanded down to base materials only. Already-owned intermediates are NOT subtracted here — that happens in the ETA layer. Materials shared across multiple pieces are deduplicated in the aggregate output (see `aggregateMaterials` below), but retained separately on each piece so per-piece ETAs can be computed.

Output shape:
```js
[
  { material: "Thorium Ore", totalNeeded: 420, sourceRecipes: ["Thorium Bar"] },
  { material: "Perfect Fur", totalNeeded: 170, sourceRecipes: [] },  // direct ingredient
  // ...
]
```

### `estimateMaterialEta(materialName, remainingQty, profile) → EtaResult`

Dispatches by `drops.json` source type:

| Source type | Formula | Inputs |
|---|---|---|
| `vendor` | `ceil(qty / dailyLimit) × 24` | `source.dailyLimit` |
| `zone` (mob drop) | `(qty × source.rate) / profile.farmingRates.killsPerHour` | kph from save, `source.rate` = 1 drop per N kills |
| `activity: mining` or `woodcutting` | `qty / profile.observedRates[materialName]` when set; else rough placeholder | observed rate (if present), else fallback |
| `boss` | placeholder `qty × 2` | (TODO: real boss drop rates) |
| unknown / unmapped | `Infinity`, flagged `reason: "source missing"` | — |

Output:
```js
{
  etaHrs: number,
  source: "vendor" | "zone" | "mining" | "wc" | "boss" | "unknown",
  location: string,        // e.g. "Zone 2.3" or "Act 2 Vendor" or "Mining lvl 42"
  isRough: boolean,        // true when falling back to placeholder
  reason?: string,         // present only when etaHrs = Infinity
}
```

**Best location:** when `drops.json` lists multiple zones/sources for a material, pick the one with highest drops/hour for the current profile. Returned in `location`.

### `buildProgressionPlan(profile) → ProgressionPlan`

Orchestrates expansion + inventory subtraction + ETA:

1. Call `expandTargetToMaterials(profile.progressionTarget, profile)`
2. For each material, subtract `profile.inventory[name] || 0` to get `remaining`
3. For each material with `remaining > 0`, call `estimateMaterialEta`
4. Aggregate:

```js
{
  target: "Thorium",
  pieces: [
    {
      name: "Thorium Helmet",
      owned: boolean,            // profile.gear includes this item
      materials: [
        { name, needed, owned, remaining, eta }
      ],
      pieceEtaHrs: number,       // sum of the piece's remaining-material ETAs
    },
    // ...
  ],
  aggregateMaterials: [
    { name, totalNeeded, owned, remaining, etaHrs, location, isRough }
  ],
  totalEtaHrs: number,           // sum of aggregateMaterials[].etaHrs
  percentComplete: number,       // 0..1, weighted by material count
}
```

**Aggregation rule:** The shopping list (`aggregateMaterials`) deduplicates materials across pieces and sums their ETAs to get `totalEtaHrs` — single-character sequential farming model. A per-piece ETA (`pieceEtaHrs`) is also reported, but it treats that piece's materials in isolation, so summing per-piece ETAs would double-count shared materials; the authoritative total is `totalEtaHrs`.

## UI (`src/tabs/Progression.jsx`)

New top-level tab, added to the nav bar in `App.jsx` alongside Dashboard, Upgrade Advisor, Gear Planner, Skill Trees, DPS Simulator, Crafting, Rune Planner, Alt Advisor, Release Notes.

### Panels (top-to-bottom)

1. **Target picker** — dropdown listing gear sets + single-piece option + "Auto (next tier from Upgrade Advisor)". Persists selection to `profile.progressionTarget`.

2. **Summary bar** — one-line `X% complete · Y hrs remaining` with a progress bar.

3. **Pieces list** — one row per gear piece in the target. Shows per-piece ETA and an "owned" checkmark. Each row expandable to show that piece's specific materials.

4. **Shopping list (aggregated)** — flat table: material / owned / needed / remaining / ETA / location. Sorted by ETA descending (longest-blocking first). This is the "what to farm next" view.

5. **Inventory editor** — inline number inputs for each material in the shopping list, plus a one-time "Import from Crafting tab" button on first visit. Edits persist live to `profile.inventory`.

### Visual conventions

- Materials with `remaining == 0`: green checkmark, no ETA row
- Materials with unknown source: yellow warning icon + hover text "source missing in drops.json"
- ETAs with `isRough == true`: `(rough)` suffix, muted color
- ETA `= Infinity`: "—" with hover explaining why

### Observed-rate prompt

When the shopping list contains a mining/WC material with no `profile.observedRates[name]`, show a subtle inline prompt near that row: `"What's your [Material]/hr at [Mining/WC] lvl X? [____]"`. Save on blur.

## Integration with existing code

- Add `progressionPlanner` import to `src/tabs/Progression.jsx`
- New tab registered in `App.jsx`'s nav + tab-switcher
- `profile.inventory` migration runs once in the Progression tab on mount
- `upgrade-enumerator.js` reused for "autoNextTier" resolution
- `recipes.json` and `drops.json` consumed as-is, no schema changes
- No changes required in the Upgrade Advisor, Crafting, or Alt Advisor tabs for this spec

## Testing

**Unit tests** (`src/state/progression-planner.test.js`):
- `expandTargetToMaterials` — gear set, single piece, autoNextTier, nested recipe (Thorium Bar → Ore)
- `estimateMaterialEta` — one test per source type (vendor, zone, mining with observed rate, mining fallback, boss, unknown)
- `buildProgressionPlan` — integration: full Thorium set for a rogue profile with partial inventory and one observed rate

**UI smoke test** (Playwright, `tests/progression-tab.spec.js`):
- Navigate to Progression tab
- Select target "Thorium"
- Assert summary and shopping list render
- Edit one inventory value, assert ETA updates

## Known Follow-Ups (not blocking this spec)

- **Event gear enhancement-level scaling.** `stat-engine.js:259-263` applies event gear bonus stats as flat values. Community data: Summer Boots at +11 shows +46.5% scaling on bonus stats. Formula fits linear (`stat × (1 + 0.0423 × enhLevel)`) with one data point; a second data point would confirm vs exponential (`stat × 1.0355^enhLevel`). Apply the scaler to all event gear (Summer Boots/Belt, Halloween Signet, Carrot Ring, Valentine Amulet, Christmas/Anniversary/Steam Belt).

- **Mining/WC formula.** Until every user enters observed rates, ETAs for profession materials use a rough placeholder. Future work: derive a formula from profession level + power stats so it's accurate without user input.

- **Boss drop rates.** `qty × 2` is a coarse placeholder. Needs community data.

- **Multi-zone material aggregation.** Currently best-location picks one zone per material; doesn't account for the case where two materials drop in the same zone (one kill yields both).

## Future specs

- **Spec #2: Efficiency-ranked upgrade list.** Extend upgrade enumerator to score every upgrade type (gear crafting chains, hunter upgrades with card synergy, talents, ash, sacrifices) by DPS-gain ÷ estimated-farm-hours. Reuses this spec's ETA engine and shared inventory.

- **Spec #3: Alt farming assignment.** Given a progression plan, assign materials to alts based on their profession levels, zone access, and kph. Layered on top of Alt Advisor's existing capability matrix.
