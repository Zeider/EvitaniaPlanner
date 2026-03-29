// ── THEME ─────────────────────────────────────────
function applyTheme(t) {
  document.body.setAttribute('data-theme', t);
  document.getElementById('themeIcon').textContent  = t === 'dark' ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent = t === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function toggleTheme() {
  var next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch(e) {}
}

// ── TABS ──────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(function(p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  document.getElementById(name + 'Tab').classList.add('active');
  document.getElementById('tabBtn' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
}

// ── COLLAPSIBLE ───────────────────────────────────
function toggleSection(bodyId, toggleId) {
  var body = document.getElementById(bodyId);
  var tog  = document.getElementById(toggleId);
  var col  = body.classList.toggle('collapsed');
  tog.textContent = col ? '▼ Expand' : '▲ Collapse';
}