# Alt Farming Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an "Alt Advisor" tab that recommends optimal offline farming assignments for 3 alt characters based on bottleneck detection and per-alt capability analysis.

**Architecture:** Bottleneck detector identifies highest-priority farmable resources from the existing upgrade scoring system. Alt eligibility engine evaluates which zones each alt can survive and farm efficiently using the stat engine. Greedy assignment algorithm matches bottlenecks to capable alts. All displayed in a card-based assignment board UI.

**Tech Stack:** Preact + Signals, Vitest, Vite. No new dependencies.

---

### Task 1: Create Drop Tables Data File

**Files:**
- Create: `src/data/drops.json`

This is pure data entry from the community spreadsheet. The file has two sections: `zones` (mob drops per zone) and `resources` (reverse index: material → source).

- [ ] **Step 1: Create `src/data/drops.json` with full drop tables**

```json
{
  "zones": {
    "1.0": { "mob": "Boar", "drops": [
      { "item": "Boar Meat", "rate": 4, "type": "material" },
      { "item": "Boar Card", "rate": 10000, "type": "card" }
    ]},
    "1.1": { "mob": "Wasp", "drops": [
      { "item": "Honeycomb", "rate": 4, "type": "material" },
      { "item": "Wasp Card", "rate": 10000, "type": "card" }
    ]},
    "1.2": { "mob": "Pebble", "drops": [
      { "item": "Stoney McStoneface", "rate": 4, "type": "material" },
      { "item": "Solid Fuel", "rate": 4, "type": "material" },
      { "item": "Pebble Card", "rate": 5000, "type": "card" }
    ]},
    "1.3": { "mob": "Stump", "drops": [
      { "item": "Leaf", "rate": 4, "type": "material" },
      { "item": "Stump Card", "rate": 10000, "type": "card" }
    ]},
    "1.4": { "mob": "Plant", "drops": [
      { "item": "Mini Plant", "rate": 4, "type": "material" },
      { "item": "Plant Card", "rate": 10000, "type": "card" }
    ]},
    "1.5": { "mob": "Wolf", "drops": [
      { "item": "Wolf Fang", "rate": 4, "type": "material" },
      { "item": "Blue Essence", "rate": 200, "type": "material" },
      { "item": "Yellow Feather", "rate": 1000, "type": "material" },
      { "item": "Wolf Card", "rate": 10000, "type": "card" }
    ]},
    "1.6": { "mob": "Gnoll", "drops": [
      { "item": "Fruit", "rate": 4, "type": "material" },
      { "item": "Red Essence", "rate": 200, "type": "material" },
      { "item": "Yellow Feather", "rate": 1000, "type": "material" },
      { "item": "Gnoll Card", "rate": 10000, "type": "card" }
    ]},
    "1.7": { "mob": "Animated Armor", "drops": [
      { "item": "Ectoplasm", "rate": 4, "type": "material" },
      { "item": "Pink Essence", "rate": 200, "type": "material" },
      { "item": "Yellow Feather", "rate": 1000, "type": "material" },
      { "item": "Animated Armor Card", "rate": 10000, "type": "card" }
    ]},
    "1.8": { "mob": "Crab", "drops": [
      { "item": "Crab Claw", "rate": 4, "type": "material" },
      { "item": "Black Essence", "rate": 200, "type": "material" },
      { "item": "Yellow Feather", "rate": 1000, "type": "material" },
      { "item": "Solid Fuel", "rate": 10000, "type": "material" },
      { "item": "Crab Card", "rate": 5000000, "type": "card" }
    ]},
    "1.9": { "mob": "Bat", "drops": [
      { "item": "Bat Dust", "rate": 4, "type": "material" },
      { "item": "Bat Card", "rate": 10000, "type": "card" }
    ]},
    "1.10": { "mob": "Kobold", "drops": [
      { "item": "Candle", "rate": 4, "type": "material" },
      { "item": "Kobold Card", "rate": 10000, "type": "card" }
    ]},
    "1.11": { "mob": "Weird Book", "drops": [
      { "item": "Weird Page", "rate": 4, "type": "material" },
      { "item": "Weird Book Card", "rate": 10000, "type": "card" }
    ]},
    "1.12": { "mob": "Slime Cube", "drops": [
      { "item": "D20 Dice", "rate": 4, "type": "material" },
      { "item": "Slime Cube Card", "rate": 10000, "type": "card" }
    ]},
    "1.13": { "mob": "Fire Elemental", "drops": [
      { "item": "Fire Essence", "rate": 4, "type": "material" },
      { "item": "Fire Elemental Card", "rate": 10000, "type": "card" }
    ]},
    "2.1": { "mob": "Iceboar", "drops": [
      { "item": "Icy Needle", "rate": 4, "type": "material" },
      { "item": "Furry Fur", "rate": 200, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: NIL", "rate": 300000, "type": "rune" },
      { "item": "Iceboar Card", "rate": 25000, "type": "card" }
    ]},
    "2.2": { "mob": "Helmet", "drops": [
      { "item": "Helmet", "rate": 4, "type": "material" },
      { "item": "Furry Fur", "rate": 200, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: NIL", "rate": 300000, "type": "rune" },
      { "item": "Helmet Card", "rate": 25000, "type": "card" }
    ]},
    "2.3": { "mob": "Ghost", "drops": [
      { "item": "Iceghost Doll", "rate": 4, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: NIL", "rate": 300000, "type": "rune" },
      { "item": "Ghost Card", "rate": 25000, "type": "card" }
    ]},
    "2.4": { "mob": "Yeti", "drops": [
      { "item": "Distinguished Glasses", "rate": 4, "type": "material" },
      { "item": "Furry Fur", "rate": 200, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: NIL", "rate": 300000, "type": "rune" },
      { "item": "Yeti Card", "rate": 25000, "type": "card" }
    ]},
    "2.5": { "mob": "Ratatoskr", "drops": [
      { "item": "Nut", "rate": 4, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: FUS", "rate": 300000, "type": "rune" },
      { "item": "Ratatoskr Card", "rate": 25000, "type": "card" }
    ]},
    "2.6": { "mob": "Watches", "drops": [
      { "item": "Pocketwatch", "rate": 4, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: FUS", "rate": 300000, "type": "rune" },
      { "item": "Watches Card", "rate": 25000, "type": "card" }
    ]},
    "2.7": { "mob": "Snowman", "drops": [
      { "item": "Carrot", "rate": 4, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: FUS", "rate": 300000, "type": "rune" },
      { "item": "Snowman Card", "rate": 25000, "type": "card" }
    ]},
    "2.8": { "mob": "Troll", "drops": [
      { "item": "Troll Idol", "rate": 4, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: FUS", "rate": 300000, "type": "rune" },
      { "item": "Troll Card", "rate": 25000, "type": "card" }
    ]},
    "2.9": { "mob": "Penguin", "drops": [
      { "item": "Monocle", "rate": 4, "type": "material" },
      { "item": "Cryolite Ore", "rate": 2000, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: MU", "rate": 30000, "type": "rune" },
      { "item": "Penguin Card", "rate": 25000, "type": "card" }
    ]},
    "2.10": { "mob": "Glass", "drops": [
      { "item": "Slightly Damaged Glass", "rate": 4, "type": "material" },
      { "item": "Cryolite Ore", "rate": 2000, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: MU", "rate": 300000, "type": "rune" },
      { "item": "Glass Card", "rate": 25000, "type": "card" }
    ]},
    "2.11": { "mob": "Matryoshka", "drops": [
      { "item": "Matryoshka Doll", "rate": 4, "type": "material" },
      { "item": "Cryolite Ore", "rate": 2000, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: MU", "rate": 30000, "type": "rune" },
      { "item": "Matryoshka Card", "rate": 25000, "type": "card" }
    ]},
    "2.12": { "mob": "Draugr", "drops": [
      { "item": "Spearhead", "rate": 4, "type": "material" },
      { "item": "Cryolite Ore", "rate": 2000, "type": "material" },
      { "item": "Norse Essence", "rate": 10000, "type": "material" },
      { "item": "RUNE: MU", "rate": 300000, "type": "rune" },
      { "item": "Draugr Card", "rate": 25000, "type": "card" }
    ]},
    "3.1": { "mob": "Sun Boy", "drops": [
      { "item": "Sun Essence", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "RUNE: GOR", "rate": 3000, "type": "rune" },
      { "item": "Sun Boy Card", "rate": 50000, "type": "card" }
    ]},
    "3.2": { "mob": "Dung Beetle", "drops": [
      { "item": "Poop Ball", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "RUNE: GOR", "rate": 3000, "type": "rune" },
      { "item": "Dung Beetle Card", "rate": 50000, "type": "card" }
    ]},
    "3.3": { "mob": "Cactus Mommy", "drops": [
      { "item": "Cactus", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "RUNE: GOR", "rate": 3000, "type": "rune" },
      { "item": "Cactus Mommy Card", "rate": 50000, "type": "card" }
    ]},
    "3.4": { "mob": "Kangaroo", "drops": [
      { "item": "Kangaroo Boomerang", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Aether Crystal Shards", "rate": 125000, "type": "material" },
      { "item": "RUNE: GOR", "rate": 3000, "type": "rune" },
      { "item": "Kangaroo Card", "rate": 50000, "type": "card" }
    ]},
    "3.5": { "mob": "Fez", "drops": [
      { "item": "Fez Fez", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "Fez Card", "rate": 50000, "type": "card" }
    ]},
    "3.6": { "mob": "Winged Serpent", "drops": [
      { "item": "Serpent Feather", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "RUNE: GOR", "rate": 3000, "type": "rune" },
      { "item": "Winged Serpent Card", "rate": 50000, "type": "card" }
    ]},
    "3.7": { "mob": "Bandiff", "drops": [
      { "item": "Bandiff Star", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "RUNE: GOR", "rate": 30000, "type": "rune" },
      { "item": "Bandiff Card", "rate": 50000, "type": "card" }
    ]},
    "3.8": { "mob": "Beetleman", "drops": [
      { "item": "Beetleman Sting", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Aether Crystal Shards", "rate": 125000, "type": "material" },
      { "item": "RUNE: GOR", "rate": 30000, "type": "rune" },
      { "item": "Beetleman Card", "rate": 50000, "type": "card" }
    ]},
    "3.9": { "mob": "Ciphered Building", "drops": [
      { "item": "Bow Tie", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "Ciphered Building Card", "rate": 50000, "type": "card" }
    ]},
    "3.10": { "mob": "Mummy", "drops": [
      { "item": "Mummy Wraps", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "Mummy Card", "rate": 50000, "type": "card" }
    ]},
    "3.11": { "mob": "Djinn", "drops": [
      { "item": "Djinn Lamp", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Torn Silk Fabric", "rate": 50000, "type": "material" },
      { "item": "Djinn Card", "rate": 50000, "type": "card" }
    ]},
    "3.12": { "mob": "Horus", "drops": [
      { "item": "Horus Idol", "rate": 4, "type": "material" },
      { "item": "Orange Chromo", "rate": 25000, "type": "material" },
      { "item": "Aether Crystal Shards", "rate": 125000, "type": "material" },
      { "item": "Horus Card", "rate": 50000, "type": "card" }
    ]}
  },
  "bosses": {
    "boss:bringer": { "mob": "Bringer of Death", "drops": [
      { "item": "Death's Eye", "rate": 1, "type": "material" },
      { "item": "Boss Amulet", "rate": 6, "type": "gear" },
      { "item": "Enhance Stone I", "rate": 10, "type": "material" },
      { "item": "Bringer of Death Card", "rate": 2, "type": "card" }
    ]},
    "boss:crab": { "mob": "The Crab", "drops": [
      { "item": "The Crab's Pickaxe", "rate": 1, "type": "gear" },
      { "item": "Enhance Stone I", "rate": 10, "type": "material" },
      { "item": "The Crab Card", "rate": 2, "type": "card" }
    ]},
    "boss:yrsainir": { "mob": "Yrsainir", "drops": [
      { "item": "Dragon Tooth", "rate": 1, "type": "material" },
      { "item": "Dragon Soul", "rate": 1, "type": "material" },
      { "item": "Enhance Stone I", "rate": 10, "type": "material" },
      { "item": "Yrsainir Card", "rate": 2, "type": "card" }
    ]},
    "boss:mammoth": { "mob": "Ice Mammoth", "drops": [
      { "item": "Mammoth Soul", "rate": 1, "type": "material" },
      { "item": "Mammoth Tusk", "rate": 1, "type": "material" },
      { "item": "Mammoth Ring", "rate": 10, "type": "gear" },
      { "item": "Norse Essence", "rate": 10, "type": "material" },
      { "item": "Enhance Stone 2", "rate": 10, "type": "material" },
      { "item": "Ice Mammoth Card", "rate": 2, "type": "card" },
      { "item": "Rune: HAS", "rate": 10, "type": "rune" }
    ]},
    "boss:jotunn": { "mob": "Jotunn", "drops": [
      { "item": "Jötunn Soul", "rate": 1, "type": "material" },
      { "item": "Jötunn Eye", "rate": 1, "type": "material" },
      { "item": "Nordic Amulet", "rate": 20, "type": "gear" },
      { "item": "Norse Essence", "rate": 10, "type": "material" },
      { "item": "Enhance Stone 2", "rate": 10, "type": "material" },
      { "item": "Jötunn Card", "rate": 2, "type": "card" }
    ]},
    "boss:maevath": { "mob": "Maevath", "drops": [
      { "item": "Maevath's Horn", "rate": 1, "type": "material" },
      { "item": "Ghostly Pet", "rate": 100, "type": "pet" },
      { "item": "Enhance Stone 2", "rate": 10, "type": "material" },
      { "item": "Maevath Card", "rate": 2, "type": "card" },
      { "item": "Rune: HAS", "rate": 10, "type": "rune" }
    ]},
    "boss:kangaroo": { "mob": "Zhai Halud", "drops": [
      { "item": "Gate Building Blocks", "rate": 1, "type": "material" },
      { "item": "Enhance Stone 3", "rate": 10, "type": "material" },
      { "item": "Zhai Halud Card", "rate": 2, "type": "card" }
    ]}
  },
  "professions": {
    "mining": {
      "Copper Ore": { "zone": "1.2", "minLevel": 1 },
      "Iron Ore": { "zone": "1.10", "minLevel": 10 },
      "Thorium Ore": { "zone": "2.5", "minLevel": 20 },
      "Sunstone Ore": { "zone": "3.5", "minLevel": 30 }
    },
    "woodcutting": {
      "Ash Log": { "zone": "1.3", "minLevel": 1 },
      "Pyrewood Log": { "zone": "1.11", "minLevel": 10 },
      "Ironwood Log": { "zone": "2.1", "minLevel": 20 },
      "Palm Tree Log": { "zone": "3.3", "minLevel": 30 }
    }
  },
  "resources": {
    "Boar Meat": { "zone": "1.0", "rate": 4 },
    "Honeycomb": { "zone": "1.1", "rate": 4 },
    "Stoney McStoneface": { "zone": "1.2", "rate": 4 },
    "Leaf": { "zone": "1.3", "rate": 4 },
    "Mini Plant": { "zone": "1.4", "rate": 4 },
    "Wolf Fang": { "zone": "1.5", "rate": 4 },
    "Fruit": { "zone": "1.6", "rate": 4 },
    "Ectoplasm": { "zone": "1.7", "rate": 4 },
    "Crab Claw": { "zone": "1.8", "rate": 4 },
    "Bat Dust": { "zone": "1.9", "rate": 4 },
    "Candle": { "zone": "1.10", "rate": 4 },
    "Weird Page": { "zone": "1.11", "rate": 4 },
    "D20 Dice": { "zone": "1.12", "rate": 4 },
    "Fire Essence": { "zone": "1.13", "rate": 4 },
    "Icy Needle": { "zone": "2.1", "rate": 4 },
    "Helmet": { "zone": "2.2", "rate": 4 },
    "Iceghost Doll": { "zone": "2.3", "rate": 4 },
    "Distinguished Glasses": { "zone": "2.4", "rate": 4 },
    "Nut": { "zone": "2.5", "rate": 4 },
    "Pocketwatch": { "zone": "2.6", "rate": 4 },
    "Carrot": { "zone": "2.7", "rate": 4 },
    "Troll Idol": { "zone": "2.8", "rate": 4 },
    "Monocle": { "zone": "2.9", "rate": 4 },
    "Slightly Damaged Glass": { "zone": "2.10", "rate": 4 },
    "Matryoshka Doll": { "zone": "2.11", "rate": 4 },
    "Spearhead": { "zone": "2.12", "rate": 4 },
    "Mammoth Soul": { "boss": "boss:mammoth", "rate": 1 },
    "Jötunn Soul": { "boss": "boss:jotunn", "rate": 1 },
    "Maevath's Horn": { "boss": "boss:maevath", "rate": 1 },
    "Death's Eye": { "boss": "boss:bringer", "rate": 1 },
    "Dragon Tooth": { "boss": "boss:yrsainir", "rate": 1 },
    "Mammoth Tusk": { "boss": "boss:mammoth", "rate": 1 },
    "Jötunn Eye": { "boss": "boss:jotunn", "rate": 1 },
    "Norse Essence": { "zone": "2.1", "rate": 10000 },
    "Coin": { "zone": "any", "rate": 1, "note": "gold drops" },
    "Steel Ingot": { "craft": true, "note": "smelted from Iron Ore" },
    "Copper Ore": { "activity": "mining", "minLevel": 1 },
    "Iron Ore": { "activity": "mining", "minLevel": 10 },
    "Thorium Ore": { "activity": "mining", "minLevel": 20 },
    "Sunstone Ore": { "activity": "mining", "minLevel": 30 },
    "Ash Logs": { "activity": "woodcutting", "minLevel": 1 },
    "Pyrewood Logs": { "activity": "woodcutting", "minLevel": 10 },
    "Ironwood Logs": { "activity": "woodcutting", "minLevel": 20 },
    "Palm Tree Log": { "activity": "woodcutting", "minLevel": 30 }
  }
}
```

- [ ] **Step 2: Verify the JSON is valid**

Run: `cd "C:/Users/Jeremy/Documents/Repos/Personal/EvitaniaCalc" && node -e "require('./src/data/drops.json'); console.log('valid')"`
Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add src/data/drops.json
git commit -m "feat: add full drop tables data from community spreadsheet"
```

---

### Task 2: Extract Upgrade Enumerator into Shared Module

**Files:**
- Create: `src/state/upgrade-enumerator.js`
- Modify: `src/tabs/UpgradeAdvisor.jsx`
- Test: `src/state/upgrade-enumerator.test.js`

Move `enumerateHunterUpgrades`, `enumerateTalentUpgrades`, `enumerateAshUpgrades`, `enumerateSacrificeUpgrades`, `enumerateGearUpgrades`, `enumerateAllUpgrades`, and all their helpers (`buildGearBySlotSubtype`, `findItemInGearData`, `computeGearStatDelta`) from `UpgradeAdvisor.jsx` into a shared module. The UpgradeAdvisor then imports from the shared module.

- [ ] **Step 1: Write a test for the shared module**

Create `src/state/upgrade-enumerator.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { enumerateAllUpgrades } from './upgrade-enumerator.js';

describe('enumerateAllUpgrades', () => {
  it('returns upgrades for a rogue profile with gear', () => {
    const profile = {
      class: 'rogue',
      level: 10,
      hunterUpgrades: { LeBabka_Str: 5 },
      talents: { novice_0_0_patk: 1 },
      ashUpgrades: {},
      sacrificeUpgrades: {},
      gear: {
        weapon: { name: 'Copper Bow', enhancementLevel: 0 },
      },
    };
    const upgrades = enumerateAllUpgrades(profile);

    // Should have hunter, talent, ash, sacrifice, and gear upgrades
    const types = new Set(upgrades.map(u => u.type));
    expect(types.has('hunter')).toBe(true);
    expect(types.has('talent')).toBe(true);
    expect(types.has('gear')).toBe(true);

    // Talent upgrades should only be novice + rogue (not warrior/mage)
    const talentUpgrades = upgrades.filter(u => u.type === 'talent');
    const hasWarrior = talentUpgrades.some(u => u.id.startsWith('tt_warrior'));
    expect(hasWarrior).toBe(false);

    // Gear: bow should suggest next bow (Steel Bow), not a sword
    const gearUpgrades = upgrades.filter(u => u.type === 'gear');
    const bowUpgrade = gearUpgrades.find(u => u.name === 'Steel Bow');
    expect(bowUpgrade).toBeDefined();
    const swordUpgrade = gearUpgrades.find(u => u.name === 'Wooden Sword');
    expect(swordUpgrade).toBeUndefined();
  });

  it('each upgrade has materialCost with resource names', () => {
    const profile = {
      class: 'rogue',
      level: 10,
      hunterUpgrades: {},
      talents: {},
      ashUpgrades: {},
      sacrificeUpgrades: {},
      gear: {},
    };
    const upgrades = enumerateAllUpgrades(profile);
    const hunterUpgrades = upgrades.filter(u => u.type === 'hunter');

    // Hunter upgrades should have materialCost
    for (const hu of hunterUpgrades) {
      expect(hu.materialCost).toBeDefined();
      expect(Object.keys(hu.materialCost).length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/upgrade-enumerator.test.js`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Create `src/state/upgrade-enumerator.js`**

Cut the following functions from `src/tabs/UpgradeAdvisor.jsx` and paste into the new file:
- `buildGearBySlotSubtype` and the `gearBySlotSubtype` constant
- `enumerateHunterUpgrades`
- `enumerateTalentUpgrades`
- `enumerateAshUpgrades`
- `enumerateSacrificeUpgrades`
- `enumerateGearUpgrades`
- `findItemInGearData`
- `computeGearStatDelta`
- `enumerateAllUpgrades`

The new file's imports:

```js
import hunterUpgradesData from '../data/hunter-upgrades.json';
import talentsData from '../data/talents.json';
import ashUpgradesData from '../data/ash-upgrades.json';
import sacrificesData from '../data/sacrifices.json';
import gearData from '../data/gear.json';
```

Export: `export { enumerateAllUpgrades, enumerateHunterUpgrades, enumerateTalentUpgrades, enumerateAshUpgrades, enumerateSacrificeUpgrades, enumerateGearUpgrades };`

- [ ] **Step 4: Update `UpgradeAdvisor.jsx` to import from shared module**

Replace the cut functions with:

```js
import { enumerateAllUpgrades } from '../state/upgrade-enumerator.js';
```

Remove the now-unused imports: `hunterUpgradesData`, `talentsData`, `ashUpgradesData`, `sacrificesData`, `gearData`.

Keep: `enemies`, `UpgradeRow`, `signal`, `activeProfile`, `computeStats`, `rankAllUpgrades`, `autoCalibrate`.

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS (existing tests + new upgrade-enumerator tests)

- [ ] **Step 6: Commit**

```bash
git add src/state/upgrade-enumerator.js src/state/upgrade-enumerator.test.js src/tabs/UpgradeAdvisor.jsx
git commit -m "refactor: extract upgrade enumerator into shared module"
```

---

### Task 3: Build Bottleneck Detector

**Files:**
- Create: `src/state/bottleneck-detector.js`
- Test: `src/state/bottleneck-detector.test.js`

- [ ] **Step 1: Write tests for the bottleneck detector**

Create `src/state/bottleneck-detector.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { detectBottlenecks } from './bottleneck-detector.js';

describe('detectBottlenecks', () => {
  const baseProfile = {
    class: 'rogue',
    level: 69,
    hunterUpgrades: { LeBabka_Str: 10 },
    talents: { tt_rogue_0_0: 5, novice_0_0_patk: 1, class_1_rogue: 1 },
    ashUpgrades: {},
    sacrificeUpgrades: { 'act-2-sacrifice-1': 5 },
    gear: { weapon: { name: 'Steel Bow', enhancementLevel: 6 } },
    currentZone: '2.1',
  };

  it('returns bottleneck resources sorted by priority', () => {
    const bottlenecks = detectBottlenecks(baseProfile);
    expect(Array.isArray(bottlenecks)).toBe(true);
    expect(bottlenecks.length).toBeGreaterThan(0);

    // Each bottleneck should have required fields
    for (const b of bottlenecks) {
      expect(b.upgrade).toBeDefined();
      expect(b.resource).toBeDefined();
      expect(b.needed).toBeGreaterThan(0);
      expect(b.priority).toBeDefined();
    }

    // Should be sorted by priority ascending (1 = highest)
    for (let i = 1; i < bottlenecks.length; i++) {
      expect(bottlenecks[i].priority).toBeGreaterThanOrEqual(bottlenecks[i - 1].priority);
    }
  });

  it('includes zone or activity source for each resource', () => {
    const bottlenecks = detectBottlenecks(baseProfile);
    for (const b of bottlenecks) {
      const hasZone = b.zone !== undefined;
      const hasBoss = b.boss !== undefined;
      const hasActivity = b.activity !== undefined;
      expect(hasZone || hasBoss || hasActivity).toBe(true);
    }
  });

  it('sacrifice upgrades include both costItem and soul as bottlenecks', () => {
    const profile = {
      ...baseProfile,
      sacrificeUpgrades: { 'act-2-sacrifice-1': 1 }, // Attack Wish rank 1, needs Helmet + Mammoth Soul
    };
    const bottlenecks = detectBottlenecks(profile);
    const resources = bottlenecks.map(b => b.resource);
    // Attack Wish needs "Helmet" material and "Mammoth Soul"
    // Both should appear if Attack Wish is in the top upgrades
    const hasHelmet = resources.includes('Helmet');
    const hasSoul = resources.includes('Mammoth Soul');
    // At least one of these should be present (depends on upgrade ranking)
    expect(hasHelmet || hasSoul).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/bottleneck-detector.test.js`
Expected: FAIL — module doesn't exist

- [ ] **Step 3: Implement `src/state/bottleneck-detector.js`**

```js
import { computeStats, computeEffectiveDPS } from './stat-engine.js';
import { enumerateAllUpgrades } from './upgrade-enumerator.js';
import { rankAllUpgrades, autoCalibrate } from './upgrade-scorer.js';
import enemies from '../data/enemies.json';
import dropsData from '../data/drops.json';
import sacrificesData from '../data/sacrifices.json';
import hunterUpgradesData from '../data/hunter-upgrades.json';

/**
 * Find enemy data for a zone.
 */
function findEnemy(zoneId) {
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    const match = act.zones.find(e => e.zone === zoneId);
    if (match) return match;
  }
  return enemies.act1.zones[0];
}

/**
 * Resolve a material name to its source (zone, boss, or profession activity).
 */
function resolveResource(resourceName) {
  const entry = dropsData.resources[resourceName];
  if (!entry) return null;
  return entry;
}

/**
 * Get the material requirements for a scored upgrade.
 */
function getUpgradeMaterials(upgrade) {
  const materials = [];

  if (upgrade.materialCost) {
    for (const [item, qty] of Object.entries(upgrade.materialCost)) {
      if (qty > 0) {
        materials.push({ resource: item, needed: qty });
      }
    }
  }

  // For sacrifice upgrades, also add the soul cost
  if (upgrade.type === 'sacrifice') {
    const sac = sacrificesData.find(s => s.id === upgrade.id);
    if (sac) {
      materials.push({ resource: `${sac.soul} Soul`, needed: 1 });
    }
  }

  return materials;
}

/**
 * Detect the highest-priority farmable resource bottlenecks for a profile.
 *
 * @param {object} profile — the main character's profile
 * @param {number} [topN=10] — how many top upgrades to analyze
 * @returns {Array<object>} — priority-sorted bottleneck list
 */
export function detectBottlenecks(profile, topN = 10) {
  const stats = computeStats(profile);
  const enemy = findEnemy(profile.currentZone || '1.0');
  const weights = autoCalibrate(95);

  const allUpgrades = enumerateAllUpgrades(profile);
  const ranked = rankAllUpgrades(stats, allUpgrades, enemy, weights);

  const bottlenecks = [];
  const seenResources = new Set();

  const limit = Math.min(topN, ranked.length);
  for (let i = 0; i < limit; i++) {
    const upgrade = ranked[i];
    const materials = getUpgradeMaterials(upgrade);

    for (const mat of materials) {
      if (seenResources.has(mat.resource)) continue;
      seenResources.add(mat.resource);

      const source = resolveResource(mat.resource);
      if (!source) continue;

      const bottleneck = {
        upgrade: upgrade.name,
        upgradeType: upgrade.type,
        resource: mat.resource,
        needed: mat.needed,
        owned: 0, // v1: no inventory tracking
        priority: i + 1,
        powerGain: upgrade.powerDelta,
        score: upgrade.score,
      };

      // Attach source info
      if (source.zone) {
        bottleneck.zone = source.zone;
        bottleneck.dropRate = source.rate;
      } else if (source.boss) {
        bottleneck.boss = source.boss;
        bottleneck.dropRate = source.rate;
      } else if (source.activity) {
        bottleneck.activity = source.activity;
        bottleneck.minLevel = source.minLevel;
      }

      bottlenecks.push(bottleneck);
    }
  }

  return bottlenecks;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/bottleneck-detector.js src/state/bottleneck-detector.test.js
git commit -m "feat: add bottleneck detector for alt farming advisor"
```

---

### Task 4: Build Alt Eligibility Engine

**Files:**
- Create: `src/state/alt-optimizer.js`
- Test: `src/state/alt-optimizer.test.js`

- [ ] **Step 1: Write tests**

Create `src/state/alt-optimizer.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildCapabilityMatrix, assignAlts } from './alt-optimizer.js';

describe('buildCapabilityMatrix', () => {
  it('returns eligible zones for a profile', () => {
    const profile = {
      name: 'Thalin',
      class: 'warrior',
      level: 48,
      hunterUpgrades: { LeBabka_Str: 15, LeBabka_PAtk: 10 },
      talents: { tt_warrior_0_0: 5, tt_warrior_1_1: 5, novice_0_0_patk: 1, class_1_warrior: 1 },
      ashUpgrades: {},
      sacrificeUpgrades: {},
      gear: { weapon: { name: 'Steel Sword', enhancementLevel: 5 } },
      currentZone: '2.1',
      miningLevel: 20,
      woodcuttingLevel: 15,
      farmingRates: { killsPerHour: 300, xpPerHour: 50000, goldPerHour: 100 },
    };
    const matrix = buildCapabilityMatrix(profile);

    expect(matrix.altName).toBe('Thalin');
    expect(matrix.altClass).toBe('warrior');
    expect(matrix.altLevel).toBe(48);
    expect(Array.isArray(matrix.zones)).toBe(true);

    // Should have at least some eligible zones
    expect(matrix.zones.length).toBeGreaterThan(0);

    // Each zone entry should have zone, killsPerHour, survivalTime
    for (const z of matrix.zones) {
      expect(z.zone).toBeDefined();
      expect(z.killsPerHour).toBeGreaterThan(0);
      expect(z.survivalTime).toBeGreaterThan(0);
    }
  });
});

describe('assignAlts', () => {
  it('assigns alts to bottleneck zones', () => {
    const bottlenecks = [
      { resource: 'Helmet', zone: '2.2', dropRate: 4, priority: 1, upgrade: 'Attack Wish (Rank 6)' },
      { resource: 'Thorium Ore', activity: 'mining', minLevel: 20, priority: 2, upgrade: 'Thorium Bow' },
    ];
    const matrices = [
      {
        altName: 'Thalin', altClass: 'warrior', altLevel: 48,
        zones: [
          { zone: '2.2', killsPerHour: 340, survivalTime: 180 },
          { zone: '2.1', killsPerHour: 400, survivalTime: 300 },
        ],
        mining: { level: 25 },
        woodcutting: { level: 15 },
        profile: { name: 'Thalin' },
      },
      {
        altName: 'Kai', altClass: 'rogue', altLevel: 15,
        zones: [
          { zone: '1.10', killsPerHour: 200, survivalTime: 120 },
        ],
        mining: { level: 20 },
        woodcutting: { level: 10 },
        profile: { name: 'Kai' },
      },
    ];

    const assignments = assignAlts(bottlenecks, matrices);
    expect(assignments.length).toBe(2);

    // Thalin should get Helmet zone since he can farm 2.2
    const thalinAssign = assignments.find(a => a.altName === 'Thalin');
    expect(thalinAssign.zone).toBe('2.2');
    expect(thalinAssign.type).toBe('farm');

    // Kai can't reach 2.2, so should get mining (next bottleneck)
    const kaiAssign = assignments.find(a => a.altName === 'Kai');
    expect(kaiAssign.type).toBe('profession');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/alt-optimizer.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `src/state/alt-optimizer.js`**

```js
import { computeStats, computeEffectiveDPS, computeTimeToDie, computeFarmingRates } from './stat-engine.js';
import enemies from '../data/enemies.json';

const SURVIVAL_THRESHOLD = 60; // seconds — must survive at least this long

/**
 * Build a flat list of all zone enemies.
 */
function getAllZoneEnemies() {
  const list = [];
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    for (const enemy of act.zones) {
      list.push(enemy);
    }
  }
  return list;
}

const allEnemies = getAllZoneEnemies();

/**
 * Build a capability matrix for a single alt profile.
 * Determines which zones they can farm and at what efficiency.
 */
export function buildCapabilityMatrix(profile) {
  const stats = computeStats(profile);
  const eligibleZones = [];

  for (const enemy of allEnemies) {
    const eDPS = computeEffectiveDPS(stats, enemy);
    const ttd = computeTimeToDie(stats, enemy);

    if (ttd >= SURVIVAL_THRESHOLD && eDPS > 0) {
      const rates = computeFarmingRates(eDPS, enemy, stats);
      eligibleZones.push({
        zone: enemy.zone,
        mob: enemy.name,
        killsPerHour: rates.killsPerHour,
        survivalTime: ttd,
        xpPerHour: rates.xpPerHour,
      });
    }
  }

  // Sort by zone progression (higher zones are "better" for pushing)
  eligibleZones.sort((a, b) => {
    const [aAct, aZone] = a.zone.split('.').map(Number);
    const [bAct, bZone] = b.zone.split('.').map(Number);
    return aAct !== bAct ? aAct - bAct : aZone - bZone;
  });

  // Determine the next zone they could push to
  const maxZone = eligibleZones.length > 0 ? eligibleZones[eligibleZones.length - 1].zone : null;
  let canPushTo = null;
  if (maxZone) {
    const [act, zone] = maxZone.split('.').map(Number);
    const nextZone = `${act}.${zone + 1}`;
    const nextEnemy = allEnemies.find(e => e.zone === nextZone);
    if (nextEnemy) canPushTo = nextZone;
  }

  return {
    altName: profile.name,
    altClass: profile.class,
    altLevel: profile.level,
    zones: eligibleZones,
    mining: { level: profile.miningLevel || 1 },
    woodcutting: { level: profile.woodcuttingLevel || 1 },
    maxZone,
    canPushTo,
    currentZone: profile.currentZone,
    offlineRates: profile.farmingRates,
    profile,
  };
}

/**
 * Greedy assignment: match bottleneck resources to capable alts.
 *
 * @param {Array} bottlenecks — priority-sorted from detectBottlenecks
 * @param {Array} matrices — capability matrices from buildCapabilityMatrix
 * @returns {Array} — assignment objects
 */
export function assignAlts(bottlenecks, matrices) {
  const assignments = [];
  const assigned = new Set(); // alt names already assigned

  for (const bn of bottlenecks) {
    if (assigned.size >= matrices.length) break;

    if (bn.zone) {
      // Find the best unassigned alt that can farm this zone
      let bestAlt = null;
      let bestRate = 0;

      for (const matrix of matrices) {
        if (assigned.has(matrix.altName)) continue;
        const zoneEntry = matrix.zones.find(z => z.zone === bn.zone);
        if (!zoneEntry) continue;
        const itemsPerHour = zoneEntry.killsPerHour / bn.dropRate;
        if (itemsPerHour > bestRate) {
          bestRate = itemsPerHour;
          bestAlt = matrix;
          bestAlt._zoneEntry = zoneEntry;
          bestAlt._itemsPerHour = itemsPerHour;
        }
      }

      if (bestAlt) {
        const remaining = bn.needed - bn.owned;
        const eta = bestAlt._itemsPerHour > 0 ? remaining / bestAlt._itemsPerHour : Infinity;
        assignments.push({
          altName: bestAlt.altName,
          type: 'farm',
          zone: bn.zone,
          resource: bn.resource,
          reason: `${bn.upgrade} needs ${remaining} ${bn.resource}`,
          rate: Math.round(bestAlt._itemsPerHour),
          rateUnit: `${bn.resource}/hr`,
          eta,
          powerGain: bn.powerGain,
          priority: bn.priority,
          profile: bestAlt.profile,
        });
        assigned.add(bestAlt.altName);
      }
    } else if (bn.activity) {
      // Find an unassigned alt with sufficient profession level
      for (const matrix of matrices) {
        if (assigned.has(matrix.altName)) continue;
        const profLevel = bn.activity === 'mining' ? matrix.mining.level : matrix.woodcutting.level;
        if (profLevel >= (bn.minLevel || 1)) {
          assignments.push({
            altName: matrix.altName,
            type: 'profession',
            activity: bn.activity,
            resource: bn.resource,
            reason: `${bn.upgrade} needs ${bn.resource}`,
            minLevel: bn.minLevel,
            priority: bn.priority,
            powerGain: bn.powerGain,
            profile: matrix.profile,
          });
          assigned.add(matrix.altName);
          break;
        }
      }
    }
  }

  // Unassigned alts: recommend zone pushing if they have room to progress
  for (const matrix of matrices) {
    if (assigned.has(matrix.altName)) continue;

    if (matrix.canPushTo) {
      const highestZone = matrix.zones[matrix.zones.length - 1];
      assignments.push({
        altName: matrix.altName,
        type: 'push',
        zone: matrix.maxZone,
        reason: `Push to ${matrix.canPushTo} to unlock new resources`,
        rate: highestZone ? Math.round(highestZone.killsPerHour) : 0,
        rateUnit: 'kills/hr',
        profile: matrix.profile,
      });
    } else if (matrix.zones.length > 0) {
      // Park at highest zone for XP
      const best = matrix.zones[matrix.zones.length - 1];
      assignments.push({
        altName: matrix.altName,
        type: 'xp',
        zone: best.zone,
        reason: 'Farm XP at highest zone',
        rate: Math.round(best.xpPerHour),
        rateUnit: 'XP/hr',
        profile: matrix.profile,
      });
    }
    assigned.add(matrix.altName);
  }

  return assignments;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/alt-optimizer.js src/state/alt-optimizer.test.js
git commit -m "feat: add alt eligibility engine and assignment algorithm"
```

---

### Task 5: Build Alt Advisor Tab UI

**Files:**
- Create: `src/tabs/AltAdvisor.jsx`
- Create: `src/css/alt-advisor.css`
- Modify: `src/app.jsx` — add tab route
- Modify: `src/components/TabNav.jsx` — add tab button

- [ ] **Step 1: Create `src/css/alt-advisor.css`**

```css
.alt-advisor { padding: 0; }
.alt-advisor__board {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.alt-card {
  background: var(--card-bg, rgba(255,255,255,0.05));
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  border-radius: 8px;
  padding: 14px 16px;
}
.alt-card--active {
  border-color: var(--success, #8f8);
  border-width: 2px;
}
.alt-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.alt-card__name {
  font-weight: 700;
  font-size: 1rem;
}
.alt-card__badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}
.alt-card__badge--active {
  background: rgba(80,255,80,0.15);
  color: var(--success, #8f8);
}
.alt-card__badge--offline {
  background: rgba(136,170,255,0.15);
  color: var(--accent, #8af);
}
.alt-card__recommendation {
  margin-top: 6px;
}
.alt-card__rec-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--accent, #8af);
  margin-bottom: 4px;
}
.alt-card__rec-reason {
  font-size: 0.8rem;
  color: var(--text, #eee);
  margin-bottom: 4px;
}
.alt-card__rec-stats {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--text-dim, #aaa);
}
.alt-card__rec-stat {
  display: flex;
  gap: 4px;
}
.alt-card__rec-stat-value {
  color: var(--success, #8f8);
  font-weight: 600;
}
.alt-card__tip {
  margin-top: 6px;
  padding: 4px 8px;
  background: rgba(255, 170, 0, 0.08);
  border: 1px solid rgba(255, 170, 0, 0.2);
  border-radius: 4px;
  font-size: 0.72rem;
  color: var(--warn, #fa0);
}
.alt-card__override {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.alt-card__override-select {
  padding: 3px 6px;
  background: var(--input-bg, rgba(0,0,0,0.3));
  border: 1px solid var(--border, rgba(255,255,255,0.15));
  border-radius: 4px;
  color: var(--text, #eee);
  font-size: 0.75rem;
}
.alt-card__override-label {
  font-size: 0.7rem;
  color: var(--text-dim, #888);
}
.alt-advisor__empty {
  text-align: center;
  padding: 40px;
  color: var(--text-dim, #888);
}
.alt-advisor__refresh {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.alt-advisor__refresh-btn {
  padding: 6px 16px;
  background: var(--accent-dim, rgba(136,170,255,0.15));
  border: 1px solid var(--accent, #8af);
  border-radius: 6px;
  color: var(--accent, #8af);
  font-size: 0.8rem;
  cursor: pointer;
}
.alt-advisor__refresh-btn:hover {
  background: rgba(136,170,255,0.25);
}
```

- [ ] **Step 2: Create `src/tabs/AltAdvisor.jsx`**

```jsx
import { useState, useMemo } from 'preact/hooks';
import { profiles, activeProfileKey, activeProfile } from '../state/store.js';
import { detectBottlenecks } from '../state/bottleneck-detector.js';
import { buildCapabilityMatrix, assignAlts } from '../state/alt-optimizer.js';
import enemies from '../data/enemies.json';

/** Format numbers compactly. */
function fmt(n) {
  if (!isFinite(n) || isNaN(n)) return '---';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

/** Format hours to readable ETA. */
function fmtEta(hours) {
  if (!isFinite(hours) || hours <= 0) return '---';
  if (hours < 1 / 60) return '< 1 min';
  if (hours < 1) return Math.round(hours * 60) + ' min';
  return hours.toFixed(1) + ' hrs';
}

/** Find zone mob name. */
function zoneMobName(zoneId) {
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    const match = act.zones.find(e => e.zone === zoneId);
    if (match) return match.name;
  }
  return zoneId;
}

function AltCard({ assignment, isMain }) {
  const p = assignment.profile;

  return (
    <div class={`alt-card ${isMain ? 'alt-card--active' : ''}`}>
      <div class="alt-card__header">
        <span class="alt-card__name">
          {p.name} ({p.class} {p.level})
        </span>
        <span class={`alt-card__badge ${isMain ? 'alt-card__badge--active' : 'alt-card__badge--offline'}`}>
          {isMain ? 'Active' : 'Offline'}
        </span>
      </div>

      {isMain ? (
        <div class="alt-card__recommendation">
          <div class="alt-card__rec-reason">
            Farming: {assignment.zone} {zoneMobName(assignment.zone)}
          </div>
        </div>
      ) : (
        <div class="alt-card__recommendation">
          <div class="alt-card__rec-title">
            {assignment.type === 'farm' && `Farm ${assignment.zone} (${assignment.resource})`}
            {assignment.type === 'profession' && `${assignment.activity === 'mining' ? 'Mine' : 'Chop'} ${assignment.resource}`}
            {assignment.type === 'push' && `Push zones (at ${assignment.zone})`}
            {assignment.type === 'xp' && `Farm XP at ${assignment.zone}`}
          </div>
          <div class="alt-card__rec-reason">{assignment.reason}</div>
          <div class="alt-card__rec-stats">
            {assignment.rate > 0 && (
              <div class="alt-card__rec-stat">
                Rate: <span class="alt-card__rec-stat-value">~{fmt(assignment.rate)} {assignment.rateUnit}</span>
              </div>
            )}
            {assignment.eta > 0 && isFinite(assignment.eta) && (
              <div class="alt-card__rec-stat">
                ETA: <span class="alt-card__rec-stat-value">{fmtEta(assignment.eta)}</span>
              </div>
            )}
          </div>
          {assignment.throughputTip && (
            <div class="alt-card__tip">{assignment.throughputTip}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function AltAdvisor() {
  const allProfiles = profiles.value;
  const mainKey = activeProfileKey.value;
  const profileList = Object.entries(allProfiles);
  const [refreshKey, setRefresh] = useState(0);

  const result = useMemo(() => {
    if (profileList.length === 0) return null;

    const mainProfile = allProfiles[mainKey] || profileList[0][1];
    const altProfiles = profileList
      .filter(([key]) => key !== mainKey)
      .map(([, p]) => p);

    // Detect bottlenecks from main's upgrade path
    const bottlenecks = detectBottlenecks(mainProfile);

    // Build capability matrices for each alt
    const matrices = altProfiles.map(p => buildCapabilityMatrix(p));

    // Assign alts to bottlenecks
    const assignments = assignAlts(bottlenecks, matrices);

    return { mainProfile, assignments, bottlenecks };
  }, [allProfiles, mainKey, refreshKey]);

  if (!result || profileList.length === 0) {
    return (
      <div class="alt-advisor">
        <div class="alt-advisor__empty">
          Import a save file with multiple characters to see alt farming recommendations.
        </div>
      </div>
    );
  }

  const { mainProfile, assignments } = result;

  return (
    <div class="alt-advisor">
      <div class="alt-advisor__refresh">
        <button class="alt-advisor__refresh-btn" onClick={() => setRefresh(k => k + 1)}>
          Refresh Recommendations
        </button>
      </div>
      <div class="alt-advisor__board">
        <AltCard
          assignment={{ type: 'active', zone: mainProfile.currentZone, profile: mainProfile }}
          isMain={true}
        />
        {assignments.map((a, i) => (
          <AltCard key={a.altName || i} assignment={a} isMain={false} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add tab to `TabNav.jsx`**

In `src/components/TabNav.jsx`, add after the `advisor` entry:

```js
  { id: 'alt-advisor', label: 'Alt Advisor' },
```

- [ ] **Step 4: Add route to `app.jsx`**

In `src/app.jsx`, add import:

```js
import { AltAdvisor } from './tabs/AltAdvisor.jsx';
```

Add CSS import in `src/main.jsx` or wherever CSS is imported:

```js
import './css/alt-advisor.css';
```

Add route in the `<main>` section:

```jsx
{activeTab.value === 'alt-advisor' && <AltAdvisor />}
```

- [ ] **Step 5: Run all tests and build**

Run: `npx vitest run && npx vite build`
Expected: ALL PASS, build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/tabs/AltAdvisor.jsx src/css/alt-advisor.css src/components/TabNav.jsx src/app.jsx src/main.jsx
git commit -m "feat: add Alt Advisor tab with assignment board UI"
```

---

### Task 6: Integration Test & Polish

**Files:**
- Test: `src/state/alt-advisor-integration.test.js`

- [ ] **Step 1: Write integration test**

Create `src/state/alt-advisor-integration.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { detectBottlenecks } from './bottleneck-detector.js';
import { buildCapabilityMatrix, assignAlts } from './alt-optimizer.js';

describe('Alt Advisor integration', () => {
  const mainProfile = {
    name: 'Zeider', class: 'rogue', level: 69,
    hunterUpgrades: { LeBabka_Str: 8, LeBabka_PAtk: 15, LeBabka_Dex: 5 },
    talents: { tt_rogue_0_0: 5, tt_rogue_8_1: 1, tt_rogue_8_0: 5, novice_0_0_patk: 1, class_1_rogue: 1 },
    ashUpgrades: { ash_3_0: 1 },
    sacrificeUpgrades: { 'act-2-sacrifice-1': 5, 'act-2-sacrifice-0': 3 },
    gear: { weapon: { name: 'Steel Bow', enhancementLevel: 6 } },
    currentZone: '2.1',
    miningLevel: 18, woodcuttingLevel: 21,
    farmingRates: { killsPerHour: 149, xpPerHour: 23698, goldPerHour: 0 },
  };

  const altProfile = {
    name: 'Thalin', class: 'warrior', level: 48,
    hunterUpgrades: { LeBabka_Str: 8, LeBabka_PAtk: 15 },
    talents: { tt_warrior_0_0: 5, tt_warrior_1_1: 5, novice_0_0_patk: 1, class_1_warrior: 1 },
    ashUpgrades: { ash_3_0: 1 },
    sacrificeUpgrades: { 'act-2-sacrifice-1': 5 },
    gear: { weapon: { name: 'Copper Sword', enhancementLevel: 3 } },
    currentZone: '1.8',
    miningLevel: 10, woodcuttingLevel: 5,
    farmingRates: { killsPerHour: 50, xpPerHour: 1000, goldPerHour: 10 },
  };

  it('full flow: detect bottlenecks → build matrix → assign', () => {
    const bottlenecks = detectBottlenecks(mainProfile);
    expect(bottlenecks.length).toBeGreaterThan(0);

    const matrix = buildCapabilityMatrix(altProfile);
    expect(matrix.zones.length).toBeGreaterThan(0);

    const assignments = assignAlts(bottlenecks, [matrix]);
    expect(assignments.length).toBe(1);
    expect(assignments[0].altName).toBe('Thalin');
    // Should have a valid assignment type
    expect(['farm', 'profession', 'push', 'xp']).toContain(assignments[0].type);
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: Run dev server and verify UI**

Run: `npx vite --port 5174`
Manual check: navigate to Alt Advisor tab, verify cards render with assignment data.

- [ ] **Step 4: Commit**

```bash
git add src/state/alt-advisor-integration.test.js
git commit -m "test: add integration test for alt advisor flow"
```
