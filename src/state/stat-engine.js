import classData from '../data/classes.json';
import hunterUpgradesData from '../data/hunter-upgrades.json';
import talentsData from '../data/talents.json';
import gearData from '../data/gear.json';
import sacrificesData from '../data/sacrifices.json';
import bonfireData from '../data/bonfire.json';
import ashUpgradesData from '../data/ash-upgrades.json';
import cardsData from '../data/cards.json';
import runesData from '../data/runes.json';
import petsData from '../data/pets.json';
import curiosData from '../data/curios.json';
import professionSkillsData from '../data/profession-skills.json';

const professionSkillLookup = (() => {
  const m = {};
  for (const node of professionSkillsData) m[node.id] = node;
  return m;
})();

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
    miningPowerPercent: 0, wcPowerPercent: 0,
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
    allExp: 'xpMulti',
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
 * Build a flat list of all card definitions with their threshold arrays.
 */
function buildCardList() {
  const list = [];
  const addCards = (cards, thresholds) => {
    for (const card of cards) {
      list.push({ ...card, thresholds });
    }
  };
  addCards(cardsData.act1Cards || [], cardsData.tierThresholds.act1);
  addCards(cardsData.act2Cards || [], cardsData.tierThresholds.act2);
  addCards(cardsData.act3Cards || [], cardsData.tierThresholds.act3);
  return list;
}

const allCards = buildCardList();

/**
 * Determine the tier (0-based index) a card has reached given the count.
 * Returns -1 if not even tier 1.
 */
function getCardTier(count, thresholds) {
  let tier = -1;
  for (let i = 0; i < thresholds.length; i++) {
    if (count >= thresholds[i]) tier = i;
    else break;
  }
  return tier;
}

/**
 * Build a lookup of rune name -> family/tier info for equipped rune stat calculation.
 */
function buildRuneLookup() {
  const lookup = {};
  for (const family of runesData.families) {
    for (const [tierKey, tierData] of Object.entries(family.tiers)) {
      if (tierData.rune) {
        lookup[tierData.rune] = {
          family: family.name,
          stat: family.stat,
          value: tierData.value,
          stats: tierData.stats || null, // multi-stat runes (e.g. PRE)
          tier: tierKey,
        };
      }
    }
  }
  return lookup;
}

const runeLookup = buildRuneLookup();

/**
 * Build a lookup of pet name -> pet data.
 */
function buildPetLookup() {
  const lookup = {};
  for (const pet of petsData) {
    lookup[pet.name] = pet;
  }
  return lookup;
}

const petLookup = buildPetLookup();

/**
 * Build a lookup of curio name -> curio data.
 */
function buildCurioLookup() {
  const lookup = {};
  for (const curio of curiosData.curios) {
    lookup[curio.name] = curio;
  }
  return lookup;
}

const curioLookup = buildCurioLookup();

/**
 * Check if the equipped runes contain all runes needed for a rune word.
 * Handles duplicate runes (e.g., FAL, FAL requires 2x FAL equipped).
 */
function isRuneWordActive(equipped, required) {
  const available = [...equipped];
  for (const rune of required) {
    const idx = available.indexOf(rune);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

/**
 * Map sacrifice stat names to canonical stat keys.
 */
/**
 * Linearly interpolate a curio value between its level-1 and level-50 amounts.
 * If no max is defined, returns the level-1 value unchanged (level scaling unknown).
 */
function scaleCurioValue(level1Value, level50Value, level) {
  if (level50Value == null || level <= 1) return level1Value;
  if (level >= 50) return level50Value;
  return level1Value + (level50Value - level1Value) * ((level - 1) / 49);
}

function sacStatToKey(stat) {
  // Canonical stat mapping shared by sacrifice and curio multiplicative paths.
  // Must align with addStat's mapping for the additive path.
  const map = {
    atk: 'atk', hp: 'hp', def: 'def',
    physDef: 'def', magicDef: 'def',
    wcPower: 'woodcuttingPower', miningPower: 'miningPower',
    xp: 'xpMulti', allXp: 'xpMulti', allExp: 'xpMulti',
    critDamage: 'critDmg',
  };
  return map[stat] || stat;
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

  // Hunter Upgrades (flat additions in Layer 2, multiplicative deferred to Layer 3)
  const hunterMultipliers = [];
  if (profile.hunterUpgrades) {
    for (const upgrade of hunterUpgradesData) {
      const rank = profile.hunterUpgrades[upgrade.id] || 0;
      if (rank > 0) {
        if (upgrade.isMultiplier) {
          hunterMultipliers.push({ stat: upgrade.stat, perRank: upgrade.perRank, rank });
        } else {
          addStat(stats, upgrade.stat, upgrade.perRank * rank);
        }
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

      const enhLevel = slotData.enhancementLevel || 0;

      // Weapons: ATK scales at 27.5% per enhancement level
      if (item.slot === 'weapon' && item.atk) {
        stats.atk += Math.round(item.atk * (1 + enhLevel * 0.275) * 10) / 10;
      }

      // Armor: DEF scales at 5% per enhancement level
      if (item.def && item.slot !== 'weapon') {
        stats.def += Math.round(item.def * (1 + enhLevel * 0.05) * 10) / 10;
      }

      // Bonus stats from the item (these do NOT scale with enhancement)
      if (item.stats) {
        for (const [key, value] of Object.entries(item.stats)) {
          addStat(stats, key, value);
        }
      }
    }
  }

  // Card bonuses (flat cards in Layer 2, multiplier cards deferred to Layer 3)
  const cardMultipliers = [];
  if (profile.cards) {
    for (const card of allCards) {
      const count = profile.cards[card.enemy] || 0;
      if (count <= 0) continue;
      const tier = getCardTier(count, card.thresholds);
      if (tier < 0) continue;
      const value = card.tierValues[tier];
      if (value == null) continue;

      if (card.isMultiplier) {
        cardMultipliers.push({ stat: card.stat, value });
      } else {
        addStat(stats, card.stat, value);
      }
    }
  }

  // Rune bonuses (flat stats from equipped runes + rune word bonuses)
  if (profile.equippedRunes && Array.isArray(profile.equippedRunes)) {
    // Individual rune stats
    for (const runeName of profile.equippedRunes) {
      const info = runeLookup[runeName];
      if (!info) continue;
      if (info.stats) {
        // Multi-stat runes (e.g. PRE: ATK+30, MF+2, Offline+2%)
        for (const [stat, value] of Object.entries(info.stats)) {
          addStat(stats, stat, value);
        }
      } else if (info.value != null) {
        addStat(stats, info.stat, info.value);
      }
    }

    // Rune word detection and bonuses
    for (const word of runesData.runeWords) {
      if (isRuneWordActive(profile.equippedRunes, word.runes)) {
        for (const [stat, value] of Object.entries(word.bonuses)) {
          if (stat === 'atkMulti') {
            // atkMulti is a multiplier, defer to Layer 3
            cardMultipliers.push({ stat: 'atk', value });
          } else {
            addStat(stats, stat, value);
          }
        }
      }
    }
  }

  // Active pet global bonus: linear scaling = level50 * (0.189 + 0.0162 * level)
  if (profile.activePet) {
    const petName = typeof profile.activePet === 'string' ? profile.activePet : profile.activePet.name;
    const petLevel = typeof profile.activePet === 'object' ? (profile.activePet.level || 1) : 1;
    const pet = petLookup[petName];
    if (pet && pet.globalBonus && pet.globalBonus.level50) {
      const value = pet.globalBonus.level50 * (0.189 + 0.0162 * petLevel);
      const stat = pet.globalBonus.stat;
      // Percentage-based bonuses map to their percent stat (e.g., atk -> atkPercent)
      if (pet.globalBonus.isPercent) {
        const percentKey = stat + 'Percent';
        if (percentKey in stats) {
          stats[percentKey] += value;
        } else {
          // Fallback: some percent stats use different names
          addStat(stats, stat, value);
        }
      } else {
        addStat(stats, stat, value);
      }
    }

    // Pet tier bonuses (fixed stats unlocked at each tier)
    if (pet && pet.tierBonuses) {
      const petTier = typeof profile.activePet === 'object' ? (profile.activePet.tier || 0) : 0;
      for (const [tierKey, bonuses] of Object.entries(pet.tierBonuses)) {
        if (petTier >= parseInt(tierKey, 10)) {
          for (const bonus of bonuses) {
            addStat(stats, bonus.stat, bonus.value);
          }
        }
      }
    }
  }

  // Flat sacrifice bonuses (Layer 2 — flat additions)
  if (profile.sacrificeUpgrades) {
    for (const sac of sacrificesData) {
      const rank = profile.sacrificeUpgrades[sac.id] || 0;
      if (rank <= 0 || sac.isMultiplier) continue;
      addStat(stats, sac.stat, sac.perRank * rank);
    }
  }

  // Ash upgrades (flat combat stats)
  if (profile.ashUpgrades) {
    for (const au of ashUpgradesData) {
      const rank = profile.ashUpgrades[au.id] || 0;
      if (rank <= 0) continue;
      addStat(stats, au.perRank.stat, au.perRank.value * rank);
    }
  }

  // Profession skills (mining/woodcutting trees). Most contribute to mining/wc-only
  // stats which addStat silently drops, but the "Damage" nodes in tier 4 add ATK
  // scaled by mining/woodcutting level — important for combat builds that lean on them.
  if (profile.professionSkills) {
    const miningLvl = profile.miningLevel || 1;
    const wcLvl = profile.woodcuttingLevel || 1;
    for (const [id, points] of Object.entries(profile.professionSkills)) {
      const node = professionSkillLookup[id];
      if (!node || points <= 0) continue;
      let value = node.perRank * points;
      if (node.scalesWith === 'str') value = value * (stats.str || 0);
      else if (node.scalesWith === 'dex') value = value * (stats.dex || 0);
      else if (node.scalesWith === 'miningLevel') value = value * miningLvl;
      else if (node.scalesWith === 'wcLevel') value = value * wcLvl;
      addStat(stats, node.stat, value);
    }
  }

  // --- Layer 3: Apply formula: Final = SUM(Base) × SUM(Additive%) × PRODUCT(Multiplicative) ---

  // Bonfire buffs add to additive pools
  const heat = profile.bonfireHeat || 0;
  if (heat > 0) {
    for (const buff of bonfireData) {
      if (heat < buff.heatRequired || !buff.stat) continue;
      if (buff.stat === 'atkPercent') {
        stats.atkPercent += buff.value;
      } else if (buff.stat === 'xpMulti') {
        stats.xpMulti += buff.value;
      } else if (buff.stat === 'mobSpawnReduction') {
        stats.mobSpawnReduction += buff.value;
      } else {
        addStat(stats, buff.stat, buff.value);
      }
    }
  }

  // Curio flat bonuses (tier bonuses are base, primary percentage is additive)
  if (profile.equippedCurios && Array.isArray(profile.equippedCurios)) {
    for (const curioEntry of profile.equippedCurios) {
      const curio = curioLookup[curioEntry.name];
      if (!curio) continue;

      // Tier bonuses are flat/base
      const curioTier = curioEntry.tier || 0;
      if (curio.tierBonuses) {
        for (const [tierKey, bonus] of Object.entries(curio.tierBonuses)) {
          const tierNum = parseInt(tierKey.replace('t', ''), 10);
          if (curioTier >= tierNum) {
            addStat(stats, bonus.stat, bonus.value);
          }
        }
      }

      // Percentage-based primary (e.g., goldMulti 25%) — additive, scaled by level if max known
      if (!curio.isMultiplier && curio.primaryValue) {
        const value = scaleCurioValue(curio.primaryValue, curio.primaryValueMax, curioEntry.level || 1);
        addStat(stats, curio.primaryStat, value);
      }
    }
  }

  // --- Step A: Primary stat scaling (part of base layer) ---
  // STR/DEX/INT gives x10% ATK per point
  const primaryStat = classInfo?.primaryStat;
  if (primaryStat === 'str') {
    stats.atk += stats.str * 0.10 * stats.atk;
  } else if (primaryStat === 'dex') {
    stats.atk += stats.dex * 0.10 * stats.atk;
  } else if (primaryStat === 'int') {
    stats.atk += stats.int * 0.10 * stats.atk;
  }

  // CON scaling: +5% Max HP per CON, +1% HP Regen per CON
  // MEN scaling: +5% Max Mana per MEN, +1% Mana Regen per MEN, +5% Magic Defence per MEN
  stats.hp += stats.hp * (stats.con * 0.05);
  stats.hpRegen += stats.hpRegen * (stats.con * 0.01);
  stats.mana += stats.mana * (stats.men * 0.05);
  stats.manaRegen += stats.manaRegen * (stats.men * 0.01);

  // --- Step B: Additive % (sum all, apply once) ---
  stats.totalAtk = stats.atk * (1 + stats.atkPercent / 100);
  stats.def = stats.def * (1 + stats.defPercent / 100);
  stats.miningPower = stats.miningPower * (1 + stats.miningPowerPercent / 100);
  stats.woodcuttingPower = stats.woodcuttingPower * (1 + stats.wcPowerPercent / 100);

  // --- Step C: Multiplicative (chain-multiply after additive) ---

  // Hunter multiplicative upgrades (e.g., More Damage Training x1.01 per rank)
  for (const hm of hunterMultipliers) {
    const multiplier = 1 + hm.perRank * hm.rank;
    if (hm.stat === 'atk') {
      stats.totalAtk *= multiplier;
      stats.atk *= multiplier;
    } else if (hm.stat in stats) {
      stats[hm.stat] *= multiplier;
    }
  }

  // Multiplier sacrifice bonuses
  if (profile.sacrificeUpgrades) {
    for (const sac of sacrificesData) {
      const rank = profile.sacrificeUpgrades[sac.id] || 0;
      if (rank <= 0 || !sac.isMultiplier) continue;
      const multiplier = 1 + sac.perRank * rank;
      const key = sacStatToKey(sac.stat);
      if (key === 'atk') {
        stats.totalAtk *= multiplier;
        stats.atk *= multiplier;
      } else if (key && key in stats) {
        stats[key] *= multiplier;
      }
    }
  }

  // Card multiplier bonuses (e.g., Snowman Card ATK x1.03)
  for (const cm of cardMultipliers) {
    const key = cm.stat === 'atk' ? 'atk' : (sacStatToKey(cm.stat) || cm.stat);
    if (typeof cm.value === 'number' && cm.value > 0 && cm.value < 10) {
      if (key === 'atk') {
        stats.totalAtk *= cm.value;
        stats.atk *= cm.value;
      } else if (key in stats) {
        stats[key] *= cm.value;
      }
    }
  }

  // Curio multiplicative bonuses (e.g., miningPower x1.42, ATK by rarity)
  if (profile.equippedCurios && Array.isArray(profile.equippedCurios)) {
    for (const curioEntry of profile.equippedCurios) {
      const curio = curioLookup[curioEntry.name];
      if (!curio) continue;
      const level = curioEntry.level || 1;

      if (curio.isMultiplier && curio.primaryValue) {
        const key = sacStatToKey(curio.primaryStat);
        if (key in stats) {
          stats[key] *= scaleCurioValue(curio.primaryValue, curio.primaryValueMax, level);
        }
      }

      const atkData = curiosData.atkBonusByRarity?.[curio.rarity];
      if (atkData) {
        const atkMulti = scaleCurioValue(atkData.level1 || 1, atkData.level50, level);
        stats.totalAtk *= atkMulti;
        stats.atk *= atkMulti;
      }
    }
  }

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
