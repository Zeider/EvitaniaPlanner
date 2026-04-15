import { computeEffectiveDPS, computeEffectiveHP } from './stat-engine.js';

/**
 * Scores a single upgrade by computing DPS/EHP delta and dividing by farm time.
 * Returns the upgrade object augmented with offenseDelta, defenseDelta, powerDelta, score.
 */
export function scoreUpgrade(currentStats, upgrade, enemy, weights) {
  // 1. Clone stats, apply upgrade's stat changes
  const afterStats = { ...currentStats };
  for (const [stat, delta] of Object.entries(upgrade.statChanges)) {
    afterStats[stat] = (afterStats[stat] || 0) + delta;
  }
  // Recompute totalAtk if atk-related stats changed
  if (upgrade.statChanges.atk !== undefined || upgrade.statChanges.atkPercent !== undefined) {
    afterStats.totalAtk = afterStats.atk * (1 + (afterStats.atkPercent || 0) / 100);
  }

  // 2. Compute deltas
  const dpsBefore = computeEffectiveDPS(currentStats, enemy);
  const dpsAfter = computeEffectiveDPS(afterStats, enemy);
  const offenseDelta = dpsAfter - dpsBefore;

  const ehpBefore = computeEffectiveHP(currentStats, enemy);
  const ehpAfter = computeEffectiveHP(afterStats, enemy);
  const defenseDelta = ehpAfter - ehpBefore;

  // 3. Weighted power delta
  const powerDelta = offenseDelta * weights.offenseWeight + defenseDelta * weights.defenseWeight;

  // 4. Score = power per hour of farming (infinity if free)
  const score = upgrade.farmTimeHours <= 0 ? Infinity : powerDelta / upgrade.farmTimeHours;

  return { ...upgrade, offenseDelta, defenseDelta, powerDelta, score };
}

/**
 * Scores all upgrades and sorts by score descending.
 * Returns sorted array of scored upgrades.
 */
export function rankAllUpgrades(currentStats, upgrades, enemy, weights) {
  const scored = upgrades.map((u) => scoreUpgrade(currentStats, u, enemy, weights));
  scored.sort((a, b) => {
    // Infinity first, then descending
    if (b.score === Infinity && a.score === Infinity) return 0;
    if (b.score === Infinity) return 1;
    if (a.score === Infinity) return -1;
    return b.score - a.score;
  });
  return scored;
}

/**
 * Returns offense/defense weights based on survival rate.
 * < 90% alive → 0.4/0.6, < 95% → 0.6/0.4, >= 95% → 0.8/0.2
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
