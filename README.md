# EvitaniaPlanner

All-in-one character planning suite for **Evitania Online: Idle RPG**.

## Features

- **Save File Import** -- Load your `data.sav` directly. Auto-detects all characters, talent allocations, hunter upgrades, farming rates, and more.
- **Dashboard** -- Power summary, farming rates, and character overview at a glance.
- **Upgrade Advisor** -- Ranks every possible upgrade (hunter, gear, talents, ash, sacrifice) by power gained per hour of farming. Answers "what should I upgrade next?"
- **Gear Planner** -- Side-by-side gear comparison with stat diffs and effective DPS impact.
- **Skill Trees** -- Interactive visual talent trees for Warrior, Rogue, Mage, Mining, and Woodcutting. Three build modes: Levelling, Farming, and Custom.
- **DPS Simulator** -- Combat predictions against any enemy. Shows kills/hr, XP/hr, gold/hr, and alive time.
- **Crafting Calculator** -- Recursive ingredient expansion with inventory tracking and multicraft support.
- **Rune Planner** -- Rune word farming tracker with T1-equivalent progress bars.
- **Build Sharing** -- Generate a shareable URL for your build. Friends open it and see your exact setup.
- **Dual Themes** -- Boushoku (glassmorphism) and Yama (gradient) dark themes.

## Tech Stack

Preact + Vite. No backend, no accounts -- everything runs in your browser. Deployed to GitHub Pages.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173/EvitaniaPlanner/` and click **Import Save** to load your game data.

Save file location: `%AppData%/../LocalLow/Fireblast Studios/Evitania Online - Idle RPG/data.sav`

## Support

If this tool saves you time, consider supporting development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5f5f?logo=ko-fi&logoColor=white)](https://ko-fi.com/zeider)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Zeider)

## Credits

Built on [EvitaniaCalc](https://github.com/FYamauti/EvitaniaCalc) by FYamauti -- the original crafting ingredient calculator for Evitania Online. Game data sourced from the community spreadsheet maintained by DragoHorse, Zerozapper, Rogue, Sakori, and the Evitania Discord community.
