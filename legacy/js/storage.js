var LS_RECIPES = 'ic-recipes-v1';
var LS_CRAFT   = 'ic-craft-v1';
var LS_INVENT  = 'ic-invent-v1';
var LS_CATEGORY = 'ic-category-v1';
var THEME_KEY  = 'ic-theme';
var LS_MULTICRAFT = 'ic-multicraft-v1';

// ── GLOBAL STATE ─────────────────────────────────
var recipes   = {};
var craftList = [];
var inventory = {};
var multicraftLevel = 0;

// ── HELPERS ───────────────────────────────────────
var saveLS = function(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
};

var loadLS = function(key) {
  try {
    var r = localStorage.getItem(key);
    return r ? JSON.parse(r) : null;
  } catch (e) { return null; }
};

var toTitleCase = function(s) {
  return s.replace(/\w\S*/g, function(w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
};
