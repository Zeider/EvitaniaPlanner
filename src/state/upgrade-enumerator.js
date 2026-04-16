import hunterUpgradesData from '../data/hunter-upgrades.json';
import talentsData from '../data/talents.json';
import ashUpgradesData from '../data/ash-upgrades.json';
import sacrificesData from '../data/sacrifices.json';
import gearData from '../data/gear.json';

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
        let power = (item.atk || 0) + (item.def || 0);
        if (item.stats) {
          for (const v of Object.values(item.stats)) power += v;
        }
        byKey[key].push({ ...item, _slotKey: key, _power: power });
      }
    }
  }
  for (const key of Object.keys(byKey)) {
    byKey[key].sort((a, b) => a._power - b._power);
  }
  return byKey;
}

const gearBySlotSubtype = buildGearBySlotSubtype();

// --- Upgrade enumeration ---

function enumerateHunterUpgrades(profile) {
  const upgrades = [];
  for (const hu of hunterUpgradesData) {
    const currentRank = (profile.hunterUpgrades && profile.hunterUpgrades[hu.id]) || 0;
    if (currentRank >= hu.maxRank) continue;
    const nextRank = currentRank + 1;
    // Material cost scales with rank (rough: rank * 10 base materials)
    const materialQty = nextRank * 10;
    upgrades.push({
      type: 'hunter',
      id: hu.id,
      name: `${hu.name} (Rank ${nextRank})`,
      statChanges: { [hu.stat]: hu.perRank },
      materialCost: { [hu.material]: materialQty },
      farmTimeHours: 0.5,
    });
  }
  return upgrades;
}

function enumerateTalentUpgrades(profile) {
  // Only suggest talents from novice tree + the character's own class tree
  const allowedTrees = new Set(['novice', profile.class]);

  // Calculate available talent points: 1 point per combat level, minus allocated
  const totalBudget = profile.level || 1;
  let allocatedPoints = 0;
  if (profile.talents) {
    for (const pts of Object.values(profile.talents)) {
      allocatedPoints += pts;
    }
  }
  const availablePoints = totalBudget - allocatedPoints;
  if (availablePoints <= 0) return [];

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
        farmTimeHours: 0,
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
    upgrades.push({
      type: 'ash',
      id: au.id,
      name: `${au.name} (Rank ${nextRank})`,
      statChanges: { [au.perRank.stat]: au.perRank.value },
      materialCost: { Ash: nextRank * 50 },
      farmTimeHours: 0.5,
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
    upgrades.push({
      type: 'sacrifice',
      id: sac.id,
      name: `${sac.name} (Rank ${nextRank})`,
      statChanges: { [sac.stat]: sac.isMultiplier ? sac.perRank * 100 : sac.perRank },
      materialCost: { [sac.costItem]: nextRank, [`${sac.soul} Soul`]: 1 },
      farmTimeHours: 1.0,
    });
  }
  return upgrades;
}

function enumerateGearUpgrades(profile) {
  const upgrades = [];
  const currentGear = profile.gear || {};

  // For each equipped slot, find the matching subtype group and suggest the next tier
  for (const [slot, equipped] of Object.entries(currentGear)) {
    if (!equipped || !equipped.name) continue;

    // Look up the item to find its subtype
    const equippedItem = gearData.weapons
      ? findItemInGearData(equipped.name)
      : null;
    if (!equippedItem) continue;

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

    upgrades.push({
      type: 'gear',
      id: `gear_${slot}_${nextItem.name}`,
      name: nextItem.name,
      statChanges,
      materialCost: nextItem.recipe ? { [nextItem.recipe]: 1 } : {},
      farmTimeHours: nextItem.recipe ? 1.0 : 0.5,
    });
  }

  // Also suggest gear for empty slots (only obtainable, lowest tier)
  for (const [key, items] of Object.entries(gearBySlotSubtype)) {
    const baseSlot = key.split(':')[0];
    if (currentGear[baseSlot] && currentGear[baseSlot].name) continue;
    if (items.length === 0) continue;

    const firstItem = items[0];
    const statChanges = computeGearStatDelta(null, firstItem);
    if (Object.keys(statChanges).length === 0) continue;

    upgrades.push({
      type: 'gear',
      id: `gear_${baseSlot}_${firstItem.name}`,
      name: firstItem.name,
      statChanges,
      materialCost: firstItem.recipe ? { [firstItem.recipe]: 1 } : {},
      farmTimeHours: firstItem.recipe ? 1.0 : 0.5,
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
