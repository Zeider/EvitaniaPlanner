# EvitaniaCalc v2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand EvitaniaCalc from a crafting calculator into a full character planning suite with upgrade advisor, DPS simulator, skill trees, save file import, and build sharing.

**Architecture:** Preact + Vite static app. Game data in bundled JSON files. Save file decoded client-side (XOR 0xFF). State in Preact signals + localStorage. Deployed to GitHub Pages.

**Tech Stack:** Preact, Vite, Vitest, vanilla CSS with custom properties, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-04-15-evitaniacalc-v2-design.md`

---

## Phase 1: Project Scaffolding & Game Data

### Task 1: Initialize Preact + Vite Project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `src/main.jsx`
- Create: `src/app.jsx`
- Create: `src/css/base.css`
- Create: `src/css/theme-boushoku.css`
- Create: `src/css/theme-yama.css`
- Modify: `index.html` (replace with Vite entry)
- Modify: `.gitignore`

- [ ] **Step 1: Initialize npm project and install dependencies**

```bash
cd EvitaniaCalc
npm init -y
npm install preact
npm install -D vite @preact/preset-vite vitest
```

- [ ] **Step 2: Create vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  base: '/EvitaniaCalc/',
  test: {
    environment: 'jsdom',
  },
});
```

- [ ] **Step 3: Create src/main.jsx entry point**

```jsx
// src/main.jsx
import { render } from 'preact';
import { App } from './app.jsx';
import './css/base.css';

render(<App />, document.getElementById('app'));
```

- [ ] **Step 4: Create src/app.jsx with placeholder shell**

```jsx
// src/app.jsx
import { useState } from 'preact/hooks';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'advisor', label: 'Upgrade Advisor' },
  { id: 'gear', label: 'Gear Planner' },
  { id: 'skills', label: 'Skill Trees' },
  { id: 'dps', label: 'DPS Simulator' },
  { id: 'crafting', label: 'Crafting' },
  { id: 'runes', label: 'Rune Planner' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div class="app">
      <header class="top-bar">
        <div class="top-bar-left">
          <span class="app-title">EvitaniaCalc</span>
          <span class="app-version">v2.0</span>
        </div>
        <div class="top-bar-right">
          <button class="btn btn-import">Import Save</button>
          <button class="btn btn-share">Share</button>
        </div>
      </header>
      <nav class="tab-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            class={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main class="tab-content">
        <div class="placeholder-tab">
          <p>{TABS.find(t => t.id === activeTab)?.label} — coming soon</p>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Migrate CSS files**

Copy `css/base.css` → `src/css/base.css`, `css/theme-boushoku.css` → `src/css/theme-boushoku.css`, `css/theme-yama.css` → `src/css/theme-yama.css`. Add new CSS rules for the tab navigation and top bar to `src/css/base.css`:

```css
/* Append to src/css/base.css */

.app { display: flex; flex-direction: column; min-height: 100vh; }

.top-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-header, #1a1a2e);
  border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.1));
}
.top-bar-left { display: flex; align-items: center; gap: 12px; }
.app-title { font-size: 18px; font-weight: 700; color: var(--text-primary, #e0e0ff); }
.app-version { font-size: 11px; color: #666; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
.top-bar-right { display: flex; align-items: center; gap: 12px; }

.tab-nav {
  display: flex; gap: 0; background: var(--bg-nav, rgba(0,0,0,0.3));
  border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
  overflow-x: auto;
}
.tab-btn {
  padding: 10px 18px; font-size: 12px; color: #888;
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; white-space: nowrap;
}
.tab-btn.active { color: var(--accent, #aaf); border-bottom-color: var(--accent, #aaf); background: rgba(100,100,255,0.05); font-weight: 600; }

.tab-content { flex: 1; padding: 20px; }
.placeholder-tab { display: flex; align-items: center; justify-content: center; min-height: 200px; color: #666; }
```

- [ ] **Step 6: Replace index.html with Vite entry**

Rename existing `index.html` → `legacy/index.html`. Create new:

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EvitaniaCalc</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 7: Update .gitignore**

```
node_modules/
dist/
.superpowers/
```

- [ ] **Step 8: Run dev server and verify**

```bash
npx vite
```

Expected: Opens at `http://localhost:5173/EvitaniaCalc/`, shows top bar with "EvitaniaCalc v2.0", 7 tab buttons, and "Dashboard — coming soon" placeholder.

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.js src/ index.html .gitignore legacy/
git commit -m "feat: scaffold Preact + Vite project with app shell and 7-tab navigation"
```

---

### Task 2: Create Game Data JSON Files

**Files:**
- Create: `src/data/enemies.json`
- Create: `src/data/gear.json`
- Create: `src/data/talents.json`
- Create: `src/data/professions.json`
- Create: `src/data/hunter-upgrades.json`
- Create: `src/data/ash-upgrades.json`
- Create: `src/data/sacrifices.json`
- Create: `src/data/runes.json`
- Create: `src/data/cards.json`
- Create: `src/data/pets.json`
- Create: `src/data/curios.json`
- Create: `src/data/bonfire.json`
- Create: `src/data/classes.json`
- Create: `src/data/recipes.json`

This task creates all static game data JSON files from the Google Sheet data extracted during design.

- [ ] **Step 1: Create enemies.json**

Structure: array of enemy objects keyed by zone.

```json
{
  "zones": [
    { "id": "1.0", "name": "Boar", "act": 1, "hp": 3, "atk": 0, "armor": 0, "evasion": 0, "accuracy": 0, "gold": 1, "xp": 10 },
    { "id": "1.2", "name": "Wasp", "act": 1, "hp": 6, "atk": 1, "armor": 0, "evasion": 5, "accuracy": 5, "gold": 2, "xp": 20 },
    { "id": "1.3", "name": "Pebble", "act": 1, "hp": 22, "atk": 6, "armor": 0, "evasion": 15, "accuracy": 15, "gold": 3, "xp": 50 }
  ],
  "bosses": [
    { "id": "boss-plant", "name": "Plant", "act": 1, "hp": 3000, "atk": 26, "armor": 0, "evasion": 100, "accuracy": 100, "gold": 19, "xp": 1000 }
  ]
}
```

Populate ALL enemies from the spreadsheet data (Acts 1.0-1.14, 2.1-2.12, 3.1-3.8, all bosses). Reference the extracted data from the brainstorming session. Use `K` → multiply by 1000, `M` → multiply by 1000000 for the values.

- [ ] **Step 2: Create gear.json**

Structure: keyed by slot type, then array of items.

```json
{
  "weapons": {
    "sword": [
      {
        "name": "Wooden Sword",
        "atkL1": 15, "atkL15": 76.9,
        "stats": { "str": 2 },
        "effects": { "atkspd": 2 },
        "source": "Blacksmith Act 1",
        "recipe": "Straw"
      }
    ],
    "longsword": [],
    "bow": [],
    "staff": []
  },
  "armor": {
    "helmet": [],
    "chest": [],
    "gloves": [],
    "boots": []
  },
  "accessories": {
    "ring": [],
    "amulet": [],
    "belt": []
  },
  "tools": {
    "pickaxe": [],
    "axe": []
  }
}
```

Populate ALL gear from the spreadsheet extract. Include stat scaling (L1/L15), special effects (CritDMG%, ATKSPD%, MagicFind, etc.), crafting costs, and availability flags (unobtainable items marked with `"obtainable": false`).

- [ ] **Step 3: Create classes.json**

```json
{
  "starter": { "hp": 5, "def": 1, "atk": 4, "atkPercent": 0, "atkSpeed": 0, "critChance": 0, "critDmg": 0, "mana": 0, "manaRegen": 0, "magicFind": 5, "bonusXp": 5, "primaryStat": null },
  "warrior": { "hp": 45, "def": 38, "atk": 10, "atkPercent": 10, "atkSpeed": 15, "critChance": 15, "critDmg": 30, "mana": 25, "manaRegen": 5, "magicFind": 15, "bonusXp": 50, "primaryStat": "str" },
  "rogue":   { "hp": 35, "def": 25, "atk": 14, "atkPercent": 15, "atkSpeed": 20, "critChance": 20, "critDmg": 40, "mana": 25, "manaRegen": 5, "magicFind": 20, "bonusXp": 0,  "primaryStat": "dex" },
  "mage":    { "hp": 25, "def": 17, "atk": 12, "atkPercent": 10, "atkSpeed": 10, "critChance": 10, "critDmg": 20, "mana": 75, "manaRegen": 14, "magicFind": 30, "bonusXp": 75, "primaryStat": "int" }
}
```

- [ ] **Step 4: Create talents.json**

Structure: one tree per class, with nodes matching the save file key format.

```json
{
  "rogue": {
    "totalNodes": 31,
    "maxPoints": 156,
    "nodes": [
      { "id": "novice_0_0_patk", "name": "Attack +1", "maxPoints": 1, "bonuses": [{"stat": "atk", "perPoint": 1}], "col": 0, "row": 0, "prereqs": [] },
      { "id": "novice_1_0_hp", "name": "HP +5", "maxPoints": 2, "bonuses": [{"stat": "hp", "perPoint": 5}], "col": 1, "row": 0, "prereqs": ["novice_0_0_patk"] },
      { "id": "novice_1_1_patk", "name": "ATK +1", "maxPoints": 2, "bonuses": [{"stat": "atk", "perPoint": 1}], "col": 1, "row": 1, "prereqs": ["novice_0_0_patk"] },
      { "id": "novice_1_2_pdef", "name": "DEF +1", "maxPoints": 2, "bonuses": [{"stat": "def", "perPoint": 1}], "col": 1, "row": 2, "prereqs": ["novice_0_0_patk"] }
    ],
    "skills": [
      { "name": "Piercing Arrow", "description": "Launches arrow piercing through enemies, dealing 100% ATK damage", "cooldown": 5, "manaCost": 6 },
      { "name": "Rapid Fire", "description": "Increases attack speed by 50% for 20 seconds", "cooldown": 120, "manaCost": 3 },
      { "name": "Arrow Barrage", "description": "Creates arrow rain dealing 80% ATK damage to all enemies, lasts 5 seconds", "cooldown": 15, "manaCost": 6 }
    ]
  },
  "warrior": { "totalNodes": 34, "maxPoints": 153, "nodes": [], "skills": [] },
  "mage": { "totalNodes": 28, "maxPoints": 150, "nodes": [], "skills": [] }
}
```

Populate ALL talent nodes from the spreadsheet data. The node `id` must match the save file key format exactly (e.g., `tt_rogue_3_1` for class talents, `novice_0_0_patk` for novice talents). Include the `class_1_rogue` unlock node.

For each node, `col` is the tier (left-to-right position) and `row` is the vertical position within that tier, matching the in-game layout.

- [ ] **Step 5: Create professions.json**

```json
{
  "mining": {
    "nodes": [
      { "id": "profession_mining_0_0", "name": "Mining Power +1", "maxPoints": 3, "bonuses": [{"stat": "miningPower", "perPoint": 1}], "col": 0, "row": 0, "prereqs": [] },
      { "id": "profession_mining_1_2", "name": "Mining Power +2", "maxPoints": 4, "bonuses": [{"stat": "miningPower", "perPoint": 2}], "col": 1, "row": 0, "prereqs": ["profession_mining_0_0"] }
    ]
  },
  "woodcutting": {
    "nodes": []
  }
}
```

Populate all profession skill nodes from the spreadsheet data.

- [ ] **Step 6: Create hunter-upgrades.json**

```json
[
  { "id": "LeBabka_Str", "name": "Strength Training", "stat": "str", "perRank": 1, "maxRank": 40, "material": "Wolf Fang", "description": "+1 STR (+10% Warrior Attack)" },
  { "id": "LeBabka_Dex", "name": "Dexterity Training", "stat": "dex", "perRank": 1, "maxRank": 40, "material": "Fruit", "description": "+1 DEX (+10% Rogue Attack)" },
  { "id": "LeBabka_Int", "name": "Intelligence Training", "stat": "int", "perRank": 1, "maxRank": 40, "material": "Ectoplasm", "description": "+1 INT (+10% Mage Attack)" },
  { "id": "LeBabka_Con", "name": "Hunter Endurance Training", "stat": "con", "perRank": 1, "maxRank": 40, "material": "Boar Meat", "description": "+1 CON (+5% Max HP, +1% HP Regen)" },
  { "id": "LeBabka_PAtk", "name": "Power Training", "stat": "atkPercent", "perRank": 10, "maxRank": 40, "material": "Mini Plant", "description": "+10% ATK" },
  { "id": "LeBabka_MAtk", "name": "More Damage Training", "stat": "atkPercent", "perRank": 2, "maxRank": 40, "material": "Fire Essence", "description": "+2% ATK" },
  { "id": "LeBabka_PDef", "name": "Defence Training", "stat": "defPercent", "perRank": 3, "maxRank": 40, "material": "Stoney McStoneface", "description": "+3% Physical Defence" },
  { "id": "LeBabka_Accuracy", "name": "Accuracy Training", "stat": "accuracy", "perRank": 0.04, "maxRank": 40, "material": "Leaf", "description": "+0.04 Accuracy" },
  { "id": "LeBabka_CritChance", "name": "Dice Training", "stat": "critChance", "perRank": 0.3, "maxRank": 40, "material": "D20 Dice", "description": "+0.3% Crit Chance" },
  { "id": "LeBabka_CritDamage", "name": "Damage Abuse Training", "stat": "critDmg", "perRank": 2, "maxRank": 40, "material": "Weird Page", "description": "+2% Crit Damage" },
  { "id": "LeBabka_AllAtk", "name": "Speed Training (Attack)", "stat": "atkSpeed", "perRank": 1, "maxRank": 40, "material": "Candle", "description": "+1% Attack Speed" },
  { "id": "LeBabka_MoveSpeed", "name": "Speed Training", "stat": "moveSpeed", "perRank": 0.3, "maxRank": 40, "material": "Coin", "description": "+0.3% Movement Speed" },
  { "id": "LeBabka_Mining", "name": "Mining Training", "stat": "miningPercent", "perRank": 3, "maxRank": 40, "material": "Crab Claw", "description": "+3% Mining Power" },
  { "id": "LeBabka_MiningPower", "name": "Mining Power", "stat": "miningPower", "perRank": 1, "maxRank": 40, "material": "Copper Ore", "description": "+1 Mining Power" },
  { "id": "LeBabka_Woodcutting", "name": "Woodcutting Training", "stat": "woodcuttingPercent", "perRank": 3, "maxRank": 40, "material": "Bat Dust", "description": "+3% Woodcutting Power" },
  { "id": "LeBabka_WoodcuttingPower", "name": "Woodcutting Power", "stat": "woodcuttingPower", "perRank": 1, "maxRank": 40, "material": "Ash Logs", "description": "+1 Woodcutting Power" },
  { "id": "LeBabka_Men", "name": "Meditation Training", "stat": "men", "perRank": 1, "maxRank": 40, "material": "Honeycomb", "description": "+1 MEN (+5% Max Mana, +1% Mana Regen, +5 Magic Defence)" },
  { "id": "LeBabka_HunterCost", "name": "Hunter Cost Reduction", "stat": "hunterCostReduction", "perRank": 5, "maxRank": 40, "material": "Coin", "description": "+5% Hunter Cost Reduction" },
  { "id": "LeBabka_SmelterySpeed", "name": "Smeltery Speed Training", "stat": "smelterySpeed", "perRank": 5, "maxRank": 40, "material": "Steel Ingot", "description": "+5% Smeltery Speed" },
  { "id": "LeBabka_MiningExp", "name": "Mining Experience", "stat": "miningXp", "perRank": 1, "maxRank": 40, "material": "Iron Ore", "description": "+1% Mining XP" },
  { "id": "LeBabka_WoodcuttingExp", "name": "Woodcutting Experience", "stat": "woodcuttingXp", "perRank": 1, "maxRank": 40, "material": "Pyrewood Logs", "description": "+1% Woodcutting XP" }
]
```

- [ ] **Step 7: Create remaining data files**

Create `src/data/ash-upgrades.json`, `src/data/sacrifices.json`, `src/data/runes.json`, `src/data/cards.json`, `src/data/pets.json`, `src/data/curios.json`, `src/data/bonfire.json` following the same pattern — each file contains a JSON array or object with all data from the spreadsheet.

Runes: include rune types with tier bonuses and all 7 rune word recipes with result effects. Reference existing `js/runes.js` for the data structure.

Sacrifices: 15 upgrades across 3 boss souls (Mammoth, Jotunn, Maevath), 30 ranks each, with material costs and per-rank effects.

- [ ] **Step 8: Migrate recipes to JSON**

Extract the `recipeCategories` object from `js/recipes.js` and save as `src/data/recipes.json`. Keep the same structure:

```json
{
  "Act 1": {
    "Copper Axe": { "yields": 1, "ingredients": [{"name": "Copper Bar", "qty": 3}, {"name": "Ash Log", "qty": 1}] }
  },
  "Act 2": {},
  "Act 3": {},
  "Hard": {},
  "Smeltery": {}
}
```

- [ ] **Step 9: Commit**

```bash
git add src/data/
git commit -m "feat: add all game data JSON files from spreadsheet"
```

---

## Phase 2: Core Engine

### Task 3: Save File Decoder

**Files:**
- Create: `src/state/save-decoder.js`
- Create: `src/state/save-decoder.test.js`

- [ ] **Step 1: Write test for XOR decode**

```js
// src/state/save-decoder.test.js
import { describe, it, expect } from 'vitest';
import { decodeSaveHex, extractProfiles } from './save-decoder.js';

describe('decodeSaveHex', () => {
  it('decodes XOR 0xFF hex-encoded JSON', () => {
    // Encode a known JSON string: {"test":1}
    const json = '{"test":1}';
    const hex = Array.from(new TextEncoder().encode(json))
      .map(b => (b ^ 0xFF).toString(16).padStart(2, '0').toUpperCase())
      .join('');
    const result = decodeSaveHex(hex);
    expect(result).toEqual({ test: 1 });
  });

  it('throws on invalid hex', () => {
    expect(() => decodeSaveHex('ZZZZ')).toThrow();
  });
});

describe('extractProfiles', () => {
  it('extracts hero profiles from save JSON', () => {
    const saveData = {
      Heroes: {
        LastSelectedHero: 0,
        Heroes: [{
          Name: 'TestHero',
          HeroClass: 3,
          Health: 100,
          Mana: 25,
          Enhancements: { tt_rogue_0_0: 1, novice_0_0_patk: 1, LeBabka_Str: 5 },
          Currencies: [{ name: 0, current: 5000 }],
          skillModels: [
            { currentXp: 1000, currentLevel: 10, ESkill: 0 },
            { currentXp: 50, currentLevel: 5, ESkill: 1 },
            { currentXp: 80, currentLevel: 6, ESkill: 2 },
          ],
          equipment: { Weapon1: { itemGuid: 'abc-123', Level: 0, EnhancementLevel: 5 }, Weapon2: null },
          Progress: { scene: '2.1' },
          OfflineProgress: { KillsPerHour: 149, XpPerHour: 23000, GoldPerHour: 1500 },
          inventory: [],
        }],
      },
      ProgressProfile: {
        Enhancements: { LeBabka_Str: 5, LeBabka_Dex: 10, ash_0_0: 1 },
      },
      Currency: { cards: { Boar: 5 } },
    };

    const profiles = extractProfiles(saveData);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('TestHero');
    expect(profiles[0].class).toBe('rogue');
    expect(profiles[0].level).toBe(10);
    expect(profiles[0].currentZone).toBe('2.1');
    expect(profiles[0].farmingRates.killsPerHour).toBe(149);
    expect(profiles[0].hunterUpgrades.LeBabka_Str).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/state/save-decoder.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement save-decoder.js**

```js
// src/state/save-decoder.js

const CLASS_MAP = { 1: 'warrior', 2: 'mage', 3: 'rogue' };

export function decodeSaveHex(hexString) {
  const clean = hexString.replace(/\s/g, '');
  if (!/^[0-9A-Fa-f]+$/.test(clean)) throw new Error('Invalid hex string');

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16) ^ 0xFF;
  }
  const text = new TextDecoder('utf-8').decode(bytes);
  return JSON.parse(text);
}

export function extractProfiles(saveData) {
  const heroes = saveData.Heroes?.Heroes || [];
  const sharedEnhancements = saveData.ProgressProfile?.Enhancements || {};
  const cards = saveData.Currency?.cards || {};

  return heroes.map(hero => {
    const className = CLASS_MAP[hero.HeroClass] || 'starter';
    const combatSkill = hero.skillModels?.find(s => s.ESkill === 0);
    const miningSkill = hero.skillModels?.find(s => s.ESkill === 1);
    const woodcuttingSkill = hero.skillModels?.find(s => s.ESkill === 2);
    const enhancements = hero.Enhancements || {};

    // Separate talent allocations from other enhancements
    const talents = {};
    const professionSkills = {};
    for (const [key, val] of Object.entries(enhancements)) {
      if (key.startsWith('tt_') || key.startsWith('novice_') || key.startsWith('class_')) {
        talents[key] = val;
      } else if (key.startsWith('profession_')) {
        professionSkills[key] = val;
      }
    }

    // Extract hunter upgrades from shared enhancements
    const hunterUpgrades = {};
    const ashUpgrades = {};
    const sacrificeUpgrades = {};
    for (const [key, val] of Object.entries(sharedEnhancements)) {
      if (key.startsWith('LeBabka_')) {
        hunterUpgrades[key] = val;
      } else if (key.startsWith('ash_')) {
        ashUpgrades[key] = val;
      } else if (key.startsWith('act-2-sacrifice') || key.startsWith('bonfire-sacrifice')) {
        sacrificeUpgrades[key] = val;
      }
    }

    // Extract equipment
    const gear = {};
    if (hero.equipment) {
      for (const [slot, item] of Object.entries(hero.equipment)) {
        if (item) {
          gear[slot] = {
            guid: item.itemGuid,
            level: item.Level || 0,
            enhancementLevel: item.EnhancementLevel || 0,
          };
        }
      }
    }

    return {
      name: hero.Name,
      class: className,
      level: combatSkill?.currentLevel || 1,
      miningLevel: miningSkill?.currentLevel || 1,
      woodcuttingLevel: woodcuttingSkill?.currentLevel || 1,
      gear,
      talents,
      professionSkills,
      hunterUpgrades,
      ashUpgrades,
      sacrificeUpgrades,
      cards,
      farmingRates: {
        killsPerHour: hero.OfflineProgress?.KillsPerHour || 0,
        xpPerHour: hero.OfflineProgress?.XpPerHour || 0,
        goldPerHour: hero.OfflineProgress?.GoldPerHour || 0,
      },
      currentZone: hero.Progress?.scene || '1.0',
    };
  });
}

export async function loadSaveFile(file) {
  const text = await file.text();
  const saveData = decodeSaveHex(text);
  return extractProfiles(saveData);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/state/save-decoder.test.js
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/save-decoder.js src/state/save-decoder.test.js
git commit -m "feat: add save file decoder with XOR 0xFF decode and profile extraction"
```

---

### Task 4: Stat Engine

**Files:**
- Create: `src/state/stat-engine.js`
- Create: `src/state/stat-engine.test.js`

- [ ] **Step 1: Write tests for stat computation**

```js
// src/state/stat-engine.test.js
import { describe, it, expect } from 'vitest';
import { computeStats, computeEffectiveDPS, computeEffectiveHP, computeFarmingRates } from './stat-engine.js';

describe('computeStats', () => {
  it('computes base stats for a rogue with no gear', () => {
    const profile = {
      class: 'rogue',
      level: 10,
      gear: {},
      talents: {},
      hunterUpgrades: {},
      ashUpgrades: {},
      sacrificeUpgrades: {},
      professionSkills: {},
      cards: {},
    };
    const stats = computeStats(profile);
    // Rogue base: hp=35, def=25, atk=14, atkPercent=15, atkSpeed=20, critChance=20, critDmg=40
    expect(stats.hp).toBe(35);
    expect(stats.atk).toBe(14);
    expect(stats.critChance).toBe(20);
    expect(stats.critDmg).toBe(40);
  });

  it('adds hunter upgrade bonuses', () => {
    const profile = {
      class: 'warrior',
      level: 10,
      gear: {},
      talents: {},
      hunterUpgrades: { LeBabka_Str: 5, LeBabka_PAtk: 3 },
      ashUpgrades: {},
      sacrificeUpgrades: {},
      professionSkills: {},
      cards: {},
    };
    const stats = computeStats(profile);
    // Warrior base atk=10, plus STR 5 contributes to ATK via primary stat scaling
    // Hunter PAtk: 3 ranks × 10% = +30% ATK
    expect(stats.str).toBe(5); // 0 base + 5 from hunter
    expect(stats.atkPercent).toBeGreaterThan(10); // base 10 + 30 from hunter
  });
});

describe('computeEffectiveDPS', () => {
  it('computes DPS against an enemy', () => {
    const stats = { atk: 100, atkSpeed: 50, critChance: 20, critDmg: 100, accuracy: 200 };
    const enemy = { evasion: 100 };
    const dps = computeEffectiveDPS(stats, enemy);
    // baseDPS = 100 × (1 + 50/100) = 150
    // critMult = 1 + (20/100 × 100/100) = 1.2
    // hitRate = min(1, 200 / (200+100)) = 0.667
    // eDPS = 150 × 1.2 × 0.667 ≈ 120
    expect(dps).toBeCloseTo(120, 0);
  });
});

describe('computeEffectiveHP', () => {
  it('computes effective HP against enemy damage', () => {
    const stats = { hp: 1000, def: 100, hpRegen: 0 };
    const enemy = { atk: 200, accuracy: 100 };
    const ehp = computeEffectiveHP(stats, enemy);
    // damageReduction = 100 / (100 + 200) = 0.333
    // effectiveHP = 1000 / (1 - 0.333) = 1500
    expect(ehp).toBeCloseTo(1500, 0);
  });
});

describe('computeFarmingRates', () => {
  it('computes kills/hr from DPS and enemy HP', () => {
    const rates = computeFarmingRates(100, { hp: 1000, xp: 500, gold: 10 }, { mobSpawnReduction: 0, moveSpeed: 0, xpMulti: 0, goldMulti: 0 });
    // timeToKill = 1000/100 = 10s
    // mobSpawnTime = 3s (base), travelTime = 1s (base)
    // killsPerHour = 3600 / 14 ≈ 257
    expect(rates.killsPerHour).toBeGreaterThan(200);
    expect(rates.xpPerHour).toBeGreaterThan(0);
    expect(rates.goldPerHour).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/state/stat-engine.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement stat-engine.js**

```js
// src/state/stat-engine.js
import classData from '../data/classes.json';
import hunterData from '../data/hunter-upgrades.json';
import gearData from '../data/gear.json';
import talentData from '../data/talents.json';

const BASE_MOB_SPAWN = 3; // seconds between mob spawns
const BASE_TRAVEL = 1;    // seconds travel time

export function computeStats(profile) {
  const base = classData[profile.class] || classData.starter;

  // Layer 1: base stats
  const stats = {
    hp: base.hp,
    def: base.def,
    atk: base.atk,
    atkPercent: base.atkPercent,
    atkSpeed: base.atkSpeed,
    critChance: base.critChance,
    critDmg: base.critDmg,
    mana: base.mana,
    manaRegen: base.manaRegen,
    magicFind: base.magicFind,
    bonusXp: base.bonusXp,
    accuracy: 0,
    moveSpeed: 0,
    hpRegen: 0,
    str: 0, dex: 0, int: 0, con: 0, men: 0,
    mobSpawnReduction: 0,
    goldMulti: 0,
    xpMulti: 0,
    offlineGains: 0,
    miningPower: 0, woodcuttingPower: 0,
  };

  // Layer 2: flat additions from hunter upgrades
  for (const upgrade of hunterData) {
    const rank = profile.hunterUpgrades?.[upgrade.id] || 0;
    if (rank > 0 && stats[upgrade.stat] !== undefined) {
      stats[upgrade.stat] += upgrade.perRank * rank;
    }
  }

  // Layer 2: flat additions from talent tree
  if (profile.talents) {
    const treeId = profile.class;
    const tree = talentData[treeId];
    if (tree) {
      for (const node of tree.nodes) {
        const points = profile.talents[node.id] || 0;
        if (points > 0) {
          for (const bonus of node.bonuses) {
            if (stats[bonus.stat] !== undefined) {
              stats[bonus.stat] += bonus.perPoint * points;
            }
          }
        }
      }
    }
  }

  // Layer 2: gear stats (simplified — lookup from gear data by name)
  // Gear is added by name, not GUID, since GUIDs aren't resolvable
  if (profile.gear) {
    for (const [slot, selection] of Object.entries(profile.gear)) {
      if (selection?.name) {
        const item = findGearByName(selection.name);
        if (item) {
          applyGearStats(stats, item, selection.enhancementLevel || 0);
        }
      }
    }
  }

  // Layer 3: percentage multipliers from primary stat
  const primaryStat = base.primaryStat;
  if (primaryStat && stats[primaryStat]) {
    stats.atk += stats[primaryStat] * 0.10 * stats.atk;
  }

  // Apply ATK% as multiplier
  const totalAtk = stats.atk * (1 + stats.atkPercent / 100);
  stats.totalAtk = totalAtk;

  // CON → HP
  stats.hp += stats.hp * (stats.con * 0.05);
  stats.hpRegen += stats.hpRegen * (stats.con * 0.01);

  return stats;
}

function findGearByName(name) {
  for (const category of Object.values(gearData)) {
    for (const slotItems of Object.values(category)) {
      if (Array.isArray(slotItems)) {
        const found = slotItems.find(i => i.name === name);
        if (found) return found;
      }
    }
  }
  return null;
}

function applyGearStats(stats, item, enhanceLevel) {
  if (item.stats) {
    for (const [stat, val] of Object.entries(item.stats)) {
      if (stats[stat] !== undefined) stats[stat] += val;
    }
  }
  if (item.effects) {
    for (const [stat, val] of Object.entries(item.effects)) {
      if (stats[stat] !== undefined) stats[stat] += val;
    }
  }
  // Enhancement level adds attack/defense based on gear type
  if (item.atkL1) {
    stats.atk += item.atkL1 + (enhanceLevel * (item.atkL1 * 0.1));
  }
}

export function computeEffectiveDPS(stats, enemy) {
  const totalAtk = stats.totalAtk || stats.atk;
  const baseDPS = totalAtk * (1 + (stats.atkSpeed || 0) / 100);
  const critMultiplier = 1 + ((stats.critChance || 0) / 100) * ((stats.critDmg || 0) / 100);
  const hitRate = Math.min(1.0, (stats.accuracy || 1) / ((stats.accuracy || 1) + (enemy.evasion || 0)));
  return baseDPS * critMultiplier * hitRate;
}

export function computeEffectiveHP(stats, enemy) {
  const damageReduction = (stats.def || 0) / ((stats.def || 0) + (enemy.atk || 1));
  return (stats.hp || 1) / (1 - damageReduction);
}

export function computeTimeToDie(stats, enemy) {
  const damageReduction = (stats.def || 0) / ((stats.def || 0) + (enemy.atk || 1));
  const incomingDPS = (enemy.atk || 0) * (1 - damageReduction);
  const netDPS = Math.max(0.01, incomingDPS - (stats.hpRegen || 0));
  return (stats.hp || 1) / netDPS;
}

export function computeFarmingRates(effectiveDPS, enemy, utilStats) {
  const timeToKill = (enemy.hp || 1) / Math.max(0.01, effectiveDPS);
  const mobSpawnTime = BASE_MOB_SPAWN * (1 - (utilStats.mobSpawnReduction || 0) / 100);
  const travelTime = BASE_TRAVEL / (1 + (utilStats.moveSpeed || 0) / 100);
  const timePerKill = timeToKill + mobSpawnTime + travelTime;
  const killsPerHour = 3600 / timePerKill;
  const xpPerHour = killsPerHour * (enemy.xp || 0) * (1 + (utilStats.xpMulti || 0) / 100);
  const goldPerHour = killsPerHour * (enemy.gold || 0) * (1 + (utilStats.goldMulti || 0) / 100);

  return { killsPerHour, xpPerHour, goldPerHour, timeToKill, timePerKill };
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/state/stat-engine.test.js
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/stat-engine.js src/state/stat-engine.test.js
git commit -m "feat: add stat engine with DPS, effective HP, and farming rate calculations"
```

---

### Task 5: State Store

**Files:**
- Create: `src/state/store.js`

- [ ] **Step 1: Create the store with Preact signals**

```js
// src/state/store.js
import { signal, computed } from '@preact/signals';

// UI State
export const activeTab = signal('dashboard');
export const theme = signal(localStorage.getItem('ic-theme') || 'boushoku');
export const lightMode = signal(false);

// Profile State
export const profiles = signal(loadProfiles());
export const activeProfileKey = signal(localStorage.getItem('ic-active-profile') || '');

export const activeProfile = computed(() => {
  const key = activeProfileKey.value;
  return profiles.value[key] || createDefaultProfile();
});

function createDefaultProfile() {
  return {
    name: 'New Character',
    class: 'rogue',
    level: 1,
    gear: {},
    talents: {},
    hunterUpgrades: {},
    ashUpgrades: {},
    sacrificeUpgrades: {},
    professionSkills: {},
    cards: {},
    farmingRates: { killsPerHour: 0, xpPerHour: 0, goldPerHour: 0 },
    currentZone: '1.0',
  };
}

export function setActiveProfile(key) {
  activeProfileKey.value = key;
  localStorage.setItem('ic-active-profile', key);
}

export function saveProfile(key, profile) {
  const current = { ...profiles.value };
  current[key] = profile;
  profiles.value = current;
  localStorage.setItem('ic-profiles', JSON.stringify(current));
}

export function importProfiles(extractedProfiles) {
  const current = { ...profiles.value };
  for (const p of extractedProfiles) {
    const key = p.name.toLowerCase().replace(/\s/g, '-');
    current[key] = p;
  }
  profiles.value = current;
  localStorage.setItem('ic-profiles', JSON.stringify(current));
  if (extractedProfiles.length > 0) {
    setActiveProfile(extractedProfiles[0].name.toLowerCase().replace(/\s/g, '-'));
  }
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem('ic-profiles');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function setTheme(t) {
  theme.value = t;
  localStorage.setItem('ic-theme', t);
}
```

- [ ] **Step 2: Wire store into App component**

Update `src/app.jsx` to use the store signals for tab switching and display the active profile name in the top bar. Import `activeTab`, `activeProfile`, `theme` from store and use them reactively.

- [ ] **Step 3: Commit**

```bash
git add src/state/store.js src/app.jsx
git commit -m "feat: add state store with profile management and localStorage persistence"
```

---

### Task 6: Upgrade Scorer

**Files:**
- Create: `src/state/upgrade-scorer.js`
- Create: `src/state/upgrade-scorer.test.js`

- [ ] **Step 1: Write tests**

```js
// src/state/upgrade-scorer.test.js
import { describe, it, expect } from 'vitest';
import { scoreUpgrade, rankAllUpgrades } from './upgrade-scorer.js';

describe('scoreUpgrade', () => {
  it('scores a hunter upgrade by power-per-time', () => {
    const currentStats = { atk: 100, totalAtk: 100, atkSpeed: 0, critChance: 0, critDmg: 0, accuracy: 100, hp: 500, def: 50, hpRegen: 0 };
    const upgrade = { type: 'hunter', id: 'LeBabka_PAtk', name: 'Power Training', nextRank: 1, statChanges: { atkPercent: 10 }, materialCost: { 'Mini Plant': 50 }, farmTimeHours: 0.3 };
    const enemy = { hp: 1000, atk: 50, evasion: 100, accuracy: 100, xp: 500, gold: 10 };
    const result = scoreUpgrade(currentStats, upgrade, enemy, { offenseWeight: 0.7, defenseWeight: 0.3 });
    expect(result.score).toBeGreaterThan(0);
    expect(result.offenseDelta).toBeGreaterThan(0);
  });

  it('talent points with zero cost have infinite score', () => {
    const currentStats = { atk: 100, totalAtk: 100, atkSpeed: 0, critChance: 0, critDmg: 0, accuracy: 100, hp: 500, def: 50, hpRegen: 0 };
    const upgrade = { type: 'talent', id: 'tt_rogue_1_0', name: 'ATK +1', nextRank: 1, statChanges: { atk: 1 }, materialCost: {}, farmTimeHours: 0 };
    const enemy = { hp: 1000, atk: 50, evasion: 100, accuracy: 100, xp: 500, gold: 10 };
    const result = scoreUpgrade(currentStats, upgrade, enemy, { offenseWeight: 0.7, defenseWeight: 0.3 });
    expect(result.score).toBe(Infinity);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/state/upgrade-scorer.test.js
```

- [ ] **Step 3: Implement upgrade-scorer.js**

```js
// src/state/upgrade-scorer.js
import { computeEffectiveDPS, computeEffectiveHP } from './stat-engine.js';

export function scoreUpgrade(currentStats, upgrade, enemy, weights) {
  // Clone stats and apply the upgrade's stat changes
  const afterStats = { ...currentStats };
  for (const [stat, delta] of Object.entries(upgrade.statChanges)) {
    afterStats[stat] = (afterStats[stat] || 0) + delta;
  }
  // Recompute totalAtk if atk or atkPercent changed
  if (upgrade.statChanges.atk || upgrade.statChanges.atkPercent) {
    afterStats.totalAtk = afterStats.atk * (1 + (afterStats.atkPercent || 0) / 100);
  }

  const dpsBefore = computeEffectiveDPS(currentStats, enemy);
  const dpsAfter = computeEffectiveDPS(afterStats, enemy);
  const offenseDelta = dpsAfter - dpsBefore;

  const ehpBefore = computeEffectiveHP(currentStats, enemy);
  const ehpAfter = computeEffectiveHP(afterStats, enemy);
  const defenseDelta = ehpAfter - ehpBefore;

  const powerDelta = offenseDelta * weights.offenseWeight + defenseDelta * weights.defenseWeight;
  const score = upgrade.farmTimeHours <= 0 ? Infinity : powerDelta / upgrade.farmTimeHours;

  return {
    ...upgrade,
    offenseDelta,
    defenseDelta,
    powerDelta,
    score,
  };
}

export function rankAllUpgrades(currentStats, upgrades, enemy, weights) {
  return upgrades
    .map(u => scoreUpgrade(currentStats, u, enemy, weights))
    .sort((a, b) => b.score - a.score);
}

export function autoCalibrate(aliveTimePercent) {
  // If dying frequently, weight defense higher
  if (aliveTimePercent < 0.9) return { offenseWeight: 0.4, defenseWeight: 0.6 };
  if (aliveTimePercent < 0.95) return { offenseWeight: 0.6, defenseWeight: 0.4 };
  return { offenseWeight: 0.8, defenseWeight: 0.2 };
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/state/upgrade-scorer.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/upgrade-scorer.js src/state/upgrade-scorer.test.js
git commit -m "feat: add upgrade scorer with power-per-time ranking and auto-calibration"
```

---

## Phase 3: UI Components & Tabs

### Task 7: Shared Components (TopBar, GearStrip, StatCard)

**Files:**
- Create: `src/components/TopBar.jsx`
- Create: `src/components/GearStrip.jsx`
- Create: `src/components/StatCard.jsx`
- Create: `src/components/TabNav.jsx`
- Create: `src/css/components.css`
- Modify: `src/app.jsx`

- [ ] **Step 1: Create TopBar.jsx**

```jsx
// src/components/TopBar.jsx
import { profiles, activeProfileKey, activeProfile, setActiveProfile, theme, setTheme, lightMode } from '../state/store.js';
import { loadSaveFile } from '../state/save-decoder.js';
import { importProfiles } from '../state/store.js';

export function TopBar() {
  const profile = activeProfile.value;
  const allProfiles = profiles.value;

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sav';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const extracted = await loadSaveFile(file);
        importProfiles(extracted);
      } catch (err) {
        alert('Failed to decode save file: ' + err.message);
      }
    };
    input.click();
  }

  function handleShare() {
    const data = JSON.stringify(activeProfile.value);
    const encoded = btoa(unescape(encodeURIComponent(data)));
    const url = `${location.origin}${location.pathname}#b=${encoded}`;
    navigator.clipboard.writeText(url);
    alert('Build link copied to clipboard!');
  }

  return (
    <header class="top-bar">
      <div class="top-bar-left">
        <span class="app-title">EvitaniaCalc</span>
        <span class="app-version">v2.0</span>
      </div>
      <div class="top-bar-right">
        <button class="btn btn-import" onClick={handleImport}>Import Save</button>
        {Object.keys(allProfiles).length > 0 && (
          <select
            class="profile-select"
            value={activeProfileKey.value}
            onChange={e => setActiveProfile(e.target.value)}
          >
            {Object.entries(allProfiles).map(([key, p]) => (
              <option key={key} value={key}>{p.name} ({p.class} {p.level})</option>
            ))}
          </select>
        )}
        <button class="btn btn-share" onClick={handleShare}>Share</button>
        <button class="btn btn-theme" onClick={() => {
          setTheme(theme.value === 'boushoku' ? 'yama' : 'boushoku');
        }}>Theme</button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create StatCard.jsx**

```jsx
// src/components/StatCard.jsx
export function StatCard({ title, items, accent }) {
  return (
    <div class={`stat-card stat-card--${accent || 'default'}`}>
      <div class="stat-card__title">{title}</div>
      {items.map(item => (
        <div class="stat-card__row" key={item.label}>
          <span class="stat-card__label">{item.label}</span>
          <span class={`stat-card__value stat-card__value--${item.color || 'default'}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create GearStrip.jsx**

```jsx
// src/components/GearStrip.jsx
import { activeProfile } from '../state/store.js';

const GEAR_SLOTS = ['Helmet', 'Chest', 'Gloves', 'Boots', 'Belt', 'Amulet', 'Ring', 'Weapon1', 'Axe', 'Pickaxe'];

export function GearStrip({ onSlotClick }) {
  const profile = activeProfile.value;

  return (
    <footer class="gear-strip">
      <div class="gear-strip__label">Equipped Gear</div>
      <div class="gear-strip__slots">
        {GEAR_SLOTS.map(slot => {
          const item = profile.gear?.[slot];
          return (
            <div
              key={slot}
              class={`gear-slot ${item ? 'gear-slot--equipped' : 'gear-slot--empty'}`}
              onClick={() => onSlotClick?.(slot)}
              title={slot}
            >
              <div class="gear-slot__name">{item?.name || slot}</div>
              {item?.enhancementLevel > 0 && (
                <div class="gear-slot__enhance">+{item.enhancementLevel}</div>
              )}
            </div>
          );
        })}
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Create components.css and add styles**

Create `src/css/components.css` with styles for StatCard, GearStrip, TopBar profile select, and import/share/theme buttons. Import it from `src/main.jsx`.

- [ ] **Step 5: Update app.jsx to use real components**

Replace the placeholder top bar and add `<GearStrip />` at the bottom. Wire `TopBar` and `TabNav` in.

- [ ] **Step 6: Run dev server and verify visually**

```bash
npx vite
```

Expected: top bar shows title, import/share/theme buttons. Tab nav works. Gear strip shows empty slots at bottom.

- [ ] **Step 7: Commit**

```bash
git add src/components/ src/css/components.css src/app.jsx src/main.jsx
git commit -m "feat: add TopBar, GearStrip, StatCard shared components"
```

---

### Task 8: Dashboard Tab

**Files:**
- Create: `src/tabs/Dashboard.jsx`
- Modify: `src/app.jsx` (wire in tab)

- [ ] **Step 1: Implement Dashboard.jsx**

```jsx
// src/tabs/Dashboard.jsx
import { activeProfile } from '../state/store.js';
import { computeStats, computeEffectiveDPS, computeEffectiveHP, computeFarmingRates } from '../state/stat-engine.js';
import { StatCard } from '../components/StatCard.jsx';
import enemies from '../data/enemies.json';

export function Dashboard() {
  const profile = activeProfile.value;
  const stats = computeStats(profile);
  const enemy = enemies.zones.find(e => e.id === profile.currentZone) || enemies.zones[0];
  const edps = computeEffectiveDPS(stats, enemy);
  const ehp = computeEffectiveHP(stats, enemy);
  const rates = profile.farmingRates;

  const fmt = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  };

  return (
    <div class="dashboard">
      <div class="dashboard__grid">
        <StatCard
          title="Power Summary"
          accent="red"
          items={[
            { label: 'Offensive Power', value: fmt(edps), color: 'red' },
            { label: 'Defensive Power', value: fmt(ehp), color: 'blue' },
            { label: 'Effective DPS', value: fmt(edps) + '/s', color: 'orange' },
            { label: 'Total ATK', value: fmt(stats.totalAtk || stats.atk) },
          ]}
        />
        <StatCard
          title={`Farming Rates (${profile.currentZone})`}
          accent="green"
          items={[
            { label: 'Kills/Hour', value: fmt(rates.killsPerHour) },
            { label: 'XP/Hour', value: fmt(rates.xpPerHour), color: 'blue' },
            { label: 'Gold/Hour', value: fmt(rates.goldPerHour), color: 'yellow' },
          ]}
        />
        <StatCard
          title="Character Info"
          accent="purple"
          items={[
            { label: 'Name', value: profile.name },
            { label: 'Class', value: profile.class },
            { label: 'Level', value: profile.level },
            { label: 'Zone', value: profile.currentZone },
          ]}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire Dashboard into app.jsx**

In `src/app.jsx`, import `Dashboard` and render it when `activeTab === 'dashboard'`.

- [ ] **Step 3: Run dev server and verify**

Expected: Dashboard shows 3 stat cards. If no profile imported, shows default values. After importing a save file, shows real data.

- [ ] **Step 4: Commit**

```bash
git add src/tabs/Dashboard.jsx src/app.jsx
git commit -m "feat: add Dashboard tab with power summary and farming rates"
```

---

### Task 9: DPS Simulator Tab

**Files:**
- Create: `src/tabs/DpsSimulator.jsx`
- Modify: `src/app.jsx`

- [ ] **Step 1: Implement DpsSimulator.jsx**

Three-column layout (Your Stats | VS | Enemy), results grid below, what-if bar at bottom. Enemy dropdown populated from `enemies.json`, defaults to `activeProfile.currentZone`.

The component:
- Uses `computeStats()` to get current stats
- Uses `computeEffectiveDPS()`, `computeEffectiveHP()`, `computeTimeToDie()`, `computeFarmingRates()` to compute all 6 metrics
- Has a `selectedEnemy` state initialized from profile's currentZone
- Renders 6 result cards: eDPS, TTK, Kills/hr, XP/hr, Gold/hr, Alive Time

- [ ] **Step 2: Wire into app.jsx and test**

- [ ] **Step 3: Commit**

```bash
git add src/tabs/DpsSimulator.jsx src/app.jsx
git commit -m "feat: add DPS Simulator tab with enemy selection and 6 combat metrics"
```

---

### Task 10: Gear Planner Tab

**Files:**
- Create: `src/tabs/GearPlanner.jsx`
- Modify: `src/app.jsx`

- [ ] **Step 1: Implement GearPlanner.jsx**

Three-column layout: Current Gear | Stat Diff | Candidate Gear.
- Slot selector row at top (10 clickable gear slot icons)
- Current gear panel shows equipped item stats
- Candidate gear panel has a dropdown filtered by slot type (from `gear.json`)
- Center column shows stat diff (green/red) and eDPS change badge
- Bottom shows crafting requirements from `recipes.json`

Key logic:
- When candidate selected, compute stats with current gear vs stats with candidate gear
- Show delta for each stat that changes
- Compute eDPS delta using `computeEffectiveDPS()`

- [ ] **Step 2: Wire into app.jsx and test**

- [ ] **Step 3: Commit**

```bash
git add src/tabs/GearPlanner.jsx src/app.jsx
git commit -m "feat: add Gear Planner tab with side-by-side comparison and eDPS impact"
```

---

### Task 11: Upgrade Advisor Tab

**Files:**
- Create: `src/tabs/UpgradeAdvisor.jsx`
- Create: `src/components/UpgradeRow.jsx`
- Modify: `src/app.jsx`

- [ ] **Step 1: Create UpgradeRow.jsx**

```jsx
// src/components/UpgradeRow.jsx
const TYPE_COLORS = {
  hunter: { bg: 'rgba(200,100,255,0.15)', color: '#c8f' },
  gear: { bg: 'rgba(100,100,255,0.15)', color: '#aaf' },
  talent: { bg: 'rgba(100,200,100,0.15)', color: '#8f8' },
  ash: { bg: 'rgba(255,150,50,0.15)', color: '#fa8' },
  sacrifice: { bg: 'rgba(255,100,100,0.15)', color: '#f88' },
};

export function UpgradeRow({ rank, upgrade }) {
  const tc = TYPE_COLORS[upgrade.type] || TYPE_COLORS.hunter;
  const scoreText = upgrade.score === Infinity ? '∞' : Math.round(upgrade.score);

  return (
    <tr class={`upgrade-row ${rank === 1 ? 'upgrade-row--top' : ''}`}>
      <td class="upgrade-row__rank">{rank}</td>
      <td class="upgrade-row__name">{upgrade.name}</td>
      <td>
        <span class="type-badge" style={{ background: tc.bg, color: tc.color }}>
          {upgrade.type}
        </span>
      </td>
      <td class="upgrade-row__power">+{Math.round(upgrade.offenseDelta)} eDPS</td>
      <td class="upgrade-row__cost">{formatCost(upgrade.materialCost)}</td>
      <td class="upgrade-row__time">{formatTime(upgrade.farmTimeHours)}</td>
      <td class="upgrade-row__score">{scoreText}</td>
    </tr>
  );
}

function formatCost(cost) {
  if (!cost || Object.keys(cost).length === 0) return 'free';
  return Object.entries(cost).map(([mat, qty]) => `${qty} ${mat}`).join(', ');
}

function formatTime(hours) {
  if (hours <= 0) return 'free';
  if (hours < 1) return `~${Math.round(hours * 60)} min`;
  return `~${hours.toFixed(1)} hrs`;
}
```

- [ ] **Step 2: Implement UpgradeAdvisor.jsx**

This is the core "what should I do next" tab:
- Generates all possible upgrades from current profile state
- For each hunter upgrade: check current rank vs max, create upgrade object with next rank stat changes and material cost
- For each unspent talent point: find available nodes, create upgrade objects
- For each gear slot: compare to next tier options from gear.json
- Runs `rankAllUpgrades()` to sort by score
- Renders with offense/defense slider, zone selector, type filters, and the ranked table using `UpgradeRow`

- [ ] **Step 3: Wire into app.jsx and test**

- [ ] **Step 4: Commit**

```bash
git add src/tabs/UpgradeAdvisor.jsx src/components/UpgradeRow.jsx src/app.jsx
git commit -m "feat: add Upgrade Advisor tab with ranked upgrade list and auto-calibration"
```

---

### Task 12: Skill Trees Tab

**Files:**
- Create: `src/tabs/SkillTrees.jsx`
- Create: `src/components/TreeNode.jsx`
- Create: `src/components/NodeTooltip.jsx`
- Create: `src/css/skill-trees.css`
- Modify: `src/app.jsx`

- [ ] **Step 1: Create TreeNode.jsx**

Renders a single talent node with visual states (maxed/partial/available/locked/class-unlock/recommended). Shows `current/max` points, stat name. Has `onClick` for allocation and `onContextMenu` for deallocation.

Node visual state logic:
```js
function getNodeState(node, points, prereqsMet) {
  if (points >= node.maxPoints) return 'maxed';
  if (points > 0) return 'partial';
  if (!prereqsMet) return 'locked';
  return 'available';
}
```

- [ ] **Step 2: Create SkillTrees.jsx**

Three-panel layout:
- **Left sidebar:** Tree tab buttons (Novice, Rogue, Warrior, Mage | Mining, Woodcutting), Build Mode buttons (Levelling, Farming, Custom), points counter
- **Center:** Horizontal scrollable container. For each column (tier) in the tree, render a vertical flex container of `TreeNode` components. SVG lines connect prerequisite nodes.
- **Right sidebar:** Selected node detail (name, description, current/max, progress bar), DPS impact panel, running stat totals from tree, Add/Remove buttons.

State: `selectedTree`, `selectedNode`, `buildMode`, local talent allocation (forked from profile for what-if).

Build mode logic:
- Levelling: greedy allocate by priority `bonusXp > atk > atkSpeed > moveSpeed`
- Farming: greedy allocate by priority `magicFind > goldMulti > mobSpawnReduction > atk > critDmg`
- Custom: use profile's current allocation

- [ ] **Step 3: Create skill-trees.css**

Styles for the three-panel layout, node states (6 visual states with distinct borders/backgrounds), SVG connection lines, scrollable center, and the right sidebar detail panel.

- [ ] **Step 4: Wire into app.jsx and test**

Verify: tree renders horizontally, clicking nodes changes point allocation, stat sidebar updates, build mode buttons auto-allocate.

- [ ] **Step 5: Commit**

```bash
git add src/tabs/SkillTrees.jsx src/components/TreeNode.jsx src/components/NodeTooltip.jsx src/css/skill-trees.css src/app.jsx
git commit -m "feat: add interactive Skill Trees tab with 5 trees and 3 build modes"
```

---

## Phase 4: Migration & Polish

### Task 13: Migrate Crafting Calculator

**Files:**
- Create: `src/tabs/Crafting.jsx`
- Modify: `src/app.jsx`

- [ ] **Step 1: Migrate crafting logic to Preact**

Port the logic from `js/calc.js` (expand, rawCalc, netCalc, expandNet, getEffectiveYield) into the component. The recursive expansion algorithm stays identical. Recipe data loaded from `src/data/recipes.json`.

Key components within `Crafting.jsx`:
- Recipe category dropdowns with item selectors
- Craft list with add/remove
- Combined view (table with inventory inputs)
- By-item view (collapsible tree)
- Import/export recipes

All existing localStorage keys (`ic-recipes-v1`, `ic-craft-v1`, `ic-invent-v1`) are read for backwards compatibility.

- [ ] **Step 2: Test existing crafting workflows**

Verify: add items to craft list, see ingredient expansion, enter inventory amounts, see net requirements update live.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/Crafting.jsx src/app.jsx
git commit -m "feat: migrate crafting calculator to Preact with full existing functionality"
```

---

### Task 14: Migrate Rune Planner

**Files:**
- Create: `src/tabs/RunePlanner.jsx`
- Modify: `src/app.jsx`

- [ ] **Step 1: Migrate rune planner to Preact**

Port logic from `js/runes.js`. Rune data loaded from `src/data/runes.json`. Components:
- Rune word combo selector dropdown
- Per-family tier inputs (T1-T4) with farming location hints
- Progress bars per family
- Completion tracking

Read existing localStorage key `ic-rune-inv-v1` for backwards compatibility.

- [ ] **Step 2: Test rune planner workflows**

- [ ] **Step 3: Commit**

```bash
git add src/tabs/RunePlanner.jsx src/app.jsx
git commit -m "feat: migrate rune planner to Preact with existing functionality"
```

---

### Task 15: Build Sharing via URL

**Files:**
- Modify: `src/state/store.js`
- Modify: `src/main.jsx`

- [ ] **Step 1: Add URL hash decode on page load**

In `src/main.jsx`, before rendering, check for `#b=` in `location.hash`. If found, decode base64 → parse JSON → load as a read-only profile.

```js
// In src/main.jsx, before render()
import { importProfiles } from './state/store.js';

const hash = location.hash;
if (hash.startsWith('#b=')) {
  try {
    const encoded = hash.substring(3);
    const json = decodeURIComponent(escape(atob(encoded)));
    const profile = JSON.parse(json);
    importProfiles([{ ...profile, name: profile.name + ' (shared)' }]);
  } catch (e) {
    console.warn('Failed to decode shared build:', e);
  }
}
```

- [ ] **Step 2: Test sharing flow**

1. Import a save, click Share → copies URL
2. Open URL in new tab → profile loads as "[name] (shared)"
3. Verify all tabs show the shared profile's data

- [ ] **Step 3: Commit**

```bash
git add src/main.jsx src/state/store.js
git commit -m "feat: add build sharing via base64 URL hash"
```

---

### Task 16: Theming & GitHub Pages Deploy

**Files:**
- Modify: `src/app.jsx` (theme class application)
- Modify: `src/css/base.css` (responsive styles)
- Create: `.github/workflows/deploy.yml` (optional)
- Modify: `package.json` (build script)

- [ ] **Step 1: Wire theme classes**

In `src/app.jsx`, apply theme class to root element based on `theme` signal:

```jsx
<div class={`app theme-${theme.value} ${lightMode.value ? 'light-theme' : ''}`}>
```

Import both theme CSS files in `src/main.jsx`:
```js
import './css/theme-boushoku.css';
import './css/theme-yama.css';
```

- [ ] **Step 2: Add build script to package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: Test production build**

```bash
npm run build
npx vite preview
```

Expected: App loads at preview URL, all tabs work, themes toggle, save import works.

- [ ] **Step 4: Add .gitignore entry for dist/**

- [ ] **Step 5: Commit**

```bash
git add src/app.jsx src/main.jsx src/css/ package.json .gitignore
git commit -m "feat: add theming support and production build configuration"
```

---

### Task 17: Final Integration Test

**Files:** None (testing only)

- [ ] **Step 1: Import actual save file**

Use the real `data.sav` from `%AppData%/../LocalLow/Fireblast Studios/Evitania Online - Idle RPG/data.sav`. Click Import Save, select the file, verify all 4 heroes appear in the character switcher.

- [ ] **Step 2: Verify Dashboard**

Switch to Zeider (Rogue 69). Verify farming rates show 149 kills/hr, 23,698 XP/hr. Verify power summary shows computed stats.

- [ ] **Step 3: Verify DPS Simulator**

Select Act 2.1 enemy. Verify eDPS, TTK, kills/hr calculations match reasonable expectations against the enemy stats (HP 40K, ATK 200, Evasion 275).

- [ ] **Step 4: Verify Skill Trees**

Select Rogue tree. Verify talent allocations from save are reflected (nodes show correct points). Try Levelling/Farming/Custom modes. Click nodes to reallocate.

- [ ] **Step 5: Verify Upgrade Advisor**

Verify ranked list shows hunter upgrades, gear upgrades, and talent point options. Verify unspent talent points appear first (infinite score).

- [ ] **Step 6: Verify Gear Planner**

Select weapon slot. Verify current gear shows (from dropdown selection). Select a candidate gear. Verify stat diff and eDPS impact display.

- [ ] **Step 7: Verify Crafting + Runes**

Test existing crafting workflows: add Thorium Bow to craft list, verify ingredient expansion. Test rune planner: select a rune word, enter tier counts.

- [ ] **Step 8: Test sharing**

Click Share, copy URL, open in new tab. Verify shared build loads correctly.

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "chore: integration testing complete — EvitaniaCalc v2.0 ready"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1. Scaffolding | Tasks 1-2 | Working Preact app with all game data |
| 2. Core Engine | Tasks 3-6 | Save decoder, stat engine, upgrade scorer, state store |
| 3. UI & Tabs | Tasks 7-12 | All 7 tabs with shared components |
| 4. Migration & Polish | Tasks 13-17 | Crafting/rune migration, sharing, theming, deploy |

Total: 17 tasks. Each produces a working commit. The app is usable after Phase 2 (can import saves and see stats). Full feature set after Phase 4.
