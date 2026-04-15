import { signal } from '@preact/signals';
import { activeProfile } from '../state/store.js';
import { computeStats } from '../state/stat-engine.js';
import { rankAllUpgrades, autoCalibrate } from '../state/upgrade-scorer.js';
import { enumerateAllUpgrades } from '../state/upgrade-enumerator.js';
import { UpgradeRow } from '../components/UpgradeRow.jsx';
import enemies from '../data/enemies.json';

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
