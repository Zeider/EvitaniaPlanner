import { signal } from '@preact/signals';
import { activeProfile, saveProfile, activeProfileKey } from '../state/store.js';
import { computeStats, computeEffectiveDPS } from '../state/stat-engine.js';
import gearData from '../data/gear.json';
import enemies from '../data/enemies.json';

/* ── Gear slot definitions ────────────────────────── */
const SLOTS = [
  { id: 'helmet',  label: 'Helmet' },
  { id: 'chest',   label: 'Chest' },
  { id: 'gloves',  label: 'Gloves' },
  { id: 'boots',   label: 'Boots' },
  { id: 'belt',    label: 'Belt' },
  { id: 'amulet',  label: 'Amulet' },
  { id: 'ring',    label: 'Ring' },
  { id: 'weapon',  label: 'Weapon' },
  { id: 'axe',     label: 'Axe' },
  { id: 'pickaxe', label: 'Pickaxe' },
];

/* ── Build flat item lists per slot ───────────────── */
function buildItemsBySlot() {
  const bySlot = {};
  for (const slot of SLOTS) {
    bySlot[slot.id] = [];
  }
  for (const category of Object.values(gearData)) {
    for (const subcategory of Object.values(category)) {
      if (!Array.isArray(subcategory)) continue;
      for (const item of subcategory) {
        const slotId = item.slot;
        if (bySlot[slotId]) {
          bySlot[slotId].push(item);
        }
      }
    }
  }
  return bySlot;
}

const itemsBySlot = buildItemsBySlot();

/* ── Flat gear lookup by name ─────────────────────── */
function buildGearLookup() {
  const lookup = {};
  for (const category of Object.values(gearData)) {
    for (const subcategory of Object.values(category)) {
      if (!Array.isArray(subcategory)) continue;
      for (const item of subcategory) {
        lookup[item.name] = item;
      }
    }
  }
  return lookup;
}

const gearLookup = buildGearLookup();

/* ── Find first enemy for eDPS computation ────────── */
function findEnemy(zoneId) {
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    const match = act.zones.find(e => e.zone === zoneId);
    if (match) return match;
  }
  return enemies.act1?.zones?.[0] || { hp: 100, atk: 10, evasion: 0 };
}

/* ── Stat display labels ──────────────────────────── */
const STAT_LABELS = {
  atk: 'ATK', totalAtk: 'Total ATK', def: 'DEF', hp: 'HP',
  str: 'STR', dex: 'DEX', int: 'INT', con: 'CON', men: 'MEN',
  atkSpeed: 'ATK Speed', critChance: 'Crit Chance', critDmg: 'Crit Damage',
  accuracy: 'Accuracy', magicFind: 'Magic Find', moveSpeed: 'Move Speed',
  hpRegen: 'HP Regen', miningPower: 'Mining Power',
  woodcuttingPower: 'WC Power', bonusXp: 'Bonus XP',
  mobSpawnReduction: 'Mob Spawn Reduction', goldMulti: 'Gold Multi',
  xpMulti: 'XP Multi', offlineGains: 'Offline Gains',
  mana: 'Mana', manaRegen: 'Mana Regen', atkPercent: 'ATK%', defPercent: 'DEF%',
};

/* ── Number formatting ────────────────────────────── */
function fmt(n) {
  if (!isFinite(n) || isNaN(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

function fmtDelta(n) {
  if (n > 0) return '+' + fmt(n);
  if (n < 0) return fmt(n);
  return '0';
}

/* ── Signals ──────────────────────────────────────── */
const selectedSlot = signal('helmet');
const candidateItem = signal('');

/* ── Enhancement scaling ─────────────────────────── */
const WEAPON_ENH_RATE = 0.275;
const ARMOR_ENH_RATE = 0.05;

function enhancedPrimary(item, level) {
  if (item.atk) return Math.round(item.atk * (1 + level * WEAPON_ENH_RATE) * 10) / 10;
  if (item.def) return Math.round(item.def * (1 + level * ARMOR_ENH_RATE) * 10) / 10;
  return 0;
}

/* ── Profile helpers ──────────────────────────────── */
function setCurrentGear(slot, itemName, enhLevel) {
  const profile = { ...activeProfile.value };
  const existing = profile.gear?.[slot];
  profile.gear = {
    ...profile.gear,
    [slot]: { name: itemName, enhancementLevel: enhLevel ?? existing?.enhancementLevel ?? 0 },
  };
  saveProfile(activeProfileKey.value, profile);
}

function setEnhancementLevel(slot, level) {
  const profile = { ...activeProfile.value };
  const existing = profile.gear?.[slot];
  if (!existing || !existing.name) return;
  profile.gear = { ...profile.gear, [slot]: { ...existing, enhancementLevel: level } };
  saveProfile(activeProfileKey.value, profile);
}

/* ── Main component ───────────────────────────────── */
export function GearPlanner() {
  const profile = activeProfile.value;
  const slot = selectedSlot.value;
  const currentGearSlot = profile.gear?.[slot];
  const currentItemName = currentGearSlot?.name || '';
  const currentItem = currentItemName ? gearLookup[currentItemName] : null;

  const candidateName = candidateItem.value;
  const candidate = candidateName ? gearLookup[candidateName] : null;

  // Compute stats for current profile
  const currentStats = computeStats(profile);
  const enemy = findEnemy(profile.currentZone);
  const currentEDPS = computeEffectiveDPS(currentStats, enemy);

  // Compute stats with candidate swapped in
  let candidateStats = null;
  let candidateEDPS = 0;
  if (candidate) {
    const modifiedProfile = {
      ...profile,
      gear: { ...profile.gear, [slot]: { name: candidate.name, enhancementLevel: 0 } },
    };
    candidateStats = computeStats(modifiedProfile);
    candidateEDPS = computeEffectiveDPS(candidateStats, enemy);
  }

  // Compute stat diffs
  const diffs = [];
  if (currentStats && candidateStats) {
    for (const key of Object.keys(currentStats)) {
      if (key === 'totalAtk' || key === 'atkPercent' || key === 'defPercent') continue; // skip derived/percent
      const curr = currentStats[key] || 0;
      const cand = candidateStats[key] || 0;
      const delta = cand - curr;
      if (Math.abs(delta) > 0.01) {
        diffs.push({ key, label: STAT_LABELS[key] || key, delta });
      }
    }
  }

  const edpsDelta = candidateStats ? candidateEDPS - currentEDPS : 0;

  // Items available for this slot
  const availableItems = itemsBySlot[slot] || [];

  const onSlotClick = (slotId) => {
    selectedSlot.value = slotId;
    candidateItem.value = '';
  };

  const onCandidateChange = (e) => {
    candidateItem.value = e.target.value;
  };

  const onEquipCandidate = () => {
    if (candidate) {
      setCurrentGear(slot, candidate.name);
      candidateItem.value = '';
    }
  };

  const onUnequip = () => {
    const prof = { ...activeProfile.value };
    const newGear = { ...prof.gear };
    delete newGear[slot];
    prof.gear = newGear;
    saveProfile(activeProfileKey.value, prof);
  };

  return (
    <div class="gear-planner">
      {/* ── Slot Selector ── */}
      <div class="gp-slots">
        {SLOTS.map(s => (
          <button
            key={s.id}
            class={`gp-slots__btn ${selectedSlot.value === s.id ? 'gp-slots__btn--active' : ''}`}
            onClick={() => onSlotClick(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Three-Column Comparison ── */}
      <div class="gp-compare">
        {/* Current Gear */}
        <div class="gp-col gp-col--current">
          <h3 class="gp-col__title">Current Gear</h3>
          {currentItem ? (
            <div class="gp-item-info">
              <div class="gp-item-info__name">{currentItem.name}</div>
              {currentItem.source && (
                <div class="gp-item-info__source">{currentItem.source}</div>
              )}
              {currentItem.subtype && (
                <div class="gp-item-info__subtype">{currentItem.subtype}</div>
              )}
              {currentItem.obtainable === false && (
                <div class="gp-item-info__unobtainable">Unobtainable</div>
              )}
              {currentItem.atk != null && (
                <div class="gp-item-info__primary">
                  ATK: {enhancedPrimary(currentItem, currentGearSlot?.enhancementLevel || 0)}
                  {currentGearSlot?.enhancementLevel > 0 && (
                    <span class="gp-item-info__base"> (base {currentItem.atk})</span>
                  )}
                </div>
              )}
              {currentItem.def != null && (
                <div class="gp-item-info__primary">
                  DEF: {enhancedPrimary(currentItem, currentGearSlot?.enhancementLevel || 0)}
                  {currentGearSlot?.enhancementLevel > 0 && (
                    <span class="gp-item-info__base"> (base {currentItem.def})</span>
                  )}
                </div>
              )}
              <div class="gp-enhance-row">
                <label class="gp-enhance-label">Enhancement:</label>
                <input
                  type="number"
                  class="gp-enhance-input"
                  min="0"
                  max="15"
                  value={currentGearSlot?.enhancementLevel || 0}
                  onInput={(e) => setEnhancementLevel(slot, Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                />
                <span class="gp-enhance-preview">
                  +1 = {enhancedPrimary(currentItem, (currentGearSlot?.enhancementLevel || 0) + 1)}
                </span>
              </div>
              <div class="gp-stat-list">
                {currentItem.stats && Object.entries(currentItem.stats).map(([k, v]) => (
                  <div class="gp-stat-row" key={k}>
                    <span class="gp-stat-row__label">{STAT_LABELS[k] || k}</span>
                    <span class="gp-stat-row__value">{v > 0 ? '+' : ''}{v}</span>
                  </div>
                ))}
              </div>
              <button class="gp-btn gp-btn--unequip" onClick={onUnequip}>Unequip</button>
            </div>
          ) : (
            <div class="gp-empty">No item equipped</div>
          )}
        </div>

        {/* Stat Diff */}
        <div class="gp-col gp-col--diff">
          <h3 class="gp-col__title">Stat Diff</h3>
          {candidate ? (
            <>
              {/* eDPS badge */}
              <div class={`gp-edps-badge ${edpsDelta > 0 ? 'gp-edps-badge--up' : edpsDelta < 0 ? 'gp-edps-badge--down' : ''}`}>
                <span class="gp-edps-badge__label">eDPS</span>
                <span class="gp-edps-badge__value">{fmtDelta(edpsDelta)}</span>
              </div>

              {diffs.length > 0 ? (
                <div class="gp-diff-list">
                  {diffs.map(d => (
                    <div class={`gp-diff-row ${d.delta > 0 ? 'gp-diff-row--up' : 'gp-diff-row--down'}`} key={d.key}>
                      <span class="gp-diff-row__label">{d.label}</span>
                      <span class="gp-diff-row__value">{fmtDelta(d.delta)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="gp-empty">No stat changes</div>
              )}

              {/* Crafting info */}
              {candidate.recipe && (
                <div class="gp-craft-info">
                  <span class="gp-craft-info__label">Recipe:</span> {candidate.recipe}
                </div>
              )}

              {/* Equip button */}
              <button class="gp-btn gp-btn--equip" onClick={onEquipCandidate}>Equip Candidate</button>
            </>
          ) : (
            <div class="gp-empty">Select a candidate to compare</div>
          )}
        </div>

        {/* Candidate Gear */}
        <div class="gp-col gp-col--candidate">
          <h3 class="gp-col__title">Candidate Gear</h3>
          <select class="gp-select" value={candidateName} onChange={onCandidateChange}>
            <option value="">-- Select an item --</option>
            {availableItems.map(item => (
              <option value={item.name} key={item.name}>
                {item.name}{item.subtype ? ` (${item.subtype})` : ''}{item.obtainable === false ? ' [Unobtainable]' : ''}
              </option>
            ))}
          </select>

          {candidate ? (
            <div class="gp-item-info">
              <div class="gp-item-info__name">{candidate.name}</div>
              {candidate.source && (
                <div class="gp-item-info__source">{candidate.source}</div>
              )}
              {candidate.subtype && (
                <div class="gp-item-info__subtype">{candidate.subtype}</div>
              )}
              {candidate.obtainable === false && (
                <div class="gp-item-info__unobtainable">Unobtainable</div>
              )}
              {candidate.atk != null && (
                <div class="gp-item-info__primary">ATK: {candidate.atk}</div>
              )}
              {candidate.def != null && (
                <div class="gp-item-info__primary">DEF: {candidate.def}</div>
              )}
              <div class="gp-stat-list">
                {candidate.stats && Object.entries(candidate.stats).map(([k, v]) => (
                  <div class="gp-stat-row" key={k}>
                    <span class="gp-stat-row__label">{STAT_LABELS[k] || k}</span>
                    <span class="gp-stat-row__value">{v > 0 ? '+' : ''}{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div class="gp-empty">No candidate selected</div>
          )}
        </div>
      </div>
    </div>
  );
}
