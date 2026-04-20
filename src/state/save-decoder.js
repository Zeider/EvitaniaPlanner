/**
 * Save file decoder for Evitania Online's data.sav format.
 *
 * The file is ASCII hex (each pair XOR'd with 0xFF) that decodes to UTF-8 JSON.
 */

const CLASS_MAP = {
  1: 'warrior',
  2: 'mage',
  3: 'rogue',
};

/**
 * Known gear GUID → item name mappings.
 * Add new entries as they're discovered from save files.
 */
const GEAR_GUID_MAP = {
  // Helmets
  'ebc99fd6-a250-4a20-a4a5-0815f796148c': 'Bronze Helmet',
  '25f97961-90f6-4f18-9f7b-76e20c54e845': 'Iron Helmet',
  'cdd7ffa7-dd6e-499c-8fec-107ad960042e': 'Thorium Helmet',
  // Chestplates
  '8a4e9274-0396-415b-ae89-f268a8b9afae': 'Bronze Chestplate',
  '19d55c7a-3354-4c01-9f7d-8b8a9620066f': 'Iron Chestplate',
  '8317c874-94e9-49d7-9eba-72a339f96791': 'Thorium Chestplate',
  '7aa5a7a5-8e6e-4e0d-b0a9-e03b2b9a1ae0': 'Harvest Shirt',
  // Gloves
  '1d23d781-e7ba-4e85-9c4f-2ddf85a95804': 'Bronze Gloves',
  '99528be3-8b4f-4067-88d8-662d72b3d578': 'Iron Gloves',
  '3c9065ee-7794-4e2c-8d08-6c88ae394040': 'Thorium Gloves',
  // Boots
  '6fa4b8c7-adc0-42c7-98e5-7c5963f46f66': 'Bronze Boots',
  'c6d360e1-1c30-454c-bb63-935e67761d8b': 'Iron Boots',
  '666c26e3-2516-4204-9055-e1c4947275ce': 'Summer Boots',
  // Belts
  '36737f24-0684-4744-a032-6feb29cd39dd': 'Steam Belt',
  '8e42e15e-c3de-4471-8d40-19fccf9d0a23': 'Belt of Love',
  // Amulets
  '4d02a095-fe8b-4a12-a7c3-6d1ef2ab5107': 'Boss Amulet',
  // Rings
  '2c1d48e6-875a-4530-8080-f017bac70e99': 'Mammoth Ring',
  // Swords
  '5279b9a3-3ac1-44e2-8306-1374d6351c10': 'Essence Sword',
  'b0a19111-6e67-4f9d-bbb4-af27755c7297': 'Thorium Sword',
  // Bows
  'a30e858e-5429-4c2a-9175-8a6cfd0f5c7a': 'Steel Bow',
  // Staffs
  'fe3f786f-4807-4cd5-b34c-e3a0c3b53967': 'Steel Staff',
  // Pickaxes
  'a2e7e691-4c65-49b5-a7f6-2f512a059b56': 'Iron Pickaxe',
  // Axes
  '95fbcc3e-b5f2-48cd-adc7-42a187ae4179': 'Iron Axe',
  '08cd484a-023b-4bae-93c9-465683d681ed': 'Thorium Axe',
};

const HEX_PAIR = /^[0-9A-Fa-f]*$/;

/**
 * Known rune GUID → rune name mappings.
 * Add new entries as they're discovered from save files.
 */
const RUNE_GUID_MAP = {
  // Shop
  'd90f7d7a-76ee-4209-875d-ba17f094d0e1': 'PRE',
  // Act 2 Bosses (All EXP)
  '076a243c-3906-48a9-8705-bd065f35d4cc': 'HAS',
  '5a4efab8-a86a-4d9c-9edc-ba67cdce1b08': 'OLU',
  // Iceboar-Yeti (WC Power)
  '6268da07-03bb-47f7-80b7-03bb199093f6': 'NIL',
  // Ratatoskr-Troll (Mining Power)
  '7c65e420-77c6-4581-ba34-ba04bc9cccf2': 'FUS',
  '4814b89d-ab1e-4c54-ae3a-224cbdaaf090': 'YIT',
  // Penguin-Draugr (Gold Multi)
  'b10b0191-5c58-4601-9817-efc150cfbad4': 'MU',
  // Sunboy-Kangaroo (HP)
  'e2dba269-d259-4091-a6e8-5f2dc597a0b9': 'GOR',
  // Ironwood (Attack)
  '8a3a86f3-e84c-444f-a47d-61dec9d5a396': 'RYS',
  // Thorium Ore (Crit Damage)
  '9fe2cd59-b50f-49f0-8e07-d7a498435953': 'WOM',
};

/**
 * Decode a hex-encoded, XOR-0xFF save string back to its original UTF-8 text.
 * @param {string} hexString - ASCII hex characters from data.sav
 * @returns {string} The decoded UTF-8 string (typically JSON)
 */
export function decodeSaveHex(hexString) {
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd number of characters');
  }
  if (!HEX_PAIR.test(hexString)) {
    throw new Error('Invalid hex string: contains non-hex characters');
  }

  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16) ^ 0xff;
  }

  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Extract character profiles from decoded save JSON.
 * @param {object} saveData - Parsed save JSON
 * @returns {Array<object>} Array of character profile objects
 */
export function extractProfiles(saveData) {
  const heroes = saveData.Heroes?.Heroes ?? [];
  const progressEnhancements = saveData.ProgressProfile?.Enhancements ?? {};
  const cards = saveData.Currency?.cards ?? {};

  // Bonfire heat is not stored in the save (only fuel/rate) — user sets manually
  const bonfireHeat = 0;

  // Extract pet data
  const petSaveData = saveData.Pets?.petSaveData ?? [];

  // Extract equipped runes from RuneSystem (shared across all characters)
  // Gem shop unlocks (GemshopRuneSlotUnlock) add slots beyond the base UnlockedSlots
  const gemSlotUnlocks = progressEnhancements.GemshopRuneSlotUnlock || 0;
  const equippedRunes = [];
  const runeSystem = saveData.RuneSystem;
  if (runeSystem?.Rows) {
    for (const row of runeSystem.Rows) {
      const baseSlots = row.UnlockedSlots || 0;
      // Gem shop unlocks apply to the first row
      const totalSlots = row.RowIndex === 0 ? baseSlots + gemSlotUnlocks : baseSlots;
      const slotted = row.SlottedRunes || {};
      for (let i = 0; i < totalSlots; i++) {
        const guid = slotted[String(i)];
        if (guid) {
          const name = RUNE_GUID_MAP[guid];
          if (name) equippedRunes.push(name);
        }
      }
    }
  }

  // Shared upgrades extracted once from ProgressProfile.Enhancements
  const hunterUpgrades = {};
  const ashUpgrades = {};
  const sacrificeUpgrades = {};

  for (const [key, value] of Object.entries(progressEnhancements)) {
    if (key.startsWith('LeBabka_')) {
      hunterUpgrades[key] = value;
    } else if (key.startsWith('ash_')) {
      ashUpgrades[key] = value;
    } else if (key.startsWith('act-2-sacrifice-') || key.startsWith('bonfire-sacrifice-')) {
      sacrificeUpgrades[key] = value;
    }
  }

  return heroes.map((hero) => {
    // Skill levels by ESkill id
    const skillByType = {};
    for (const s of hero.skillModels ?? []) {
      skillByType[s.ESkill] = s.currentLevel;
    }

    // Split hero Enhancements into talents vs profession skills
    const talents = {};
    const professionSkills = {};
    for (const [key, value] of Object.entries(hero.Enhancements ?? {})) {
      if (key.startsWith('profession_')) {
        professionSkills[key] = value;
      } else if (key.startsWith('tt_') || key.startsWith('novice_') || key.startsWith('class_')) {
        talents[key] = value;
      }
    }

    // Map equipment slots — normalize game's slot names to our slot IDs
    const SLOT_MAP = {
      Helmet: 'helmet', Chest: 'chest', Legs: 'gloves', Boots: 'boots',
      Belt: 'belt', Amulet: 'amulet', Ring: 'ring',
      Weapon1: 'weapon', Weapon2: 'weapon2', Potion: 'potion',
      Axe: 'axe', Pickaxe: 'pickaxe',
    };
    const gear = {};
    for (const [rawSlot, item] of Object.entries(hero.equipment ?? {})) {
      const slot = SLOT_MAP[rawSlot] || rawSlot.toLowerCase();
      if (!item) { gear[slot] = null; continue; }
      const name = GEAR_GUID_MAP[item.itemGuid] || null;
      gear[slot] = { guid: item.itemGuid, name, level: item.Level, enhancementLevel: item.EnhancementLevel };
    }

    const op = hero.OfflineProgress ?? {};

    return {
      name: hero.Name,
      class: CLASS_MAP[hero.HeroClass] ?? 'starter',
      level: skillByType[0] ?? 1,
      miningLevel: skillByType[1] ?? 1,
      woodcuttingLevel: skillByType[2] ?? 1,
      gear,
      talents,
      professionSkills,
      hunterUpgrades,
      ashUpgrades,
      sacrificeUpgrades,
      cards: { ...cards },
      equippedRunes: [...equippedRunes],
      farmingRates: {
        killsPerHour: op.KillsPerHour ?? 0,
        xpPerHour: op.XpPerHour ?? 0,
        goldPerHour: op.GoldPerHour ?? 0,
      },
      currentZone: hero.Progress?.scene ?? '',
      bonfireHeat,
      activePet: (() => {
        const heroIndex = heroes.indexOf(hero);
        const pet = petSaveData.find(p => p.characterId === heroIndex && p.petSlot === 0);
        return pet ? { name: pet.petName, level: pet.level, tier: pet.tier } : null;
      })(),
      // Determine which sacrifice bosses have been defeated
      defeatedBosses: (() => {
        const visited = hero.Progress?.visitedScenes ?? [];
        const bosses = [];
        // 2.boss-1 = Mammoth (Ice Mammoth), unlocks sacrifices 0-4
        if (visited.includes('2.boss-1')) bosses.push('Mammoth');
        // 2.boss-2 = Jotunn, unlocks sacrifices 5-9
        if (visited.includes('2.boss-2')) bosses.push('Jotunn');
        // 2.boss-3 = Maevath, unlocks sacrifices 10-14
        if (visited.includes('2.boss-3')) bosses.push('Maevath');
        return bosses;
      })(),
      // Derive max unlocked zone from visitedScenes — find highest combat zone
      maxUnlockedZone: (() => {
        const visited = hero.Progress?.visitedScenes ?? [];
        let maxZone = '';
        let maxVal = -1;
        for (const scene of visited) {
          // Only combat zones match pattern like "1.0", "2.7", "3.12"
          // Skip towns (x.0 for act 2+), bosses, towers, etc.
          const match = scene.match(/^(\d+)\.(\d+)$/);
          if (!match) continue;
          const act = parseInt(match[1]);
          const zone = parseInt(match[2]);
          // Skip town zones (2.0, 3.0) and non-combat scenes
          if (act >= 2 && zone === 0) continue;
          const val = act * 100 + zone;
          if (val > maxVal) {
            maxVal = val;
            maxZone = scene;
          }
        }
        return maxZone;
      })(),
    };
  });
}

/**
 * Load a save File object and return extracted profiles.
 * @param {File} file - A File (or Blob) representing data.sav
 * @returns {Promise<Array<object>>} Extracted character profiles
 */
export async function loadSaveFile(file) {
  const text = await file.text();
  const decoded = decodeSaveHex(text);
  const saveData = JSON.parse(decoded);
  return extractProfiles(saveData);
}
