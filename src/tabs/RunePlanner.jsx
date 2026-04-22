import { useState, useMemo, useCallback, useEffect } from 'preact/hooks';
import runeData from '../data/runes.json';
import { activeProfile } from '../state/store.js';
import { recommendSocketableRunewords } from '../state/runeword-recommender.js';

// ── localStorage (backwards-compatible with legacy) ──
const LS_KEY = 'ic-rune-inv-v1';

function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* noop */ }
}
function loadLS(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch (e) { return null; }
}

// ── T1-equivalent multipliers ──
const T1_MULT = { t1: 1, t2: 6, t3: 54, t4: 486 };

// ── Rune combos (same structure as legacy RUNE_COMBOS) ──
const RUNE_COMBOS = [
  {
    id: 'gor_mu_has',
    name: 'GOR \u00b7 MU \u00b7 HAS',
    effect: '200 HP, 10% All EXP, 2\u00d7 Portal Kills',
    families: [
      { id: 'gor', label: 'GOR', tiers: ['GOR', 'BOL', 'TES', 'WAR'], farm: 'Sunboy / Kangaroo', required: 1 },
      { id: 'mu',  label: 'MU',  tiers: ['MU',  'RO',  'FON', 'FAL'], farm: 'Penguin / Draugr',  required: 1 },
      { id: 'has', label: 'HAS', tiers: ['HAS', 'OLU', 'SUR', 'TYR'], farm: 'Act 2 Bosses',      required: 1 },
    ],
  },
  {
    id: 'apex_sirc_wer',
    name: 'APEX \u00b7 SIRC \u00b7 WER',
    effect: '10% Crit Chance, 60% Crit Dmg, 5 Magic Find',
    families: [
      { id: 'wom', label: 'WOM', tiers: ['WOM', 'SIRC', 'APEX', 'BEB'], farm: 'Thorium Ore',    required: 60 },
      { id: 'ki',  label: 'KI',  tiers: ['KI',  'WER',  'ANG',  'YUR'], farm: 'Act 1 Hardmode', required: 6  },
    ],
  },
  {
    id: 'tyr_sur_vex_lum',
    name: 'TYR \u00b7 SUR \u00b7 VEX \u00b7 LUM',
    effect: '50% All XP, 300 ATK, 5% Offline Gains',
    families: [
      { id: 'has', label: 'HAS', tiers: ['HAS', 'OLU', 'SUR', 'TYR'], farm: 'Act 2 Bosses', required: 540 },
      { id: 'rys', label: 'RYS', tiers: ['RYS', 'LUM', 'ORT', 'VEX'], farm: 'Ironwood',     required: 492 },
    ],
  },
  {
    id: 'fal_fal_tes_war',
    name: 'FAL \u00b7 FAL \u00b7 TES \u00b7 WAR',
    effect: '50% Gold Multi, 400 HP, 10 Magic Find',
    families: [
      { id: 'mu',  label: 'MU',  tiers: ['MU',  'RO',  'FON', 'FAL'], farm: 'Penguin / Draugr',  required: 972 },
      { id: 'gor', label: 'GOR', tiers: ['GOR', 'BOL', 'TES', 'WAR'], farm: 'Sunboy / Kangaroo', required: 540 },
    ],
  },
  {
    id: 'dot_wir_yur_sko',
    name: 'DOT \u00b7 WIR \u00b7 YUR \u00b7 SKO',
    effect: '100 Mining & Woodcutting Power, 40 Mining & Woodcutting Multiloot',
    families: [
      { id: 'nil', label: 'NIL', tiers: ['NIL', 'DOT', 'WIR', 'GRO'], farm: 'Iceboar / Yeti',    required: 60  },
      { id: 'ki',  label: 'KI',  tiers: ['KI',  'WER', 'ANG', 'YUR'], farm: 'Act 1 Hardmode',    required: 486 },
      { id: 'fus', label: 'FUS', tiers: ['FUS', 'YIT', 'SKO', 'MIN'], farm: 'Ratatoskr / Troll', required: 54  },
    ],
  },
  {
    id: 'war_yur_gro_min_tyr_fal',
    name: 'WAR \u00b7 YUR \u00b7 GRO \u00b7 MIN \u00b7 TYR \u00b7 FAL',
    effect: '10% Offline Gains, \u00d71.5 ATK, 20 Magic Find',
    families: [
      { id: 'gor', label: 'GOR', tiers: ['GOR', 'BOL', 'TES', 'WAR'], farm: 'Sunboy / Kangaroo', required: 486 },
      { id: 'ki',  label: 'KI',  tiers: ['KI',  'WER', 'ANG', 'YUR'], farm: 'Act 1 Hardmode',    required: 486 },
      { id: 'nil', label: 'NIL', tiers: ['NIL', 'DOT', 'WIR', 'GRO'], farm: 'Iceboar / Yeti',    required: 486 },
      { id: 'fus', label: 'FUS', tiers: ['FUS', 'YIT', 'SKO', 'MIN'], farm: 'Ratatoskr / Troll', required: 486 },
      { id: 'has', label: 'HAS', tiers: ['HAS', 'OLU', 'SUR', 'TYR'], farm: 'Act 2 Bosses',      required: 486 },
      { id: 'mu',  label: 'MU',  tiers: ['MU',  'RO',  'FON', 'FAL'], farm: 'Penguin / Draugr',  required: 486 },
    ],
  },
  {
    id: 'pre_x6',
    name: 'PRE \u00d7 6 \u2014 Premium',
    effect: '20 Magic Find, 20% Offline Gains, 200 ATK, 2\u00d7 Portal Kills',
    families: [
      { id: 'pre', label: 'PRE', tiers: ['PRE', null, null, null], farm: 'Shop (Diamonds only)', required: 6 },
    ],
  },
];

const TIER_LABELS = ['T1 (Gray)', 'T2 (Blue)', 'T3 (Purple)', 'T4 (Gold)'];
const TIER_KEYS   = ['t1', 't2', 't3', 't4'];

// Lookup: sorted rune list → combo id. Built at module load so the Socketable panel
// can find the matching combo selector entry for each recommendation.
const COMBO_ID_BY_RUNES_KEY = Object.fromEntries(
  (runeData.runeWords || []).map((rw, i) => [
    [...rw.runes].sort().join('|'),
    RUNE_COMBOS[i]?.id,
  ]).filter(([_, id]) => id),
);

function runesToComboId(runes) {
  return COMBO_ID_BY_RUNES_KEY[[...runes].sort().join('|')];
}

// Formatting helper for the bonus object on a runeword recommendation.
const BONUS_LABELS = {
  atk: 'ATK', atkMulti: 'ATK x', hp: 'HP', allExp: 'All EXP',
  allXp: 'All XP', offline: 'Offline', goldMulti: 'Gold x',
  magicFind: 'MF', critChance: 'Crit Chance', critDamage: 'Crit Dmg',
  miningPower: 'Mining Power', wcPower: 'WC Power',
  multiloot: 'Multiloot', portalKills: 'Portal Kills',
};
function formatBonuses(bonuses) {
  return Object.entries(bonuses)
    .map(([k, v]) => {
      const label = BONUS_LABELS[k] || k;
      return `${label} +${v}`;
    })
    .join(', ');
}

// ── Helpers ──
function getT1Total(inv, comboId, familyId) {
  const fInv = (inv[comboId] || {})[familyId] || {};
  return (fInv.t1 || 0) * T1_MULT.t1
       + (fInv.t2 || 0) * T1_MULT.t2
       + (fInv.t3 || 0) * T1_MULT.t3
       + (fInv.t4 || 0) * T1_MULT.t4;
}

// ── Family input block ──
function FamilyBlock({ combo, fam, inv, onInput }) {
  const famInv = (inv[combo.id] || {})[fam.id] || { t1: 0, t2: 0, t3: 0, t4: 0 };

  return (
    <div class="rune-family-block">
      <div class="rune-family-name">{fam.label}</div>
      <div class="rune-farm-loc">{'\ud83d\udccd'} Farm: {fam.farm}</div>
      <div class="rune-tier-row">
        {fam.tiers.map((tierName, t) => {
          if (!tierName) return null;
          const tierKey = TIER_KEYS[t];
          const tierVal = famInv[tierKey] || 0;
          return (
            <div class="rune-tier-cell" key={t}>
              <span class={`rune-tier-label rune-tier-label--${t}`}>{TIER_LABELS[t]}</span>
              <div class="rune-tier-rune-name">{tierName}</div>
              <input
                type="number"
                min="0"
                value={tierVal}
                onInput={(e) => {
                  let val = parseInt(e.target.value) || 0;
                  if (val < 0) { val = 0; e.target.value = 0; }
                  onInput(combo.id, fam.id, tierKey, val);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Result row ──
function ResultRow({ fam, have, need }) {
  const delta = Math.max(0, need - have);
  const pct = need === 0 ? 100 : Math.min(100, Math.round((have / need) * 100));
  const done = delta === 0;

  return (
    <div class="rune-result-row">
      <span class="rune-result-family">{fam.label}</span>
      <span class="rune-result-farm">{'\ud83d\udccd'} {fam.farm}</span>
      <div class="rune-progress-wrap">
        <div class={`rune-progress-bar ${done ? 'done' : 'partial'}`} style={{ width: `${pct}%` }} />
      </div>
      {done
        ? <span class="rune-need-label done">{'\u2705'} Done</span>
        : <span class="rune-need-label partial">Farm {delta} more T1</span>
      }
    </div>
  );
}

// ── Socketable-now panel ──
function SocketableNowPanel({ profile, onSelect }) {
  if (!profile) {
    return (
      <div class="rune-planner__card">
        <div class="rune-planner__card-title">Socketable Right Now</div>
        <div class="rune-empty-hint">Import your save to see runewords you can assemble from your current inventory.</div>
      </div>
    );
  }
  const recommendations = recommendSocketableRunewords({
    runeInventory: profile.runeInventory,
    equippedRunes: profile.equippedRunes,
    runeSlots: profile.runeSlots,
  });
  return (
    <div class="rune-planner__card">
      <div class="rune-planner__card-title">Socketable Right Now</div>
      {recommendations.length === 0 ? (
        <div class="rune-empty-hint">None of your runewords can be assembled from current inventory.</div>
      ) : (
        recommendations.map((rw, i) => {
          const name = rw.runes.join(' · ');
          const comboId = runesToComboId(rw.runes);
          return (
            <div class="socketable-row" key={i}>
              <div class="socketable-row__name">{name}</div>
              <div class="socketable-row__bonuses">{'✨ '}{formatBonuses(rw.bonuses)}</div>
              {comboId && (
                <button class="socketable-row__select" onClick={() => onSelect(comboId)}>
                  Plan
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Main component ──
export function RunePlanner() {
  const profile = activeProfile.value;
  const [inventory, setInventory] = useState(() => loadLS(LS_KEY) || {});
  const [selectedComboId, setSelectedComboId] = useState(RUNE_COMBOS[0].id);

  // Auto-populate the inventory inputs when a profile is imported or changed.
  // The user's owned runes (inventory + currently-equipped) become the starting
  // values across every combo. Users can still edit the inputs afterward.
  useEffect(() => {
    if (!profile) return;
    const ownedCounts = { ...(profile.runeInventory || {}) };
    for (const rune of profile.equippedRunes || []) {
      ownedCounts[rune] = (ownedCounts[rune] || 0) + 1;
    }
    setInventory(() => {
      const next = {};
      for (const combo of RUNE_COMBOS) {
        next[combo.id] = {};
        for (const fam of combo.families) {
          next[combo.id][fam.id] = { t1: 0, t2: 0, t3: 0, t4: 0 };
          fam.tiers.forEach((runeName, tIdx) => {
            if (!runeName) return;
            const count = ownedCounts[runeName] || 0;
            if (count) next[combo.id][fam.id][TIER_KEYS[tIdx]] = count;
          });
        }
      }
      saveLS(LS_KEY, next);
      return next;
    });
  }, [profile?.runeInventory, profile?.equippedRunes]);

  const combo = useMemo(
    () => RUNE_COMBOS.find((c) => c.id === selectedComboId) || RUNE_COMBOS[0],
    [selectedComboId],
  );

  const handleInput = useCallback((comboId, familyId, tierKey, val) => {
    setInventory((prev) => {
      const next = { ...prev };
      if (!next[comboId]) next[comboId] = {};
      if (!next[comboId][familyId]) next[comboId][familyId] = { t1: 0, t2: 0, t3: 0, t4: 0 };
      next[comboId] = { ...next[comboId] };
      next[comboId][familyId] = { ...next[comboId][familyId], [tierKey]: val };
      saveLS(LS_KEY, next);
      return next;
    });
  }, []);

  // Compute results
  const results = useMemo(() => {
    let allDone = true;
    const rows = combo.families.map((fam) => {
      const have = getT1Total(inventory, combo.id, fam.id);
      const need = fam.required;
      if (have < need) allDone = false;
      return { fam, have, need };
    });
    return { rows, allDone };
  }, [inventory, combo]);

  return (
    <div class="rune-planner">
      {/* Socketable-now recommendations (driven by imported save) */}
      <SocketableNowPanel profile={profile} onSelect={setSelectedComboId} />

      {/* Combo selector */}
      <div class="rune-planner__card">
        <div class="rune-planner__card-title">Rune Word Combo</div>
        <select
          class="rune-combo-select"
          value={selectedComboId}
          onChange={(e) => setSelectedComboId(e.target.value)}
        >
          {RUNE_COMBOS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div class="rune-effect">{'\u2728'} {combo.effect}</div>
      </div>

      {/* Inventory inputs */}
      <div class="rune-planner__card">
        <div class="rune-planner__card-title">Your Rune Inventory</div>
        {combo.families.map((fam) => (
          <FamilyBlock
            key={`${combo.id}-${fam.id}`}
            combo={combo}
            fam={fam}
            inv={inventory}
            onInput={handleInput}
          />
        ))}
      </div>

      {/* Progress / Results */}
      <div class="rune-planner__card">
        <div class="rune-planner__card-title">Progress</div>
        {results.allDone ? (
          <div class="rune-combo-complete">
            {'\ud83c\udf89'} Combo complete! All runes collected.
          </div>
        ) : (
          results.rows.map((r) => (
            <ResultRow key={`${combo.id}-${r.fam.id}`} fam={r.fam} have={r.have} need={r.need} />
          ))
        )}
      </div>
    </div>
  );
}
