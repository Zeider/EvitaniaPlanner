import { activeTab } from '../state/store.js';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'advisor', label: 'Upgrade Advisor' },
  { id: 'gear', label: 'Gear Planner' },
  { id: 'skills', label: 'Skill Trees' },
  { id: 'crafting', label: 'Crafting' },
  { id: 'runes', label: 'Rune Planner' },
  { id: 'alt-advisor', label: 'Alt Advisor' },
  { id: 'progression', label: 'Progression' },
  { id: 'cards', label: 'Cards' },
  { id: 'storage', label: 'Storage' },
  { id: 'engineer', label: 'Engineer' },
  { id: 'dps', label: 'DPS Sim' },
];

export function TabNav() {
  return (
    <nav class="tab-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          class={`tab-btn ${activeTab.value === t.id ? 'active' : ''}`}
          onClick={() => { activeTab.value = t.id; }}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
