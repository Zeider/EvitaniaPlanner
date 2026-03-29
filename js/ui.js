// ── THEME TOGGLE ──────────────────────────────────
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  var icon = document.getElementById('themeIcon');
  var label = document.getElementById('themeLabel');
  if (theme === 'dark') {
    icon.textContent = '☀️';
    label.textContent = 'Light Mode';
  } else {
    icon.textContent = '🌙';
    label.textContent = 'Dark Mode';
  }
  try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
}

function toggleTheme() {
  var currentTheme = document.body.getAttribute('data-theme');
  var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// ── TOAST NOTIFICATIONS ───────────────────────────
var _toastTimeout;
function showToast(message, isError) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('error');
  if (isError) toast.classList.add('error');
  toast.classList.add('show');

  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(function() {
    toast.classList.remove('show');
  }, 3000);
}

// ── TAB SWITCHING ─────────────────────────────────
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

// ── ITEM SELECT DROPDOWN ──────────────────────────
function updateItemSelect() {
  var sel   = document.getElementById('craftItemSelect');
  var cur   = sel.value;
  var names = Object.keys(recipes).sort();
  sel.innerHTML = '<option value="">— Select An Item —</option>' +
    names.map(function(n) {
      return '<option value="' + n + '"' + (n === cur ? ' selected' : '') + '>' + n + '</option>';
    }).join('');
}
