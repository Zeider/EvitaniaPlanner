import { describe, it, expect } from 'vitest';
import { decodeSaveHex, extractProfiles, loadSaveFile } from './save-decoder.js';

/** Helper: encode a string the same way the game does (UTF-8 -> XOR 0xFF -> hex pairs). */
function encodeSaveHex(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes)
    .map((b) => (b ^ 0xff).toString(16).toUpperCase().padStart(2, '0'))
    .join('');
}

describe('decodeSaveHex', () => {
  it('round-trips a known JSON string through encode then decode', () => {
    const original = JSON.stringify({ hello: 'world', num: 42 });
    const hex = encodeSaveHex(original);
    const decoded = decodeSaveHex(hex);
    expect(decoded).toBe(original);
    expect(JSON.parse(decoded)).toEqual({ hello: 'world', num: 42 });
  });

  it('throws on invalid hex input', () => {
    expect(() => decodeSaveHex('ZZZZ')).toThrow();
    expect(() => decodeSaveHex('GG')).toThrow();
    // Odd-length strings are also invalid (need pairs)
    expect(() => decodeSaveHex('A')).toThrow();
  });
});

// Minimal save data fixture matching the real structure
const MOCK_SAVE = {
  Heroes: {
    LastSelectedHero: 2,
    SlotsAvailable: 1,
    Heroes: [
      {
        Name: 'Zeider',
        HeroClass: 3,
        Health: 2442.825,
        Mana: 27.75,
        Enhancements: {
          tt_rogue_8_1: 1,
          tt_rogue_8_0: 5,
          novice_0_0_patk: 1,
          class_1_rogue: 1,
          profession_woodcutting_0_0: 3,
          profession_mining_0_0: 3,
        },
        Currencies: [
          { name: 0, current: 1180031.88, total: 5086427.0 },
        ],
        skillModels: [
          { currentXp: 1039507650.0, currentLevel: 69, ESkill: 0 },
          { currentXp: 2275.24, currentLevel: 18, ESkill: 1 },
          { currentXp: 6494.42, currentLevel: 21, ESkill: 2 },
        ],
        equipment: {
          Helmet: { itemGuid: '25f97961-aaa', Amount: 1, Level: 0, EnhancementLevel: 7 },
          Chest: { itemGuid: '19d55c7a-bbb', Amount: 1, Level: 0, EnhancementLevel: 7 },
          Weapon1: { itemGuid: 'a30e858e-ccc', Amount: 1, Level: 0, EnhancementLevel: 6 },
          Weapon2: null,
          Potion: null,
        },
        Progress: {
          scene: '2.1',
          visitedScenes: ['1.2', '1.0', '1.3'],
        },
        OfflineProgress: {
          KillsPerHour: 149.14,
          XpPerHour: 23698.26,
          GoldPerHour: 0.0,
        },
        inventory: [],
      },
      {
        Name: 'Thalin',
        HeroClass: 1,
        Health: 500,
        Mana: 100,
        Enhancements: {
          tt_warrior_1_0: 3,
          novice_0_0_pdef: 2,
          class_1_warrior: 1,
          profession_mining_0_0: 1,
        },
        Currencies: [{ name: 0, current: 500.0, total: 1000.0 }],
        skillModels: [
          { currentXp: 100.0, currentLevel: 10, ESkill: 0 },
          { currentXp: 50.0, currentLevel: 5, ESkill: 1 },
          { currentXp: 0.0, currentLevel: 1, ESkill: 2 },
        ],
        equipment: {
          Helmet: null,
          Chest: null,
          Weapon1: null,
          Weapon2: null,
          Potion: null,
        },
        Progress: { scene: '1.0', visitedScenes: ['1.0'] },
        OfflineProgress: { KillsPerHour: 50, XpPerHour: 1000, GoldPerHour: 10 },
        inventory: [],
      },
    ],
  },
  ProgressProfile: {
    Enhancements: {
      LeBabka_MoveSpeed: 15,
      LeBabka_HunterCost: 19,
      LeBabka_PDef: 15,
      LeBabka_PAtk: 15,
      LeBabka_Str: 8,
      ash_0_0: 1,
      ash_1_2: 1,
      'bonfire-sacrifice-soul-0': 1,
      'act-2-sacrifice-0': 5,
      'act-2-sacrifice-1': 3,
      GemshopSmelterySpeed: 4,
      GemshopSmelteryMulticraft: 4,
    },
  },
  Currency: {
    cards: {
      'Bringer Of Death': 12.0,
      'Fire Worm': 3.0,
      'Ash Tree': 2.0,
      'ice-mammoth': 5.0,
      'jotunn': 7.0,
      'BossCrab': 2.0,
      'BlueDragon': 4.0,
      'difficulty1-act1': 30.0,
    },
  },
  RuneSystem: {
    Rows: [
      {
        RowIndex: 0,
        UnlockedSlots: 3,
        SlottedRunes: {
          '0': 'd90f7d7a-76ee-4209-875d-ba17f094d0e1',
          '1': 'd90f7d7a-76ee-4209-875d-ba17f094d0e1',
          '2': '5a4efab8-a86a-4d9c-9edc-ba67cdce1b08',
          '3': 'd90f7d7a-76ee-4209-875d-ba17f094d0e1',
        },
        ActiveRunewordId: 'bd05c016-3be5-4b90-aba3-12078a64ee4c',
      },
      {
        RowIndex: 1,
        UnlockedSlots: 3,
        SlottedRunes: {},
      },
    ],
    CollectedRunewordIds: [
      'cffcf31c-e6e7-48d3-87ac-0fe75025994b',
      'bd05c016-3be5-4b90-aba3-12078a64ee4c',
    ],
    Inventory: {
      SlotEntries: [
        { ItemId: '8a3a86f3-e84c-444f-a47d-61dec9d5a396', Count: 1 },  // RYS
        { ItemId: '8a3a86f3-e84c-444f-a47d-61dec9d5a396', Count: 1 },  // RYS (stacks)
        { ItemId: '6268da07-03bb-47f7-80b7-03bb199093f6', Count: 1 },  // NIL
        { Count: 0 },  // empty slot — should be ignored
        { ItemId: 'unknown-guid', Count: 1 },  // unmapped — should be ignored
      ],
    },
  },
};

describe('extractProfiles', () => {
  const profiles = extractProfiles(MOCK_SAVE);

  it('extracts hero data correctly (name, class, level, zone, farming rates)', () => {
    expect(profiles).toHaveLength(2);

    const zeider = profiles[0];
    expect(zeider.name).toBe('Zeider');
    expect(zeider.class).toBe('rogue');
    expect(zeider.level).toBe(69);
    expect(zeider.miningLevel).toBe(18);
    expect(zeider.woodcuttingLevel).toBe(21);
    expect(zeider.currentZone).toBe('2.1');
    expect(zeider.farmingRates).toEqual({
      killsPerHour: 149.14,
      xpPerHour: 23698.26,
      goldPerHour: 0.0,
    });

    const thalin = profiles[1];
    expect(thalin.name).toBe('Thalin');
    expect(thalin.class).toBe('warrior');
    expect(thalin.level).toBe(10);
    expect(thalin.currentZone).toBe('1.0');
  });

  it('separates talent nodes from profession nodes', () => {
    const zeider = profiles[0];

    // Talents: tt_*, novice_*, class_* keys only
    expect(zeider.talents).toEqual({
      tt_rogue_8_1: 1,
      tt_rogue_8_0: 5,
      novice_0_0_patk: 1,
      class_1_rogue: 1,
    });

    // Profession skills: profession_* keys only
    expect(zeider.professionSkills).toEqual({
      profession_woodcutting_0_0: 3,
      profession_mining_0_0: 3,
    });

    // Talents should NOT contain profession keys
    expect(zeider.talents).not.toHaveProperty('profession_woodcutting_0_0');
    // Profession skills should NOT contain talent keys
    expect(zeider.professionSkills).not.toHaveProperty('tt_rogue_8_1');
  });

  it('extracts shared hunter/ash/sacrifice upgrades from ProgressProfile', () => {
    const zeider = profiles[0];
    const thalin = profiles[1];

    // Hunter upgrades (LeBabka_* keys from ProgressProfile.Enhancements)
    const expectedHunter = {
      LeBabka_MoveSpeed: 15,
      LeBabka_HunterCost: 19,
      LeBabka_PDef: 15,
      LeBabka_PAtk: 15,
      LeBabka_Str: 8,
    };
    expect(zeider.hunterUpgrades).toEqual(expectedHunter);
    // Shared between all characters
    expect(thalin.hunterUpgrades).toEqual(expectedHunter);

    // Ash upgrades (ash_* keys)
    const expectedAsh = { ash_0_0: 1, ash_1_2: 1 };
    expect(zeider.ashUpgrades).toEqual(expectedAsh);
    expect(thalin.ashUpgrades).toEqual(expectedAsh);

    // Sacrifice upgrades (act-2-sacrifice-* and bonfire-sacrifice-* keys)
    const expectedSacrifice = {
      'bonfire-sacrifice-soul-0': 1,
      'act-2-sacrifice-0': 5,
      'act-2-sacrifice-1': 3,
    };
    expect(zeider.sacrificeUpgrades).toEqual(expectedSacrifice);
    expect(thalin.sacrificeUpgrades).toEqual(expectedSacrifice);
  });

  it('extracts gear from equipment', () => {
    const zeider = profiles[0];
    expect(zeider.gear.helmet).toEqual({
      guid: '25f97961-aaa',
      name: null,
      level: 0,
      enhancementLevel: 7,
    });
    expect(zeider.gear.weapon2).toBeNull();
    expect(zeider.gear.potion).toBeNull();
  });

  it('extracts cards from Currency, normalizing keys to cards.json canonical names', () => {
    const zeider = profiles[0];
    expect(zeider.cards).toEqual({
      'Bringer of Death': 12.0,  // case fix: 'Bringer Of Death' -> 'Bringer of Death'
      'Fire Worm': 3.0,           // unchanged: not in cards.json, kept as-is
      'Ash Tree': 2.0,            // unchanged: not in cards.json, kept as-is
      'Ice Mammoth': 5.0,         // dash + case: 'ice-mammoth' -> 'Ice Mammoth'
      'Jötunn': 7.0,              // diacritic: 'jotunn' -> 'Jötunn'
      'The Crab': 2.0,            // explicit alias: 'BossCrab' -> 'The Crab'
      'Maevath': 4.0,             // explicit alias: 'BlueDragon' -> 'Maevath'
      'Act 1 Hard': 30.0,         // explicit alias: 'difficulty1-act1' -> 'Act 1 Hard'
    });
  });

  it('extracts equipped runes from all SlottedRunes entries (shared across heroes)', () => {
    const zeider = profiles[0];
    // All 4 SlottedRunes entries are extracted — the game sometimes stores runes
    // at non-contiguous indices (e.g. 3-slot rows with entries at positions 3/4/5).
    expect(zeider.equippedRunes).toEqual(['PRE', 'PRE', 'OLU', 'PRE']);
    // Shared across all characters
    expect(profiles[1].equippedRunes).toEqual(['PRE', 'PRE', 'OLU', 'PRE']);
  });

  it('aggregates unequipped rune inventory from RuneSystem.Inventory.SlotEntries', () => {
    const zeider = profiles[0];
    // RYS appears in 2 slot entries with Count 1 each → total 2
    // NIL appears in 1 slot entry → total 1
    // Empty slots and unmapped GUIDs are ignored
    expect(zeider.runeInventory).toEqual({ RYS: 2, NIL: 1 });
    expect(profiles[1].runeInventory).toEqual({ RYS: 2, NIL: 1 });
  });

  it('extracts rune slot capacity including gem-shop unlocks on row 0', () => {
    const zeider = profiles[0];
    // Row 0: UnlockedSlots=3, no GemshopRuneSlotUnlock in this fixture → 3 slots
    // Row 1: UnlockedSlots=3 → 3 slots
    expect(zeider.runeSlots).toEqual({ total: 6, byRow: [3, 3] });
  });

  it('maps active and discovered runeword GUIDs to names', () => {
    const zeider = profiles[0];
    expect(zeider.runewords.active).toEqual({ 0: 'PRE x 6' });
    // CollectedRunewordIds resolves GUIDs to names in the same order
    expect(zeider.runewords.discovered).toEqual(['GOR MU HAS', 'PRE x 6']);
  });
});

describe('loadSaveFile', () => {
  it('reads a File object and returns profiles', async () => {
    const saveJson = JSON.stringify(MOCK_SAVE);
    const hex = encodeSaveHex(saveJson);

    // jsdom File doesn't implement .text(), so we create a mock with the method
    const file = { text: async () => hex };

    const profiles = await loadSaveFile(file);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].name).toBe('Zeider');
    expect(profiles[0].class).toBe('rogue');
    expect(profiles[1].name).toBe('Thalin');
  });
});
