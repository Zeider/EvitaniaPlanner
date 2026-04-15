# EvitaniaPlanner — Known Issues & Next Steps

## Bugs

### B1: Novice tree tier 2 nodes have wrong max points
- `talents.json` novice tier 2 nodes (`novice_2_0_exp`, `novice_2_1_patk`, `novice_2_2_mf`) are set to `maxPoints: 2`, should be `maxPoints: 1`

### B2: Upgrade Advisor suggests talents from wrong class
- A Rogue character sees Warrior and Mage talent suggestions
- Fix: filter to only show talents from `novice` tree + the active character's class tree
- Also filter profession trees to only show the profession the character is training

### B3: Upgrade Advisor ignores available talent points
- Suggests talent upgrades even when the character has 0 unspent points
- Fix: calculate available points (level-based allowance minus allocated total), only suggest if points > 0

## Missing Data

### D1: Enhancement scaling not implemented
- Gear stats increase per enhancement level (e.g., Thorium Bow +6 has higher ATK than base)
- Need the formula: likely `stat * (1 + enhanceLevel * scaleFactor)` or a lookup table
- Check community spreadsheet for enhancement scaling data
- This is the single biggest source of stat underestimation

### D2: Missing belts in gear.json
- Only Steel Belt loaded
- Missing: Valentine Belt, Steam Belt, Harvest Belt, Summer Belt, Christmas Belt, Anniversary Belt
- Also verify all accessories are complete (rings, amulets)

### D3: Cards input UI and stat contribution
- No UI to enter card counts per mob
- Card bonuses at 4 tiers affect: HP, Mana, Mining/WC Power, Smeltery Speed, Crit Damage, Combat XP, ATK%, Hunter Cost, Gold Multi, Phys DEF, HP Regen, Offline Gains, MagicFind
- Save import loads card counts but they don't feed into stat calculation yet

### D4: Rune selection UI and stat contribution
- Save import loads rune GUIDs but no way to manually select runes
- Equipped runes don't contribute to stat calculations
- Need: rune selector UI, rune word detection, stat contribution from rune bonuses

### D5: Sacrifice multiplier stat contribution
- Save import loads sacrifice levels but they aren't applied as multipliers in the stat engine
- These are significant: Attack Wish x2.70, Crit Chance +30%, Crit Damage +90%, etc.

### D6: Bonfire buff stat contribution
- Bonfire heat level is in the save but buffs aren't applied
- Active buffs: +50% ATK (Fiery Weapons), +50% XP (Owl Wisdom), +100% Mining/WC Power, etc.

### D7: Pet stat contribution
- Active pet stats not factored into computation
- Each pet contributes two stats (HP, MagicFind, Offline Gains, etc.)

### D8: Curio stat contribution
- Equipped curios not factored into computation
- ATK multipliers, Mining/WC Power multipliers, Crit Damage, Gold Multi, etc.

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

## Enhancement Priority
1. D1 (enhancement scaling) + B1-B3 (bugs) — highest impact
2. D5 (sacrifice multipliers) — these are massive multipliers
3. D6 (bonfire buffs) — +50% ATK and +50% XP alone
4. D3 + D4 (cards + runes) — need both data and UI
5. D2 (missing belts) — data gap
6. D7 + D8 (pets + curios) — smaller stat contributions
