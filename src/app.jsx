import { activeTab, theme, lightMode } from './state/store.js';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'upgrade-advisor', label: 'Upgrade Advisor' },
  { id: 'gear-planner', label: 'Gear Planner' },
  { id: 'skill-trees', label: 'Skill Trees' },
  { id: 'dps-simulator', label: 'DPS Simulator' },
  { id: 'crafting', label: 'Crafting' },
  { id: 'rune-planner', label: 'Rune Planner' },
];

export function App() {
  return (
    <div class={`app theme-${theme.value} ${lightMode.value ? 'light-theme' : ''}`}>
      <header class="top-bar">
        <div class="top-bar-left">
          <h1 class="top-bar-title">EvitaniaCalc</h1>
          <span class="top-bar-version">v2.0.0</span>
        </div>
        <div class="top-bar-right">
          <button class="btn btn-outline btn-sm">Import Save</button>
          <button class="btn btn-outline btn-sm">Share</button>
          <button class="btn btn-outline btn-sm">Theme</button>
        </div>
      </header>

      <nav class="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            class={`tab-btn${activeTab.value === tab.id ? ' active' : ''}`}
            onClick={() => activeTab.value = tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main class="tab-content">
        <div class="placeholder-tab">
          <h2>{TABS.find((t) => t.id === activeTab.value)?.label}</h2>
          <p>This tab is under construction.</p>
        </div>
      </main>
    </div>
  );
}
