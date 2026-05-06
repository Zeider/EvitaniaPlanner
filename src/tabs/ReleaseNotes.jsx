export function ReleaseNotes() {
  return (
    <div class="release-notes">
      <h2 class="release-notes__title">Release Notes</h2>

      <div class="release-notes__version">
        <h3>v3.2.17 <span class="release-notes__date">May 5, 2026</span></h3>

        <h4>38 Pet Skin GUIDs Mapped (Bulk Asset Extraction)</h4>
        <ul>
          <li>Bulk-extracted via Cpp2IL + UnityPy + TypeTreeGenerator from the game's compiled asset bundle. The 38 pet skin GUIDs (Animated Armor Skin, Astral Head Skin, Basic Bat Skin, …, Winged Observer Skin) now resolve to friendly names everywhere <code>PET_SKIN_GUID_MAP</code> is consulted.</li>
          <li>Save extraction's <code>activePet</code> output now includes the equipped pet's <code>skin</code> name when the GUID is known.</li>
          <li>Item / curio / recipe ScriptableObject classes use Unity's <code>[SerializeReference]</code> polymorphic serialization which can't be deserialized with free tooling — those still get filled in per-save observation. AssetRipper Premium would unblock the rest in one pass; pending decision until BadBotExe license response.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.16 <span class="release-notes__date">May 5, 2026</span></h3>

        <h4>Daily Vendor Purchases + Engineer Upgrade Catalog</h4>
        <ul>
          <li><strong>Daily Vendor Purchases panel</strong> on the Dashboard (replaces the old Daily Tasks): three act sections (Act 1: Solid Fuel + Enhance Stone 1; Act 2: Crystalized Yellow Substance + Enhance Stone 2; Act 3: Crystallized Blue Substance + Enhance Stone 3) with checkboxes that auto-reset on day rollover. Per-act <em>Engineer +stock</em> input applies your Vendor Stock rank (max +6 Act 1 from idea+blueprint slots, +3 Acts 2/3) to the displayed daily count. Daily limit + gold cost are editable per row and persist to the profile, so you can fill in numbers as you observe them in-game.</li>
          <li><strong>Engineer tab</strong> now shows what each slot produces (Idea / Blueprint / Runic Blueprint / Sun Scroll) and how many upgrades exist in each slot's tree (5 / 11 / 15 / 9 = 40 total). A <em>Show all upgrades</em> toggle reveals the full catalog with effects, max levels, and per-level costs (table-based and exponential cost progressions both rendered).</li>
          <li>New <code>src/data/engineer-upgrades.json</code> — 40 upgrades with names, effects, costs (pre-expanded for exponential ones using <code>base × growth^(level-offset)</code>). Game data cross-referenced from in-game observation and BadBotExe's evi reference site (license-clearing PR pending).</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.15 <span class="release-notes__date">May 4, 2026</span></h3>

        <h4>Same-name Heroes No Longer Collide on Import + How-To Guide</h4>
        <ul>
          <li>Profile keys now include the hero's slot index (<code>&lt;name-slug&gt;-&lt;index&gt;</code>), so two heroes with the same name in one save (or across saves) are kept distinct instead of overwriting each other. Re-imports update the same key, not a new one. Legacy bare-slug entries are migrated when their hero is re-imported.</li>
          <li>Added <code>GUIDE.md</code> at the repo root — a per-feature walkthrough covering every tab, the top-bar buttons, how the calculations work, and known limitations. Will eventually become a Help tab in the app; for now it's discoverable on the GitHub repo.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.14 <span class="release-notes__date">May 4, 2026</span></h3>

        <h4>7 More Gear GUIDs + Steam Ring magicFind Fix</h4>
        <ul>
          <li>Mapped: Steel Belt, Harvest Gloves, Steam Ring, Sunstone Axe, Christmas Longsword, Second Anniversary Belt. With these, all 4 community-test-save heroes (ProGamer, SenorDabs, Timmay, Graviton) now have every equipped slot identified.</li>
          <li>Steam Ring's <code>gear.json</code> entry was missing <code>magicFind: 10</code> — added (confirmed at enh+0).</li>
          <li>Added <code>Second Anniversary Belt</code> to <code>gear.json</code> (mobSpawn -20, offline +3, allXp +10) — the first Anniversary Belt is a different item (positive mobSpawn).</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.13 <span class="release-notes__date">May 4, 2026</span></h3>

        <h4>12 New Gear GUID Mappings (Infinite I, Sunstone, Event Items)</h4>
        <ul>
          <li>Identified and mapped from a community save (tripleog, save version 0.310.2): Infinite Chestplate I, Infinite Gloves I, Infinite Boots I, Infinite Longsword I, Sunstone Longsword, Christmas Gloves, Valentine Belt, Rabbit's Foot, Ashen Ring, Second Anniversary Cap, Second Anniversary Pickaxe, Second Anniversary Axe.</li>
          <li>Equipped gear for save imports now displays the correct names instead of raw GUIDs in the Gear Planner and the Storage tab. Stat calculations only apply where <code>gear.json</code> already had the item; Second Anniversary tools currently show name-only because we don't have base (enh+0) stat values yet.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.12 <span class="release-notes__date">May 4, 2026</span></h3>

        <h4>Grouped Tab Nav + Report Issue Button</h4>
        <ul>
          <li>Tab nav reorganized into 4 categories so it stops scrolling: <strong>Dashboard</strong> · <strong>Character ▾</strong> (Gear, Skills, Cards, Runes, Engineer) · <strong>Inventory ▾</strong> (Storage, Crafting) · <strong>Planning ▾</strong> (Upgrade Advisor, Progression, Alt Advisor) · <strong>DPS Sim</strong>. Group buttons highlight when one of their children is the active tab. Click outside or press Escape to close an open dropdown.</li>
          <li>Dropdowns render with <code>position: fixed</code> anchored to the trigger's bounding rect, so they escape the nav's <code>overflow-x: auto</code> clipping and remain fully visible on narrow screens where horizontal scroll is still active.</li>
          <li>New <strong>Report Issue</strong> button in the top bar opens a prefilled GitHub issue with planner version, active tab, profile state, and browser — no API key needed, you edit the template and submit. Save-file contents are deliberately NOT included to avoid leaking character state into a public tracker.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.11 <span class="release-notes__date">May 4, 2026</span></h3>

        <h4>Progression — Intermediate Inventory Counts Toward Goals</h4>
        <ul>
          <li>The Progression tab's Inventory now tracks <strong>processed intermediates</strong> (Thorium Bar, Chadcoal, Perfect Fur, etc.) alongside raw materials. Owning 30 Thorium Bars cuts the raw Thorium Ore requirement from 1974 → 714 — fully-stocked intermediates short-circuit their entire sub-tree (no more being told to mine ore for bars you've already smelted).</li>
          <li>Algorithm: top-down expansion that greedily consumes inventory at each recipe level before recursing. Across pieces in a gear set, intermediates are shared via a single allocation pool so 30 bars can't be double-counted across 5 pieces.</li>
          <li>Shopping List shows intermediates as italic "craft" rows below the raw materials, with no ETA (their farming time is captured by their ingredient rows). The Inventory section makes them editable so you can punch in your stockpile counts directly.</li>
          <li><strong>percentComplete</strong> now credits work-already-done via intermediates: covered = (raw saved by intermediates) + (raw owned directly) ÷ (total raw work). Stockpiling bars no longer shows 0% progress when it represents most of the smelting work.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.10 <span class="release-notes__date">May 1, 2026</span></h3>

        <h4>Storage Tab — Read Your In-Game Stash</h4>
        <ul>
          <li>New <strong>Storage</strong> tab surfaces the player's shared stash from save imports — gear (with enhancement + durability) and resources, sorted by enhancement and amount respectively.</li>
          <li><code>extractStash</code> in <code>save-decoder.js</code> walks <code>Inventory.stash</code>, filters empty slots, and discriminates gear vs. resource by presence of the <code>Durability</code> field (gear has it even when 0; resources never do).</li>
          <li>Names resolve via <code>GEAR_GUID_MAP</code>; resource GUIDs are unmapped today and surface as truncated GUIDs — fill in a future <code>RESOURCE_GUID_MAP</code> as you identify them.</li>
        </ul>

        <h4>Engineer Tab — Patch 0.310.0 Mechanic Support</h4>
        <ul>
          <li>New <strong>Engineer</strong> tab decodes the Act 2 Engineer system added in patch 0.310.0: 4 production slots (enabled/disabled/stalled), per-slot upgrade levels, shared stockpile, and the <code>engineer_slot_upgrade</code> gem-shop rank.</li>
          <li><code>extractEngineer</code> in <code>save-decoder.js</code> returns null for pre-0.310.0 saves (no <code>Engineer</code> block) and buckets every <code>engineer_*</code> key from <code>ProgressProfile.Enhancements</code> for forward-compat with future unlocks (already saw <code>engineer_unlock_item2</code> in live saves).</li>
          <li>Last-produced timestamps decoded from .NET <code>DateTime.ToBinary()</code> (Kind=Local) and rendered as relative time. Number-precision loss near 2^62 (~10µs) is harmless at second resolution.</li>
          <li>Upgrade GUIDs and recipe outputs aren't yet mapped to names — surfaced as raw GUIDs with rank counts so you can correlate against in-game observation.</li>
        </ul>

        <h4>Dashboard Tooltip Fix</h4>
        <ul>
          <li>The Boss Readiness footnote was leaking the literal text <code>{'\\u00f7'}</code>/<code>{'\\u2264'}</code>/<code>{'\\u00d7'}</code> instead of rendering as <code>÷</code>/<code>≤</code>/<code>×</code>. JSX text content doesn't interpret JavaScript escape sequences (only string literals do). Fixed by using the actual Unicode characters directly.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.9 <span class="release-notes__date">May 1, 2026</span></h3>

        <h4>Progression Tab — Infinite Set Was Missing</h4>
        <ul>
          <li><strong>Bug</strong>: the Progression tab's <em>Set</em> picker dropped Infinite tier entirely. Both the dropdown's tier extractor and the planner's recipe filter required armor names to end at the slot word (e.g. <code>"Infinite Helmet"</code>), but Infinite recipes are named with a Roman-numeral generation suffix (<code>"Infinite Helmet I"</code>), which neither code path tolerated. Result: zero Infinite pieces resolved even though individual-piece selection still worked.</li>
          <li>Fix: extract tier as <code>"&lt;Name&gt; &lt;Gen&gt;"</code> (e.g. <code>"Infinite I"</code>) when a Roman-numeral suffix is present, and have the planner split that label and gate suffix matching on the generation. Bare tiers (Thorium, Sunstone, …) keep the original code path — no profile migration needed.</li>
          <li>Forward-compatible with future <code>"Infinite II"</code> / <code>"Infinite III"</code> generations: each gen will surface as its own selectable set rather than silently merging.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.8 <span class="release-notes__date">April 29, 2026</span></h3>

        <h4>Hunter Mining/Woodcutting Trainings — Were Silently Dropped</h4>
        <ul>
          <li><strong>Major bug</strong>: <code>hunter-upgrades.json</code>'s Mining Training and Woodcutting Training entries used stat names <code>miningPercent</code> / <code>woodcuttingPercent</code> that weren't in <code>defaultStats</code>. <code>addStat</code> dropped them silently. With each rank giving +3% Power and players easily hitting 26+ ranks each (+78% per stat), this was an enormous mining/wc undercount.</li>
          <li>Fix: aliased <code>miningPercent</code> → <code>miningPowerPercent</code> and <code>woodcuttingPercent</code> → <code>wcPowerPercent</code> in <code>addStat</code>'s mapping table.</li>
          <li>Verified: Zeider's mining power moved 662 → 877, woodcutting 610 → 848. Remaining gap to in-game (1782 / 2119) is consistent with profession-skill tiers 5-8 not yet documented.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.7 <span class="release-notes__date">April 29, 2026</span></h3>

        <h4>Curio Level Scaling — Real Endpoints</h4>
        <ul>
          <li><strong>4 curios calibrated</strong> from in-game level-N readings:
            <ul>
              <li>Pandemonium Egg primaryValueMax 89 (L1=20 → L12=35.5%)</li>
              <li>Century Tome primaryValueMax 57 (L1=19.8 → L10=26.6%)</li>
              <li>Necromancer's Hand primaryValueMax 90 (L1=31.2 → L10=42%)</li>
              <li>Entomed Mask primaryValueMax 1.54 (L1=1.20 → L11=1.27)</li>
            </ul>
          </li>
          <li><strong>ATK rarity L50 endpoints added</strong>: blue 1.21, purple 1.26 (from in-game observation; orange 1.30 was already documented).</li>
        </ul>

        <h4>Curio physDef Multiplier Bug</h4>
        <ul>
          <li><code>sacStatToKey</code> didn't have <code>physDef → def</code>, so Entomed Mask + Ceremonial Dagger physDef×N multipliers were silently dropped on the curio multiplicative path. Added that mapping plus <code>magicDef → def</code>, <code>critDamage → critDmg</code>, and <code>allXp/allExp → xpMulti</code> for consistency with addStat.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.6 <span class="release-notes__date">April 29, 2026</span></h3>

        <h4>Bonfire Bug Fix</h4>
        <ul>
          <li><strong>Mining/WC bonfire buffs now apply.</strong> The +100% Mining Power (heat 1400) and +100% Woodcutting Power (heat 900) bonuses were silently dropped because <code>miningPowerPercent</code> and <code>wcPowerPercent</code> weren't in <code>defaultStats</code>. Added them and the additive→final-value step.</li>
          <li><strong>Note:</strong> Bonfire heat isn't stored in the save (only fuel/rate). Set heat manually in the Bonfire panel to see these buffs apply.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.5 <span class="release-notes__date">April 29, 2026</span></h3>

        <h4>Stat Engine — Sacrifice Coefficients (in-game verified)</h4>
        <ul>
          <li><strong>HP gap closed +56% → +3%</strong> by correcting Food Donation's perRank from 0.08 to 0.03 (in-game observation: rank 15 = 1.45×, rank 16 = 1.48×).</li>
          <li><strong>Three more sacrifice perRanks corrected</strong>: Mining Edge Technology 0.14 → 0.10, Wish for Knowledge 0.07 → 0.03, Wish for Hardness 0.09 → 0.05. All four now match the in-game sacrifice menu's displayed multipliers.</li>
          <li><strong>Pattern</strong>: spreadsheet values for sacrifice multipliers are systematically inflated (1.4× to 2.7×). Trust the in-game sacrifice menu, not the community sheet, for these coefficients.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.4 <span class="release-notes__date">April 28, 2026</span></h3>

        <h4>Cards Tab</h4>
        <ul>
          <li><strong>Manual Card Count Override</strong> — Click any card's count to type your in-game value. Overrides persist to localStorage and win over save-imported counts. Shown in amber when overridden; tooltip shows the underlying save value. <em>"Clear all"</em> button when any overrides are active.</li>
          <li><strong>Why?</strong> The save's <code>Currency.cards</code> map is incomplete — most Act 1 zone cards are stored server-side and don't appear locally. Manual overrides bridge the gap so Cards/hr and Time-to-next-tier estimates are accurate.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.3 <span class="release-notes__date">April 28, 2026</span></h3>

        <h4>Stat Engine</h4>
        <ul>
          <li><strong>Profession Skills</strong> — Mining and woodcutting skill trees now contribute to stats. New <code>profession-skills.json</code> data file with tiers 0–4 (43 nodes). Higher tiers (5+) are present in saves but not yet documented in the spreadsheet — engine ignores them silently for now.</li>
          <li><strong>Curio Level Scaling</strong> — Equipped curios now interpolate <code>primaryValue</code> and rarity-based ATK bonus from level 1 to 50 when the L50 value is known. Currently only Orange ATK rarity (1.15→1.30) and Ever Eclipsed Sun (50→200%) have L50 values; others held at L1 until learned.</li>
          <li><strong>Hardmode Detection</strong> — Save's <code>ActDifficulty</code> map now extracted into profile. Boss Readiness scales boss HP/ATK by difficulty (Hard ≈ ×16) and shows the difficulty next to the boss subtitle.</li>
        </ul>

        <h4>Save Import</h4>
        <ul>
          <li><strong>Gem Shop Upgrades</strong> documented in <code>gemshop.json</code>. Most are crafting/economy buffs (smeltery speed, fuel efficiency, librarian discount) — not combat stats — so they don't yet affect computeStats. Surfaced as data for future UI.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.2 <span class="release-notes__date">April 28, 2026</span></h3>

        <h4>New: Cards Tab</h4>
        <ul>
          <li><strong>All Cards in One Place</strong> — Act 1 / 2 / 3 / Resource / Hard Mode cards with their stat, drop zone, your count, current tier, active bonus, estimated cards/hr, and time to next tier. Cards/hr is computed from your effective DPS at the drop zone.</li>
          <li><strong>cards.json Rebuilt from Spreadsheet</strong> — Act 1 zone/stat misalignments fixed (Wasp now Mana, Pebble now Mining Power, etc.), 4 new Act 3 cards added (Ciphered Bilding, Mummy, Djinn, Horus), every card now has a <code>dropRate</code> field, and Glass/Bringer of Death stats corrected.</li>
        </ul>

        <h4>Boss Readiness — Reworked</h4>
        <ul>
          <li><strong>All 7 Bosses</strong> across Act 1 / 2 / 3 (was Act 2 only).</li>
          <li><strong>TTK-Based Readiness</strong> — boss HP ÷ effective DPS. Killed / Ready (≤5min) / Far instead of arbitrary kills/hour thresholds.</li>
          <li><strong>Killed Detection Fixed</strong> — Maevath previously misdetected because the save uses scene name <code>2.bossBlueDragon</code>, not <code>2.boss-3</code>. All 7 boss scenes now matched via multi-pattern lookup.</li>
          <li><strong>Boss ATK Filled In</strong> — Maevath (1.9K) and Kangaroo Boss (5K) added to enemies.json.</li>
        </ul>

        <h4>Save Import</h4>
        <ul>
          <li><strong>Card Key Normalization</strong> — Save uses inconsistent casing/diacritics (<code>BossCrab</code>, <code>ice-mammoth</code>, <code>jotunn</code>, <code>BlueDragon</code>). Normalized at decode to canonical cards.json names so Card Bonuses and the new Cards tab resolve correctly.</li>
        </ul>

        <h4>Navigation</h4>
        <ul>
          <li><strong>DPS Sim</strong> — renamed and moved to last position in tab nav. Functionality unchanged.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.1 <span class="release-notes__date">April 28, 2026</span></h3>

        <h4>Save Import</h4>
        <ul>
          <li><strong>Curio System Decoded</strong> — Equipped curios are now read from save and contribute to stats (rarity-based ATK multiplier, primary stat bonuses, tier bonuses). Previously the engine had the math but the decoder never populated it, leaving 5+ slots' worth of power off the calculation. Initial GUID mappings: Pandemonium Egg, Ceremonial Dagger, Century Tome, Entomed Mask, Swirling Tear, Necromancer's Hand.</li>
          <li><strong>New Gear GUID</strong> — Thorium Bow now auto-equips on import.</li>
          <li><strong>New Rune GUID</strong> — KI (Phys DEF t1) added to inventory recognition.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.2.0 <span class="release-notes__date">April 22, 2026</span></h3>

        <h4>Rune Planner</h4>
        <ul>
          <li><strong>Socketable Right Now</strong> — New panel at the top of the Rune Planner lists the runewords you can assemble from your current rune inventory, with bonus summaries. Click <em>Plan</em> on any entry to jump to that combo's progress view.</li>
          <li><strong>Auto-Populated Inventory</strong> — When you import a save, rune counts fill in automatically across every combo's inputs. Values are still editable for what-if planning.</li>
          <li><strong>Smarter Rune Detection</strong> — Equipped runes across multi-row setups now decode correctly; previously some rows were missed when runes occupied non-contiguous slot positions.</li>
        </ul>

        <h4>Save Import</h4>
        <ul>
          <li><strong>More Gear Auto-Detected</strong> — 7 new gear GUID mappings: Thorium Boots, Steel Longsword, Tower Ring, Ring of STR, Straw Hat, Copper Boots, Copper Pickaxe.</li>
          <li><strong>Rune Inventory Loaded from Save</strong> — Unequipped runes in your rune bag are now read into the planner automatically, not just the equipped ones.</li>
          <li><strong>Runeword Recognition</strong> — Save import identifies your active and discovered runewords (currently mapped: PRE x 6 and GOR MU HAS; more as they're found).</li>
        </ul>

        <h4>Data</h4>
        <ul>
          <li><strong>Straw Hat</strong> — Quest reward helmet added to gear data with stats (STR +1, CON +2, Def 5).</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.1.0 <span class="release-notes__date">April 19, 2026</span></h3>

        <h4>New: Progression Tab</h4>
        <ul>
          <li><strong>Target Picker</strong> — Pick a gear set (Copper / Bronze / Iron / Thorium / Sunstone) or any single piece as your goal. Weapon is auto-filtered by class.</li>
          <li><strong>Summary</strong> — Quantity-weighted progress bar and total farming ETA.</li>
          <li><strong>Pieces List</strong> — Per-piece ETA plus expandable material breakdown.</li>
          <li><strong>Shopping List</strong> — Every base material needed, sorted by longest farming time first, with source (zone / vendor / mining / woodcutting / boss / quest) and color-coded rough-estimate flags.</li>
          <li><strong>Inventory Editor</strong> — Inline material counts persist to profile. First visit pulls in whatever you had typed into the Crafting tab.</li>
          <li><strong>Observed-Rate Prompt</strong> — For mining/woodcutting materials, enter your in-game per-hour readout to refine the ETA from a placeholder.</li>
        </ul>

        <h4>Data: drops.json</h4>
        <ul>
          <li><strong>30+ New Material Sources</strong> — Synced from the community spreadsheet. Coverage went from 37 recipe ingredients missing in drops.json to zero.</li>
          <li><strong>Name Fixes</strong> — Ash Log, Pyrewood Log, Ironwood Log, Jotunn Eye, Mini Plants, Stoney Mcstoneface now match recipe ingredient spellings. "Mammoth Bitusk" in Thorium Axe recipe corrected to "Mammoth Tusk".</li>
          <li><strong>New Source Types</strong> — Quest rewards (e.g. Animal Bone from the Act 1 Boar quest) now have a dedicated ETA path.</li>
        </ul>

        <h4>Warrior Talent Tree</h4>
        <ul>
          <li><strong>Critical Damage maxPoints</strong> — T9 Critical Damage corrected from 2 to 10 (verified against in-game screenshot).</li>
          <li><strong>Hub Connection Lines</strong> — Intra-tier connections (e.g. Crit Chance → Dragon Soul / Movespeed) now render as a visible side bracket instead of confusing backward diagonals.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.0.6 <span class="release-notes__date">April 18, 2026</span></h3>

        <h4>Community Feedback</h4>
        <ul>
          <li><strong>Talent Recommendations Always Visible</strong> — Upgrade Advisor now shows talent power gains even when all points are allocated, so you can plan ahead for future levels.</li>
          <li><strong>Show Downgrades Toggle</strong> — New checkbox in Upgrade Advisor to show negative power suggestions for comparing alternatives (e.g. Summer Boots vs Thorium Boots).</li>
          <li><strong>Sortable Columns</strong> — Click Power Gain, Farm Time, or Score headers to sort ascending/descending.</li>
        </ul>

        <h4>Data</h4>
        <ul>
          <li><strong>14 Event Items Added</strong> — Summer Boots, Harvest Shirt/Gloves, Christmas armor set + weapons, Halloween Helmet, Anniversary Cap/tools. All marked unobtainable but available for comparison in Gear Planner.</li>
          <li><strong>Stat Engine Calibration</strong> — Formula restructured to match game's Base x Additive x Multiplicative model. Attack Wish sacrifice corrected (0.09 to 0.05/rank). Hunter multiplicative changed from compound to linear. Gear CON values corrected from spreadsheet.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.0.5 <span class="release-notes__date">April 17, 2026</span></h3>

        <h4>Stat Engine</h4>
        <ul>
          <li><strong>PRE Rune Stats</strong> — Premium runes now correctly apply ATK +30, Magic Find +2, and Offline Gains +2% per rune. Previously showed no stat contribution.</li>
        </ul>

        <h4>Infrastructure</h4>
        <ul>
          <li><strong>E2E Test Suite</strong> — 21 Playwright browser tests covering save import, gear planner, upgrade advisor, character switching, and all tabs.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.0.4 <span class="release-notes__date">April 17, 2026</span></h3>

        <h4>Save Import</h4>
        <ul>
          <li><strong>Gear Auto-Detection</strong> — Save import now resolves gear GUIDs to item names. 17 items mapped (Bronze/Iron armor, Essence Sword, Steel Bow/Staff, belts, accessories, tools). Gear stats and enhancement levels flow into the stat engine automatically.</li>
          <li><strong>Equipped Runes</strong> — Save import extracts equipped runes from all rune rows. 10 rune GUIDs mapped (PRE, OLU, GOR, MU, HAS, NIL, FUS, YIT, RYS, WOM). Rune word detection works automatically.</li>
        </ul>

        <h4>Upgrade Advisor Fixes</h4>
        <ul>
          <li><strong>Talent Point Budget</strong> — Fixed off-by-one: talent budget is now level-1 (no point at level 1). Fully allocated characters no longer see phantom talent suggestions.</li>
          <li><strong>Real Farm Time Estimates</strong> — Farm times now use actual kill rates and drop data instead of hardcoded guesses. Zone drops scale with your kills/hour, vendor items show days needed, boss drops estimate per-attempt time.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.0.3 <span class="release-notes__date">April 17, 2026</span></h3>

        <h4>Data</h4>
        <ul>
          <li><strong>Ash Tree Rewrite</strong> — Complete rewrite of the Act 2 bonfire ash upgrade tree from in-game data. Now 25 nodes across 11 tiers (was 16 nodes across 6 rows). Correct node order, names, effects, and max ranks. Multiple Attack Increase and Smeltery Speed nodes across the tree. Existing saves should be re-imported.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.0.2 <span class="release-notes__date">April 17, 2026</span></h3>

        <h4>New Features</h4>
        <ul>
          <li><strong>Boss Readiness Panel</strong> — Dashboard now shows kill-rate thresholds for Act 2 bosses (500/h Mammoth, 1,000/h Jotunn, 1,000/h+ Maevath) with defeated/ready/not-ready indicators.</li>
          <li><strong>Progression Milestones</strong> — Gear Planner shows collapsible milestone tips for each Act 2 boss with recommended gear tiers and enhancement levels.</li>
          <li><strong>Daily Vendor Reminders</strong> — Dashboard reminds you to buy 50 Yellow Substance daily and shows how many days of purchases are needed for Thorium gear.</li>
          <li><strong>4th Alt Slot Gating</strong> — Alt Advisor now correctly shows only 3 character slots until zone 2.6 (Watches) is unlocked.</li>
        </ul>

        <h4>Data</h4>
        <ul>
          <li><strong>Charcoal Smelting</strong> — Added ironwood charcoal recipe (10 ironwood → 3 charcoal, 3,300 fuel vs 1,000 raw).</li>
          <li><strong>Gear Upgrade Order</strong> — Fixed gear progression to use correct tier order (Copper → Bronze → Iron → Thorium → Infinite → Sunstone) instead of raw stat sum sorting.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.0.1 <span class="release-notes__date">April 16, 2026</span></h3>

        <h4>Upgrade Advisor Fixes</h4>
        <ul>
          <li><strong>Accurate Power Gain Scoring</strong> — Upgrade scoring now reruns the full 3-layer stat engine with each upgrade applied, properly capturing multiplicative interactions (ATK%, primary stat scaling, sacrifice multipliers, hunter multiplicative, etc.). Previously, small upgrades like talent points showed 0.0 power gain.</li>
          <li><strong>Class-Locked Weapon Suggestions</strong> — Gear suggestions now respect class weapon restrictions: Rogues see bows only, Warriors see swords/longswords, Mages see staves. No more longsword suggestions for archers.</li>
          <li><strong>Better Small-Number Display</strong> — Power gain and score columns now show adaptive precision for small values instead of truncating to 0.0.</li>
          <li><strong>Free Upgrade Sorting</strong> — Talent points and other free upgrades (score: Infinity) now sort by power gain descending, so the most impactful free upgrade shows first.</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v3.0.0 <span class="release-notes__date">April 16, 2026</span></h3>

        <h4>New Features</h4>
        <ul>
          <li><strong>Alt Advisor</strong> — Recommends where to park your 3 offline alts for maximum account progress. Detects bottleneck resources, evaluates zone capability per alt, and assigns farming targets with ETAs.</li>
          <li><strong>Dashboard Buffs Panel</strong> — Bonfire heat input, equipped runes with rune word detection, active pet selector with level scaling, card tier overview.</li>
          <li><strong>Enhancement Scaling</strong> — Gear ATK/DEF now scales with enhancement level. Visible in Gear Planner with +1 preview.</li>
          <li><strong>Full Stat Engine</strong> — Sacrifice multipliers, bonfire buffs, ash upgrades, cards, runes, curios, and pet bonuses all integrated into stat calculations.</li>
        </ul>

        <h4>Data Overhaul</h4>
        <ul>
          <li><strong>Talent Trees</strong> — Completely rewritten from community spreadsheet. Rogue (38 nodes), Warrior (34), Mage (28), each with 11 tiers and correct connection patterns.</li>
          <li><strong>Cards</strong> — 4-tier system with correct values and multiplier card support.</li>
          <li><strong>Curios</strong> — 20 real items with rarity tiers and tier bonuses.</li>
          <li><strong>Pets</strong> — 35 real pets with level-50 scaling values.</li>
          <li><strong>Gear</strong> — 7 belts, 4 accessories added. Boss drops and event items flagged.</li>
          <li><strong>Drop Tables</strong> — Full mob drop tables for all Act 1-3 zones and bosses.</li>
          <li><strong>Enemies</strong> — Act 2 and Act 3 zone names corrected.</li>
        </ul>

        <h4>Save Import Improvements</h4>
        <ul>
          <li>Auto-extracts active pet (name + level) per character</li>
          <li>Auto-detects max unlocked zone from save progression</li>
          <li>Extracts defeated bosses for sacrifice gating</li>
        </ul>

        <h4>Bug Fixes</h4>
        <ul>
          <li>Upgrade Advisor: class-filtered talents, talent point budget, subtype-aware gear suggestions</li>
          <li>Skill Trees: allocations persist across tab switches, improved connection visibility</li>
          <li>Gear Planner: enhancement level input, unobtainable badges</li>
          <li>Sacrifice suggestions gated by defeated bosses</li>
          <li>Various data corrections (novice maxPoints, zone names, stat values)</li>
        </ul>

        <h4>Game Patch 0.309.0 Support</h4>
        <ul>
          <li>New bonfire tier at 1700 heat (Ash per Kill)</li>
          <li>Hunter "More Damage Training" updated to multiplicative x1.01/rank</li>
          <li>Act 3 zones 3.4-3.8 now drop HAS rune</li>
        </ul>
      </div>

      <div class="release-notes__version">
        <h3>v2.0.0 <span class="release-notes__date">April 15, 2026</span></h3>
        <ul>
          <li>Initial planning suite release</li>
          <li>Save file import with character extraction</li>
          <li>Upgrade Advisor, DPS Simulator, Gear Planner</li>
          <li>Interactive Skill Trees with build modes</li>
          <li>Crafting Calculator, Rune Planner</li>
          <li>Build sharing via URL</li>
        </ul>
      </div>
    </div>
  );
}
