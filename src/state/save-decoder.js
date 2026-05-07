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

  // ─── Bulk-extracted from Items_en localization (2026-05-06) ───
  // 83 items across all gear slots + 8 Thorium crafting parts. Sorted
  // alphabetically rather than by slot to keep insertion mechanical.
  '6d6aa854-40c0-4790-9f06-5545d62f6789': 'Actuatlly Sword',
  '96123378-f4d2-48c5-82fd-c198733baf49': 'Anniversary Belt',
  '6bbd4f9e-503c-4b1e-856a-5b5b8f972961': 'Anniversary Cap',
  '3f76bc3c-d9eb-4897-9585-dab6fb7885b6': 'Bow Tie',
  '1c5ba96e-adf9-4292-8d4f-757cf00f417e': 'Bronze Axe',
  '8cfbe9c4-d696-4d1e-92b1-ede9d00abf0b': 'Brown Boots',
  '34cd60d1-6604-4a7f-af2c-2981299e8131': 'Brown Gloves',
  'f3988658-9f31-4a1c-8928-af4f29408002': 'Brown Helmet',
  'baec348d-5d0d-4c49-bbcb-ba59da355c7a': 'Carrot Ring',
  'dcac2e5a-c5ea-4008-b75c-ea4eb3da76ba': 'Christmas Belt',
  'cdf728d9-a97f-48a4-bd8e-3c6acf29ef4f': 'Christmas Boots',
  '43ad5bcd-4f3e-49f3-9906-dbf4248747a5': 'Christmas Bow',
  'e05f1d57-c31b-4cdf-b578-94648251f075': 'Christmas Coat',
  '7505d2ba-8d4f-405f-951e-921746ad98d3': 'Christmas Helmet',
  '3df4d093-17fe-4b22-a619-fc61ba5db4f4': 'Christmas Staff',
  '0ed8e13b-05d5-4973-9397-064c3df55c75': 'Copper Axe',
  '29090722-b1cb-4f2b-8fc6-5c97e46bfa12': 'Copper Bow',
  '75ee60a4-89b8-493d-b109-78794e19b476': 'Copper Chestplate',
  '822b2f65-5510-4073-aec0-0ea243b8800d': 'Copper Gloves',
  '90d74bce-3dc1-46e7-9d5b-1f6dbc6087a9': 'Copper Helmet',
  '916f60e4-7cdc-4687-aaac-bb0f1e57fa77': 'Copper Pickaxe',
  '7271edd7-548f-4480-906c-81dbcbb2ce46': 'Copper Sword',
  '1b1e9f94-cdd7-4e01-ab35-f33dc7a63dea': "Death's Boots",
  '68573828-eaea-46ca-b3ef-cfe584ef8826': "Death's Chestplate",
  '1f7d5d8d-13c7-4b33-9bd8-d904f944b5f3': "Death's Gloves",
  '90991c75-7bf0-4b76-aeab-ecde19fb5038': "Death's Helmet",
  'b1a0d2a6-1bc1-48ec-ad60-61f497dd2a5a': 'Halloween Helmet',
  '86fd56b8-3720-4dc7-915a-1a4afc1abd7e': 'Harvest Belt',
  '1e02a494-876a-492f-9a5f-56f5db7d8c58': 'Helmet Helmet',
  'd49b7697-2deb-4e3d-a71e-e1a34ce3bc44': 'Infinite Boots II',
  'ef283620-f6c5-4b24-b33e-7686f7cdcc6a': 'Infinite Bow I',
  '64022cc9-ba81-4c6c-a94a-a1d015f3a659': 'Infinite Chestplate II',
  '3abfc6be-fc00-4f90-a9cb-8e626c202d10': 'Infinite Gloves II',
  'bfcec995-9e09-4fdc-866f-dd89dc91aab2': 'Infinite Helmet I',
  'e9895d14-0746-4361-889e-67f07fa84f05': 'Infinite Helmet II',
  'a53e74c7-08d2-4489-9e84-8b121714fc8b': 'Infinite Staff I',
  'e8d966c1-5f06-4010-886e-c620fc13a216': 'Iron Boots',
  '7a15d9a0-e8d4-476b-b5a3-756897233ece': 'Iron Chestplate',
  '68f8960e-ec62-4818-aa02-1e5fb2a96a57': 'Iron Gloves',
  'dc5b67c7-53a4-4d2d-a40c-92871e518fab': 'Iron Helmet',
  '0a25943c-1a97-4899-b2c0-fd50fc13d3da': 'Legacy Bronze Boots',
  '954a5547-219d-40ca-9cbd-559d71ff5ac9': 'Legacy Bronze Chestplate',
  '83079762-fe19-4da4-b0e2-528763a6ec44': 'Legacy Bronze Gloves',
  '498b2afd-7062-4e1e-9fd0-b0b3663f5da4': 'Legacy Bronze Helmet',
  '16128ef6-d25d-4fed-85f6-78986b4036ae': 'Legacy Mithril Boots',
  'a7c7a7ff-e76e-4de5-957d-d0a7d3dcf3da': 'Legacy Mithril Chestplate',
  '10660902-490e-4d2a-b6f2-41171fa4faee': 'Legacy Mithril Gloves',
  '1349dd2f-637c-481c-a6b9-ceaad4cfd4f8': 'Legacy Mithril Helmet',
  '985d68dc-37e0-492d-bbd3-0ce4204d8394': 'Mithril Axe',
  'b0609eaf-8f0d-4efb-ba15-bfee369e16db': 'Mithril Bow',
  'bf149228-d694-4937-83d3-86670275b5fe': 'Mithril Longsword',
  'a77d8eb6-9a59-4a9c-9f7f-5ccce111f709': 'Mithril Pickaxe',
  'b13830c9-c311-4982-8dd7-f7853a683c10': 'Mithril Staff',
  'd9fa162c-d9d1-49c5-a191-4a18be9f40f8': 'Mithril Sword',
  'a54efb06-7e0e-4ca0-963f-7b10185134d0': 'Snowy Belt',
  '151d846d-3b0d-4432-98f3-c6ba2e87a520': 'Snowy Longsword',
  'f066ad78-683c-47c5-9bd6-20352ef4ad11': 'Snowy Staff',
  '91145e07-55c8-428d-b8b6-9700583f97dc': 'Snowy Sword',
  'd9c62e8b-c2ec-4103-aa47-d373a784efed': 'Starter Sword',
  '1a5ec422-991f-417a-aa27-9754a7e83a3d': 'Steel Sword',
  '5ea05025-3e6c-4609-a6db-d675ee864d0b': 'Summer Belt',
  'd88e6bec-e17b-4437-be34-2dd53754a02c': 'Sunstone Boots',
  '91f0e60d-2c4d-45ba-aa7b-951d3d5427a9': 'Sunstone Bow',
  '634ab365-a5ef-4bdd-ba53-94dc023bc07a': 'Sunstone Chestplate',
  'de58372e-fb59-4510-bf5a-0762d0b4905a': 'Sunstone Helmet',
  'c866e12d-e751-4aa8-aea3-b9e604c08783': 'Sunstone Pickaxe',
  'b4d2808d-3201-491e-9f65-4177f1b857d1': 'Sunstone Staff',
  '22e4e2b2-555f-48d7-8ff5-a5d6607b021c': "The Crab's Pickaxe",
  '02629cc8-7be2-44f7-8947-a164461b3a2e': 'Thorium Boots Part',
  'b9c8f17b-17ea-4b59-bd63-287cff2295f5': 'Thorium Bow Part',
  'e1969ad0-c1a5-46ac-a6f5-6cab1ce397ad': 'Thorium Chestplate Part',
  'a1e5a380-06c7-47e3-b0df-9677f6b4efa1': 'Thorium Gloves Part',
  '349a3b1e-94df-46e8-8f0b-2185928a6cdd': 'Thorium Helmet Part',
  '57ef7b6f-b6c7-449e-a530-d07c2c7cf768': 'Thorium Longsword Part',
  '5575184f-e6ff-4f3f-a1a8-0db2457eb37d': 'Thorium Staff',
  '4ac393aa-623a-4c7c-aadd-a0c8f677f3af': 'Thorium Staff Part',
  '45f920bc-2d0f-4f64-8722-eb8d7bdc390d': 'Thorium Sword',
  '271d3788-e3b4-40ac-bf02-45a101f27d72': 'Thorium Sword Part',
  'af949dcb-c853-431e-9b84-f0cb608b6cce': 'ULTRA SWORD',
  '63ccc017-8c01-45c8-b660-3dc2ae30f55d': 'Valentine Amulet',
  '4e87ef25-c933-4b8d-a8d2-f3f534be22b8': 'Wooden Axe',
  'fc1fd3ec-2c3e-4908-82b6-4342de29f1cd': 'Wooden Pickaxe',
  '61d04d78-4c01-44fd-964b-07ea51312661': 'Wooden Sword',
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
  // Defensive: pre-fix saves may use the old typo "Ciphered Bilding" — route to canonical "Billding".
  'Ciphered Bilding': 'Ciphered Billding',
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
 * Resource / consumable / event-item GUID → name. Bulk-extracted from the
 * Items_en localization tables (2026-05-06). 221 entries covering raw
 * materials (ores/bars/logs/essences/feathers), pet items (snacks, eggs,
 * collectibles), enhance/repair stones, hourglasses, brews, boss souls and
 * keys, event drops, curio reagents, and storage-unlock items.
 *
 * A handful of names are intentionally duplicated under different GUIDs
 * (e.g. "Crab Stew", "Fruit Smoothie", "1k Installs", "Dragon Coin",
 * "Death's Key") because the game ships multiple item entries with the same
 * display name; each GUID is its own canonical entry.
 *
 * Wired into extractStash so any non-gear stash slot resolves to a human
 * name instead of leaving `name: null`.
 */
const RESOURCE_GUID_MAP = {
  '98a219cb-4487-40e8-a154-3d466f627542': '1 hour Hourglass',
  '37acc6e1-90a1-43f0-a984-cd0f71b695e0': '1k Installs',
  'c03cf11c-f059-4e3b-b411-271a654bd700': '1k Installs',
  '522121c6-a870-45b0-a278-233ee4915a39': '24 hour Hourglass',
  'c5272016-1935-424b-99eb-e7ed5cff6341': '8 hour Hourglass',
  '63465805-51ba-44cc-9890-0df254d5f8c7': 'Aether Crystal Shards',
  '576a3060-8107-42ef-8365-790285195edd': 'Ancient Feather',
  '561e55ef-4fe7-45ea-a71f-e39693d35566': 'Ancient Liquid',
  '5bc70408-eb28-4835-81fa-a5311f6c2cfb': 'Ancient Petal',
  '652ced2d-82d7-499d-867c-cb6e4f400984': 'Ancient Powder',
  'c48127b9-ad9b-4af2-950c-8befb4eb02f1': 'Animal Bone',
  '896ae4e7-5bc4-446d-8cb8-d85a4e584218': "Artisan's Frame",
  '360769f9-a914-487c-b92a-3dbee820f849': 'Ash Log',
  '1c725808-b5af-429d-936d-fe4019485644': 'Bandiff Star',
  'e2bb840e-a7a4-4bb5-a23c-95ef4ef086c9': 'Basic Bat Pet',
  'e1661c67-3ef7-4abd-8a71-e2d851b40ebe': 'Basic Necklace',
  'd981a507-783f-4fd7-bfcb-a9fd77e8ed4d': 'Basic Vest',
  'f90e1c22-5da5-4916-9168-7c9e9372438f': 'Bat Dust',
  'e69da937-5223-4b95-892e-86bd5d774fd5': 'Beeb Pet',
  '468430ff-0dff-4fb9-ada6-06bc563a709c': 'Beetleman Sting',
  '35a989b7-15b4-4866-bc5d-8d32033f464b': 'Big Pet Storage',
  '5d6bdc4e-c338-4335-81e0-8322eb38106c': 'Black Essence',
  '010ff59a-e543-49a4-bd7a-8810f49b5ca3': 'Blue Drake Pet',
  '713f9e62-ba6c-4178-a051-f65a90fad5c1': 'Blue Essence',
  '25d7e5e4-4849-4236-9383-6686b3446891': 'Boar Meat',
  '03fffc66-35d0-4b47-9e04-6143070665ba': 'BONFIRE RESET',
  '2999b73b-0602-471d-a7d9-72df65a80a89': 'Bronze Bar',
  '337b4e04-da09-45d0-ba6e-7b79614f6934': 'Cactus',
  'ab21477c-a8fc-467a-b3c8-82dc2f5ed306': 'Candle',
  '07584ebe-b073-4e4c-91a1-ebb2b0824740': 'Canned Knowledge',
  'bcfd18fa-7dcc-4cc6-b2ba-d9bc58fe9c0d': 'Captain Squishy',
  'd3295375-25f5-4cbf-9212-a4de7962b31e': 'Carrot',
  '0045a9a8-2fae-4d1e-8c65-d5450784cb72': 'Chadcoal',
  '0e257856-b816-4904-9aef-cbf9ec16af42': 'Charcoal',
  'f1da142a-b859-435a-b117-25839c62c01c': 'Christmas Box',
  '8a6d338e-c0db-4ce9-a7e2-6b138d6c7dd5': 'Christmas Enhance Stone',
  '30836081-389b-45cc-93c0-2c8c85366329': 'Christmas Event',
  '098b675e-be7f-4c26-bf6f-580d5090eae5': 'Christmas Repair Stone',
  'e3a4a6a8-6b7d-4a4c-b9f3-08f563eafbee': 'Class Reset Brew',
  'a2c2763e-7670-4cd6-a634-0ffad3cddaf3': 'Copper Bar',
  '5871626d-c8ad-47c0-b404-d45fbb7877d8': 'Copper Ore',
  'b30b9f33-2612-4dc3-8c81-e57f7a9a86d8': 'Crab Claw',
  '242d088b-e2c2-4f79-940b-a64ec904849e': 'Crab Nuggets',
  '5973892a-1cee-40cd-94a9-7dca6eda7710': 'Crab Stew',
  'e97658b7-6175-4ffa-8ff6-77856efa1cd4': 'Crab Stew',
  'e1cf72b9-e914-4586-bd12-b8d0a56652b9': 'Cryolite',
  'c9ead82d-270f-4f5a-a69d-0ea39a915fa3': 'Cryolite Ore',
  '57a31e34-fd03-462a-9dbd-7d57bdb6d548': 'Crystallized Blue Substance',
  '48a7e8e8-2e8b-4938-badc-142d9bc7988a': 'Crystallized Yellow Substance',
  'bde36785-64da-4107-98ca-5764b8d256a2': 'Cupid Pet',
  '31c8b3af-a10b-4615-920c-da9068d65380': 'D20 Dice',
  '6e16d9e5-0059-413e-b786-cfba9d5c8f93': "Death's Feather",
  '53ee2a86-936d-44a2-bc36-25c118357c6f': "Death's Flower",
  '8288f3e2-7fc3-428b-ba60-43e69a1652c3': "Death's Key",
  'a873e3d9-7014-426b-a74d-b6d668cfd277': "Death's Key",
  '8151d14e-ebb0-45e1-b2ed-61dc5a22cb9b': "Death's Liquid",
  '0716ac52-2f08-48a1-99b6-4c89c335e470': "Death's Petal",
  'af5cd1f7-5d24-4acd-ac7a-ec46a695e798': "Death's Powder",
  '77942cfb-f154-44f3-a09d-25729fb59050': 'Distinguished Glasses',
  'e9407452-a5e7-4a1a-9121-fd12ad4f1e9f': 'Djinn Lamp',
  'a0e5167d-e1e9-4f5b-892c-cbb42f7b98bc': 'Dragon Coin',
  'a83a1384-2ed8-4400-835e-8ea479a41bbe': 'Dragon Coin',
  'bb078d69-abbf-4a70-b02c-7822413ce5d7': 'Dragon Horn',
  '626d626e-a240-4a77-abbf-9aa2eec52780': 'Dragon Soul',
  '6900fb33-f141-4332-bd03-f8f652cd4edb': 'Easter Egg',
  '2ee3b25e-de54-4482-9ace-2328c74f1700': 'Ectoplasm',
  'cd0edfbd-1b0e-48c6-8620-6bd35d616efc': 'Energy Potion',
  'f08c216d-e96e-407a-89d7-e076e28e0a63': 'Enhance Stone 1',
  '428153a3-c447-4555-9948-7c84f74082fe': 'Enhance Stone 2',
  'd28b1c65-6c92-46d8-9737-9e1c18a4f575': 'Enhance Stone 3',
  '8a61b760-34f2-4008-8a86-9ef2eee06129': 'Essence Shard',
  '131a48a9-b9a4-4c69-8a26-a611f6da226c': 'FailSafe',
  '89c21248-d05a-4387-986b-b6a34ec62b9a': 'Fez Fez',
  '3c1d0686-9305-4286-b83f-09fdb3cce818': 'Fire Essence',
  '05d8b31f-4e3c-4a22-b0f1-11a1ce63e702': 'Fire Whelp Pet',
  '5a5db547-ce7a-45d8-b884-58fc353d46d4': 'Firework I',
  '68b4b6a3-802a-405e-9304-4a3d02c6b678': 'Firework II',
  '4430a0b2-7fc8-4099-97fe-dde91c36ccc7': 'Firework III',
  'dd96cd1d-e30f-45ca-b370-1f189b4d1248': 'Fruit',
  'be59a32d-6073-4769-8b13-9a3b19a4a084': 'Fruit Smoothie',
  'd16f0ead-959d-4307-aabc-23ce0448621c': 'Fruit Smoothie',
  '23dc992b-9f38-4084-9c75-606e462a1b59': 'Furry Fur',
  '118fd9cd-1a87-49df-9ad9-b4b5ce1d778c': 'Furstring',
  '2cb8560a-4307-49fb-a602-8c06c59023dc': 'Gate Building Blocks',
  'cc4a3f53-d3d0-4e8e-b288-5d2f294c9b8f': 'Ghosty Pet',
  '90974d74-ab32-454e-9e32-dd7403183214': 'Glitch Pet',
  '7c4e8dfd-0813-4585-8f07-991ed7e5b883': 'Goak',
  '1b11d82e-6a98-495c-bae8-47a20d1739d3': 'Goak Log',
  '35b233e1-217b-4bae-9fef-f9cd8394673c': 'Gold Bar',
  'd7b2563e-50a8-40fc-b630-8e36b34499e0': 'Gold Ore',
  '961793b4-0850-4bc0-8614-83c5c7a44736': 'Golden Piggy Pet',
  'bf2f1577-a404-42e5-96fb-99266cc64f7d': 'Grassy Enhance Stone I',
  'bceff121-3cca-4edd-817a-c952a7314811': 'Grassy Key I',
  'bc49cd46-e4f1-4b93-82b7-e4e92f515f5b': 'Grassy Repair Stone I',
  'f86288fe-a65a-4bc0-ba58-065c2832d5de': 'Grassy Stone I',
  '74f910b0-e188-4e74-8f50-6202ce0bd68d': 'Grassy Stone II',
  '8e5dc709-19f8-4b1e-87c4-922921c2328e': 'Grassy Stone III',
  '0f0bda59-acd8-4f04-b3e4-adc508a0e82e': 'Green Soda',
  'e5d277a8-2c0b-4b2c-915a-c8332d7f5a0b': 'Grilled Ham',
  'b5dfdafb-5a42-48c0-baa3-161786789225': 'Halloween Candy',
  'b5adaa24-93af-4a72-968a-c91b5a5d3c6f': 'Halloween Enhance Stone',
  '1e8e241e-d2f7-468e-bab5-2c289d3c503f': 'Halloween Repair Stone',
  '8e38d1b1-59c8-4073-a3ca-349749d17def': 'Halloween Signet',
  '8c3a69eb-5729-40cd-8c57-43958fdaabba': 'Harvest Enhance Stone',
  'd642ef60-3b8b-42df-a7e9-487fd81d589b': 'Harvest Repair Stone',
  'c33429cb-ea06-43b0-a213-db0cbb47b55d': 'Honeycomb',
  'bf6060ce-b7dc-4107-ad8d-c6b5f7635fe1': 'Horus Idle',
  '2b487735-3b46-4fcd-9939-65a50cbe397e': "Ice Mammoth's Key",
  '5e80157e-e853-4bbc-9266-8291f7ccd43d': 'Iceghost Doll',
  'b9d6526c-42d8-4227-a928-abc0e409ea1d': 'Icy Enhance Stone I',
  '549a67b5-c286-4d4b-999c-052a08a5b802': 'Icy Key I',
  'b073d845-ee53-4657-a72c-bcc08d2808a4': 'Icy Needles',
  'ec90ca27-1d61-43cc-b0b0-86987064ae33': 'Icy Repair Stone I',
  '8a330384-2ff1-45e7-916a-9adffe5f013a': 'Icy Stone I',
  'd39ce1e2-957e-47fe-82bc-c81695d16728': 'Icy Stone II',
  'c57162e2-bd86-4184-8bc7-d0698780680e': 'Icy Stone III',
  'eab75b63-88b1-4e41-bc31-264fca585f66': 'Inventory space',
  '95345197-e787-4aeb-bbed-42f177d6e6e8': 'Iron Bar',
  '2be3250b-2d36-4ada-8c66-4b6334f55797': 'Iron Ore',
  '00506755-a834-4ab0-8796-6583d370f20f': 'Ironwood Log',
  'aad337e0-229a-4dac-b491-6c80335b56b4': 'Jolly Package',
  'c485abd1-a858-44f7-b5a3-cd352c7dda27': 'Jötunn Eye',
  '5952cfc9-6ab3-4b9a-9a1a-83c1d4bb37c1': 'Jötunn Soul',
  '780e8efd-1d32-459f-a645-393fb0c07ad3': "Jötunn's Key",
  '326477ac-1b68-4060-8d1b-437152077c09': 'Kangaroo Boomerang',
  'c92b7b89-d823-40f8-976d-9d72d04a9a96': 'Large Pet Snack',
  'db0b78f0-9ce4-4955-b312-c3e842647158': 'Leaf',
  '3e34454f-f8af-4380-934b-629265fadbab': 'Leaf Spirit Pet',
  'ce09effc-7390-4773-ba4a-b65daf05026c': "Maevath's Horn",
  '769b922a-9ff9-4bd9-a35b-e52b6c34d8a1': 'Mammoth Bitusk',
  '84f8240e-d2d0-43e8-8b60-6f66c7c52d69': 'Mammoth Soul',
  'bdee0d05-5112-4914-a22d-082453a2ad8d': 'Matryoska Doll',
  '7f0865ba-cd18-406e-9b77-732dd14c1179': 'Medium Pet Snack',
  '1484fcb2-c63e-4498-b5e0-77daa0c62508': 'Mimic Pet',
  'aedf9909-c8f2-48ab-a406-4222142ec59f': 'Mini Plants',
  '74060e34-ccba-4938-935b-2fb4cf867a4b': 'Mining Reset Potion',
  '45176766-9b45-465e-8a7b-b4c315a66a03': 'Mithril',
  '39581e61-5b50-48be-a575-2d91049ec5fa': 'Mithril Bar',
  'f52095f7-b2ed-411c-9021-ac7c8f0f8037': 'Mithril Ore',
  'ac1e8974-1ded-438e-a664-c62596882296': 'Monocle',
  '1697b0a2-892c-40ef-88dc-e3c586a7eb90': 'Mummy Wraps',
  '6b0f9c74-04cf-4cf4-b430-bab74355d42b': 'Norse Essence',
  '16576108-f60d-4ce1-96fc-569d4477701b': 'Norse Feather',
  '346ee256-75be-435a-aa96-a1df55c7b86a': 'Norse Liquid',
  '9c4fe688-8dd9-4ff1-8cb2-12226c8a633a': 'Norse Petal',
  '01451c3d-4f6c-430e-bf62-111abd66ef42': 'Norse Powder',
  '189e9887-f447-4a61-9d39-3504c34c5fd2': 'Nut',
  '07a290cb-0c39-431b-903e-f721020d0e7b': 'Orange Chroma',
  'd32092df-c295-444e-b35b-65dd05aef825': 'Palm Face',
  '99fbd0a2-1d5d-4f12-8249-7057d999cb59': 'Pebble Pet',
  '8c16c290-8fa2-4263-82cd-c528376ea7a9': 'Perfect Aether Crystal',
  '42310910-e95b-4d9e-9310-451d514458eb': 'Perfect fur',
  '25821857-82e2-456a-b424-8f6338988911': 'Perfect Norse Essence',
  '24e434ae-2cde-429c-8d20-1adcd4a397c6': 'Perfect Silk Fabric',
  '2f5db361-cc71-458e-b0ad-17a7b38fec0e': 'Pet Storage',
  '70cb22bd-5448-4e96-8bcd-6705ce764cb4': 'Pink Essence',
  '29cd3425-eb82-4ad0-b9f6-55ceaea7f572': 'Pocketwatch',
  '700be987-a04e-46ff-94c4-db2cc691169d': 'Poop Ball',
  '135f7379-0bf2-4ad8-bb59-41256c44c736': 'Pyrewood Log',
  '6328c3e4-bb0d-475f-aed0-1ddf14a8f14b': 'Raw fish',
  '06414213-9a97-44c8-924d-287641900b45': 'Re-skill Brew',
  '8a7659bd-091f-43f1-9694-6118a1a5d976': 'Re-talent Brew',
  'c6729bfc-c8d9-4da6-abb5-11d2e8021e0d': 'Red Drake Pet',
  '8b4849a2-2f27-4aec-b0f5-b58969af8a5b': 'Red Essence',
  '31904379-fab7-417e-9da1-e73f8c85c3f4': 'Red eye',
  '3ffc4288-e32b-4b5a-b006-c590fd81f681': 'Red Feather',
  'c650b0fa-d911-4ce7-b07a-489d9bc4c057': 'Red Liquid',
  'afb1f9c7-7c53-4986-8eae-40076deb2f29': 'Red Petal',
  '918eb4aa-fd1e-4389-ba6e-49f9eb601fb0': 'Red Powder',
  'e87c0d87-a1cf-401a-a14c-1b1877f19c53': 'Rename Feather',
  '7d2ec6ea-6569-434c-8354-dac475400507': 'Repair Stone 1',
  'f4267358-b361-4421-af59-852745c321fd': 'Repair Stone 2',
  'ffd0cb82-fbc0-4102-9712-bbf4e4e37ddf': 'Repair Stone 3',
  'd86ba7ce-997a-4701-b7fa-fd12e947698d': 'Romantic Gift',
  'cf829473-45b1-475b-81e5-88bbb19dc994': 'Scroll of Shop Reset',
  '5c61dc44-4df7-42ff-8a38-5ec0374a06c7': 'Seashell',
  'b6877452-9319-4475-880f-9b8ad4e62d3c': 'Serpent Feather',
  'a7133db2-ecc4-4b4b-b301-5aa906b823f9': 'Slightly Damaged Glass',
  'bbe5b292-766a-4bf6-80d4-1337506931fd': 'Small Pet Snack',
  'f97dd9c3-349d-4083-854e-e59726f05770': 'Snek Pet',
  '7db3f1b4-2160-4866-b794-69dac0ca26a6': 'Snowflake',
  'c0881863-4163-416b-80d0-0f71a3f74a08': 'Snowflake Pet',
  '64addca6-3925-41e2-bd5d-8b1d78a3668f': 'Solid Fuel',
  '5c8bc486-bf61-4f6b-9ce0-baab783b4abd': 'Spearhead',
  'c59235d8-0ff9-4732-8545-b1bbdbebf90e': 'Spice Bag',
  'a0fd74fc-2031-4e12-9a45-4df3d2ff17cb': 'Spiney Pet',
  '37970488-9ba0-4174-ac6f-fb242948a282': 'Spooky Spook',
  '44ca5960-af4d-488b-a300-8ebe37960a60': 'Starfish',
  '3402b9a1-0978-4ce3-a33f-e9f9c704918d': 'Stash space',
  '3e82261f-de58-4eac-a096-3354e291a412': 'Steam Coin',
  '81b3ea1b-f139-40e1-822b-51d960562ef1': 'Steam Dust',
  'f3b1b2b6-aaf3-4052-bc4e-626691dcc6dd': 'Steel Bar',
  'f6963da9-33a6-42a6-a3cb-d24b4e963037': 'Stone',
  '7a45c672-8219-4fc9-8adf-8bb59b223b2e': 'Stoney McStoneface',
  '9950b3bd-4f6d-444c-b6b8-80f577ccf226': 'Stonks',
  '508497ea-05e1-475e-b642-85c24424da84': 'Summer Enhance Stone',
  '84b19b85-1286-479d-9525-c4d6410b175b': 'Summer Repair Stone',
  '9c522a6d-ccd8-4750-b1e0-d719608ec300': 'Sun Essence',
  '7a68e8d5-db81-4099-9e97-de2e0b79d0ad': 'Sunstone Bar',
  '6a584e06-ad18-475d-b70c-b9d05084a3c3': 'Sunstone Ore',
  '8cbb6f5a-777f-4190-9db0-0d1e0ef21a41': 'Thorium Bar',
  '453946a7-7ca3-4458-98d3-f26de24f2de7': 'Thorium Ore',
  'cb3ed74e-8d7a-4bc4-96fc-9100076e2d19': 'Thread',
  '1f47fba8-512f-4751-b8ee-122a62e914c8': 'Tin Bar',
  'e9390dc5-b629-47b9-9bd1-3aab9c5a05a0': 'Tin Ore',
  '90a5d2db-70f9-4617-85f4-427eb769156f': 'Torn Silk Fabric',
  '1dfa73c4-4a2d-4c91-a405-1121cdb4186a': 'Town Teleport',
  'b073d850-f284-4b3e-a20d-6b27d58d7b51': 'Troll Idol',
  '46f4978f-b395-4960-beb5-cf34ccd44d0a': 'Turkey Drumstick',
  '688e1299-f019-4ed0-aa4d-cfa4a21f0f4d': 'Turkey Feather',
  '9d1f66fe-e16d-49f6-ba6e-f2111c6c2fc1': 'Turkey In Honey',
  '1b476dec-a2d2-410c-b306-64fde75aac85': 'Turkey Salad',
  'c913ecd6-69f6-4042-8b89-881778c11156': 'Ultra Repair Stone',
  '59801128-4a15-4b34-a1dd-0fdf5f3ca7d0': 'Unknown Item',
  '91331b15-6eb9-41bb-86a2-3b821086ba99': 'Valentine Pet',
  '0cdd5000-2c00-497e-bfa8-f3740c6ca184': 'Weird Book Pet',
  '7d86c52e-d075-40f3-8c7e-0bd15fc513f0': 'Weird Page',
  '8a494aa0-ff6f-4856-9c0f-e017286710d8': 'Wolf Fang',
  'ce6a191b-8107-4a61-9390-152f75a19e89': 'Woodcutting Reset Potion',
  '714aa71a-200f-4b71-ab70-d3b5d6cb84d0': 'Yellow Feather',
  '5b31dbab-0bf3-4f8b-bd40-0899d6e6cc6e': "Yrsainir's Key",
};

/**
 * Card-item GUID → name. Stash-resident card drops (the consumable
 * "X Card" items granted by mob kills, before being deposited into
 * Currency.cards). Bulk-extracted 2026-05-06 from Items_en localization
 * (`card_<guid>_name` keys). Names preserve game's inconsistent casing
 * (e.g. "Bat Card" vs "Bandiff card") — match the loc tables verbatim
 * so a future cards.json cross-reference is mechanical.
 *
 * Distinct namespace from the canonical card names in cards.json which
 * are keyed by mob name; these GUIDs key the *item form* of the card.
 */
const CARD_GUID_MAP = {
  '0c1ef0c9-94a6-4b03-b7d0-0f7c123a80d5': 'Act 1 Hard Card',
  '9995e57d-56a0-43f7-ba9a-2ae58d660c9e': 'Act 1 Hell Card',
  '4e7b9ee2-ed39-4452-b110-b48173fbcf44': 'Act 1 Nightmare Card',
  'e517df04-27d7-4b19-9b40-e3946da487e9': 'Act 2 Hard Card',
  'e8f12476-16d8-46e3-a434-a610586e60a9': 'Act 2 Hell Card',
  '3dfa3ddf-920a-417e-89c4-23761104bf70': 'Act 2 Nightmare Card',
  '13afcba1-93a5-4db7-9c95-9495cbf106b6': 'Act 3 Hard Card',
  'fd8fb64e-75f5-4cc7-b10f-a09551e3b992': 'Act 3 Hell Card',
  'd29f81f5-16dd-48d1-a3cf-6c01d881d7a3': 'Act 3 Nightmare Card',
  'd2102531-54c6-4015-bf80-999a77bdce22': 'Animater Armor Card',
  '6c49777f-3a8e-45fe-882d-b04441d5e3a6': 'Ash Card',
  'e09a9f88-761d-4c8c-a0fc-52f636598e96': 'Bandiff card',
  '1d96b63e-a91b-4950-9100-bfb2cb8ac842': 'Bat Card',
  '085147aa-8bad-48ad-bcda-8a2cb6f304a2': 'Beetleman card',
  '2a87e53c-5189-44f1-9ff3-cc154244d6df': 'Boar Card',
  'eaf231fb-1ed2-469f-a044-8db4b30bfd02': 'Bringer Of Death Card',
  '04a440f8-fd4c-40ee-9a87-dbcd90f6b809': 'Cactus Mommy card',
  'ec7cbbcd-f65e-4b05-a81c-adc26c9d71d2': 'Card Part',
  '86d874e3-22b5-435a-b5ff-5dc6ac111282': 'Ciphered Billding card',
  '09cb5090-94c0-43a3-acfc-ab0f835b1f54': 'Copper Card',
  'b72641aa-5db0-4b68-b3ec-1a57ca2a0a3a': 'Crab Card',
  'f6914f23-0587-49ea-958f-843f4f932a64': 'Djinn card',
  '228b968e-52a1-4f6d-b7e5-be7ffa2ad8bf': 'Draugr card',
  'fa1a8b0b-6e0d-4e35-a1ca-ffc56adb6c64': 'Dung Beetle card',
  '6f490791-93ca-440e-b3f8-3af4f7a73f9e': 'Fez card',
  'd716276f-216b-4990-936b-309b7bc0dc24': 'Fire Elemental Card',
  'f310bbcd-bcf8-428c-bd2e-be0a584456e1': 'Ghost Card',
  '278b0a94-1953-4745-80c1-603f29744f10': 'Glass card',
  '195d383e-553b-4243-ab67-1a4cfb503593': 'Gnoll Card',
  'ed63ed44-bae8-42e7-9ca5-47d200a7fb62': 'Helmet Card',
  '49a24059-a3c3-4c30-89ae-82e7a5333393': 'Horus card',
  '563f4aef-ba6d-4c65-89cd-24087826e034': 'Ice Mammoth Card',
  '0ba54af9-0ea2-43b5-9074-b84250a86694': 'Iceboar Card',
  '04669273-34ee-40d5-adda-4bf162298f91': 'Iron Card',
  'e4df93e0-043a-42d4-82d9-995dfe377ad3': 'Ironwood Card',
  'c55b3d08-a246-4f31-bc0d-b994295130a0': 'Jötunn Card',
  '6deeee7a-63be-4d28-9bb8-28b9db41e858': 'Kangaroo card',
  'f45ae0ff-0a4e-455c-a38c-4238279eac7d': 'Kobold Card',
  '41545085-b69b-4ab9-accf-7270aaab281c': 'Maevath Card',
  '43b27c88-c39d-4bc0-a879-174f5b0243ba': 'Matryoshka card',
  '3fb7c68e-e446-4912-bc2e-5ad91e94aacc': 'Mummy card',
  '23043ffb-3407-44cd-9f17-a6b63ca62171': 'Palm Log Card',
  'f88c8b6b-f55d-4339-a6db-97843c024cf6': 'Palm Tree Log',
  '48db6aaa-b33e-4c00-b323-d3aa45d0ec31': 'Pebble Card',
  'ccd72a01-1a23-4041-9dc0-ab9165c5cf60': 'Penguin card',
  '5031b32c-bb3c-46de-a452-f9a22c9f3d96': 'Plant Card',
  'bfe49fc3-697d-4884-8a5b-08b59e7ec086': 'Pyrewood Card',
  '18ac5c22-20e8-4510-bf9a-516d49c21f50': 'Ratatoskr Card',
  'bded5fc3-5265-4498-a7c9-095376753ad2': 'Slime Cube Card',
  '45dc33bf-8cf2-4c8d-a56f-4b48aa1d2b8b': 'Snowman Card',
  'aafa5ac8-c68d-4fd7-97b3-6c7355ee2bbb': 'Stump Card',
  'f8a249ee-9a96-4945-84de-1420e4d33bd7': 'Sun Boy card',
  'bef24786-db08-4b11-9562-c3b4f4f91d47': 'Sunstone Card',
  '637d075b-b2cb-4292-8054-b594e4d65c0b': 'The Crab Card',
  '548d6401-1d48-4720-859e-1cd03001eb44': 'Thorium Card',
  '2725d34a-1ef5-4445-981b-703af861138d': 'Tree Toy',
  'f14aa711-dc2b-4a12-a404-7ef5af15d755': 'Troll Card',
  'f641d601-c3c3-44a2-9699-49872cdc5dda': 'Wasp Card',
  'f9e14b9b-e349-40d4-9927-7b2e690b12d2': 'Watches Card',
  'e3b872a7-58fd-443b-88f5-232253ccee9c': 'Weird Book Card',
  '131e901e-3990-439f-bba0-8a988c3b5383': 'Winged Serpent card',
  'c3857507-4fab-4170-bf2b-ec7d7e142870': 'Wolf Card',
  '72dd2c27-1c96-453c-9b05-c8b42221a8d5': 'Yeti Card',
  '8bf4528f-60d9-4d31-b733-596814e18cdb': 'Yrsainir Card',
  '33bf4722-6489-48df-8c04-13f4068389f4': 'Zhai Halud card',
};

/**
 * Engineer slot output GUID → item name. The 4 Engineer slots produce
 * Idea / Blueprint / Runic Blueprint / Sun Scroll (slots 0-3 in order).
 * Loc tables don't expose these as GUID-keyed entries — they live under
 * `engineer-item<N>_name` slugs. Mapping confirmed 2026-05-07 by
 * cross-referencing live save stockpile counts against the in-game
 * Engineer panel display.
 */
const ENGINEER_OUTPUT_GUID_MAP = {
  'fb8ec77b-7539-4ca7-9273-8992341f849e': 'Idea',
  '80fea108-d292-4c4e-ae19-bdc20b2cb3de': 'Blueprint',
  '97489751-4a47-4487-b5e1-8ce1ccb9a81d': 'Runic Blueprint',
  '3fd5ecc5-bbeb-4919-97d8-17ffbbb9f0fd': 'Sun Scroll',
};

/**
 * Pet-unlock GUID → name. Distinct from PET_SKIN_GUID_MAP (which keys
 * cosmetic skins applied to an already-unlocked pet). These are the
 * "Unlock" items that grant access to a pet variant. Bulk-extracted
 * 2026-05-06 from Items_en localization. Wired into extractStash for
 * stash-resident unlocks (before consumption).
 */
const PET_UNLOCK_GUID_MAP = {
  'f8fcf958-a21a-42e5-bc95-bf47b4dc0ed2': 'Animated Armor Unlock',
  'cdaf80cb-0067-4a20-86eb-c46289e53a1a': 'Astral Head Unlock',
  'd52924a2-8f42-42df-bf63-4f9071a69087': 'Bugling Unlock',
  '46153a2b-dca1-458c-a694-59860159380b': 'Chick Unlock',
  'd1eb318f-ea89-4671-b094-ee36d6608214': 'Dark Whelp Unlock',
  '16f80034-7cac-4eb0-8346-d84b78512df6': 'Epic Slyme Unlock',
  'cffef829-0cec-4daf-87f9-ce75a4ec9b2d': 'Kitty Unlock',
  'f593d48c-5ac6-40b4-a7e0-580ca3e795ae': 'Legendary Slyme Unlock',
  '87b1e3e3-98cb-4411-8681-d0dc32a835c9': 'Pump Kin Pet Unlock',
  'f5fd3b65-9139-4210-bcbe-83d86ec78d15': 'Queen of Hearts Unlock',
  '48eeac82-4c7b-42c1-bff8-9011e8216143': 'Rare Slyme Unlock',
  '4099291f-2729-498d-9488-2744a8e0cde4': 'Slyme Unlock',
  'c764c710-296d-4be5-a896-28e1f9bd3d6c': 'Succubus Unlock',
  '0b172e48-616f-41ff-8cc4-c5096c0844c3': 'Turkey Pet Unlock',
  '10eebafc-d2eb-4dba-a256-63e52dc6f996': 'Valkyrie Unlock',
  '0b0a1f31-d781-428e-a86f-403cfdbb5c71': 'Winged Observer Unlock',
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
      name:
        GEAR_GUID_MAP[entry.itemGuid] ||
        RESOURCE_GUID_MAP[entry.itemGuid] ||
        CARD_GUID_MAP[entry.itemGuid] ||
        RUNE_FRAGMENT_GUID_MAP[entry.itemGuid] ||
        PET_UNLOCK_GUID_MAP[entry.itemGuid] ||
        null,
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
  // Resolve stockpile GUIDs to readable item names (Idea / Blueprint /
  // Runic Blueprint / Sun Scroll). Unknown GUIDs preserve raw key.
  const stockpile = {};
  for (const [guid, count] of Object.entries(eng.Stockpile || {})) {
    const name = ENGINEER_OUTPUT_GUID_MAP[guid] || guid;
    stockpile[name] = count;
  }
  return {
    slots: slots.map((s, idx) => ({
      index: idx,
      enabled: !!s?.Enabled,
      stalled: !!s?.Stalled,
      lastProduced: s?.LastProduced ?? 0,
      upgrades: { ...(s?.Upgrades || {}) },
    })),
    stockpile,
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
