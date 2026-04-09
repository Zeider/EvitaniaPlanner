// ── UI CONTROLLER ────────────────────────────────
var AppUI = {
  _toastTimeout: null,

  init: function() {
    this.refreshTheme();
    this.refreshMulticraft();
  },

  refreshTheme: function() {
    var theme = localStorage.getItem(THEME_KEY) || 'dark';
    document.body.classList.toggle('light-theme', theme === 'light');
    var icon = document.getElementById('themeIcon');
    var label = document.getElementById('themeLabel');
    // If we're light, show 'Dark Mode' (moon). If we're dark, show 'Light Mode' (sun).
    if (icon) icon.textContent = theme === 'light' ? '🌙' : '☀️';
    if (label) label.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
  },

  refreshMulticraft: function() {
    var stored = localStorage.getItem(LS_MULTICRAFT);
    multicraftLevel = stored ? parseInt(stored) : 0;
    
    // Update UI buttons
    [0, 2, 4].forEach(function(lvl) {
      var btn = document.getElementById('mc_' + lvl);
      if (btn) btn.classList.toggle('active', multicraftLevel === lvl);
    });
  },

  setMulticraft: function(lvl) {
    multicraftLevel = lvl;
    localStorage.setItem(LS_MULTICRAFT, lvl);
    this.refreshMulticraft();
    liveRecalc();
    this.showToast('Multicraft Level ' + lvl + ' active');
  },

  toggleTheme: function() {
    var isLight = document.body.classList.contains('light-theme');
    var newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, newTheme);
    this.refreshTheme();
  },

  showToast: function(message, isError) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(function() {
      toast.className = 'toast';
    }, 3000);
  },

  switchTab: function(name) {
    var panels = document.querySelectorAll('.tab-panel');
    for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active');
    
    var btns = document.querySelectorAll('.tab-btn');
    for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active');
    
    var panel = document.getElementById(name + 'Tab');
    var btn = document.getElementById('tabBtn' + name.charAt(0).toUpperCase() + name.slice(1));
    
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
  },

  toggleSection: function(bodyId, toggleId) {
    var body = document.getElementById(bodyId);
    var tog = document.getElementById(toggleId);
    if (!body || !tog) return;
    
    var isCollapsed = body.classList.toggle('collapsed');
    tog.textContent = isCollapsed ? '▼ Expand' : '▲ Collapse';
  }
};

// Global aliases for legacy HTML onclicks
window.toggleTheme = function() { AppUI.toggleTheme(); };
window.switchTab = function(name) { AppUI.switchTab(name); };
window.toggleSection = function(b, t) { AppUI.toggleSection(b, t); };
window.showToast = function(m, e) { AppUI.showToast(m, e); };
