import { computeStats } from './stat-engine.js';
import { enumerateAllUpgrades } from './upgrade-enumerator.js';
import { rankAllUpgrades, autoCalibrate } from './upgrade-scorer.js';
import enemiesData from '../data/enemies.json';
import dropsData from '../data/drops.json';

/**
 * Find the enemy object for a given zone string (e.g. "2.1") from enemies.json.
 */
function findEnemy(zoneId) {
  for (const act of Object.values(enemiesData)) {
    if (!act.zones) continue;
    for (const enemy of act.zones) {
      if (enemy.zone === zoneId) return enemy;
    }
  }
  return null;
}

/**
 * Check whether an upgrade has any farmable materials in drops.json.
 */
function hasFarmableMaterials(upgrade) {
  if (!upgrade.materialCost) return false;
  for (const [mat, qty] of Object.entries(upgrade.materialCost)) {
    if (qty <= 0) continue;
    const source = dropsData.resources[mat];
    if (source && !source.craft) return true;
  }
  return false;
}

/**
 * Detects farming bottlenecks by finding which resources block the highest-value upgrades.
 *
 * Scans scored upgrades in ranked order, collecting the top N that require
 * farmable materials (free upgrades like talent points are skipped since
 * they aren't farming bottlenecks).
 *
 * @param {object} profile - Character profile
 * @param {number} topN - Number of top material-requiring upgrades to inspect (default 10)
 * @returns {Array<object>} Bottleneck entries sorted by priority (ascending, 1 = highest)
 */
export function detectBottlenecks(profile, topN = 10) {
  // 1. Compute current stats
  const stats = computeStats(profile);

  // 2. Find the enemy for the current zone
  const enemy = findEnemy(profile.currentZone);
  if (!enemy) return [];

  // 3. Get weights from autoCalibrate
  const weights = autoCalibrate(95);

  // 4. Enumerate and rank all upgrades
  const upgrades = enumerateAllUpgrades(profile);
  const ranked = rankAllUpgrades(profile, stats, upgrades, enemy, weights);

  // 5. Collect top N upgrades that have farmable materials
  const topUpgrades = [];
  for (const upgrade of ranked) {
    if (hasFarmableMaterials(upgrade)) {
      topUpgrades.push(upgrade);
      if (topUpgrades.length >= topN) break;
    }
  }

  // 6. Extract bottleneck resources from those upgrades
  const seen = new Set();
  const bottlenecks = [];

  for (let i = 0; i < topUpgrades.length; i++) {
    const upgrade = topUpgrades[i];
    const priority = i + 1;

    for (const [materialName, quantity] of Object.entries(upgrade.materialCost)) {
      if (quantity <= 0) continue;

      // Deduplicate by resource name (first occurrence wins)
      if (seen.has(materialName)) continue;

      // Look up the source in drops.json resources index
      const source = dropsData.resources[materialName];
      if (!source) continue; // Skip items not in the resource index
      if (source.craft) continue; // Skip crafted-only items

      seen.add(materialName);

      const entry = {
        upgrade: upgrade.name,
        upgradeType: upgrade.type,
        resource: materialName,
        needed: quantity,
        owned: 0,
        priority,
        powerGain: upgrade.powerDelta,
        score: upgrade.score,
      };

      // Attach source info
      if (source.zone !== undefined) {
        entry.zone = source.zone;
        entry.dropRate = source.rate;
      } else if (source.boss !== undefined) {
        entry.boss = source.boss;
        entry.dropRate = source.rate;
      } else if (source.activity !== undefined) {
        entry.activity = source.activity;
        entry.minLevel = source.minLevel;
      }

      bottlenecks.push(entry);
    }
  }

  // Sort by priority ascending (should already be ordered, but ensure it)
  bottlenecks.sort((a, b) => a.priority - b.priority);

  return bottlenecks;
}
