import { signal } from '@preact/signals';
import { activeProfile } from '../state/store.js';
import { computeStats } from '../state/stat-engine.js';
import { rankAllUpgrades, autoCalibrate } from '../state/upgrade-scorer.js';
import { UpgradeRow } from '../components/UpgradeRow.jsx';
import enemies from '../data/enemies.json';
import hunterUpgradesData from '../data/hunter-upgrades.json';
import talentsData from '../data/talents.json';
import ashUpgradesData from '../data/ash-upgrades.json';
import sacrificesData from '../data/sacrifices.json';
import gearData from '../data/gear.json';

// --- Build flat lists for lookups ---

function buildEnemyList() {
  const list = [];
  for (const [actKey, actData] of Object.entries(enemies)) {
    if (!actData.zones) continue;
    for (const enemy of actData.zones) {
      list.push({ ...enemy, actKey });
    }
  }
  return list;
}

const enemyList = buildEnemyList();

function findEnemy(zoneId) {
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    const match = act.zones.find((e) => e.zone === zoneId);
    if (match) return match;
  }
  return enemies.act1.zones[0];
}

/**
 * Build a flat list of all gear items grouped by slot, sorted by total stat power
 * (sum of all stat values + atk + def) so we can find "next tier" items.
 */
function buildGearBySlot() {
  const bySlot = {};
  for (const category of Object.values(gearData)) {
    for (const subcategory of Object.values(category)) {
      if (!Array.isArray(subcategory)) continue;
      for (const item of subcategory) {
        const slot = item.slot;
        if (!bySlot[slot]) bySlot[slot] = [];
        // Compute a rough "power" for sorting
        let power = (item.atk || 0) + (item.def || 0);
        if (item.stats) {
          for (const v of Object.values(item.stats)) power += v;
        }
        bySlot[slot].push({ ...item, _power: power });
      }
    }
  }
  // Sort each slot by power ascending
  for (const slot of Object.keys(bySlot)) {
    bySlot[slot].sort((a, b) => a._power - b._power);
  }
  return bySlot;
}

const gearBySlot = buildGearBySlot();

// --- Upgrade enumeration ---

function enumerateHunterUpgrades(profile) {
  const upgrades = [];
  for (const hu of hunterUpgradesData) {
    const currentRank = (profile.hunterUpgrades && profile.hunterUpgrades[hu.id]) || 0;
    if (currentRank >= hu.maxRank) continue;
    const nextRank = currentRank + 1;
    // Material cost scales with rank (rough: rank * 10 base materials)
    const materialQty = nextRank * 10;
    upgrades.push({
      type: 'hunter',
      id: hu.id,
      name: `${hu.name} (Rank ${nextRank})`,
      statChanges: { [hu.stat]: hu.perRank },
      materialCost: { [hu.material]: materialQty },
      farmTimeHours: 0.5,
    });
  }
  return upgrades;
}

function enumerateTalentUpgrades(profile) {
  const upgrades = [];
  for (const [treeName, tree] of Object.entries(talentsData)) {
    if (!tree.nodes) continue;
    for (const node of tree.nodes) {
      const currentPoints = (profile.talents && profile.talents[node.id]) || 0;
      if (currentPoints >= node.maxPoints) continue;
      // Skip skill nodes for stat-based scoring
      if (node.isSkill) continue;
      upgrades.push({
        type: 'talent',
        id: node.id,
        name: `${node.name} (${treeName})`,
        statChanges: { [node.stat]: node.perPoint },
        materialCost: {},
        farmTimeHours: 0,
      });
    }
  }
  return upgrades;
}

function enumerateAshUpgrades(profile) {
  const upgrades = [];
  for (const au of ashUpgradesData) {
    const currentRank = (profile.ashUpgrades && profile.ashUpgrades[au.id]) || 0;
    if (currentRank >= au.maxRank) continue;
    const nextRank = currentRank + 1;
    upgrades.push({
      type: 'ash',
      id: au.id,
      name: `${au.name} (Rank ${nextRank})`,
      statChanges: { [au.perRank.stat]: au.perRank.value },
      materialCost: { Ash: nextRank * 50 },
      farmTimeHours: 0.5,
    });
  }
  return upgrades;
}

function enumerateSacrificeUpgrades(profile) {
  const upgrades = [];
  for (const sac of sacrificesData) {
    const currentRank = (profile.sacrificeUpgrades && profile.sacrificeUpgrades[sac.id]) || 0;
    if (currentRank >= sac.maxRank) continue;
    const nextRank = currentRank + 1;
    upgrades.push({
      type: 'sacrifice',
      id: sac.id,
      name: `${sac.name} (Rank ${nextRank})`,
      statChanges: { [sac.stat]: sac.isMultiplier ? sac.perRank * 100 : sac.perRank },
      materialCost: { [sac.costItem]: nextRank, [`${sac.soul} Soul`]: 1 },
      farmTimeHours: 1.0,
    });
  }
  return upgrades;
}

function enumerateGearUpgrades(profile) {
  const upgrades = [];
  const currentGear = profile.gear || {};

  for (const [slot, items] of Object.entries(gearBySlot)) {
    const equipped = currentGear[slot];
    const equippedName = equipped && equipped.name;

    // Find the equipped item's index in the sorted list
    let equippedIdx = -1;
    if (equippedName) {
      equippedIdx = items.findIndex((i) => i.name === equippedName);
    }

    // The next upgrade is the item after the equipped one
    const nextIdx = equippedIdx + 1;
    if (nextIdx >= items.length) continue;

    const nextItem = items[nextIdx];
    // Compute stat delta between current and next
    const statChanges = {};
    const currentItem = equippedIdx >= 0 ? items[equippedIdx] : null;

    // ATK delta (weapons)
    if (nextItem.atk) {
      const currentAtk = currentItem && currentItem.atk ? currentItem.atk : 0;
      if (nextItem.atk - currentAtk !== 0) {
        statChanges.atk = nextItem.atk - currentAtk;
      }
    }

    // DEF delta (armor)
    if (nextItem.def) {
      const currentDef = currentItem && currentItem.def ? currentItem.def : 0;
      if (nextItem.def - currentDef !== 0) {
        statChanges.def = nextItem.def - currentDef;
      }
    }

    // Bonus stats delta
    const nextStats = nextItem.stats || {};
    const curStats = (currentItem && currentItem.stats) || {};
    const allStatKeys = new Set([...Object.keys(nextStats), ...Object.keys(curStats)]);
    for (const key of allStatKeys) {
      const delta = (nextStats[key] || 0) - (curStats[key] || 0);
      if (delta !== 0) {
        statChanges[key] = (statChanges[key] || 0) + delta;
      }
    }

    if (Object.keys(statChanges).length === 0) continue;

    upgrades.push({
      type: 'gear',
      id: `gear_${slot}_${nextItem.name}`,
      name: nextItem.name,
      statChanges,
      materialCost: nextItem.recipe ? { [nextItem.recipe]: 1 } : {},
      farmTimeHours: nextItem.recipe ? 1.0 : 0.5,
    });
  }

  return upgrades;
}

function enumerateAllUpgrades(profile) {
  return [
    ...enumerateHunterUpgrades(profile),
    ...enumerateTalentUpgrades(profile),
    ...enumerateAshUpgrades(profile),
    ...enumerateSacrificeUpgrades(profile),
    ...enumerateGearUpgrades(profile),
  ];
}

// --- UI State ---

const FILTER_TYPES = ['all', 'hunter', 'gear', 'talent', 'ash', 'sacrifice'];

const selectedZone = signal('');
const activeFilter = signal('all');
const autoMode = signal(true);
const offenseSlider = signal(80); // 0-100

export function UpgradeAdvisor() {
  const profile = activeProfile.value;

  // Default zone to profile's current zone
  if (!selectedZone.value) {
    selectedZone.value = profile.currentZone || '1.0';
  }

  const enemy = findEnemy(selectedZone.value);
  const stats = computeStats(profile);

  // Weights
  const weights = autoMode.value
    ? autoCalibrate(95) // Default to 95% alive for auto
    : { offenseWeight: offenseSlider.value / 100, defenseWeight: (100 - offenseSlider.value) / 100 };

  const offPct = Math.round(weights.offenseWeight * 100);
  const defPct = Math.round(weights.defenseWeight * 100);

  // Enumerate and rank
  const allUpgrades = enumerateAllUpgrades(profile);
  const ranked = rankAllUpgrades(stats, allUpgrades, enemy, weights);

  // Filter
  const filtered = activeFilter.value === 'all'
    ? ranked
    : ranked.filter((u) => u.type === activeFilter.value);

  return (
    <div class="upgrade-advisor">
      <div class="upgrade-advisor__controls">
        <label>
          Target Zone:{' '}
          <select
            value={selectedZone.value}
            onChange={(e) => { selectedZone.value = e.target.value; }}
          >
            {enemyList.map((e) => (
              <option key={e.zone} value={e.zone}>
                {e.zone} - {e.name}
              </option>
            ))}
          </select>
        </label>

        <div class="upgrade-advisor__filters">
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              class={`upgrade-advisor__filter-btn ${activeFilter.value === type ? 'active' : ''}`}
              onClick={() => { activeFilter.value = type; }}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div class="upgrade-advisor__weight-group">
          <label class="upgrade-advisor__auto-toggle">
            <input
              type="checkbox"
              checked={autoMode.value}
              onChange={(e) => { autoMode.value = e.target.checked; }}
            />
            Auto
          </label>
          {!autoMode.value && (
            <input
              type="range"
              min="0"
              max="100"
              value={offenseSlider.value}
              onInput={(e) => { offenseSlider.value = Number(e.target.value); }}
            />
          )}
          <span class="upgrade-advisor__weight-label">
            {autoMode.value ? 'Auto: ' : ''}{offPct}/{defPct}
          </span>
        </div>
      </div>

      <div class="upgrade-advisor__table-wrap">
        {filtered.length === 0 ? (
          <div class="upgrade-advisor__empty">No available upgrades found. Import a save to see recommendations.</div>
        ) : (
          <table class="upgrade-advisor__table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Upgrade Name</th>
                <th>Type</th>
                <th>Power Gain</th>
                <th>Cost</th>
                <th>Farm Time</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <UpgradeRow key={u.id} rank={i + 1} upgrade={u} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
