import { activeProfile } from '../state/store.js';
import { computeStats, computeEffectiveDPS, computeEffectiveHP } from '../state/stat-engine.js';
import { StatCard } from '../components/StatCard.jsx';
import enemies from '../data/enemies.json';

/**
 * Find enemy data for a given zone ID (e.g. "1.0", "2.3") across all acts.
 */
function findEnemy(zoneId) {
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    const match = act.zones.find(e => e.zone === zoneId);
    if (match) return match;
  }
  // Fallback to first zone of act1
  return enemies.act1.zones[0];
}

export function Dashboard() {
  const profile = activeProfile.value;
  const stats = computeStats(profile);

  const enemy = findEnemy(profile.currentZone);

  const edps = computeEffectiveDPS(stats, enemy);
  const ehp = computeEffectiveHP(stats, enemy);
  const rates = profile.farmingRates;

  // Format numbers: 1000 → 1K, 1000000 → 1M
  const fmt = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  };

  return (
    <div class="dashboard">
      <div class="dashboard__grid">
        <StatCard title="Power Summary" accent="red" items={[
          { label: 'Offensive Power', value: fmt(edps), color: 'red' },
          { label: 'Defensive Power', value: fmt(ehp), color: 'blue' },
          { label: 'Effective DPS', value: fmt(edps) + '/s', color: 'orange' },
          { label: 'Total ATK', value: fmt(stats.totalAtk || stats.atk) },
        ]} />
        <StatCard title={`Farming Rates (${profile.currentZone})`} accent="green" items={[
          { label: 'Kills/Hour', value: fmt(rates.killsPerHour) },
          { label: 'XP/Hour', value: fmt(rates.xpPerHour), color: 'blue' },
          { label: 'Gold/Hour', value: fmt(rates.goldPerHour), color: 'yellow' },
        ]} />
        <StatCard title="Character Info" accent="purple" items={[
          { label: 'Name', value: profile.name },
          { label: 'Class', value: profile.class },
          { label: 'Level', value: String(profile.level) },
          { label: 'Zone', value: profile.currentZone },
        ]} />
      </div>
    </div>
  );
}
