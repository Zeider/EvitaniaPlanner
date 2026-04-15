import { render } from 'preact';
import { App } from './app.jsx';
import './css/base.css';
import './css/components.css';
import './css/dashboard.css';
import './css/dps-sim.css';
import './css/gear-planner.css';
import './css/upgrade-advisor.css';
import './css/skill-trees.css';
import './css/crafting.css';

render(<App />, document.getElementById('app'));
