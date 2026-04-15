# EvitaniaCalc v2.0 — Design Spec

## Overview

Expand EvitaniaCalc from a crafting ingredient calculator into a full character planning suite for Evitania Online: Idle RPG. The app helps players answer "what should I upgrade next?" by scoring every possible upgrade by power-gained-per-time-invested, with full save file import, interactive skill trees, DPS simulation, and shareable builds.

## Tech Stack

- **Framework:** Preact + Vite (migrating from vanilla HTML/CSS/JS)
- **Language:** JavaScript with JSX
- **Styling:** CSS with custom properties (migrating existing theme system)
- **Data:** Static JSON files for game data (from Google Sheets), localStorage for user profiles
- **Deployment:** GitHub Pages (static build via `vite build`)
- **Dependencies:** Preact (~3KB), Vite (dev only), no other runtime deps

## Data Sources

### Game Data (static JSON, bundled with app)

All sourced from the community Google Sheet (`1wOkU-QaqLy96HwtCWKiZt251_KRdu2qbVIYfEZjS4Q4`):

- **Enemies:** HP, ATK, Armor, Evasion, Accuracy, Gold, XP for all Acts 1-3 zones + bosses + hardmode
- **Gear:** All weapons (Sword/Longsword/Bow/Staff), armor (Helm/Chest/Gloves/Boots), accessories (Ring/Amulet/Belt), tools (Pickaxe/Axe) with stats at L1/L15, effects, crafting costs
- **Classes:** Base stats for Starter/Warrior/Rogue/Mage, all active skills with damage/CD/mana
- **Talents:** Full tree definitions for all 3 classes — node positions, stat bonuses per point, max points, prerequisite connections. Rogue: 31 nodes/156 pts. Warrior: 34 nodes/153 pts. Mage: 28 nodes/150 pts
- **Professions:** Mining and Woodcutting upgrade trees — Power, Proficiency, Multiloot, Crit, Speed, XP, Damage bonuses with max levels
- **Hunter Upgrades:** 21 upgrade types with per-rank effects and material costs
- **Ash Upgrades:** All tiers with costs and effects
- **Sacrifice Bonuses:** 15 upgrades across 3 boss souls, 30 ranks each, with material costs
- **Runes:** 9 rune types, 4 tiers, merge ratios (6:1 T2, 9:1 T3, 9:1 T4), 7 rune word recipes
- **Cards:** Per-mob card bonuses at 4 tiers, card count thresholds by act (60/100/150)
- **Pets:** All pets with stat types and acquisition methods
- **Curios:** All curios by rarity (Gray→Orange) with stat multipliers, tier bonuses, upgrade costs
- **Bonfire:** Heat thresholds and zone buff effects
- **Recipes:** Existing crafting recipes (~80) already in the app

### Save File Import (client-side decode)

The game stores saves at `%AppData%/../LocalLow/Fireblast Studios/Evitania Online - Idle RPG/data.sav`.

**Format:** Hex-encoded, XOR 0xFF obfuscated JSON. Decode: read as ASCII hex → convert to bytes → XOR each byte with 0xFF → parse as UTF-8 JSON.

**Extractable data:**
- All heroes: name, class (1=Warrior, 2=Mage, 3=Rogue), HP, Mana
- Skill levels: Combat (ESkill 0), Mining (ESkill 1), Woodcutting (ESkill 2) with currentXp and currentLevel
- Full talent tree allocations as `tt_{class}_{tier}_{column}: points` and `profession_{type}_{tier}_{column}: points`
- Equipment by slot (Helmet/Chest/Boots/Legs/Belt/Amulet/Ring/Weapon1/Weapon2/Axe/Pickaxe) with GUID, Level, EnhancementLevel
- Hunter upgrades as `LeBabka_{stat}: level` (STR, DEX, INT, CON, PAtk, MAtk, PDef, Accuracy, CritChance, CritDamage, Mining, MiningPower, Woodcutting, WoodcuttingPower, etc.)
- Ash upgrades as `ash_{tier}_{index}: level`
- Sacrifice bonuses as `act-2-sacrifice-{index}: level`
- Gemshop upgrades (SmelterySpeed, SmelteryCapacity, SmelteryMulticraft, etc.)
- Kill statistics per mob per act
- Offline farming rates: KillsPerHour, XpPerHour, GoldPerHour
- Current zone from Progress.scene (e.g., "2.1")
- Cards collected per mob
- Pets: name, level, tier, equipped status
- Rune system: equipped runes, collected rune words, inventory
- Curios: inventory and equipped slots
- Bonfire fuel level and lit status
- Tower progress (floor)
- Currencies (Gold, Gems, Boss Keys, etc.)

**Gap:** Equipment GUIDs cannot be resolved to item names from local data (definitions loaded from server at runtime). Users select gear from dropdowns; enhancement levels are imported from save.

## App Architecture

### Navigation

7 tabs in the main content area:

1. **Dashboard** — At-a-glance power summary, farming rates, next best upgrade
2. **Upgrade Advisor** — Ranked upgrade list sorted by power-per-time-cost
3. **Gear Planner** — Side-by-side gear comparison with stat diffs
4. **Skill Trees** — Interactive visual talent trees for all 5 systems
5. **DPS Simulator** — Combat predictions against specific enemies
6. **Crafting** — Migrated existing crafting calculator
7. **Rune Planner** — Migrated existing rune farming planner

### Persistent UI Elements

- **Top bar:** App name/version, Import Save button, Character switcher dropdown (shows all heroes from save with name/class/level), Share button, Theme toggle
- **Gear strip (bottom):** Shows all 10+ equipped gear slots across all tabs. Click any slot to jump to Gear Planner for that slot.

### State Management

Single global state object managed via Preact signals or context:

```
AppState {
  profiles: Map<string, CharacterProfile>   // saved builds by name
  activeProfile: string                      // current profile key
  gameData: GameData                         // static JSON (enemies, gear, talents, etc.)
  uiState: { activeTab, theme, lightMode }
}

CharacterProfile {
  name: string
  class: 'warrior' | 'rogue' | 'mage'
  level: number
  gear: Map<SlotId, GearSelection>           // slot → item + enhancement level
  talents: Map<NodeId, number>               // talent node → points allocated
  hunterUpgrades: Map<UpgradeId, number>     // upgrade → level
  ashUpgrades: Map<UpgradeId, number>
  sacrificeUpgrades: Map<UpgradeId, number>
  professionSkills: Map<NodeId, number>
  runes: RuneSetup
  cards: Map<MobId, number>
  pets: PetSetup
  curios: CurioSetup
  farmingRates: { killsPerHour, xpPerHour, goldPerHour }
  currentZone: string
}
```

Persisted to localStorage. Exported/imported via base64 URL hash for sharing.

## Feature Specifications

### 1. Dashboard

Displays 3 cards in a grid:

**Power Summary card:**
- Offensive Power (weighted eDPS score)
- Defensive Power (weighted effective HP score)
- Effective DPS (number)
- Survivability % (estimated alive time at current zone)

**Farming Rates card:**
- Kills/Hour, XP/Hour, Gold/Hour, Alive Time
- Zone label from save (e.g., "Act 2.1")
- Values from save import or calculated from DPS sim

**Next Best Upgrade card:**
- Top-ranked upgrade from the Advisor
- Shows: name, power gain, cost, farm time
- Runner-up shown below

### 2. Upgrade Advisor

**Controls:**
- Target Zone dropdown (defaults to current zone from save, can pick any zone as a goal)
- Type filter buttons: All | Hunter | Gear | Talents | Ash | Sacrifice
- Offense/Defense weight slider with auto-calibrate default

**Ranking algorithm:**

For every possible upgrade (next level of each hunter upgrade, next gear tier per slot, each unallocated talent point, each ash upgrade, each sacrifice level):

1. Compute current total stats → compute stats with this upgrade applied
2. `offenseDelta` = effectiveDPS(after) - effectiveDPS(before)
3. `defenseDelta` = effectiveHP(after) - effectiveHP(before)
4. `powerDelta` = offenseDelta × offenseWeight + defenseDelta × defenseWeight
5. `timeCost` = estimate farming time for materials at current zone drop rates
6. `score` = powerDelta / timeCost (power gained per hour of farming)

Unspent talent points have timeCost = 0, score = infinity (shown first as "free power").

**Offense/Defense auto-calibration:** Default weights are determined by survival rate at the target zone. If alive time < 90%, defense weight increases. If alive time > 99%, offense weight dominates.

**Table columns:** Rank, Upgrade Name, Type (color-coded badge), Power Gain, Raw Cost, Estimated Farm Time, Score.

**Utility stats handling:** MobSpawn reduction, MagicFind, XP Multi, Gold Multi, and Offline Gains are factored as "farming efficiency" bonuses. A separate toggle lets users weight these alongside combat power.

### 3. Gear Planner

**Layout:** Three-column: Current Gear | Stat Diff | Candidate Gear

**Current gear:** Shows equipped item name, stats, effects, enhancement level. Auto-populated from save import or manual selection.

**Candidate gear:** Dropdown filtered by slot type and class-appropriate weapons. Shows all stats for the selected item.

**Stat diff (center column):** Green for improvements, red for downgrades. Shows net eDPS change as a prominent badge. Below: full crafting requirements with material counts and estimated farm time.

**Per-slot navigation:** 10+ gear slots shown as a row of clickable icons. Clicking one loads that slot's comparison.

### 4. Skill Trees

**Layout:** Three-panel horizontal — left sidebar (tree tabs + build mode + points), center (scrollable horizontal node graph), right sidebar (selected node detail + stat totals).

**Left sidebar:**
- Tree tabs stacked vertically: Novice, Warrior, Rogue, Mage | Mining, Woodcutting
- Build Mode buttons: Levelling, Farming, Custom
- Points counter: Used / Total, Available

**Center graph:**
- Horizontal left-to-right flow matching in-game layout
- Nodes are positioned in columns (tiers) with vertical branching within each column
- SVG connection lines between prerequisite nodes
- Horizontally scrollable for deep trees
- Node visual states:
  - Maxed: green solid border
  - Partial: amber solid border
  - Available (0 pts): blue dashed border
  - Locked (prereqs not met): faded, reduced opacity
  - Class Unlock: special gradient border
  - Recommended Next: purple glow (best power-per-point node)

**Right sidebar:**
- Selected node detail: name, description, current/max points, progress bar
- Impact panel: eDPS and kills/hr change from next point
- Running stat totals from this tree
- Add/Remove buttons

**Node interaction:** Click to allocate a point, right-click (or Remove button) to deallocate. Each change triggers live recalculation of stat sidebar and node visual states.

**Build modes:**
- **Levelling:** Auto-allocates to maximize XP/hr. Priority: Bonus XP > ATK > ATKSPD > Movement Speed. Shows numbered badges on nodes for recommended allocation order.
- **Farming:** Auto-allocates for max gold/drops. Priority: MagicFind > Gold Multi > MobSpawn reduction > ATK > CritDMG. For profession trees: Multiloot > Power > Speed > Crit.
- **Custom:** Full manual control. Save import loads current allocation here.

**Profession trees (Mining/Woodcutting):** Same interface but with profession-specific metrics in the stat sidebar (Mining Power, Multiloot, Mining Speed, Mining Crit, Damage bonus).

**Tree data structure:**
```
TalentTree {
  id: string                    // 'rogue', 'warrior', 'mage', 'mining', 'woodcutting'
  nodes: TalentNode[]
}

TalentNode {
  id: string                    // matches save key, e.g. 'tt_rogue_3_1'
  name: string                  // display name
  description: string
  maxPoints: number
  statBonuses: StatBonus[]      // [{stat: 'critChance', valuePerPoint: 2}]
  position: {col: number, row: number}  // for layout
  prerequisites: string[]       // node IDs that must be maxed first
}
```

### 5. DPS Simulator

**Layout:** Three-column: Your Stats | VS | Enemy Stats, with results grid below and what-if bar at bottom.

**Your Stats (left):** Computed total stats from the current profile. Shows: Total ATK, ATK Speed, Crit Chance, Crit Damage, Accuracy, HP, Phys DEF, HP Regen.

**Enemy (right):** Dropdown to select any enemy from the game data. Shows: HP, ATK, Armor, Evasion, Accuracy, Gold, XP. Defaults to current zone enemy from save.

**Results grid (6 cards):**
- Effective DPS: `baseDPS × critMultiplier × hitRate`
- Time to Kill: `enemyHP / effectiveDPS`
- Kills/Hour: `3600 / (timeToKill + mobSpawnTime + travelTime)`
- XP/Hour: `killsPerHour × enemyXP × xpMultipliers`
- Gold/Hour: `killsPerHour × enemyGold × goldMultipliers`
- Alive Time: estimated % of time alive based on incoming damage vs HP/regen/defense

**What-if bar:** Checkboxes to toggle hypothetical upgrades (gear changes, pending talent points, hunter upgrades). Each toggle recalculates all 6 metrics live. Shows simulated eDPS delta.

### 6. Crafting Calculator (Migration)

Migrate existing `calc.js`, `recipes.js`, `inventory.js` functionality into Preact components:

- `CraftingTab` — main container
- `RecipeManager` — add/edit/delete/import/export recipes
- `CraftList` — items to craft with quantities
- `IngredientResults` — combined view and by-item tree view
- `InventoryInputs` — current stock inputs with live recalculation

All existing logic (recursive expansion, multicraft yield, net calculation with inventory deduction) preserved. Recipe data stays in the same format.

### 7. Rune Planner (Migration)

Migrate existing `runes.js` into Preact components:

- `RuneTab` — main container
- `RuneComboSelector` — dropdown for rune word selection
- `RuneFamilyInputs` — per-family tier inputs with farming location hints
- `RuneProgress` — progress bars and completion tracking

All existing rune data and merge ratio logic preserved.

## Stat Engine

### Stat Aggregation

Three-layer computation:

**Layer 1 — Base Stats:** Class base stats (HP, DEF, ATK, ATK%, ATKSPD, CritCh, CritDMG, Mana, ManaReg, MF, BonusXP).

**Layer 2 — Flat Additions:** Sum of all flat bonuses from: gear stats, talent tree allocations, hunter upgrades, rune bonuses, card bonuses, pet stats, curio bonuses, profession skill bonuses.

**Layer 3 — Multipliers:** Applied multiplicatively: ATK% bonuses, sacrifice multipliers (e.g., Attack Wish ×0.09 per rank), bonfire buffs (e.g., Fiery Weapons +50% ATK), card percentage bonuses.

### Class Attack Formulas

```
Warrior ATK = baseATK + weaponATK + (STR × 0.10 × totalATK) + flatATK
Rogue ATK   = baseATK + weaponATK + (DEX × 0.10 × totalATK) + flatATK
Mage ATK    = baseATK + weaponATK + (INT × 0.10 × totalATK) + flatATK
```

### Effective DPS

```
baseDPS        = totalATK × (1 + ATKSPD/100)
critMultiplier = 1 + (critChance/100 × critDMG/100)
hitRate        = min(1.0, accuracy / (accuracy + enemyEvasion))
effectiveDPS   = baseDPS × critMultiplier × hitRate
```

### Effective HP (for defense scoring)

```
damageReduction = physDEF / (physDEF + enemyATK)       // diminishing returns formula
incomingDPS     = enemyATK × (1 - damageReduction) × enemyHitRate
timeToDie       = totalHP / max(0.01, incomingDPS - hpRegen)  // seconds alive, clamped
effectiveHP     = totalHP / (1 - damageReduction)      // HP normalized by damage reduction
```

### Accuracy Diminishing Returns

Accuracy value depends on target enemy evasion. Once hitRate > 0.95, additional accuracy provides near-zero marginal value. The scoring engine accounts for this by evaluating accuracy against the target zone's enemy evasion.

### Farming Rate Estimation

```
mobSpawnTime    = baseMobSpawn × (1 - mobSpawnReduction/100)
travelTime      = baseTravel / (1 + moveSpeed/100)
timePerKill     = timeToKill + mobSpawnTime + travelTime
killsPerHour    = 3600 / timePerKill
xpPerHour       = killsPerHour × enemyXP × (1 + xpMulti/100)
goldPerHour     = killsPerHour × enemyGold × (1 + goldMulti/100)
```

## Save Import

### Decode Pipeline (all client-side, no server)

1. User selects `data.sav` via file picker or drag-and-drop
2. Read file as text (it's ASCII hex)
3. Convert hex string to byte array
4. XOR each byte with 0xFF
5. Decode result as UTF-8
6. Parse as JSON
7. Extract character data into `CharacterProfile` objects
8. Auto-populate talent trees, hunter upgrades, ash/sacrifice levels, farming rates, current zone
9. Prompt user to select gear from dropdowns (GUIDs not resolvable)
10. Enhancement levels imported directly from save

### GUID Map (incremental, optional)

Maintain a community-contributed JSON map of `GUID → item name`. Users who identify their gear can contribute mappings. Over time this reduces manual gear selection. Not required for v2.0 launch.

## Build Sharing

### Encoding

Serialize `CharacterProfile` to a compact JSON representation → compress with a simple encoding → base64 → append as URL hash fragment.

```
https://zeider.github.io/EvitaniaCalc/#b=eyJjbGFzcyI6InJvZ3Vl...
```

### Decoding

On page load, check for `#b=` in URL hash → decode base64 → decompress → parse JSON → load as read-only profile. User can then "save a copy" to edit.

### Short Codes (optional enhancement)

Generate a shorter alphanumeric code (e.g., `RXQM-7K2P`) by hashing the build state. Store the mapping in localStorage. Only works for sharing between users who have both visited the site (codes are local). URL sharing is the primary method.

## Deployment

### GitHub Pages

- `vite build` produces static files in `dist/`
- Deploy via `gh-pages` branch or GitHub Actions
- URL: `https://zeider.github.io/EvitaniaCalc/`
- No server, no backend, no API keys

### Migration Path

1. Create Preact/Vite project alongside existing files
2. Migrate existing features first (crafting + rune planner)
3. Add new features incrementally
4. Old `index.html` can be kept at a `/legacy` path temporarily

## File Structure

```
EvitaniaCalc/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx                    # Entry point, router
│   ├── app.jsx                     # App shell (top bar, tabs, gear strip)
│   ├── state/
│   │   ├── store.js                # Global state management
│   │   ├── stat-engine.js          # Stat aggregation + DPS formulas
│   │   ├── upgrade-scorer.js       # Power-per-time scoring algorithm
│   │   └── save-decoder.js         # XOR 0xFF decode + JSON extraction
│   ├── data/
│   │   ├── enemies.json            # All enemy stats by zone
│   │   ├── gear.json               # All gear with stats, effects, costs
│   │   ├── talents.json            # Talent tree definitions (3 classes)
│   │   ├── professions.json        # Mining + Woodcutting trees
│   │   ├── hunter-upgrades.json    # Hunter upgrade definitions
│   │   ├── ash-upgrades.json       # Ash upgrade definitions
│   │   ├── sacrifices.json         # Sacrifice bonus definitions
│   │   ├── runes.json              # Rune types, words, merge ratios
│   │   ├── cards.json              # Card bonuses per mob
│   │   ├── pets.json               # Pet stats and sources
│   │   ├── curios.json             # Curio stats by rarity
│   │   ├── bonfire.json            # Heat thresholds and buffs
│   │   └── recipes.json            # Crafting recipes (migrated)
│   ├── components/
│   │   ├── TopBar.jsx
│   │   ├── GearStrip.jsx
│   │   ├── TabNav.jsx
│   │   ├── StatCard.jsx            # Reusable stat display card
│   │   ├── UpgradeRow.jsx          # Reusable upgrade list row
│   │   └── NodeTooltip.jsx         # Skill tree node hover tooltip
│   ├── tabs/
│   │   ├── Dashboard.jsx
│   │   ├── UpgradeAdvisor.jsx
│   │   ├── GearPlanner.jsx
│   │   ├── SkillTrees.jsx
│   │   ├── DpsSimulator.jsx
│   │   ├── Crafting.jsx            # Migrated
│   │   └── RunePlanner.jsx         # Migrated
│   └── css/
│       ├── base.css                # Migrated + extended
│       ├── theme-boushoku.css      # Migrated
│       └── theme-yama.css          # Migrated
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-15-evitaniacalc-v2-design.md
└── .gitignore
```

## Non-Goals (explicitly out of scope)

- Server-side features, user accounts, or databases
- Mobile app (responsive web is sufficient)
- Real-time multiplayer build comparison
- Automated game data scraping (manual JSON updates from spreadsheet)
- Full GUID resolution (partial map is acceptable)
- Build optimization solver (the advisor ranks upgrades, it doesn't auto-play)
