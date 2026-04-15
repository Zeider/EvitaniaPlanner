# EvitaniaPlanner

All-in-one character planning suite for **Evitania Online: Idle RPG**.

**[Open EvitaniaPlanner](https://zeider.github.io/EvitaniaPlanner/)** — no download, runs in your browser.

## What It Does

Import your save file and get instant answers to "what should I upgrade next?"

**Save File Import** — Drop your `data.sav` and the planner auto-detects all your characters, talent allocations, hunter upgrades, farming rates, cards, pets, runes, and more.

**Upgrade Advisor** — Ranks every possible upgrade (hunter training, gear, talents, ash, sacrifice) by power gained per hour of farming. Shows the single best thing you can do right now with your time.

**DPS Simulator** — Pick any enemy and see your effective DPS, time-to-kill, kills/hr, XP/hr, gold/hr, and alive time. Toggle what-if upgrades to see their impact before committing.

**Gear Planner** — Side-by-side gear comparison. See exactly how much eDPS you gain from swapping to a new weapon or armor piece, plus the crafting cost to get there.

**Skill Trees** — Interactive visual talent trees for Warrior, Rogue, Mage, Mining, and Woodcutting. Three build modes:
- **Levelling** — auto-allocates for fastest XP/hr
- **Farming** — auto-allocates for max gold and drops
- **Custom** — full manual control

**Crafting Calculator** — Add items to your craft list, enter your current inventory, and see exactly what materials you still need. Supports multicraft smeltery bonuses.

**Rune Planner** — Track your progress toward rune word combos with T1-equivalent progress bars and farming location hints.

**Build Sharing** — Click Share to generate a URL. Send it to a friend and they see your exact build instantly.

## How to Use

1. Go to **[zeider.github.io/EvitaniaPlanner](https://zeider.github.io/EvitaniaPlanner/)**
2. Click **Import Save**
3. Select your save file from:
   ```
   %AppData%\..\LocalLow\Fireblast Studios\Evitania Online - Idle RPG\data.sav
   ```
   (Usually: `C:\Users\YourName\AppData\LocalLow\Fireblast Studios\Evitania Online - Idle RPG\data.sav`)
4. Your characters load automatically. Use the dropdown in the top bar to switch between them.
5. Select your equipped gear from the dropdowns in the Gear Planner tab (gear names can't be auto-detected from the save file).

Everything runs locally in your browser. Your save data never leaves your machine.

## Support

If this tool helps you out, consider buying me a coffee:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5f5f?logo=ko-fi&logoColor=white)](https://ko-fi.com/zeider)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Zeider)

## For Developers

```bash
git clone https://github.com/Zeider/EvitaniaPlanner.git
cd EvitaniaPlanner
npm install
npm run dev        # dev server at localhost:5173
npm run build      # production build to dist/
npm test           # run unit tests
```

Tech stack: Preact + Vite. No backend, no accounts. Static site deployed to GitHub Pages.

## Credits

Built on [EvitaniaCalc](https://github.com/FYamauti/EvitaniaCalc) by FYamauti. Game data sourced from the community spreadsheet maintained by DragoHorse, Zerozapper, Rogue, Sakori, and the Evitania Discord community.
