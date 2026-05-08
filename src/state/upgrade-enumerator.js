import hunterUpgradesData from '../data/hunter-upgrades.json';
import talentsData from '../data/talents.json';
import ashUpgradesData from '../data/ash-upgrades.json';
import sacrificesData from '../data/sacrifices.json';
import gearData from '../data/gear.json';
import dropsData from '../data/drops.json';
import { getEffectiveInventory } from './store.js';

/** Maps each class to the weapon subtypes they can equip. */
const CLASS_WEAPON_SUBTYPES = {
  rogue: new Set(['bow']),
  warrior: new Set(['sword', 'longsword']),
  mage: new Set(['staff']),
};

/**
 * Build a flat list of all obtainable gear items grouped by slot+subtype,
 * sorted by total stat power so we can find "next tier" items.
 * Weapons are keyed by subtype (sword, bow, staff, longsword) so a bow
 * only suggests the next bow, not a sword.
 */
function buildGearBySlotSubtype() {
  const byKey = {};
  for (const category of Object.values(gearData)) {
    for (const subcategory of Object.values(category)) {
      if (!Array.isArray(subcategory)) continue;
      for (const item of subcategory) {
        // Skip unobtainable items (event exclusives, legacy gear)
        if (item.obtainable === false) continue;

        // Group weapons by subtype so bows only suggest bows, etc.
        const key = item.subtype ? `${item.slot}:${item.subtype}` : item.slot;
        if (!byKey[key]) byKey[key] = [];
        // Preserve data file order — items are listed in progression order
        // (Copper → Bronze → Iron → Thorium → Infinite → Sunstone)
        byKey[key].push({ ...item, _slotKey: key });
      }
    }
  }
  return byKey;
}

const gearBySlotSubtype = buildGearBySlotSubtype();

/**
 * Estimate farm time in hours for a material cost object using the profile's
 * kill rate and drop rate data. Credits whatever the player already has in
 * stash (auto-populated) and inventory (manual override) — only the deficit
 * counts toward the farm estimate. Returns the max across all materials
 * (bottleneck).
 */
function estimateFarmTime(materialCost, profile) {
  const kph = profile.farmingRates?.killsPerHour || 0;
  if (!materialCost || Object.keys(materialCost).length === 0) return 0;

  const inventory = getEffectiveInventory(profile);

  let maxHours = 0;
  for (const [mat, qty] of Object.entries(materialCost)) {
    const owned = inventory[mat] || 0;
    const remaining = Math.max(0, qty - owned);
    if (remaining <= 0) continue; // already have enough — this material isn't the bottleneck

    const source = dropsData.resources[mat];
    if (!source) { maxHours = Math.max(maxHours, 1); continue; } // unknown source fallback

    if (source.vendor) {
      const days = Math.ceil(remaining / (source.dailyLimit || 1));
      maxHours = Math.max(maxHours, days * 24);
    } else if (source.boss) {
      maxHours = Math.max(maxHours, remaining * 2);
    } else if (source.activity) {
      maxHours = Math.max(maxHours, remaining * 0.01);
    } else if (source.zone && source.rate && kph > 0) {
      const dropsPerHour = kph / source.rate;
      maxHours = Math.max(maxHours, remaining / dropsPerHour);
    } else {
      maxHours = Math.max(maxHours, 1);
    }
  }
  return maxHours;
}

// --- Upgrade enumeration ---

// Hunter cost per rank grows exponentially. The dominant curve is
// growth = 1.70, confirmed by:
//   - Direct observation: LeBabka_MAtk (1.70), LeBabka_SmelterySpeed (1.70)
//   - Discord-shared cost table (May 2026) following ceil(1.7 * 1.7^rank)
// A handful of utility upgrades scale slower:
//   LeBabka_HunterCost  growth 1.50  max 45  (rank 31→32 = 37M Gold)
//   LeBabka_MoveSpeed   growth 1.54  max 30  (rank 26→27 = 8.10M Gold)
// Both directly observed; their slower growth is preserved against the
// default. All anchors are taken with the daily LeBabkaHunterDiscount
// dismissed (it's a flat 60% off when active and cancels in per-rank
// ratios). Each upgrade also has its own material — costs are not in
// a single shared currency.
//
// Default for un-anchored upgrades: ceil(1.7 * 1.7^rank), matching the
// Discord-shared base. Per-upgrade base varies so this default can be
// off by a constant factor for any specific upgrade — drop in an
// `anchor` once observed and that overrides the default.
const DEFAULT_HUNTER_BASE = 1.7;
const DEFAULT_HUNTER_GROWTH = 1.70;

function computeHunterCost(hu, nextRank) {
  if (hu.anchor) {
    return Math.ceil(hu.anchor.amount * Math.pow(hu.anchor.growth, nextRank - hu.anchor.rank));
  }
  return Math.ceil(DEFAULT_HUNTER_BASE * Math.pow(DEFAULT_HUNTER_GROWTH, nextRank));
}

// Sacrifice cost has TWO components, each with its own scaling:
//
//   PRIMARY (per-sacrifice cost item — e.g. Iceghost Doll, Carrot, Monocle):
//     exponential, growth = 1.30 per rank
//     base = 384 at rank 0 for "standard" sacrifices (verified across 5
//     different sacrifices at target ranks 21-27 all matching exactly)
//     Wish for Gold is a confirmed outlier (~15 base — much cheaper)
//
//   SECONDARY (some shared bonfire currency, ~yellow blob icon):
//     linear, cost = 200 + 50 × target_rank
//     Verified across all 7 observed data points spanning ranks 7-27
//
// Calibrated 2026-05-07 from 7 in-game observations across 7 different
// sacrifices.
const DEFAULT_SACRIFICE_GROWTH = 1.30;
const DEFAULT_SACRIFICE_BASE = 384;

function computeSacrificeCost(sac, nextRank) {
  if (sac.anchor) {
    return Math.ceil(sac.anchor.amount * Math.pow(sac.anchor.growth, nextRank - sac.anchor.rank));
  }
  return Math.ceil(DEFAULT_SACRIFICE_BASE * Math.pow(DEFAULT_SACRIFICE_GROWTH, nextRank));
}

function computeSacrificeSecondaryCost(nextRank) {
  return 200 + 50 * nextRank;
}

function enumerateHunterUpgrades(profile) {
  const upgrades = [];
  for (const hu of hunterUpgradesData) {
    const currentRank = (profile.hunterUpgrades && profile.hunterUpgrades[hu.id]) || 0;
    if (currentRank >= hu.maxRank) continue;
    const nextRank = currentRank + 1;
    const materialQty = computeHunterCost(hu, nextRank);
    const materialCost = { [hu.material]: materialQty };
    upgrades.push({
      type: 'hunter',
      id: hu.id,
      name: `${hu.name} (Rank ${nextRank})`,
      statChanges: { [hu.stat]: hu.perRank },
      materialCost,
      farmTimeHours: estimateFarmTime(materialCost, profile),
    });
  }
  return upgrades;
}

function enumerateTalentUpgrades(profile) {
  // Only suggest talents from novice tree + the character's own class tree
  const allowedTrees = new Set(['novice', profile.class]);

  // Calculate available talent points: 1 point per level starting at level 2
  const totalBudget = Math.max(0, (profile.level || 1) - 1);
  let allocatedPoints = 0;
  if (profile.talents) {
    for (const pts of Object.values(profile.talents)) {
      allocatedPoints += pts;
    }
  }
  const availablePoints = totalBudget - allocatedPoints;
  const hasFreePoints = availablePoints > 0;

  const upgrades = [];
  for (const [treeName, tree] of Object.entries(talentsData)) {
    if (!tree.nodes) continue;
    if (!allowedTrees.has(treeName)) continue;
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
        free: hasFreePoints,
        farmTimeHours: hasFreePoints ? 0 : 0.01,
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
    const materialCost = { Ash: nextRank * 50 };
    upgrades.push({
      type: 'ash',
      id: au.id,
      name: `${au.name} (Rank ${nextRank})`,
      statChanges: { [au.perRank.stat]: au.perRank.value },
      materialCost,
      farmTimeHours: estimateFarmTime(materialCost, profile),
    });
  }
  return upgrades;
}

function enumerateSacrificeUpgrades(profile) {
  const upgrades = [];
  // Only show sacrifices for bosses the player has defeated
  const defeated = profile.defeatedBosses || [];
  for (const sac of sacrificesData) {
    // Skip sacrifices whose boss hasn't been defeated (unless they already have ranks)
    const currentRank = (profile.sacrificeUpgrades && profile.sacrificeUpgrades[sac.id]) || 0;
    if (currentRank === 0 && defeated.length > 0 && !defeated.includes(sac.soul)) continue;
    if (currentRank >= sac.maxRank) continue;
    const nextRank = currentRank + 1;
    const materialCost = {
      [sac.costItem]: computeSacrificeCost(sac, nextRank),
      [`${sac.soul} Soul`]: computeSacrificeSecondaryCost(nextRank),
    };
    upgrades.push({
      type: 'sacrifice',
      id: sac.id,
      name: `${sac.name} (Rank ${nextRank})`,
      statChanges: { [sac.stat]: sac.isMultiplier ? sac.perRank * 100 : sac.perRank },
      materialCost,
      farmTimeHours: estimateFarmTime(materialCost, profile),
    });
  }
  return upgrades;
}

function enumerateGearUpgrades(profile) {
  const upgrades = [];
  const currentGear = profile.gear || {};
  const allowedWeapons = CLASS_WEAPON_SUBTYPES[profile.class];

  // For each equipped slot, find the matching subtype group and suggest the next tier
  for (const [slot, equipped] of Object.entries(currentGear)) {
    if (!equipped || !equipped.name) continue;

    // Look up the item to find its subtype
    const equippedItem = gearData.weapons
      ? findItemInGearData(equipped.name)
      : null;
    if (!equippedItem) continue;

    // Skip weapons this class can't use
    if (equippedItem.slot === 'weapon' && allowedWeapons && equippedItem.subtype && !allowedWeapons.has(equippedItem.subtype)) continue;

    // Build the slot key matching the grouping
    const key = equippedItem.subtype
      ? `${equippedItem.slot}:${equippedItem.subtype}`
      : equippedItem.slot;

    const items = gearBySlotSubtype[key];
    if (!items) continue;

    const equippedIdx = items.findIndex((i) => i.name === equipped.name);
    const nextIdx = equippedIdx + 1;
    if (nextIdx >= items.length) continue;

    const nextItem = items[nextIdx];
    const currentItem = equippedIdx >= 0 ? items[equippedIdx] : null;
    const statChanges = computeGearStatDelta(currentItem, nextItem);

    if (Object.keys(statChanges).length === 0) continue;

    const matCost1 = nextItem.recipe ? { [nextItem.recipe]: 1 } : {};
    upgrades.push({
      type: 'gear',
      id: `gear_${slot}_${nextItem.name}`,
      name: nextItem.name,
      gearSlot: slot,
      gearName: nextItem.name,
      statChanges,
      materialCost: matCost1,
      farmTimeHours: estimateFarmTime(matCost1, profile),
    });
  }

  // Also suggest gear for empty slots (only obtainable, lowest tier)
  for (const [key, items] of Object.entries(gearBySlotSubtype)) {
    const baseSlot = key.split(':')[0];
    if (currentGear[baseSlot] && currentGear[baseSlot].name) continue;
    if (items.length === 0) continue;

    // Skip weapon subtypes this class can't use
    if (baseSlot === 'weapon') {
      const subtype = key.split(':')[1];
      if (allowedWeapons && subtype && !allowedWeapons.has(subtype)) continue;
    }

    const firstItem = items[0];
    const statChanges = computeGearStatDelta(null, firstItem);
    if (Object.keys(statChanges).length === 0) continue;

    const matCost2 = firstItem.recipe ? { [firstItem.recipe]: 1 } : {};
    upgrades.push({
      type: 'gear',
      id: `gear_${baseSlot}_${firstItem.name}`,
      name: firstItem.name,
      gearSlot: baseSlot,
      gearName: firstItem.name,
      statChanges,
      materialCost: matCost2,
      farmTimeHours: estimateFarmTime(matCost2, profile),
    });
  }

  return upgrades;
}

/** Find an item by name across all gear categories. */
function findItemInGearData(name) {
  for (const category of Object.values(gearData)) {
    for (const subcategory of Object.values(category)) {
      if (!Array.isArray(subcategory)) continue;
      const found = subcategory.find(i => i.name === name);
      if (found) return found;
    }
  }
  return null;
}

/** Compute stat delta between two gear items. */
function computeGearStatDelta(currentItem, nextItem) {
  const statChanges = {};

  if (nextItem.atk) {
    const currentAtk = currentItem && currentItem.atk ? currentItem.atk : 0;
    if (nextItem.atk - currentAtk !== 0) {
      statChanges.atk = nextItem.atk - currentAtk;
    }
  }

  if (nextItem.def) {
    const currentDef = currentItem && currentItem.def ? currentItem.def : 0;
    if (nextItem.def - currentDef !== 0) {
      statChanges.def = nextItem.def - currentDef;
    }
  }

  const nextStats = nextItem.stats || {};
  const curStats = (currentItem && currentItem.stats) || {};
  const allStatKeys = new Set([...Object.keys(nextStats), ...Object.keys(curStats)]);
  for (const key of allStatKeys) {
    const delta = (nextStats[key] || 0) - (curStats[key] || 0);
    if (delta !== 0) {
      statChanges[key] = (statChanges[key] || 0) + delta;
    }
  }

  return statChanges;
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

export {
  enumerateAllUpgrades,
  enumerateHunterUpgrades,
  enumerateTalentUpgrades,
  enumerateAshUpgrades,
  enumerateSacrificeUpgrades,
  enumerateGearUpgrades,
};
