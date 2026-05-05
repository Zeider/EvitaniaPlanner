# EvitaniaPlanner — User Guide

A planning suite for **Evitania Online: Idle RPG**. This guide walks through every feature so you can find what you need fast.

🔗 **Live app:** https://zeider.github.io/EvitaniaPlanner/

## Quick Start

1. Click **Import Save** in the top bar. Use **Copy Path** if you don't know where the save file lives — paste it into the file picker's address bar.
2. The default Windows save path is `%AppData%\..\LocalLow\Fireblast Studios\Evitania Online - Idle RPG\data.sav`.
3. Once imported, the Dashboard shows your character's power summary and pick a tab from the nav to drill in.
4. Save imports stay entirely in your browser — nothing is uploaded.

## Top Bar

- **Import Save** — pick a `data.sav` file. All your heroes are extracted at once.
- **Copy Path** — copies the save folder path to your clipboard.
- **Profile picker** — switch between heroes if your save has multiple. Heroes with the same in-game name are now correctly differentiated by slot index (no overwriting).
- **Share** — generates a URL with your build encoded in the hash so you can send it to friends. They can open the link and see your character without needing your save file.
- **Release Notes** — what changed in recent versions.
- **Report Issue** — opens a GitHub issue with diagnostic context (planner version, active tab, browser) prefilled. You add the description and submit. Save contents are NOT included.
- **Theme toggle** — switches light/dark mode.

## Dashboard

Landing page. Summarizes the character at a glance:

- **Power Summary** — Offensive Power, Defensive Power, Effective DPS, Total ATK.
- **Farming Rates** — Kills/hr, XP/hr, Gold/hr (extracted from the save's offline-progress fields).
- **Character Info** — name, class, level, current zone.
- **Bonfire Heat** — input field. The save doesn't store heat directly, so type your in-game value and the unlocked benefits highlight automatically.
- **Equipped Runes** — all runes currently socketed.
- **Active Pet** — dropdown to set your active pet (computes pet bonuses).
- **Boss Readiness** — TTK = boss HP ÷ effective DPS. Bosses you can kill in ≤ 5 minutes are marked Ready. Hard-mode bosses scale HP/ATK ×16.
- **Daily Tasks** — quick reminders of vendor purchases worth grabbing each day (more here as data is filled in).
- **Card Bonuses** — summary of cards in collection.

## Character ▾

### Gear Planner

Shows every equipped slot (helmet, chest, gloves, boots, belt, amulet, ring, weapon, axe, pickaxe) with item name, enhancement level, and durability. Used to verify what your save imported correctly.

If a slot shows a raw GUID instead of a name, that item isn't yet in our `GEAR_GUID_MAP`. Submit a Report Issue with the item name + the displayed GUID and we'll add it.

### Skill Trees

Visualizes your invested talent points + profession nodes. Hover any node to see what stats it grants and at what cost. Compares your current investment against the full tree so you can spot what's still unspent.

### Cards

All cards across Act 1 / Act 2 / Act 3 / Resource cards / Hard mode in a single sortable table:

- **Count** — clickable to override. Save imports often miss cards (some are server-side), so manual edits persist locally and win over imports.
- **Tier** — current bonus tier based on count.
- **Cards/hr** — estimated farming rate from your effective DPS at the drop zone.
- **Time to next tier** — how long until your count crosses the next threshold.

If you've cleared mobs but cards are missing from the import, just click and type the right count.

### Rune Planner

Shows your equipped runes, your unequipped rune inventory, and discovered runewords. Recommendations engine ranks rune combos against your current build and highlights what would improve your stats most.

### Engineer

The Act 2 Engineer mechanic (introduced in patch 0.310.0):

- **Slots** — up to 4 production slots with state (active / disabled / stalled), last-produced relative time, and per-slot upgrade ranks.
- **Stockpile** — items the Engineer has produced and not yet consumed.
- **Gem-shop slot upgrade rank** — the global enhancement that unlocks/boosts Engineer slots.

Upgrade GUIDs and recipe outputs aren't yet mapped to in-game names — they'll show as raw GUIDs until we observe them in-game. The data is correctly tracked in the meantime.

## Inventory ▾

### Storage

Decoded view of your in-game stash. Two sections:

- **Gear** — sorted by enhancement level descending. Shows name (or short-GUID for unmapped items), enhancement, durability, and full GUID.
- **Resources** — sorted by amount descending. Shows name (or short-GUID), amount, and full GUID.

If you see GUIDs instead of names for resources, we don't have the resource → name mapping yet. Long-term goal is auto-populating the Progression tab's inventory from this stash; for now, manually enter resource counts in the Progression tab.

### Crafting

Recipe calculator. Pick what you want to craft and see the materials needed expanded down to base resources. Used standalone (without a save) for general crafting math.

## Planning ▾

### Upgrade Advisor

Ranks the next upgrade you should buy by **raw value** — the cheapest gold-per-stat or kills-per-stat improvement available right now. Considers gem-shop, ash, hunter, sacrifice, and bonfire upgrades. Tells you the next click that helps you most.

### Progression

The headline planner. Pick a target gear set or single piece, see:

- **Target picker** — Set (e.g. "Thorium Set", "Infinite I Set") or Piece (any individual recipe).
- **Summary** — % complete and total estimated farming time remaining. Credits intermediate stockpile (your existing bars/charcoal count toward the goal — you don't get told to mine ore for bars you've already smelted).
- **Pieces** — per-piece breakdown with crafting time.
- **Shopping List** — every base material to farm with farming-source location and ETA. Intermediates (Bars, Charcoal, Perfect Fur) appear as italic "craft" rows below the bases.
- **Inventory** — editable counts for both raw materials and intermediate crafts. Type your current counts and the shopping list updates immediately.

### Alt Advisor

For multi-character planning. Suggests how to coordinate alts to maximize total account power — e.g., who should farm what zone, who should craft for whom.

## DPS Sim

Standalone damage simulator. Lets you tweak hypothetical stats and see how DPS changes — useful for "what if I had 200 more crit damage?" comparisons before committing to an upgrade path. Independent of save imports.

## How the calculations work

- **Effective DPS** — base ATK × (1 + ATK%) × accuracy × crit-modified average damage, with class-specific dual-wield rules and ATK speed scaling.
- **Material ETAs** — for mining/woodcutting drops, you can enter your observed rate per hour to get exact estimates; without it, a 100/hr placeholder is used (marked "rough"). Boss drops use a 2-hour-per-drop placeholder. Vendor materials use the daily limit when known.
- **Percent Complete** — credits both raw material inventory AND intermediate stockpiles (a Thorium Bar effectively counts as the ore + chadcoal it would have cost to make).

## Known limitations

- **Card counts** — `Currency.cards` in the save is incomplete (server-side for some mobs). Manual overrides bridge the gap.
- **Bonfire heat** — not stored in the save; type it in.
- **Item GUIDs** — gear and curios are well-mapped; resources and engineer-upgrade categories are still being identified. Help by sending screenshots of mystery items via Report Issue.

## Found something wrong?

Use the **Report Issue** button in the top bar — it prefills version, browser, and active tab. Or open an issue directly at <https://github.com/Zeider/EvitaniaPlanner/issues>.

For data corrections (item stats, drop rates, recipe ingredients, etc.), the underlying data files live in `src/data/` of the repo. PRs welcome.
