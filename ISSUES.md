# EvitaniaPlanner — Known Issues & Next Steps

## Bugs

### ~~B1: Novice tree tier 2 nodes have wrong max points~~ (FIXED)
- Already corrected in `talents.json` — all tier 2 nodes are `maxPoints: 1`

### ~~B2: Upgrade Advisor suggests talents from wrong class~~ (FIXED)
- Fixed: `enumerateTalentUpgrades` now filters to only `novice` + `profile.class` trees

### ~~B3: Upgrade Advisor ignores available talent points~~ (FIXED)
- Fixed: calculates available points (1 per level minus allocated total), returns no talent suggestions when 0 remain

## Missing Data

### ~~D1: Enhancement scaling not implemented~~ (FIXED)
- Weapons: `base_atk * (1 + enhLevel * 0.275)` (27.5% per level), rounded to 1 decimal
- Armor: `base_def * (1 + enhLevel * 0.05)` (5% per level), rounded to 1 decimal
- Bonus stats (STR, DEX, etc.) do NOT scale — only primary ATK/DEF
- Verified against in-game screenshots: Essence Sword +5 = 106.9 ATK, Bronze Helmet +5 = 31.3 DEF

### ~~D2: Missing belts in gear.json~~ (FIXED)
- Added: Belt of Love, Summer Belt, Harvest Belt, Christmas Belt, Anniversary Belt, Valentine Belt, Steam Belt
- Added accessories: Halloween Signet, Carrot Ring, Rabbit's Foot, Valentine Amulet

### ~~D3: Cards stat contribution~~ (FIXED — stat engine)
- Card bonuses now computed from `profile.cards` counts against tier thresholds
- Supports flat bonuses, percentage bonuses, and multiplier cards (Act 2+)
- UI for card input still needed

### ~~D4: Rune stat contribution~~ (FIXED — stat engine)
- Equipped runes contribute individual tier stats
- Rune word detection: checks if equipped runes match a rune word recipe
- Rune word bonuses applied (including atkMulti as multiplier)
- UI for rune selection still needed

### ~~D5: Sacrifice multiplier stat contribution~~ (FIXED)
- Multiplier sacrifices (ATK x2.70, HP x2.40, etc.) applied in Layer 3
- Flat sacrifices (Crit Chance +30, Crit Damage +90%) applied in Layer 2

### ~~D6: Bonfire buff stat contribution~~ (FIXED)
- Bonfire buffs applied based on `profile.bonfireHeat` level
- +50% ATK, +50% XP, -20% mob spawn, +100% Mining/WC Power all wired in
- TODO: extract bonfire heat from save file (key unknown)

### ~~D7: Pet stat contribution~~ (FIXED)
- Pet data file rewritten with 35 real pets, level-50 values from spreadsheet
- Global bonus scaling: `level50 * (0.189 + 0.0162 * level)` — derived from Basic Bat at levels 9/29/50
- Active pet selector on Dashboard with level input
- Individual pet flat stats (HP, Phys Def, etc.) not yet implemented — only global bonus

### ~~D8: Curio stat contribution~~ (FIXED)
- Primary stat multipliers applied (e.g., miningPower x1.42)
- ATK bonus by rarity applied (gray x1.06 through orange x1.15)
- Tier bonuses (t3/t7/t9) applied based on curio tier level

## Stat Discrepancy Analysis

In-game (Zeider, Rogue 69, Act 2.1 Iceboar):
- Kills/hr: 1,377 — we show: 490
- XP/hr: 67.8M — we show: 13.8M
- Gold/hr: 7.76K — we show: 7.3K (closest, gold is simpler)
- Alive: 100% — we show: 12.5%

The gap is primarily from:
1. Enhancement scaling on all gear (biggest factor)
2. Sacrifice multipliers (x2.70 ATK, +90% Crit Damage, etc.)
3. Bonfire buffs (+50% ATK, +50% XP)
4. Rune word bonuses
5. Card bonuses
6. Pet stats
7. Curio effects

## Remaining Work
1. Card input UI (card counts can be entered manually or loaded from save)
2. Rune selection UI (manual rune equip interface)
3. Pet level/tier scaling formula (stat values per level unknown)
4. Bonfire heat extraction from save file (save key unknown)
5. Enhancement scaling for tools (pickaxes/axes — formula may differ)
6. Act 3 zones 3.9+ data (Djinn, Horus, Jötunn Son of Jötunn — not in spreadsheet)
