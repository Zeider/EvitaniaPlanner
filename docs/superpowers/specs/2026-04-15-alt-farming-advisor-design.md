# Alt Farming Advisor — Design Spec

## Overview

A new "Alt Advisor" tab that tells players where to park their 3 offline characters for maximum account-wide progress. Combines bottleneck detection (what resources give the biggest power gains) with per-alt capability analysis (which alts can farm where efficiently).

## Game Mechanics Context

- 4 character slots: 1 active, 3 offline farming
- Alts can only farm zones they've personally unlocked and can survive
- Alts inherit hand-me-down gear from the main
- Offline farming rates are computed by the game per the alt's stats and zone
- Resources needed shift dynamically: sacrifice materials, hunter materials, cards, ores/logs, zone progression

## Architecture

### New Files

```
src/data/drops.json              — Full drop tables and resource-to-zone mapping
src/state/bottleneck-detector.js — Identifies priority resources from upgrade paths
src/state/alt-optimizer.js       — Eligibility matrix and assignment algorithm
src/tabs/AltAdvisor.jsx          — Assignment board UI
```

### Refactoring

Extract `enumerateAllUpgrades` and `rankAllUpgrades` from `UpgradeAdvisor.jsx` into a shared module `src/state/upgrade-enumerator.js` so both the Upgrade Advisor tab and the Alt Advisor can use the same upgrade ranking logic.

### Data Flow

```
All profiles (from save import)
        |
        v
+--------------------+    +-------------------+
| Upgrade Enumerator |    | Stat Engine       |
| (shared module)    |    | (per-alt stats)   |
+--------+-----------+    +--------+----------+
         |                         |
         v                         v
+--------------------+    +-------------------+
| Bottleneck Detector|    | Alt Eligibility   |
| - resource needs   |    | - zone capability |
| - throughput tips   |    |   matrix per alt  |
+--------+-----------+    +--------+----------+
         +--------+-------+--------+
                  |
                  v
         +------------------+
         | Assignment Board |
         | (AltAdvisor UI)  |
         +------------------+
```

## Component 1: Drop Tables (`drops.json`)

### Zone Drops

Every zone mapped to its mob and drop table:

```json
{
  "zones": {
    "1.0": {
      "mob": "Boar",
      "drops": [
        { "item": "Boar Meat", "rate": 4, "type": "material" },
        { "item": "Boar Card", "rate": 10000, "type": "card" }
      ]
    },
    "2.2": {
      "mob": "Helmet",
      "drops": [
        { "item": "Helmet", "rate": 4, "type": "material" },
        { "item": "Furry Fur", "rate": 200, "type": "material" },
        { "item": "RUNE: NIL", "rate": 300000, "type": "rune" },
        { "item": "Norse Essence", "rate": 10000, "type": "material" },
        { "item": "Helmet Card", "rate": 25000, "type": "card" }
      ]
    }
  }
}
```

Drop `rate` is the denominator — "1 in 4" = rate 4. Items per hour = kills per hour / rate.

### Resource Sources

Reverse index for quick lookup — given a material, find where it drops:

```json
{
  "resources": {
    "Helmet": { "zone": "2.2", "rate": 4 },
    "Mammoth Soul": { "zone": "boss:mammoth", "rate": 1 },
    "Thorium Ore": { "activity": "mining", "level": 20 },
    "Ironwood Log": { "activity": "woodcutting", "level": 15 }
  }
}
```

### Data Source

Populated from the community spreadsheet "Cards & Drops" tab, columns K & L. Covers Act 1 (zones 1.0-1.13 + bosses), Act 2 (2.1-2.12 + bosses), Act 3 (3.1-3.12 + boss), mining resources (Copper/Iron/Thorium/Sunstone), woodcutting resources (Ash/Pyrewood/Ironwood/Palm), and hard mode drops.

## Component 2: Bottleneck Detector (`bottleneck-detector.js`)

### Input
- Main character profile
- All upgrade data (hunter, talent, sacrifice, ash, gear)

### Algorithm

1. Call shared `enumerateAllUpgrades(mainProfile)` to get all possible upgrades
2. Call shared `rankAllUpgrades(stats, upgrades, enemy, weights)` to score them
3. For the top N upgrades (N=10), resolve material requirements:
   - Sacrifice upgrades: `costItem` (e.g., "Helmet") + `soul` (e.g., "Mammoth Soul")
   - Hunter upgrades: `material` (e.g., "Boar Meat")
   - Gear upgrades: `recipe` materials (from crafting data)
4. For each required material, look up `resourceToZone` to find the source zone
5. Calculate quantity needed: `upgrade.nextRank * costScaling`
6. Calculate quantity owned (from profile inventory if available, otherwise 0)

### Throughput Analysis

For each bottleneck that involves mining or woodcutting:

1. Calculate current resource gathering rate from alt's profession level + power stats
2. Project improved rate if the alt invested in a throughput upgrade:
   - Mining/WC sacrifice (e.g., Mining Edge Technology)
   - Hunter mining/WC training
   - Mining/WC level grinding
3. Compute time-to-target at current rate vs improved rate
4. If the throughput investment pays back within the next 2-3 resource targets, flag it as a tip

### Output

```js
[
  {
    upgrade: "Attack Wish (Rank 12)",
    resource: "Helmet",
    needed: 12,
    owned: 0,
    zone: "2.2",
    dropRate: 4,
    priority: 1,        // from upgrade scorer
    powerGain: "+9% ATK multiplier",
  },
  {
    upgrade: "Thorium Bow",
    resource: "Thorium Ore",
    needed: 100,
    owned: 45,
    zone: "mining",
    miningLevel: 20,
    priority: 2,
    throughputTip: {
      investment: "Mining level 25→30",
      currentRate: 40,   // ore/hr
      improvedRate: 56,  // ore/hr
      timeSaved: "1.2 hrs over next 3 ore-dependent upgrades",
    },
  }
]
```

## Component 3: Alt Eligibility Engine (`alt-optimizer.js`)

### Zone Eligibility

For each alt profile and each zone:

1. `computeStats(altProfile)` → alt's aggregated stats
2. `computeEffectiveDPS(stats, enemy)` → alt's DPS against zone enemy
3. `computeTimeToDie(stats, enemy)` → survival time
4. Eligibility threshold: `timeToDie >= 60` seconds (configurable)
5. `computeFarmingRates(eDPS, enemy, stats)` → `killsPerHour`

### Capability Matrix

Per alt, a list of eligible zones with farming efficiency:

```js
{
  altName: "Thalin",
  altClass: "warrior",
  altLevel: 48,
  zones: [
    { zone: "2.2", killsPerHour: 340, survivalTime: 180 },
    { zone: "2.7", killsPerHour: 180, survivalTime: 90 },
    { zone: "2.8", killsPerHour: 90, survivalTime: 65 },
  ],
  mining: { level: 25, orePerHour: 40 },
  woodcutting: { level: 18, logsPerHour: 22 },
  canPushTo: "2.9",  // next unlockable zone
}
```

### Farming Rate Source

- **Current zone (alt is already parked there):** Use the game's stored `OfflineProgress.KillsPerHour` — most accurate
- **Hypothetical zone (what-if projection):** Use our computed `computeFarmingRates` estimate

The UI labels which is which so the user knows when they're seeing a real rate vs an estimate.

## Component 4: Assignment Algorithm

### Greedy Assignment

1. Take the priority-ranked bottleneck list from the detector
2. For each bottleneck (highest priority first):
   a. Find all alts that can farm the required zone
   b. Pick the alt with the highest items/hr for that resource
   c. Assign that alt, remove from the available pool
3. Handle special cases:
   - **Zone push:** If an unassigned alt's highest eligible zone is in Act N but a top-3 bottleneck resource requires Act N+1, assign them to farm their highest zone for XP to push progression. Detected by comparing alt's max unlocked zone against the zones needed by remaining unassigned bottlenecks.
   - **Profession grinding:** If the throughput analysis shows mining/WC level investment pays off, that's a valid assignment
   - **Main character:** Slot 1 is always marked as "Active" with current zone, not reassigned

### Output

An assignment object per character slot:

```js
[
  { slot: 1, profile: mainProfile, type: "active", zone: "2.1" },
  { slot: 2, profile: altProfile1, type: "farm", zone: "2.2",
    reason: "Attack Wish rank 12 needs 12 Helmets",
    rate: "85 Helmets/hr", eta: "9 min",
    powerGain: "+9% ATK multiplier" },
  { slot: 3, profile: altProfile2, type: "push", zone: "1.14",
    reason: "Push to Act 2 to unlock sacrifice materials",
    rate: "200 kills/hr" },
  { slot: 4, profile: altProfile3, type: "profession", activity: "mining",
    reason: "Thorium Bow needs 100 ore",
    rate: "30 ore/hr", eta: "3.3 hrs",
    throughputTip: "Mining 20→25 boosts to 42 ore/hr" },
]
```

## Component 5: UI — Alt Advisor Tab (`AltAdvisor.jsx`)

### Layout

A card-based assignment board showing all 4 character slots vertically:

```
┌─────────────────────────────────────────────────┐
│ SLOT 1: Zeider (Rogue 69) — ACTIVE              │
│ Farming: 2.1 Iceboar (your current zone)        │
├─────────────────────────────────────────────────┤
│ SLOT 2: Thalin (Warrior 48) — OFFLINE           │
│ ★ Recommended: Zone 2.2 (Helmets)              │
│   Why: Attack Wish rank 12 needs 12 Helmets    │
│   Rate: ~85/hr offline → done in ~9 min        │
│   Power gain: +9% ATK multiplier               │
├─────────────────────────────────────────────────┤
│ SLOT 3: Mira (Mage 31) — OFFLINE               │
│ ★ Recommended: Push zones (at 1.14, need 2.1)  │
│   Why: Unlocks Act 2 materials for sacrifices   │
│   Current: Can farm 1.14 at 200 kills/hr       │
├─────────────────────────────────────────────────┤
│ SLOT 4: Kai (Rogue 15) — OFFLINE               │
│ ★ Recommended: Mine Thorium Ore                 │
│   Why: Thorium Bow craft needs 100 ore          │
│   Rate: ~30 ore/hr → done in ~3.3 hrs          │
│   Tip: Mining 20→25 boosts to 42 ore/hr        │
│        (saves 1hr over next 3 crafts)           │
└─────────────────────────────────────────────────┘
```

### Each Slot Card Shows:
- Character name, class, level
- Status: ACTIVE / OFFLINE
- Recommended activity (zone + resource, or push zones, or profession)
- Why: which upgrade this feeds and what it needs
- Rate: items/hr with ETA to completion
- Power gain: what the upgrade gives when complete
- Throughput tip (optional): if an indirect investment would help

### Controls:
- Zone override dropdown per alt (user can manually assign a different zone)
- "Refresh" button to re-run the optimizer after profile changes

## Scope Boundaries — Not in v1

- **Goal planner with timeline** — multi-step "max all sacrifices" planning (future Approach C)
- **Progress tracking over time** — no session-to-session tracking of resource accumulation
- **Mining/WC rate formula derivation** — use estimates for v1, derive exact formula when data is available
- **Hard mode zone optimization** — include hard mode drops in data, but don't optimize for them specifically
- **Inventory tracking** — we don't know what materials the player currently has (save decoder doesn't extract inventory items yet). Assume 0 owned for v1, with manual override option.

## Testing

- Unit tests for bottleneck detector: given a known profile + upgrade list, verify correct resource identification
- Unit tests for eligibility engine: given alt stats and enemy data, verify zone eligibility and kill rates
- Unit tests for assignment algorithm: given bottlenecks + eligibility matrix, verify correct alt-to-zone matching
- Integration test: full flow from profile → assignment board output
