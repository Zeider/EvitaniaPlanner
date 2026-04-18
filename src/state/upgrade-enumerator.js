import hunterUpgradesData from '../data/hunter-upgrades.json';
import talentsData from '../data/talents.json';
import ashUpgradesData from '../data/ash-upgrades.json';
import sacrificesData from '../data/sacrifices.json';
import gearData from '../data/gear.json';
import dropsData from '../data/drops.json';

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
 * kill rate and drop rate data. Returns the max across all materials (bottleneck).
 */
function estimateFarmTime(materialCost, profile) {
  const kph = profile.farmingRates?.killsPerHour || 0;
  if (!materialCost || Object.keys(materialCost).length === 0) return 0;

  let maxHours = 0;
  for (const [mat, qty] of Object.entries(materialCost)) {
    if (qty <= 0) continue;
    const source = dropsData.resources[mat];
    if (!source) { maxHours = Math.max(maxHours, 1); continue; } // unknown source fallback

    if (source.vendor) {
      // Vendor items: limited daily purchases
      const days = Math.ceil(qty / (source.dailyLimit || 1));
      maxHours = Math.max(maxHours, days * 24);
    } else if (source.boss) {
      // Boss drops: rare, assume ~1 kill per attempt with long intervals
      maxHours = Math.max(maxHours, qty * 2);
    } else if (source.activity) {
      // Mining/WC: rough estimate based on profession level
      maxHours = Math.max(maxHours, qty * 0.01);
    } else if (source.zone && source.rate && kph > 0) {
      // Zone drops: qty needed / (kills per hour / rate)
      const dropsPerHour = kph / source.rate;
      maxHours = Math.max(maxHours, qty / dropsPerHour);
    } else {
      maxHours = Math.max(maxHours, 1);
    }
  }
  return maxHours;
}

// --- Upgrade enumeration ---

function enumerateHunterUpgrades(profile) {
  const upgrades = [];
  for (const hu of hunterUpgradesData) {
    const currentRank = (profile.hunterUpgrades && profile.hunterUpgrades[hu.id]) || 0;
    if (currentRank >= hu.maxRank) continue;
    const nextRank = currentRank + 1;
    // Material cost scales with rank (rough: rank * 10 base materials)
    const materialQty = nextRank * 10;
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
    const materialCost = { [sac.costItem]: nextRank, [`${sac.soul} Soul`]: 1 };
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
