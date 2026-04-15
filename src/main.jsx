import { render } from 'preact';
import { App } from './app.jsx';
import './css/base.css';
import './css/components.css';
import './css/dashboard.css';

render(<App />, document.getElementById('app'));
