/**
 * Save file decoder for Evitania Online's data.sav format.
 *
 * The file is ASCII hex (each pair XOR'd with 0xFF) that decodes to UTF-8 JSON.
 */
import cardsData from '../data/cards.json';

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
  'a2d4e836-c10f-414e-8662-5ef40f24556b': 'Straw hat',
  'ebc99fd6-a250-4a20-a4a5-0815f796148c': 'Bronze Helmet',
  '25f97961-90f6-4f18-9f7b-76e20c54e845': 'Iron Helmet',
  'cdd7ffa7-dd6e-499c-8fec-107ad960042e': 'Thorium Helmet',
  '8fd20049-372a-4308-84dc-be3f9593a6d6': 'Second Anniversary Cap',
  // Chestplates
  '8a4e9274-0396-415b-ae89-f268a8b9afae': 'Bronze Chestplate',
  '19d55c7a-3354-4c01-9f7d-8b8a9620066f': 'Iron Chestplate',
  '8317c874-94e9-49d7-9eba-72a339f96791': 'Thorium Chestplate',
  '7aa5a7a5-8e6e-4e0d-b0a9-e03b2b9a1ae0': 'Harvest Shirt',
  'a20b696b-219f-412b-82cf-d6efff7d72bc': 'Infinite Chestplate I',
  // Gloves
  '1d23d781-e7ba-4e85-9c4f-2ddf85a95804': 'Bronze Gloves',
  '99528be3-8b4f-4067-88d8-662d72b3d578': 'Iron Gloves',
  '3c9065ee-7794-4e2c-8d08-6c88ae394040': 'Thorium Gloves',
  '60d25ebf-c2b8-4323-9231-c818c6e8e61e': 'Infinite Gloves I',
  '9ccd8c46-9b45-438a-9123-b88c310d1ea8': 'Christmas Gloves',
  'ebf07811-87af-4b64-a65b-9dac251ecaa3': 'Harvest Gloves',
  '919782a5-4a6a-430b-b4d9-b1fc48651876': 'Sunstone Gloves',
  // Boots
  '0764c550-b308-4365-9271-8bf8dbfe949a': 'Copper Boots',
  '6fa4b8c7-adc0-42c7-98e5-7c5963f46f66': 'Bronze Boots',
  'c6d360e1-1c30-454c-bb63-935e67761d8b': 'Iron Boots',
  'd0686aa5-f77e-49a3-8232-adff3802b073': 'Thorium Boots',
  '666c26e3-2516-4204-9055-e1c4947275ce': 'Summer Boots',
  '24b50860-fc4c-4a36-be28-b33491381f7b': 'Infinite Boots I',
  // Belts
  '36737f24-0684-4744-a032-6feb29cd39dd': 'Steam Belt',
  '8e42e15e-c3de-4471-8d40-19fccf9d0a23': 'Belt of Love',
  '4e99a414-c481-481a-8b28-f05dfecd9c18': 'Valentine Belt',
  '54e6e068-7c8e-4cfb-916e-fd0b7aa745a9': 'Second Anniversary Belt',
  '5392de0f-d57d-454e-9722-a96f16e9de3b': 'Steel Belt',
  // Amulets
  '4d02a095-fe8b-4a12-a7c3-6d1ef2ab5107': 'Boss Amulet',
  'b62ce843-0d7f-4a03-8680-62545e79a873': 'Nordic Amulet',
  'b1e4a2ea-3dbc-43c0-b82f-393b53cbd828': "Rabbit's Foot",
  // Rings
  'd095a977-8554-4dff-9a8d-e66558fba0da': 'Ring of STR',
  '2c1d48e6-875a-4530-8080-f017bac70e99': 'Mammoth Ring',
  '9bb15e82-d4cd-4a4d-92b9-227d0b30c0a6': 'Tower Ring',
  '56b23a59-39bf-47fc-9784-e520f352fbed': 'Ashen Ring',
  '33281f6e-6f07-485f-8dca-f2bf70903ced': 'Steam Ring',
  // Swords / Longswords / Daggers
  'f2bf27ef-f604-4f8d-a10e-4161d7f1d087': 'Bone Dagger',
  '5279b9a3-3ac1-44e2-8306-1374d6351c10': 'Essence Sword',
  'bd3cfbe4-d754-410f-916b-db2a4241977b': 'Steel Longsword',
  'b0a19111-6e67-4f9d-bbb4-af27755c7297': 'Thorium Longsword',
  '3f98e0fe-9f6b-4bb6-af30-c690f44a20c9': 'Sunstone Longsword',
  'a4fb1638-2d15-421c-abf5-0f95aed04d66': 'Infinite Longsword I',
  '34233e5d-0201-4183-981e-ec809440c4a6': 'Christmas Longsword',
  // Bows
  'a30e858e-5429-4c2a-9175-8a6cfd0f5c7a': 'Steel Bow',
  'f61790b8-c673-41ed-9b5f-0f3a5d3993de': 'Thorium Bow',
  // Staffs
  '48640cc3-b770-4f91-add7-0ad871dfc7e7': 'Copper Staff',
  'fe3f786f-4807-4cd5-b34c-e3a0c3b53967': 'Steel Staff',
  // Pickaxes
  'a36efc3c-9678-4613-8cda-b102e55fe714': 'Bronze Pickaxe',
  'a2e7e691-4c65-49b5-a7f6-2f512a059b56': 'Iron Pickaxe',
  '8500b653-61a3-42b3-9a60-af782562e9e6': 'Thorium Pickaxe',
  '2b86c517-ff48-41e2-8be7-ee2cc1a49519': 'Second Anniversary Pickaxe',
  // Axes
  '95fbcc3e-b5f2-48cd-adc7-42a187ae4179': 'Iron Axe',
  '08cd484a-023b-4bae-93c9-465683d681ed': 'Thorium Axe',
  '4690994f-900e-47e0-9eba-2a57019d4593': 'Second Anniversary Axe',
  '7b5c3c71-2118-49fa-a9e5-8fb84334a5e5': 'Sunstone Axe',
};

/**
 * Pet skin GUID → name. Bulk-extracted via Cpp2IL + UnityPy + TypeTreeGenerator
 * from the game's data.unity3d (full asset extraction, May 2026). These are
 * the only ScriptableObject class whose schema TypeTreeGenerator could fully
 * resolve from the IL2CPP dummy DLLs — most other Item subclasses use
 * `[SerializeReference]` polymorphic fields that fail to deserialize.
 *
 * Used to display unlocked skins (save's `unlockedSkinGuids`) by name.
 */
const PET_SKIN_GUID_MAP = {
  '16868ae2-4460-4a04-be1a-b4989e05d431': 'Animated Armor Skin',
  '4abe398f-dee8-454b-8149-fbeb472f2a3a': 'Astral Head Skin',
  '1d17baa0-7c32-43fe-ab65-d06fdf529e68': 'Basic Bat Skin',
  'c25a348e-0236-4d96-bf0d-0b6d30d0b198': 'Beeb Skin',
  'd38efd3d-57cc-4084-8656-2f7b9be6a99a': 'Blue Drake Skin',
  '9e384431-a343-42ca-bdf5-21cae0c00ba5': 'Blue Slyme Skin',
  '9e297d51-5625-4789-9a6e-b9b223043982': 'Bugling Skin',
  '5b8c2533-d388-4f81-9e58-aba07c66b3d4': 'Captain Squishy Skin',
  'ee2cd99c-f031-4285-bac9-ada9d50c82b5': 'Chick Skin',
  '32ff7a39-f62c-40ae-8d4e-02f7cb6e0b13': 'Cupid Skin',
  '30d57c4d-6b12-4ee2-b466-039b63d41192': 'Dark Whelp Skin',
  '5bab2a9d-5c33-4d09-a6cd-9f0c68512faa': 'Demon Bat Skin',
  '1ae2cd0c-79b7-4285-8086-a7b69fd2ef5e': 'Easter Bunny Skin',
  'f9f951c9-7c22-4601-b1cf-a3df701eb3d8': 'Fire Whelp Skin',
  'e43662f8-2ed9-458a-b228-fd4402e93d67': 'Ghosty Skin',
  '0590e481-f034-4883-a0a8-4090115a2fe7': 'Glitch Skin',
  '4f0fbdce-09ee-4533-ae4f-44aa43e7dbb2': 'Golden Piggy Skin',
  'cf787c8d-d9cc-4c10-91a2-3977905cc34f': 'Kitty Skin',
  '0b3bd615-fc44-4aa2-a087-abb10d8ce3bf': 'Leaf Spirit Skin',
  '20cf5895-da96-4fd6-9ee7-5abd695bf200': 'Meema Skin',
  'f9bd61da-a165-48db-9e48-f582a9953c43': 'Mimic Skin',
  '70d7f2fc-8a31-4188-a260-2c81ff6f12a4': 'Mony Skin',
  'f97028ca-e9ab-4606-85bc-c0b24edda001': 'Orange Slyme Skin',
  'baf0559b-c2bd-4c29-b4fb-9c137bd3eeab': 'Pebble Skin',
  '31fc9f9b-f400-4ca0-be8a-1ea57da04f95': 'Pump Kin Skin',
  'b92aaf0c-8dfa-4c0a-aea0-3181f502a732': 'Purple Slyme Skin',
  'ab11a8bb-d2b4-4563-80fe-d8cfb4ac840f': 'Queen of Hearts Skin',
  '60e2782a-ffd6-4b22-b4bc-911008d93a96': 'Red Drake Skin',
  '21af9dd1-e9d2-46ae-8a9c-4f208e774660': 'Slyme Skin',
  '3f2e0873-1b1a-4f9b-8b1d-3d0fa741622f': 'Snek Skin',
  '792ea88f-7fa1-448e-9790-de50d59ce84d': 'Snowflake Skin',
  '74215ff2-14c6-4fa3-825d-c659b500d33d': 'Spiney Skin',
  '3be8cf5d-5e3e-4e50-8af6-f743e7906838': 'Succubus Skin',
  '8ecafe4d-bbaa-47e6-b635-56ee51a13293': 'Turkey Skin',
  '852ebfab-0703-40da-ab92-fac77cdb1fea': 'Valentine Skin',
  '2ccf69e3-5296-42d3-a416-60efba2a1f6b': 'Valkyrie Skin',
  'd9b02bf4-3d4d-4407-8ff5-4b496743f3f0': 'Weird Book Skin',
  '4d4c7e68-9f10-4bbe-8e90-0c72bcaa489b': 'Winged Observer Skin',
};

/**
 * Known curio DefinitionId GUID → curio name mappings.
 * Add new entries as they're discovered from save files.
 */
const CURIO_GUID_MAP = {
  // All 20 curios verified against Items_en localization keys (2026-05-06).
  // Note: prior versions had Ceremonial Dagger/Century Tome SWAPPED and
  // misspelled "Entomed Mask" — both fixed here.
  '01d9ca35-48b6-4a62-bf8a-33785df36275': 'Swirling Tear',
  '1ba01e17-307a-48f2-a843-18714536bc16': "Worm's Horn",
  '2c0f298e-ead1-4ecf-aa48-11752f4f36d3': 'Wyrd Goblet',
  '2ec691de-4888-4d3b-ba68-6f08389fd350': 'Sected Bypiramid',
  '428e363e-0d31-472c-9eb0-364ca82650cf': 'Century Tome',
  '5e0c5fda-7215-4934-a368-8302316021b6': "Necromancer's Hand",
  '73dfb882-4347-42b2-b118-2bbc3a81e607': 'Elden Monolith',
  '797a05db-85b4-4b6b-9e1a-32c5fe651b62': 'Blooming Desert',
  '7d61e63c-a7de-47f7-a5f3-76ae44483177': 'Ichored Specimen',
  '846cec10-a8dc-4d90-b3b8-dcee62455793': 'Crystal Cranium',
  '961b2e57-cffb-4969-9efd-a8ecb863086b': 'Pandemonium Egg',
  'b37a7454-9acb-4833-9b46-1aa6b2ed65af': 'Ever Eclipsed Sun',
  'c1e13206-b2a9-4d83-8266-6621421beff8': 'Fifth Stab',
  'd055bb8b-d47e-4d01-accf-de9e50f24b28': 'Shattered Vow',
  'd400737a-2802-4e02-9559-b31e43c1bbd4': 'Entombed Mask',
  'd8dd906f-4afb-40e3-8212-f3621e136fc4': 'Cup of Indulgence',
  'd9b09743-8082-409d-8260-2b98155e73a9': 'Jade Scarab',
  'e3e5bebd-73b0-4ca3-8372-c2afb08c2384': 'Urn Flask',
  'ee7c4afc-2b5f-4ee6-9965-5f8988799fc1': 'Ceremonial Dagger',
  'f7cadf81-f1f4-4dce-b584-eb69a3ea2387': "Servant's Idol",
};

/**
 * Save's `Currency.cards` map keys mob names with inconsistent casing/diacritics
 * (e.g. "Bringer Of Death", "ice-mammoth", "jotunn", "BossCrab"). Normalize them
 * to the canonical names used in cards.json so downstream stat-engine and the
 * Cards tab can resolve them.
 */
function normalizeCardName(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

const CARD_CANONICAL_BY_NORMALIZED = (() => {
  const map = {};
  const visit = (list, key) => {
    for (const c of (list || [])) {
      const name = c[key];
      if (name) map[normalizeCardName(name)] = name;
    }
  };
  visit(cardsData.act1Cards, 'enemy');
  visit(cardsData.act2Cards, 'enemy');
  visit(cardsData.act3Cards, 'enemy');
  visit(cardsData.resourceCards, 'resource');
  visit(cardsData.hardCards, 'name');
  return map;
})();

/**
 * Save keys that don't match any cards.json name even after normalization.
 * Add new entries as they're discovered.
 */
const CARD_NAME_ALIASES = {
  'BossCrab': 'The Crab',
  'BlueDragon': 'Maevath',
  'difficulty1-act1': 'Act 1 Hard',
  'difficulty1-act2': 'Act 2 Hard',
};

function resolveCardName(saveKey) {
  if (CARD_NAME_ALIASES[saveKey]) return CARD_NAME_ALIASES[saveKey];
  const canonical = CARD_CANONICAL_BY_NORMALIZED[normalizeCardName(saveKey)];
  return canonical || saveKey;
}

/**
 * Boss-name → list of `visitedScenes` IDs that indicate the boss has been killed.
 * Multiple patterns per boss because the game uses inconsistent naming
 * (e.g. Maevath is `2.bossBlueDragon`, Mammoth is `2.boss-1`).
 * Patterns for unfamiliar bosses (Bringer of Death, Kangaroo Boss) are guesses
 * until confirmed in a save where they've been defeated.
 */
const BOSS_SCENE_PATTERNS = {
  'Bringer of Death': ['1.bossbringer', '1.bossplant', '1.5.bossplant', '1.5.boss'],
  'The Crab': ['1.17.bossCrab', '1.bosscrab', '1.9.bossCrab'],
  'Yrsainir': ['1.bossdragon', '1.14.bossdragon', '1.bossfire'],
  'Mammoth': ['2.boss-1'],
  'Jotunn': ['2.boss-2'],
  'Maevath': ['2.boss-3', '2.bossBlueDragon'],
  'Kangaroo Boss': ['3.boss-1', '3.4.bossKangaroo', '3.bossKangaroo', '3.bossZhaiHalud'],
};

const HEX_PAIR = /^[0-9A-Fa-f]*$/;

/**
 * Known runeword GUID → runeword name mappings.
 * Runewords are combinations of runes that grant bonus effects when fully socketed.
 */
const RUNEWORD_GUID_MAP = {
  'bd05c016-3be5-4b90-aba3-12078a64ee4c': 'PRE x 6',
  'cffcf31c-e6e7-48d3-87ac-0fe75025994b': 'GOR MU HAS',
};

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
  // Phys DEF
  'bd30b89c-11ee-4fc7-9edd-7ef31897f558': 'KI',
};

/**
 * Rune-fragment item GUIDs (the "Use to add to Rune Inventory" stash items).
 * Distinct GUID space from RUNE_GUID_MAP (which keys the rune-system inventory).
 * Bulk-extracted 2026-05-06 from Items_en localization. All 33 rune names
 * present in runes.json now have a fragment GUID — a 22-rune jump from the
 * 11-rune coverage RUNE_GUID_MAP had previously.
 */
const RUNE_FRAGMENT_GUID_MAP = {
  '5c6a4ed7-3db1-4434-9494-f276cffbe73a': 'ANG',
  '38b10953-1093-402f-b033-10c29aba4958': 'APEX',
  '10bce1a1-65ef-442f-b30b-0b8d28f9f221': 'BEB',
  '6ee29bec-0d1a-4a00-b0f4-ec1c1a9acb00': 'BOL',
  'ee7d769f-e6f1-4505-9258-b72a35fba841': 'DOT',
  'f9fc2e7e-2321-4b42-b1f7-926618a52707': 'FAL',
  '93eb358c-e2f2-4720-8ac3-d0c598c9fe7d': 'FON',
  '6eee12dd-d7ca-4fe8-a888-74014ef92535': 'FUS',
  'ac8c9028-9763-46db-a675-29f486f4d3d8': 'GOR',
  '9a8cd33b-c38b-4594-a3db-24d687485bcc': 'GRO',
  'd3a3f3b2-f6ab-49c8-93ad-b73b609c55db': 'HAS',
  'f23f4633-6148-4ac4-aba7-78a8a16b2fae': 'KI',
  '934a827e-f6ef-4df1-88e0-e43648a7519a': 'LUM',
  'd4261f45-6a7a-42dc-bc44-c576e5da6ab2': 'MIN',
  'd3a098d8-e50e-4e1d-97e6-3d84417b4d76': 'MU',
  '298499df-7bb5-4307-bca4-2544a436e1bf': 'NIL',
  'f5d30a43-9f0f-46aa-adc6-e52a82f23dc6': 'OLU',
  '0f81c5cd-387e-4e42-b3fd-0520f9fef9b3': 'ORT',
  '2b6957b5-0e9a-4aee-9315-9aee146c0985': 'PRE',
  '124234f0-ee0f-48a3-886d-54053f70cdd7': 'RO',
  'a977ade9-91fc-43a8-8563-bff0d17999ea': 'RYS',
  '046323b6-8aa5-4f94-afc9-fb9e56d29f0f': 'SIRC',
  '3b777d26-7e8c-4322-8262-85ccc142d518': 'SKO',
  'f0ca2328-04c0-4fed-964a-168062b68ef7': 'SUR',
  '6cb3dcd2-cb55-4842-b01f-51b0040a9e60': 'TES',
  'eedd4646-4222-475b-8188-c9b75fb255f2': 'TYR',
  'd19ecd84-bee0-47bf-bda2-e731558eb8bd': 'VEX',
  'bb1ca061-193a-4188-bf60-70ed0378475f': 'WAR',
  'cb449023-f5cb-448b-841b-ba11a3285ec2': 'WER',
  'd9da007f-ce3e-4480-b45c-ba3704bc7ff6': 'WIR',
  '615b2523-48b2-4c5b-95f9-9f8cdcc26048': 'WOM',
  'eb8e653e-c8bc-4fde-b265-b22a35e8a8e0': 'YIT',
  'b88fe027-7008-4cf7-ba18-39d71af99b24': 'YUR',
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

  // Extract rune system state from RuneSystem (shared across all characters)
  // Gem shop unlocks (GemshopRuneSlotUnlock) add slots beyond the base UnlockedSlots
  const gemSlotUnlocks = progressEnhancements.GemshopRuneSlotUnlock || 0;
  const equippedRunes = [];
  const runeSlotsByRow = [];
  const activeRunewords = {};
  const runeSystem = saveData.RuneSystem;
  if (runeSystem?.Rows) {
    for (const row of runeSystem.Rows) {
      const baseSlots = row.UnlockedSlots || 0;
      // Gem shop unlocks apply to the first row
      const totalSlots = row.RowIndex === 0 ? baseSlots + gemSlotUnlocks : baseSlots;
      runeSlotsByRow[row.RowIndex] = totalSlots;
      if (row.ActiveRunewordId) {
        activeRunewords[row.RowIndex] = RUNEWORD_GUID_MAP[row.ActiveRunewordId] || row.ActiveRunewordId;
      }
      // Iterate actual slotted entries rather than 0..totalSlots — the game
      // stores slot positions that can be non-contiguous (e.g. a 3-slot row can
      // have its runes at indices 3/4/5 rather than 0/1/2).
      for (const guid of Object.values(row.SlottedRunes || {})) {
        if (!guid) continue;
        const name = RUNE_GUID_MAP[guid];
        if (name) equippedRunes.push(name);
      }
    }
  }

  // Count unequipped runes in the rune bag (RuneSystem.Inventory.SlotEntries)
  const runeInventory = {};
  const slotEntries = runeSystem?.Inventory?.SlotEntries ?? [];
  for (const entry of slotEntries) {
    if (!entry?.ItemId || !entry.Count) continue;
    const name = RUNE_GUID_MAP[entry.ItemId];
    if (!name) continue;
    runeInventory[name] = (runeInventory[name] || 0) + entry.Count;
  }

  // Discovered runewords (the list of runewords the player has ever assembled)
  const discoveredRunewords = (runeSystem?.CollectedRunewordIds ?? [])
    .map((id) => RUNEWORD_GUID_MAP[id] || id);

  // Extract equipped curios from CurioSystem (shared across heroes).
  // EquippedSlots maps slot index → InstanceId; resolve via Inventory to DefinitionId, then to name.
  const equippedCurios = [];
  const curioSystem = saveData.CurioSystem;
  if (curioSystem?.EquippedSlots && Array.isArray(curioSystem.Inventory)) {
    const byInstance = {};
    for (const c of curioSystem.Inventory) {
      if (c?.InstanceId) byInstance[c.InstanceId] = c;
    }
    for (const instanceId of Object.values(curioSystem.EquippedSlots)) {
      const c = byInstance[instanceId];
      if (!c) continue;
      const name = CURIO_GUID_MAP[c.DefinitionId];
      if (!name) continue;
      equippedCurios.push({ name, level: c.Level || 1, tier: c.Tier || 0 });
    }
  }

  // Shared (across all heroes) state — stash/engineer are single global instances.
  const stash = extractStash(saveData);
  const engineer = extractEngineer(saveData);

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
      stash,
      engineer,
      cards: (() => {
        const out = {};
        for (const [k, v] of Object.entries(cards)) {
          const canonical = resolveCardName(k);
          out[canonical] = (out[canonical] || 0) + (v || 0);
        }
        return out;
      })(),
      equippedCurios: [...equippedCurios],
      equippedRunes: [...equippedRunes],
      runeInventory: { ...runeInventory },
      runeSlots: {
        total: runeSlotsByRow.reduce((sum, n) => sum + (n || 0), 0),
        byRow: [...runeSlotsByRow],
      },
      runewords: {
        discovered: [...discoveredRunewords],
        active: { ...activeRunewords },
      },
      farmingRates: {
        killsPerHour: op.KillsPerHour ?? 0,
        xpPerHour: op.XpPerHour ?? 0,
        goldPerHour: op.GoldPerHour ?? 0,
      },
      currentZone: hero.Progress?.scene ?? '',
      // Per-act difficulty: 0=Normal, 1=Hard, 2=Nightmare, 3=Hell.
      // Save stores only non-Normal levels (e.g. {"1": 1} = Act 1 on Hard).
      actDifficulty: { ...(hero.Progress?.ActDifficulty ?? {}) },
      bonfireHeat,
      activePet: (() => {
        const heroIndex = heroes.indexOf(hero);
        const pet = petSaveData.find(p => p.characterId === heroIndex && p.petSlot === 0);
        if (!pet) return null;
        const skin = PET_SKIN_GUID_MAP[pet.skinGuid] || null;
        return { name: pet.petName, level: pet.level, tier: pet.tier, skin };
      })(),
      // Bosses defeated across all acts. Used by Boss Readiness panel and
      // for sacrifice unlock detection (Mammoth/Jotunn/Maevath gate Act 2 sacrifices).
      defeatedBosses: (() => {
        const visited = hero.Progress?.visitedScenes ?? [];
        const bosses = [];
        for (const [bossName, patterns] of Object.entries(BOSS_SCENE_PATTERNS)) {
          if (patterns.some((p) => visited.includes(p))) {
            bosses.push(bossName);
          }
        }
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
 * Extract the player's shared stash (in-game "Storage" tab) from save JSON.
 *
 * The save's `Inventory.stash` is a fixed-length 150-slot array — null/empty
 * slots are dropped. Each kept entry is normalized to:
 *   { guid, name, amount, level, enhancementLevel, durability?, isGear }
 *
 * Discriminator: presence of `Durability` field marks a gear item (Steel Bow
 * with `Durability: 0` still has the field; resources never do). Names are
 * resolved via `GEAR_GUID_MAP`; resources don't have a name map yet, so
 * `name` will be `null` for them — surface raw GUID in UI.
 *
 * @param {object} saveData - Parsed save JSON
 * @returns {{ items: Array<object>, slotsOpened: number, totalSlots: number }}
 */
export function extractStash(saveData) {
  const inv = saveData.Inventory || {};
  const slots = Array.isArray(inv.stash) ? inv.stash : [];
  const items = [];
  for (const entry of slots) {
    if (!entry || !entry.itemGuid) continue;
    const isGear = Object.prototype.hasOwnProperty.call(entry, 'Durability');
    items.push({
      guid: entry.itemGuid,
      name: GEAR_GUID_MAP[entry.itemGuid] || RUNE_FRAGMENT_GUID_MAP[entry.itemGuid] || null,
      amount: entry.Amount ?? 0,
      level: entry.Level ?? 0,
      enhancementLevel: entry.EnhancementLevel ?? 0,
      ...(isGear ? { durability: entry.Durability ?? 0 } : {}),
      isGear,
    });
  }
  return {
    items,
    slotsOpened: inv.stashSlotsOpened ?? 0,
    totalSlots: slots.length,
  };
}

/**
 * Extract the Engineer system state (Act 2 mechanic introduced in patch 0.310.0).
 *
 * Returns null for saves predating the Engineer (patch < 0.310.0 has no
 * `Engineer` block). The Engineer is a 4-slot idle production system where
 * each slot produces an item over a cycle, deposits it into a shared
 * `Stockpile`, and can be boosted by per-slot upgrades.
 *
 * Slot upgrade GUIDs map to four hidden upgrade categories (designer-defined
 * in `EngineerUpgradeCategoryConfig`); names are not in the save and would
 * need to be observed in-game to map.
 *
 * @param {object} saveData - Parsed save JSON
 * @returns {object|null} Engineer state, or null if absent.
 */
export function extractEngineer(saveData) {
  const eng = saveData.Engineer;
  if (!eng) return null;
  const slots = Array.isArray(eng.Slots) ? eng.Slots : [];
  // Engineer-related gem-shop enhancements live in ProgressProfile.Enhancements
  // alongside other shop unlocks. Bucket every engineer_* key — there's only
  // engineer_slot_upgrade today, but future enhancements likely follow the
  // pattern (cf. GemshopRuneSlotUnlock, GemshopCurioInventoryUnlock).
  const enhancements = {};
  for (const [key, value] of Object.entries(saveData.ProgressProfile?.Enhancements || {})) {
    if (key.startsWith('engineer_')) enhancements[key] = value;
  }
  return {
    slots: slots.map((s, idx) => ({
      index: idx,
      enabled: !!s?.Enabled,
      stalled: !!s?.Stalled,
      lastProduced: s?.LastProduced ?? 0,
      upgrades: { ...(s?.Upgrades || {}) },
    })),
    stockpile: { ...(eng.Stockpile || {}) },
    lastSelectedSlot: eng.LastSelectedSlot ?? 0,
    hasBeenOpened: !!eng.HasBeenOpened,
    enhancements,
  };
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
