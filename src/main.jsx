import { render } from 'preact';
import { App } from './app.jsx';
import { importProfiles } from './state/store.js';
import './css/base.css';
import './css/theme-boushoku.css';
import './css/theme-yama.css';
import './css/components.css';
import './css/dashboard.css';
import './css/dps-sim.css';
import './css/gear-planner.css';
import './css/upgrade-advisor.css';
import './css/skill-trees.css';
import './css/crafting.css';
import './css/rune-planner.css';
import './css/alt-advisor.css';

// Decode shared build from URL hash
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

render(<App />, document.getElementById('app'));
