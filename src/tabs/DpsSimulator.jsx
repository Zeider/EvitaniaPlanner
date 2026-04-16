import { signal } from '@preact/signals';
import { activeProfile } from '../state/store.js';
import { computeStats, computeEffectiveDPS, computeEffectiveHP, computeTimeToDie, computeFarmingRates } from '../state/stat-engine.js';
import enemies from '../data/enemies.json';

/**
 * Build a flat list of all zone enemies across all acts for the dropdown.
 */
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

/**
 * Find an enemy by zone ID, fallback to first zone.
 */
function findEnemyByZone(zoneId) {
  return enemyList.find(e => e.zone === zoneId) || enemyList[0];
}

/** Format large numbers compactly. */
function fmt(n) {
  if (!isFinite(n) || isNaN(n)) return '---';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

/** Format seconds nicely. */
function fmtTime(seconds) {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '---';
  if (seconds >= 3600) return (seconds / 3600).toFixed(1) + 'h';
  if (seconds >= 60) return (seconds / 60).toFixed(1) + 'm';
  return seconds.toFixed(1) + 's';
}

/** Selected zone signal — initialized lazily per render from active profile. */
const selectedZone = signal(null);

export function DpsSimulator() {
  const profile = activeProfile.value;
  const stats = computeStats(profile);

  // Initialize selected zone from profile if not set
  if (selectedZone.value === null) {
    selectedZone.value = profile.currentZone || '1.0';
  }

  const enemy = findEnemyByZone(selectedZone.value);

  // Compute combat metrics
  const edps = computeEffectiveDPS(stats, enemy);
  const farmRates = computeFarmingRates(edps, enemy, stats);
  const timeToDie = computeTimeToDie(stats, enemy);
  const alivePercent = Math.min(1.0, timeToDie / 300) * 100;

  // Group enemies by act for the dropdown
  const actGroups = {};
  for (const e of enemyList) {
    const actLabel = 'Act ' + e.zone.split('.')[0];
    if (!actGroups[actLabel]) actGroups[actLabel] = [];
    actGroups[actLabel].push(e);
  }

  const onZoneChange = (e) => {
    selectedZone.value = e.target.value;
  };

  return (
    <div class="dps-sim">
      {/* ── Stats Comparison ── */}
      <div class="dps-sim__comparison">
        <div class="dps-sim__col dps-sim__col--player">
          <h3 class="dps-sim__col-title">Your Stats</h3>
          <div class="dps-sim__stat-list">
            <StatRow label="Total ATK" value={fmt(stats.totalAtk || stats.atk)} />
            <StatRow label="ATK Speed" value={(stats.atkSpeed || 0) + '%'} />
            <StatRow label="Crit Chance" value={(stats.critChance || 0) + '%'} />
            <StatRow label="Crit Damage" value={(stats.critDmg || 0) + '%'} />
            <StatRow label="Accuracy" value={fmt(stats.accuracy || 0)} />
            <StatRow label="HP" value={fmt(stats.hp || 0)} />
            <StatRow label="Phys DEF" value={fmt(stats.def || 0)} />
            <StatRow label="HP Regen" value={fmt(stats.hpRegen || 0)} />
          </div>
        </div>

        <div class="dps-sim__vs">VS</div>

        <div class="dps-sim__col dps-sim__col--enemy">
          <h3 class="dps-sim__col-title">Enemy</h3>
          <select class="dps-sim__enemy-select" value={selectedZone.value} onChange={onZoneChange}>
            {Object.entries(actGroups).map(([actLabel, enemies]) => (
              <optgroup label={actLabel} key={actLabel}>
                {enemies.map(e => (
                  <option value={e.zone} key={e.zone}>
                    {e.zone} — {e.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div class="dps-sim__stat-list">
            <StatRow label="HP" value={fmt(enemy.hp)} />
            <StatRow label="ATK" value={fmt(enemy.atk)} />
            <StatRow label="Armor" value={fmt(enemy.armor || 0)} />
            <StatRow label="Evasion" value={fmt(enemy.evasion || 0)} />
            <StatRow label="Accuracy" value={fmt(enemy.accuracy || 0)} />
            <StatRow label="Gold" value={String(enemy.gold)} />
            <StatRow label="XP" value={fmt(enemy.xp)} />
          </div>
        </div>
      </div>

      {/* ── Results Grid ── */}
      <div class="dps-sim__results">
        <ResultCard label="Effective DPS" value={fmt(edps)} accent="red" />
        <ResultCard label="Time to Kill" value={fmtTime(farmRates.timeToKill)} accent="orange" />
        <ResultCard label="Kills / Hour" value={fmt(farmRates.killsPerHour)} accent="yellow" />
        <ResultCard label="XP / Hour" value={fmt(farmRates.xpPerHour)} accent="blue" />
        <ResultCard label="Gold / Hour" value={fmt(farmRates.goldPerHour)} accent="gold" />
        <ResultCard label="Alive Time" value={alivePercent.toFixed(1) + '%'} accent="green" />
      </div>

    </div>
  );
}

/** Stat row inside player/enemy column */
function StatRow({ label, value }) {
  return (
    <div class="dps-sim__stat-row">
      <span class="dps-sim__stat-label">{label}</span>
      <span class="dps-sim__stat-value">{value}</span>
    </div>
  );
}

/** Result metric card */
function ResultCard({ label, value, accent }) {
  return (
    <div class={`dps-sim__card dps-sim__card--${accent}`}>
      <span class="dps-sim__card-label">{label}</span>
      <span class="dps-sim__card-value">{value}</span>
    </div>
  );
}
