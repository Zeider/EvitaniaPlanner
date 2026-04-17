export function ReleaseNotes() {
  return (
    <div class="release-notes">
      <h2 class="release-notes__title">Release Notes</h2>

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
