// ── STORAGE KEYS ─────────────────────────────────
var LS_RECIPES = 'ic-recipes-v1';
var LS_CRAFT   = 'ic-craft-v1';
var LS_INVENT  = 'ic-invent-v1';
var THEME_KEY  = 'ic-theme';

// ── GLOBAL STATE ─────────────────────────────────
var recipes   = {};
var craftList = [];
var inventory = {};

// ── HELPERS ───────────────────────────────────────
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

function loadLS(key) {
  try {
    var r = localStorage.getItem(key);
    return r ? JSON.parse(r) : null;
  } catch(e) { return null; }
}

function showToast(msg, isError) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.className = 'toast'; }, 2800);
}

function toTitleCase(s) {
  return s.replace(/\w\S*/g, function(w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}