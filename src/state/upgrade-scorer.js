import { computeStats, computeEffectiveDPS, computeEffectiveHP } from './stat-engine.js';

/**
 * Clone a profile and apply a single upgrade mutation so the stat engine
 * can recompute all three layers with the upgrade in place.
 */
function applyUpgrade(profile, upgrade) {
  const p = {
    ...profile,
    talents: { ...(profile.talents || {}) },
    hunterUpgrades: { ...(profile.hunterUpgrades || {}) },
    ashUpgrades: { ...(profile.ashUpgrades || {}) },
    sacrificeUpgrades: { ...(profile.sacrificeUpgrades || {}) },
    gear: {},
  };

  // Shallow-clone each gear slot so mutations don't leak
  for (const [slot, data] of Object.entries(profile.gear || {})) {
    p.gear[slot] = data ? { ...data } : null;
  }

  switch (upgrade.type) {
    case 'talent':
      p.talents[upgrade.id] = (p.talents[upgrade.id] || 0) + 1;
      break;
    case 'hunter':
      p.hunterUpgrades[upgrade.id] = (p.hunterUpgrades[upgrade.id] || 0) + 1;
      break;
    case 'ash':
      p.ashUpgrades[upgrade.id] = (p.ashUpgrades[upgrade.id] || 0) + 1;
      break;
    case 'sacrifice':
      p.sacrificeUpgrades[upgrade.id] = (p.sacrificeUpgrades[upgrade.id] || 0) + 1;
      break;
    case 'gear':
      if (upgrade.gearSlot) {
        p.gear[upgrade.gearSlot] = { name: upgrade.gearName, enhancementLevel: 0 };
      }
      break;
  }
  return p;
}

/**
 * Scores a single upgrade by recomputing full stats through the stat engine
 * with the upgrade applied, then comparing DPS/EHP deltas.
 */
export function scoreUpgrade(profile, currentStats, upgrade, enemy, weights) {
  const mutatedProfile = applyUpgrade(profile, upgrade);
  const afterStats = computeStats(mutatedProfile);

  const dpsBefore = computeEffectiveDPS(currentStats, enemy);
  const dpsAfter = computeEffectiveDPS(afterStats, enemy);
  const offenseDelta = dpsAfter - dpsBefore;

  const ehpBefore = computeEffectiveHP(currentStats, enemy);
  const ehpAfter = computeEffectiveHP(afterStats, enemy);
  const defenseDelta = ehpAfter - ehpBefore;

  const powerDelta = offenseDelta * weights.offenseWeight + defenseDelta * weights.defenseWeight;
  const score = upgrade.farmTimeHours <= 0 ? Infinity : powerDelta / upgrade.farmTimeHours;

  return { ...upgrade, offenseDelta, defenseDelta, powerDelta, score };
}

/**
 * Scores all upgrades and sorts by score descending.
 */
export function rankAllUpgrades(profile, currentStats, upgrades, enemy, weights) {
  const scored = upgrades
    .map((u) => scoreUpgrade(profile, currentStats, u, enemy, weights));
  scored.sort((a, b) => {
    if (b.score === Infinity && a.score === Infinity) return b.powerDelta - a.powerDelta;
    if (b.score === Infinity) return 1;
    if (a.score === Infinity) return -1;
    return b.score - a.score;
  });
  return scored;
}

/**
 * Returns offense/defense weights based on survival rate.
 */
export function autoCalibrate(aliveTimePercent) {
  if (aliveTimePercent < 90) {
    return { offenseWeight: 0.4, defenseWeight: 0.6 };
  }
  if (aliveTimePercent < 95) {
    return { offenseWeight: 0.6, defenseWeight: 0.4 };
  }
  return { offenseWeight: 0.8, defenseWeight: 0.2 };
}
