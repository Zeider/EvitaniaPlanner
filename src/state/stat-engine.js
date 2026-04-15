import classData from '../data/classes.json';
import hunterUpgradesData from '../data/hunter-upgrades.json';
import talentsData from '../data/talents.json';
import gearData from '../data/gear.json';

/**
 * Build a flat lookup of all gear items by name.
 */
function buildGearLookup() {
  const lookup = {};
  for (const category of Object.values(gearData)) {
    for (const subcategory of Object.values(category)) {
      if (!Array.isArray(subcategory)) continue;
      for (const item of subcategory) {
        lookup[item.name] = item;
      }
    }
  }
  return lookup;
}

const gearLookup = buildGearLookup();

/**
 * Build a flat lookup of all talent nodes across all trees.
 */
function buildTalentLookup() {
  const lookup = {};
  for (const tree of Object.values(talentsData)) {
    if (!tree.nodes) continue;
    for (const node of tree.nodes) {
      lookup[node.id] = node;
    }
  }
  return lookup;
}

const talentLookup = buildTalentLookup();

/**
 * Default stat template with all fields initialized to zero.
 */
function defaultStats() {
  return {
    hp: 0, def: 0, atk: 0, atkPercent: 0, atkSpeed: 0,
    critChance: 0, critDmg: 0, mana: 0, manaRegen: 0,
    magicFind: 0, bonusXp: 0, accuracy: 0, moveSpeed: 0,
    hpRegen: 0, str: 0, dex: 0, int: 0, con: 0, men: 0,
    mobSpawnReduction: 0, goldMulti: 0, xpMulti: 0, offlineGains: 0,
    miningPower: 0, woodcuttingPower: 0, defPercent: 0,
    totalAtk: 0,
  };
}

/**
 * Add a value to a stat field, handling the name mapping between
 * data files (which use various names) and our canonical stat object.
 */
function addStat(stats, statName, value) {
  // Map data-file stat names to our canonical field names
  const mapping = {
    critDamage: 'critDmg',
    mobSpawn: 'mobSpawnReduction',
    offline: 'offlineGains',
    allXp: 'xpMulti',
    physDef: 'def',
    magicDef: 'def', // simplified: fold magic def into def
    wcPower: 'woodcuttingPower',
  };

  const key = mapping[statName] || statName;

  if (key in stats) {
    stats[key] += value;
  }
  // Silently ignore unknown stats (skills, percent-based crafting stats, etc.)
}

/**
 * Takes a character profile, returns aggregated stats object.
 * Three-layer computation: base class -> flat additions -> multipliers.
 */
export function computeStats(profile) {
  const stats = defaultStats();

  // --- Layer 1: Base stats from class ---
  const classInfo = classData[profile.class];
  if (classInfo && classInfo.stats) {
    for (const [key, value] of Object.entries(classInfo.stats)) {
      addStat(stats, key, value);
    }
  }

  // --- Layer 2: Flat additions ---

  // Hunter Upgrades
  if (profile.hunterUpgrades) {
    for (const upgrade of hunterUpgradesData) {
      const rank = profile.hunterUpgrades[upgrade.id] || 0;
      if (rank > 0) {
        addStat(stats, upgrade.stat, upgrade.perRank * rank);
      }
    }
  }

  // Talent Tree
  if (profile.talents) {
    for (const [nodeId, points] of Object.entries(profile.talents)) {
      const node = talentLookup[nodeId];
      if (!node || points <= 0) continue;

      // Skip skill nodes (they don't add numeric stats)
      if (node.isSkill) continue;

      addStat(stats, node.stat, node.perPoint * points);
    }
  }

  // Gear
  if (profile.gear) {
    for (const slotData of Object.values(profile.gear)) {
      if (!slotData || !slotData.name) continue;

      const item = gearLookup[slotData.name];
      if (!item) continue;

      // Weapons: add atk from the weapon's atk field
      if (item.slot === 'weapon' && item.atk) {
        stats.atk += item.atk;
      }

      // Armor: add def from the armor's def field
      if (item.def && item.slot !== 'weapon') {
        stats.def += item.def;
      }

      // Apply all bonus stats from the item
      if (item.stats) {
        for (const [key, value] of Object.entries(item.stats)) {
          addStat(stats, key, value);
        }
      }
    }
  }

  // --- Layer 3: Multipliers ---

  // Primary stat scaling
  const primaryStat = classInfo?.primaryStat;
  if (primaryStat === 'str') {
    stats.atk += stats.str * 0.10 * stats.atk;
  } else if (primaryStat === 'dex') {
    stats.atk += stats.dex * 0.10 * stats.atk;
  } else if (primaryStat === 'int') {
    stats.atk += stats.int * 0.10 * stats.atk;
  }

  // ATK% multiplier
  stats.totalAtk = stats.atk * (1 + stats.atkPercent / 100);

  // CON scaling
  stats.hp += stats.hp * (stats.con * 0.05);
  stats.hpRegen += stats.hpRegen * (stats.con * 0.01);

  // DEF% multiplier
  stats.def = stats.def * (1 + stats.defPercent / 100);

  return stats;
}

/**
 * Takes computed stats + enemy data, returns damage per second.
 */
export function computeEffectiveDPS(stats, enemy) {
  const totalAtk = stats.totalAtk ?? stats.atk;
  const atkSpeed = stats.atkSpeed || 0;
  const critChance = stats.critChance || 0;
  const critDmg = stats.critDmg || 0;
  const accuracy = stats.accuracy || 0;
  const enemyEvasion = enemy.evasion || 0;

  const baseDPS = totalAtk * (1 + atkSpeed / 100);
  const critMultiplier = 1 + (critChance / 100) * (critDmg / 100);
  const denom = accuracy + enemyEvasion;
  const hitRate = denom > 0 ? Math.min(1.0, accuracy / denom) : (accuracy > 0 ? 1.0 : 0);

  return baseDPS * critMultiplier * hitRate;
}

/**
 * Takes computed stats + enemy data, returns effective HP.
 */
export function computeEffectiveHP(stats, enemy) {
  const physDef = stats.def || 0;
  const enemyAtk = enemy.atk || 0;
  const totalHP = stats.hp || 0;

  const denom = physDef + enemyAtk;
  const damageReduction = denom > 0 ? physDef / denom : 0;
  const divisor = 1 - damageReduction;
  return divisor > 0 ? totalHP / divisor : totalHP;
}

/**
 * Takes computed stats + enemy data, returns seconds until death.
 */
export function computeTimeToDie(stats, enemy) {
  const def = stats.def || 0;
  const enemyAtk = enemy.atk || 0;
  const hp = stats.hp || 0;
  const hpRegen = stats.hpRegen || 0;

  const denom = def + enemyAtk;
  const damageReduction = denom > 0 ? def / denom : 0;
  const incomingDPS = enemyAtk * (1 - damageReduction);
  const netDamage = incomingDPS - hpRegen;
  if (netDamage <= 0) return Infinity; // out-healing the damage
  return hp / netDamage;
}

/**
 * Takes DPS + enemy + utility stats, returns farming rate metrics.
 */
export function computeFarmingRates(effectiveDPS, enemy, utilStats) {
  const BASE_MOB_SPAWN = 3;
  const BASE_TRAVEL = 1;

  const mobSpawnReduction = utilStats.mobSpawnReduction || 0;
  const moveSpeed = utilStats.moveSpeed || 0;
  const xpMulti = utilStats.xpMulti || 0;
  const goldMulti = utilStats.goldMulti || 0;

  const timeToKill = enemy.hp / Math.max(0.01, effectiveDPS);
  const mobSpawnTime = BASE_MOB_SPAWN * (1 - mobSpawnReduction / 100);
  const travelTime = BASE_TRAVEL / (1 + moveSpeed / 100);
  const timePerKill = timeToKill + mobSpawnTime + travelTime;
  const killsPerHour = 3600 / timePerKill;
  const xpPerHour = killsPerHour * (enemy.xp || 0) * (1 + xpMulti / 100);
  const goldPerHour = killsPerHour * (enemy.gold || 0) * (1 + goldMulti / 100);

  return {
    killsPerHour,
    xpPerHour,
    goldPerHour,
    timeToKill,
    timePerKill,
  };
}
