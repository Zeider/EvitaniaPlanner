# EvitaniaPlanner — patch notes (May 4–7, 2026)

A four-day sprint that shifted the planner from "manual data entry"
toward "your save tells the planner what you have." Big themes:
GUID mapping, hunter cost calibration, and inventory auto-fill.

---

## Stash + inventory: no more typing in your stockpile

Previously every "Owned" field on the Progression tab was hand-typed
and the Upgrade Advisor's farm-time estimate ignored your stash
entirely.

- **491 stash items now resolve to game names.** Bulk-extracted from
  the game's Items_en localization — gear, curios, rune fragments,
  resources/consumables, cards, pet unlocks, engineer outputs all
  show up by name in the Storage tab.
- **Storage tab regrouped into 12 semantic sections** (Raw Materials,
  Stones, Brews & Potions, Boss Drops, Pet Items, Event Items, Cards,
  Rune Fragments, Currencies, Storage Unlocks, Time Items, Other).
  86 resources in a single amount-sorted block became browsable.
- **Inventory auto-fills from your save.** Open Progression and your
  stash counts are already in the "Owned" column. The Upgrade
  Advisor's farm-time estimate now subtracts what you already have
  before estimating the bottleneck. Manual edits still work for
  what-if planning; clearing a field falls back to the stash count.
- **GUID columns dropped** on the Storage and Engineer tabs now that
  everything resolves to readable names.

## Engineer tab: stockpile by item name

- **Stockpile shows item names** (Idea / Blueprint / Runic Blueprint /
  Sun Scroll) instead of GUIDs. Mapping confirmed by cross-referencing
  in-game stockpile counts against the save data.
- The GUID column is gone; the slot upgrades column is still GUID-only
  until those get observed in-game.

## Cards tab: full boss titles + typo fixes

- **Boss cards show their full canonical names**: Maevath, Champion
  of the Blue · Yrsainir, Champion of the Red · Jötunn, son of
  Jötunn · Zhai Halud's Gate.
- **Resource cards show vein/tree suffixes**: Copper Vein, Iron Vein,
  Thorium Vein, Sunstone Vein, Ash Tree, Pyrewood Tree, Ironwood Tree.
- Typo fixes: "Ciphered Bilding" → "Ciphered Billding"; "Entomed
  Mask" → "Entombed Mask" (in curios.json).
- Card-bonus calculations are unchanged — these are display fields
  layered on top of the existing keys, so the math you've seen stays
  identical.

## Hunter Cost Reduction → real exponential cost scaling

The Upgrade Advisor's farm-time estimate for hunter upgrades was
using a placeholder of `rank × 10` materials per level — at rank 30
that suggested 300 of material when the real cost was approaching
1 million. Off by ~1000×.

Now: per-rank cost grows exponentially with a per-upgrade growth
rate and per-upgrade max rank. Calibrated from in-game observation:

| Upgrade | Growth | Max | Anchor |
|---|---|---|---|
| More Damage Training | 1.70 | 45 | rank 30 → 919K Fire Essence |
| Hunter Cost Reduction | 1.50 | 45 | rank 31 → 37M Gold |
| Speed Training | 1.54 | 30 | rank 26 → 8.10M Gold |
| Smeltery Speed Training | 1.70 | 45 | rank 13 → 111 Steel Bar |

The other 17 hunter upgrades still use the old placeholder until
they get one observation each. Drop a screenshot of any rank with
the daily Hunter Discount dismissed and I'll add the anchor.

(The daily Hunter Discount is a flat 60% off — its presence cancels
out in the per-rank growth ratio, so the *shape* of the curve is
robust. The *base* values reflect your permanent discount stack.)

## Earlier in the window (May 4–5)

- **v3.2.15** — same-name hero keying fix; the planner used to
  collapse two heroes with identical names into one slot.
- **v3.2.16** — new Daily Vendor Purchases panel on Dashboard +
  Engineer upgrade catalog.
- **v3.2.17** — 38 pet skin GUIDs from bulk asset extraction; pet
  skins now resolve by name everywhere.
- Vendor daily limits + gold costs filled in for Acts 1 and 3.

---

## What's still on placeholder (acknowledged gaps)

- **17 of 21 hunter upgrades** — cost still uses old `rank × 10`
  fallback. One screenshot each unlocks proper estimates.
- **Hunter discount stack** isn't modeled in the planner — costs
  shown reflect raw base × per-rank growth, not what you'll actually
  pay after the daily discount, gem-shop cruncher, hunter-cost-
  reduction stat, and engineer refund chance combine.
- **Mystery /30 upgrade** in row 2 col 4 of the hunter panel
  (current rank 29, green plant icon) — likely Accuracy Training
  but not yet confirmed.
- **Recipe tree definitions, Bonfire heat curve, Pet tier scaling,
  Achievement triggers** — all blocked by the SerializeReference
  wall in the game's Unity asset deserializer. Cpp2IL stubs method
  bodies, and the runtime config values live in serialized .asset
  files we can't read without a paid AssetRipper plan that doesn't
  hit the same wall. Dev TODOs has the full list.

## Methodology note

The big unlock this window was discovering that the game's Items_en
localization keys *embed item GUIDs directly* — `item_<guid>_name`,
`curio_<guid>`, `card_<guid>_name`. This bypassed the
SerializeReference wall that defeated AssetRipper for the cosmetic
deserializer pass: 491 GUID→name pairs harvested via UnityPy +
TypeTreeGenerator alone, no premium tools needed. Tools cached at
`C:/Users/Jeremy/Tools/UnityPy-extract/` for re-running on game
updates.
