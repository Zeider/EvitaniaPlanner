import { TopBar } from './components/TopBar.jsx';
import { TabNav } from './components/TabNav.jsx';
import { GearStrip } from './components/GearStrip.jsx';
import { Dashboard } from './tabs/Dashboard.jsx';
import { activeTab, theme, lightMode } from './state/store.js';

export function App() {
  return (
    <div class={`app theme-${theme.value} ${lightMode.value ? 'light-theme' : ''}`}>
      <TopBar />
      <TabNav />
      <main class="tab-content">
        {activeTab.value === 'dashboard' && <Dashboard />}
        {activeTab.value !== 'dashboard' && (
          <div class="placeholder-tab"><p>{activeTab.value} — coming soon</p></div>
        )}
      </main>
      <GearStrip />
    </div>
  );
}
