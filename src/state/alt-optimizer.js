import { computeStats, computeEffectiveDPS, computeTimeToDie, computeFarmingRates } from './stat-engine.js';
import enemiesData from '../data/enemies.json';

/**
 * Parse a zone string like "2.3" into { act: 2, zone: 3 } for sorting.
 */
function parseZone(zoneStr) {
  const [act, zone] = zoneStr.split('.').map(Number);
  return { act, zone };
}

/**
 * Compare two zone strings numerically (e.g., "1.10" > "1.9").
 */
function compareZones(a, b) {
  const pa = parseZone(a);
  const pb = parseZone(b);
  if (pa.act !== pb.act) return pa.act - pb.act;
  return pa.zone - pb.zone;
}

/**
 * Get all zone enemies from enemies.json as a flat array.
 */
function getAllZoneEnemies() {
  const enemies = [];
  for (const actData of Object.values(enemiesData)) {
    if (!actData.zones) continue;
    for (const enemy of actData.zones) {
      enemies.push(enemy);
    }
  }
  return enemies;
}

/**
 * Collect all known zone IDs for determining canPushTo.
 */
function getAllZoneIds() {
  const ids = new Set();
  for (const actData of Object.values(enemiesData)) {
    if (!actData.zones) continue;
    for (const enemy of actData.zones) {
      ids.add(enemy.zone);
    }
  }
  return ids;
}

/**
 * Given a zone string, return the next sequential zone string.
 * E.g., "2.8" -> "2.9", "1.14" -> "1.15"
 */
function nextZone(zoneStr) {
  const { act, zone } = parseZone(zoneStr);
  return `${act}.${zone + 1}`;
}

const SURVIVAL_THRESHOLD = 60;

/**
 * Build a capability matrix for a single alt profile.
 * Determines which zones they can farm, their rates, and push potential.
 */
export function buildCapabilityMatrix(profile) {
  const stats = computeStats(profile);
  const allEnemies = getAllZoneEnemies();
  const allZoneIds = getAllZoneIds();

  const eligibleZones = [];
  const maxUnlocked = profile.maxUnlockedZone || null;

  // If the profile has game-provided offline rates, use those as anchor
  // and scale for other zones by relative enemy HP
  const gameKillsPerHour = profile.farmingRates?.killsPerHour || 0;
  const gameCurrentZone = profile.currentZone || '';
  const currentZoneEnemy = allEnemies.find(e => e.zone === gameCurrentZone);
  const anchorHP = currentZoneEnemy?.hp || 0;

  for (const enemy of allEnemies) {
    // Skip zones beyond the player's unlocked progression
    if (maxUnlocked && compareZones(enemy.zone, maxUnlocked) > 0) continue;

    if (maxUnlocked && gameKillsPerHour > 0 && anchorHP > 0) {
      // Scale game's real rate by relative enemy HP
      // Weaker mobs (lower HP) = proportionally more kills/hr
      const scaledKillsPerHour = gameKillsPerHour * (anchorHP / Math.max(enemy.hp, 1));
      const xpPerHour = scaledKillsPerHour * (enemy.xp || 0);
      eligibleZones.push({
        zone: enemy.zone,
        mob: enemy.name,
        killsPerHour: scaledKillsPerHour,
        survivalTime: Infinity,
        xpPerHour,
        estimated: enemy.zone !== gameCurrentZone,
      });
    } else {
      const eDPS = computeEffectiveDPS(stats, enemy);
      const timeToDie = computeTimeToDie(stats, enemy);

      if (maxUnlocked || (timeToDie >= SURVIVAL_THRESHOLD && eDPS > 0)) {
        const rates = computeFarmingRates(Math.max(eDPS, 1), enemy, stats);
        eligibleZones.push({
          zone: enemy.zone,
          mob: enemy.name,
          killsPerHour: rates.killsPerHour,
          survivalTime: timeToDie,
          xpPerHour: rates.xpPerHour,
          estimated: eDPS <= 0,
        });
      }
    }
  }

  // Sort by zone progression
  eligibleZones.sort((a, b) => compareZones(a.zone, b.zone));

  // maxZone = user-set limit if available, otherwise stat-based highest
  const maxZone = maxUnlocked || (eligibleZones.length > 0
    ? eligibleZones[eligibleZones.length - 1].zone
    : null);

  let canPushTo = null;
  if (maxZone) {
    const next = nextZone(maxZone);
    if (allZoneIds.has(next)) {
      canPushTo = next;
    }
  }

  return {
    altName: profile.name,
    altClass: profile.class,
    altLevel: profile.level,
    zones: eligibleZones,
    mining: { level: profile.miningLevel || 1 },
    woodcutting: { level: profile.woodcuttingLevel || 1 },
    maxZone,
    canPushTo,
    currentZone: profile.currentZone,
    offlineRates: profile.farmingRates,
    profile,
  };
}

/**
 * Greedy assignment: match bottlenecks to capable alts, then assign leftovers.
 */
export function assignAlts(bottlenecks, matrices) {
  const assigned = new Set();
  const assignments = [];

  for (const bn of bottlenecks) {
    if (assigned.size >= matrices.length) break;

    if (bn.boss) {
      // Boss farming is manual, skip
      continue;
    }

    if (bn.zone) {
      // Find unassigned alt that can farm this zone, pick best items/hr
      let bestAlt = null;
      let bestRate = -1;

      for (const m of matrices) {
        if (assigned.has(m.altName)) continue;
        const zoneData = m.zones.find(z => z.zone === bn.zone);
        if (!zoneData) continue;

        // Use game's offline rate if alt is currently parked at this zone
        let killsPerHour = zoneData.killsPerHour;
        if (m.currentZone === bn.zone && m.offlineRates && m.offlineRates.killsPerHour > 0) {
          killsPerHour = m.offlineRates.killsPerHour;
        }
        const itemsPerHour = killsPerHour / (bn.dropRate || 1);
        if (itemsPerHour > bestRate) {
          bestRate = itemsPerHour;
          bestAlt = m;
        }
      }

      if (bestAlt) {
        const remaining = (bn.needed || 0) - (bn.owned || 0);
        assigned.add(bestAlt.altName);
        assignments.push({
          altName: bestAlt.altName,
          type: 'farm',
          zone: bn.zone,
          resource: bn.resource,
          reason: `${bn.upgrade} needs ${remaining} ${bn.resource}`,
          rate: Math.round(bestRate),
          rateUnit: `${bn.resource}/hr`,
          eta: remaining / bestRate,
          powerGain: bn.powerGain,
          priority: bn.priority,
          profile: bestAlt.profile,
        });
      }
      continue;
    }

    if (bn.activity) {
      // Find unassigned alt whose profession level meets requirement
      let bestAlt = null;
      let bestLevel = -1;

      for (const m of matrices) {
        if (assigned.has(m.altName)) continue;

        let level = 0;
        if (bn.activity === 'mining') level = m.mining.level;
        else if (bn.activity === 'woodcutting') level = m.woodcutting.level;

        if (level >= (bn.minLevel || 0) && level > bestLevel) {
          bestLevel = level;
          bestAlt = m;
        }
      }

      if (bestAlt) {
        assigned.add(bestAlt.altName);
        assignments.push({
          altName: bestAlt.altName,
          type: 'profession',
          activity: bn.activity,
          resource: bn.resource,
          reason: `${bn.upgrade} needs ${bn.resource}`,
          minLevel: bn.minLevel,
          priority: bn.priority,
          powerGain: bn.powerGain,
          profile: bestAlt.profile,
        });
      }
      continue;
    }
  }

  // Assign remaining unassigned alts
  for (const m of matrices) {
    if (assigned.has(m.altName)) continue;

    if (m.canPushTo) {
      assignments.push({
        altName: m.altName,
        type: 'push',
        zone: m.maxZone,
        reason: `Push to ${m.canPushTo} to unlock new resources`,
        profile: m.profile,
      });
    } else if (m.maxZone) {
      assignments.push({
        altName: m.altName,
        type: 'xp',
        zone: m.maxZone,
        reason: 'Farm XP at highest zone',
        profile: m.profile,
      });
    }

    assigned.add(m.altName);
  }

  return assignments;
}
