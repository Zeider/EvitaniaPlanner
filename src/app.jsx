import { useState } from 'preact/hooks';

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
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div class="app">
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
            class={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main class="tab-content">
        <div class="placeholder-tab">
          <h2>{TABS.find((t) => t.id === activeTab)?.label}</h2>
          <p>This tab is under construction.</p>
        </div>
      </main>
    </div>
  );
}
