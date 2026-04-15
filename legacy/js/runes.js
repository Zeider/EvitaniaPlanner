// ── RUNE FARMING CALCULATOR ──────────────────────────
// Merge ratios: 6 T1 → 1 T2, 9 T2 → 1 T3, 9 T3 → 1 T4
// T1 equivalents: T2 = 6, T3 = 54, T4 = 486

var RUNE_COMBOS = [
  {
    id: 'gor_mu_has',
    name: 'GOR · MU · HAS',
    effect: '200 HP, 10% All EXP, 2× Portal Kills',
    families: [
      { id: 'gor', label: 'GOR', tiers: ['GOR', 'BOL', 'TES', 'WAR'], farm: 'Sunboy / Kangaroo', required: 1 },
      { id: 'mu',  label: 'MU',  tiers: ['MU',  'RO',  'FON', 'FAL'], farm: 'Penguin / Draugr',  required: 1 },
      { id: 'has', label: 'HAS', tiers: ['HAS', 'OLU', 'SUR', 'TYR'], farm: 'Act 2 Bosses',      required: 1 }
    ]
  },
  {
    id: 'apex_sirc_wer',
    name: 'APEX · SIRC · WER',
    effect: '10% Crit Chance, 60% Crit Dmg, 5 Magic Find',
    families: [
      { id: 'wom', label: 'WOM', tiers: ['WOM', 'SIRC', 'APEX', 'BEB'], farm: 'Thorium Ore',    required: 60 },
      { id: 'ki',  label: 'KI',  tiers: ['KI',  'WER',  'ANG',  'YUR'], farm: 'Act 1 Hardmode', required: 6  }
    ]
  },
  {
    id: 'tyr_sur_vex_lum',
    name: 'TYR · SUR · VEX · LUM',
    effect: '50% All XP, 300 ATK, 5% Offline Gains',
    families: [
      { id: 'has', label: 'HAS', tiers: ['HAS', 'OLU', 'SUR', 'TYR'], farm: 'Act 2 Bosses', required: 540 },
      { id: 'rys', label: 'RYS', tiers: ['RYS', 'LUM', 'ORT', 'VEX'], farm: 'Ironwood',     required: 492 }
    ]
  },
  {
    id: 'fal_fal_tes_war',
    name: 'FAL · FAL · TES · WAR',
    effect: '50% Gold Multi, 400 HP, 10 Magic Find',
    families: [
      { id: 'mu',  label: 'MU',  tiers: ['MU',  'RO',  'FON', 'FAL'], farm: 'Penguin / Draugr',  required: 972 },
      { id: 'gor', label: 'GOR', tiers: ['GOR', 'BOL', 'TES', 'WAR'], farm: 'Sunboy / Kangaroo', required: 540 }
    ]
  },
  {
    id: 'dot_wir_yur_sko',
    name: 'DOT · WIR · YUR · SKO',
    effect: '100 Mining & Woodcutting Power, 40 Mining & Woodcutting Multiloot',
    families: [
      { id: 'nil', label: 'NIL', tiers: ['NIL', 'DOT', 'WIR', 'GRO'], farm: 'Iceboar / Yeti',    required: 60  },
      { id: 'ki',  label: 'KI',  tiers: ['KI',  'WER', 'ANG', 'YUR'], farm: 'Act 1 Hardmode',    required: 486 },
      { id: 'fus', label: 'FUS', tiers: ['FUS', 'YIT', 'SKO', 'MIN'], farm: 'Ratatoskr / Troll', required: 54  }
    ]
  },
  {
    id: 'war_yur_gro_min_tyr_fal',
    name: 'WAR · YUR · GRO · MIN · TYR · FAL',
    effect: '10% Offline Gains, ×1.5 ATK, 20 Magic Find',
    families: [
      { id: 'gor', label: 'GOR', tiers: ['GOR', 'BOL', 'TES', 'WAR'], farm: 'Sunboy / Kangaroo', required: 486 },
      { id: 'ki',  label: 'KI',  tiers: ['KI',  'WER', 'ANG', 'YUR'], farm: 'Act 1 Hardmode',    required: 486 },
      { id: 'nil', label: 'NIL', tiers: ['NIL', 'DOT', 'WIR', 'GRO'], farm: 'Iceboar / Yeti',    required: 486 },
      { id: 'fus', label: 'FUS', tiers: ['FUS', 'YIT', 'SKO', 'MIN'], farm: 'Ratatoskr / Troll', required: 486 },
      { id: 'has', label: 'HAS', tiers: ['HAS', 'OLU', 'SUR', 'TYR'], farm: 'Act 2 Bosses',      required: 486 },
      { id: 'mu',  label: 'MU',  tiers: ['MU',  'RO',  'FON', 'FAL'], farm: 'Penguin / Draugr',  required: 486 }
    ]
  },
  {
    id: 'pre_x6',
    name: 'PRE × 6 — Premium',
    effect: '20 Magic Find, 20% Offline Gains, 200 ATK, 2× Portal Kills',
    families: [
      { id: 'pre', label: 'PRE', tiers: ['PRE', null, null, null], farm: 'Shop (Diamonds only)', required: 6 }
    ]
  }
];

var RuneCalc = {
  LS_KEY: 'ic-rune-inv-v1',
  inventory: {},       // { comboId: { familyId: { t1, t2, t3, t4 } } }
  currentComboId: null,

  // T1-equivalent multipliers for each tier index
  T1_MULT: [1, 6, 54, 486],

  getT1Total: function(comboId, familyId) {
    var inv = ((this.inventory[comboId] || {})[familyId]) || {};
    return (inv.t1 || 0) * 1
         + (inv.t2 || 0) * 6
         + (inv.t3 || 0) * 54
         + (inv.t4 || 0) * 486;
  },

  saveInventory: function() {
    saveLS(this.LS_KEY, this.inventory);
  },

  init: function() {
    var stored = loadLS(this.LS_KEY);
    if (stored) this.inventory = stored;

    var sel = document.getElementById('runeComboSelect');
    if (!sel) return;

    // Populate dropdown
    for (var i = 0; i < RUNE_COMBOS.length; i++) {
      var opt = document.createElement('option');
      opt.value = RUNE_COMBOS[i].id;
      opt.textContent = RUNE_COMBOS[i].name;
      sel.appendChild(opt);
    }

    var self = this;
    sel.addEventListener('change', function() {
      self.onComboChange(this.value);
    });

    // Load first combo by default
    if (RUNE_COMBOS.length) {
      this.onComboChange(RUNE_COMBOS[0].id);
    }
  },

  onComboChange: function(comboId) {
    this.currentComboId = comboId;
    var combo = this._findCombo(comboId);
    if (!combo) return;

    // Update effect line
    var effectEl = document.getElementById('runeEffect');
    if (effectEl) effectEl.textContent = '✨ ' + combo.effect;

    // Show inventory + result cards
    var invCard = document.getElementById('runeInventoryCard');
    var resCard = document.getElementById('runeResultCard');
    if (invCard) invCard.style.display = '';
    if (resCard) resCard.style.display = '';

    this.renderInputs(combo);
    this.renderResults(combo);
  },

  renderInputs: function(combo) {
    var body = document.getElementById('runeInventoryBody');
    if (!body) return;

    var self = this;
    var comboId = combo.id;
    var html = '';

    for (var i = 0; i < combo.families.length; i++) {
      var fam = combo.families[i];
      var inv = ((this.inventory[comboId] || {})[fam.id]) || { t1: 0, t2: 0, t3: 0, t4: 0 };
      var hasTiers = fam.tiers[1] !== null; // PRE has no T2/T3/T4

      html += '<div class="rune-family-block" data-family="' + fam.id + '">';
      html += '<div class="rune-family-name">' + fam.label + '</div>';
      html += '<div class="rune-farm-loc">📍 Farm: ' + fam.farm + '</div>';
      html += '<div class="rune-tier-row">';

      for (var t = 0; t < 4; t++) {
        var tierName = fam.tiers[t];
        if (!tierName) continue; // skip null tiers (PRE T2/T3/T4)
        var tierKey = 't' + (t + 1);
        var tierVal = inv[tierKey] || 0;
        var tierColors = ['', 'style="color:var(--accent)"', 'style="color:#c084fc"', 'style="color:var(--warning)"'];

        html += '<div class="rune-tier-cell">';
        html += '<span class="rune-tier-label" ' + (tierColors[t] || '') + '>';
        html += (t === 0 ? 'T1 (Gray)' : t === 1 ? 'T2 (Blue)' : t === 2 ? 'T3 (Purple)' : 'T4 (Gold)');
        html += '</span>';
        html += '<div style="font-size:0.75rem;font-weight:600;text-align:center;margin-bottom:2px">' + tierName + '</div>';
        html += '<input type="number" min="0" value="' + tierVal + '" '
              + 'data-combo="' + comboId + '" data-family="' + fam.id + '" data-tier="' + tierKey + '" '
              + 'oninput="RuneCalc.onInputChange(this)" />';
        html += '</div>';
      }

      html += '</div>'; // rune-tier-row
      html += '</div>'; // rune-family-block
    }

    body.innerHTML = html;
  },

  onInputChange: function(inputEl) {
    var comboId = inputEl.dataset.combo;
    var familyId = inputEl.dataset.family;
    var tierKey  = inputEl.dataset.tier;
    var val      = parseInt(inputEl.value) || 0;
    if (val < 0) { val = 0; inputEl.value = 0; }

    if (!this.inventory[comboId]) this.inventory[comboId] = {};
    if (!this.inventory[comboId][familyId]) this.inventory[comboId][familyId] = { t1: 0, t2: 0, t3: 0, t4: 0 };
    this.inventory[comboId][familyId][tierKey] = val;

    this.saveInventory();

    var combo = this._findCombo(comboId);
    if (combo) this.renderResults(combo);
  },

  renderResults: function(combo) {
    var body = document.getElementById('runeResultBody');
    if (!body) return;

    var comboId = combo.id;
    var html = '';
    var allDone = true;

    for (var i = 0; i < combo.families.length; i++) {
      var fam = combo.families[i];
      var have = this.getT1Total(comboId, fam.id);
      var need = fam.required;
      var delta = Math.max(0, need - have);
      var pct   = need === 0 ? 100 : Math.min(100, Math.round((have / need) * 100));
      var done  = delta === 0;
      if (!done) allDone = false;

      html += '<div class="rune-result-row">';
      html += '<span class="rune-result-family">' + fam.label + '</span>';
      html += '<span class="rune-result-farm">📍 ' + fam.farm + '</span>';
      html += '<div class="rune-progress-wrap">'
            + '<div class="rune-progress-bar ' + (done ? 'done' : 'partial') + '" style="width:' + pct + '%"></div>'
            + '</div>';
      if (done) {
        html += '<span class="rune-need-label done">✅ Done</span>';
      } else {
        html += '<span class="rune-need-label partial">Farm ' + delta + ' more T1</span>';
      }
      html += '</div>';
    }

    if (allDone) {
      html = '<div style="text-align:center;padding:1rem;color:var(--success);font-weight:700;font-size:1rem">'
           + '🎉 Combo complete! All runes collected.'
           + '</div>';
    }

    body.innerHTML = html;
  },

  _findCombo: function(id) {
    for (var i = 0; i < RUNE_COMBOS.length; i++) {
      if (RUNE_COMBOS[i].id === id) return RUNE_COMBOS[i];
    }
    return null;
  }
};

// Auto-init (safe for both inline and deferred load positions)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { RuneCalc.init(); });
} else {
  RuneCalc.init();
}
