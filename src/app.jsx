import { TopBar } from './components/TopBar.jsx';
import { TabNav } from './components/TabNav.jsx';
import { GearStrip } from './components/GearStrip.jsx';
import { Dashboard } from './tabs/Dashboard.jsx';
import { DpsSimulator } from './tabs/DpsSimulator.jsx';
import { GearPlanner } from './tabs/GearPlanner.jsx';
import { UpgradeAdvisor } from './tabs/UpgradeAdvisor.jsx';
import { SkillTrees } from './tabs/SkillTrees.jsx';
import { Crafting } from './tabs/Crafting.jsx';
import { RunePlanner } from './tabs/RunePlanner.jsx';
import { AltAdvisor } from './tabs/AltAdvisor.jsx';
import { ReleaseNotes } from './tabs/ReleaseNotes.jsx';
import { Progression } from './tabs/Progression.jsx';
import { useEffect } from 'preact/hooks';
import { activeTab, theme, lightMode } from './state/store.js';

export function App() {
  // Sync theme class onto body so CSS custom properties cascade to body's background
  useEffect(() => {
    document.body.className = `theme-${theme.value} ${lightMode.value ? 'light-theme' : ''}`;
  }, [theme.value, lightMode.value]);

  return (
    <div class={`app theme-${theme.value} ${lightMode.value ? 'light-theme' : ''}`}>
      <TopBar />
      <TabNav />
      <main class="tab-content">
        {activeTab.value === 'dashboard' && <Dashboard />}
        {activeTab.value === 'dps' && <DpsSimulator />}
        {activeTab.value === 'gear' && <GearPlanner />}
        {activeTab.value === 'advisor' && <UpgradeAdvisor />}
        {activeTab.value === 'skills' && <SkillTrees />}
        {activeTab.value === 'crafting' && <Crafting />}
        {activeTab.value === 'runes' && <RunePlanner />}
        {activeTab.value === 'alt-advisor' && <AltAdvisor />}
        {activeTab.value === 'release-notes' && <ReleaseNotes />}
        {activeTab.value === 'progression' && <Progression />}
        {activeTab.value !== 'dashboard' && activeTab.value !== 'dps' && activeTab.value !== 'gear' && activeTab.value !== 'advisor' && activeTab.value !== 'skills' && activeTab.value !== 'crafting' && activeTab.value !== 'runes' && activeTab.value !== 'alt-advisor' && activeTab.value !== 'release-notes' && activeTab.value !== 'progression' && (
          <div class="placeholder-tab"><p>{activeTab.value} — coming soon</p></div>
        )}
      </main>
      <GearStrip />
    </div>
  );
}
