import { useState, useCallback } from 'preact/hooks';
import { activeProfile, saveProfile, activeProfileKey } from '../state/store.js';
import { computeStats, computeEffectiveDPS, computeEffectiveHP } from '../state/stat-engine.js';
import { StatCard } from '../components/StatCard.jsx';
import enemies from '../data/enemies.json';
import bonfireData from '../data/bonfire.json';
import cardsData from '../data/cards.json';
import runesData from '../data/runes.json';
import petsData from '../data/pets.json';
import dropsData from '../data/drops.json';
import recipesData from '../data/recipes.json';

/**
 * Find enemy data for a given zone ID across all acts.
 */
function findEnemy(zoneId) {
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    const match = act.zones.find(e => e.zone === zoneId);
    if (match) return match;
  }
  return enemies.act1.zones[0];
}

/** Build flat list of all unique rune names from all families. */
function getAllRuneNames() {
  const names = new Set();
  for (const family of runesData.families) {
    for (const tierData of Object.values(family.tiers)) {
      if (tierData.rune) names.add(tierData.rune);
    }
  }
  return [...names].sort();
}

const ALL_RUNE_NAMES = getAllRuneNames();

/** Get the tier index a card has reached. */
function getCardTier(count, thresholds) {
  let tier = -1;
  for (let i = 0; i < thresholds.length; i++) {
    if (count >= thresholds[i]) tier = i;
    else break;
  }
  return tier;
}

/** Format numbers compactly. */
function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

/** Persist a profile field change. */
function updateProfile(key, value) {
  const profile = activeProfile.value;
  const updated = { ...profile, [key]: value };
  saveProfile(activeProfileKey.value, updated);
}

// ── Bonfire Panel ──

function BonfirePanel() {
  const profile = activeProfile.value;
  const heat = profile.bonfireHeat || 0;

  const activeBufFs = bonfireData.filter(b => heat >= b.heatRequired && b.stat);
  const allUnlocked = bonfireData.filter(b => heat >= b.heatRequired);

  return (
    <div class="buffs-panel">
      <div class="buffs-panel__title">Bonfire Heat</div>
      <div class="buffs-panel__input-row">
        <input
          type="number"
          min="0"
          step="100"
          value={heat}
          class="buffs-panel__number-input"
          onInput={(e) => updateProfile('bonfireHeat', Math.max(0, parseInt(e.target.value) || 0))}
        />
        <span class="buffs-panel__hint">{allUnlocked.length}/{bonfireData.length} unlocked</span>
      </div>
      <div class="buffs-panel__buff-list">
        {bonfireData.map((b, i) => {
          const active = heat >= b.heatRequired;
          return (
            <div key={i} class={`buffs-panel__buff ${active ? 'buffs-panel__buff--active' : ''}`}>
              <span class="buffs-panel__buff-heat">{b.heatRequired}</span>
              <span class="buffs-panel__buff-name">{b.bonus}</span>
              {b.stat && <span class="buffs-panel__buff-value">{b.effect}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Equipped Runes Panel ──

function EquippedRunesPanel() {
  const profile = activeProfile.value;
  const equipped = profile.equippedRunes || [];
  const [adding, setAdding] = useState(false);

  const addRune = useCallback((runeName) => {
    const updated = [...(profile.equippedRunes || []), runeName];
    updateProfile('equippedRunes', updated);
    setAdding(false);
  }, [profile]);

  const removeRune = useCallback((index) => {
    const updated = [...(profile.equippedRunes || [])];
    updated.splice(index, 1);
    updateProfile('equippedRunes', updated);
  }, [profile]);

  // Check active rune words
  const activeWords = [];
  for (const word of runesData.runeWords) {
    const avail = [...equipped];
    let match = true;
    for (const rune of word.runes) {
      const idx = avail.indexOf(rune);
      if (idx === -1) { match = false; break; }
      avail.splice(idx, 1);
    }
    if (match) {
      activeWords.push(word);
    }
  }

  return (
    <div class="buffs-panel">
      <div class="buffs-panel__title">Equipped Runes</div>
      <div class="rune-equip__slots">
        {equipped.map((rune, i) => (
          <span key={i} class="rune-equip__chip" onClick={() => removeRune(i)}>
            {rune} <span class="rune-equip__remove">x</span>
          </span>
        ))}
        {equipped.length < 6 && (
          adding ? (
            <select
              class="rune-equip__select"
              onChange={(e) => { if (e.target.value) addRune(e.target.value); }}
              autoFocus
              onBlur={() => setAdding(false)}
            >
              <option value="">Select rune...</option>
              {ALL_RUNE_NAMES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          ) : (
            <button class="rune-equip__add-btn" onClick={() => setAdding(true)}>+ Add Rune</button>
          )
        )}
      </div>
      {activeWords.length > 0 && (
        <div class="rune-equip__words">
          {activeWords.map((w, i) => (
            <div key={i} class="rune-equip__word-active">
              Rune Word: {w.runes.join(' + ')} — {Object.entries(w.bonuses).map(([k, v]) => `${k}: ${v}`).join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Card Overview Panel ──

function CardOverviewPanel() {
  const profile = activeProfile.value;
  const cards = profile.cards || {};

  const renderCardRow = (card, thresholds, label) => {
    const key = card.enemy || card.resource || card.name;
    const count = cards[key] || 0;
    const tier = count > 0 ? getCardTier(count, thresholds) : -1;
    const tierLabel = tier >= 0 ? `T${tier + 1}` : '-';
    const maxTier = thresholds.length;
    const nextThreshold = tier < maxTier - 1 ? thresholds[tier + 1] : null;

    return (
      <div key={key} class={`card-row ${tier >= 0 ? 'card-row--active' : ''}`}>
        <span class="card-row__name">{key}</span>
        <span class="card-row__count">{count}</span>
        <span class={`card-row__tier card-row__tier--${tier + 1}`}>{tierLabel}</span>
        {nextThreshold && <span class="card-row__next">{nextThreshold - count} to T{tier + 2}</span>}
      </div>
    );
  };

  // Only show cards the player has
  const ownedCards = [];
  const addSection = (cardList, thresholds, sectionLabel) => {
    const owned = cardList.filter(c => {
      const key = c.enemy || c.resource || c.name;
      return (cards[key] || 0) > 0;
    });
    if (owned.length > 0) {
      ownedCards.push({ label: sectionLabel, cards: owned, thresholds });
    }
  };

  addSection(cardsData.act1Cards || [], cardsData.tierThresholds.act1, 'Act 1');
  addSection(cardsData.act2Cards || [], cardsData.tierThresholds.act2, 'Act 2');
  addSection(cardsData.act3Cards || [], cardsData.tierThresholds.act3, 'Act 3');

  return (
    <div class="buffs-panel">
      <div class="buffs-panel__title">Card Bonuses</div>
      {ownedCards.length === 0 ? (
        <div class="buffs-panel__empty">No cards loaded. Import a save file to see card progress.</div>
      ) : (
        ownedCards.map(section => (
          <div key={section.label} class="card-section">
            <div class="card-section__label">{section.label}</div>
            {section.cards.map(c => renderCardRow(c, section.thresholds, section.label))}
          </div>
        ))
      )}
    </div>
  );
}

// ── Active Pet Panel ──

/** Compute pet global bonus at a given level */
function petBonusAtLevel(pet, level) {
  if (!pet || !pet.globalBonus || !pet.globalBonus.level50) return null;
  const value = pet.globalBonus.level50 * (0.189 + 0.0162 * level);
  return { stat: pet.globalBonus.stat, value: Math.round(value * 10) / 10, isPercent: pet.globalBonus.isPercent };
}

const STAT_LABELS = {
  atk: 'ATK', hp: 'HP', def: 'DEF', atkSpeed: 'ATK Speed', critChance: 'Crit Chance',
  critDamage: 'Crit DMG', magicFind: 'Magic Find', goldMulti: 'Gold Multi', xpMulti: 'XP Multi',
  moveSpeed: 'Move Speed', offlineGains: 'Offline Gains', miningPower: 'Mining Pwr',
  wcPower: 'WC Pwr', physDef: 'Phys DEF', accuracy: 'Accuracy', mobSpawn: 'Mob Spawn',
  allXp: 'All XP',
};

function ActivePetPanel() {
  const profile = activeProfile.value;
  const petName = typeof profile.activePet === 'string' ? profile.activePet :
                  (profile.activePet ? profile.activePet.name : '');
  const petLevel = typeof profile.activePet === 'object' && profile.activePet ? profile.activePet.level || 1 : (profile.petLevel || 1);

  const activePetData = petName ? petsData.find(p => p.name === petName) : null;
  const bonus = activePetData ? petBonusAtLevel(activePetData, petLevel) : null;

  const setPet = (name) => {
    if (!name) {
      updateProfile('activePet', null);
    } else {
      updateProfile('activePet', { name, level: petLevel });
    }
  };

  const setLevel = (lvl) => {
    const clamped = Math.max(1, Math.min(50, lvl));
    if (petName) {
      updateProfile('activePet', { name: petName, level: clamped });
    }
    updateProfile('petLevel', clamped);
  };

  return (
    <div class="buffs-panel">
      <div class="buffs-panel__title">Active Pet</div>
      <div class="buffs-panel__input-row">
        <select
          class="buffs-panel__number-input"
          style="width: auto; min-width: 140px;"
          value={petName}
          onChange={(e) => setPet(e.target.value)}
        >
          <option value="">None</option>
          {petsData.filter(p => !p.sacrificeOnly).map(p => (
            <option key={p.name} value={p.name}>{p.name} ({p.rarity})</option>
          ))}
        </select>
        {petName && (
          <label class="buffs-panel__input-row" style="gap: 4px;">
            Lv.
            <input
              type="number"
              min="1"
              max="50"
              value={petLevel}
              class="buffs-panel__number-input"
              style="width: 60px;"
              onInput={(e) => setLevel(parseInt(e.target.value) || 1)}
            />
          </label>
        )}
      </div>
      {bonus && (
        <div class="rune-equip__word-active" style="margin-top: 6px;">
          Global: {STAT_LABELS[bonus.stat] || bonus.stat} +{bonus.value}{bonus.isPercent ? '%' : ''}
        </div>
      )}
      {activePetData && (
        <div class="buffs-panel__hint" style="margin-top: 4px;">
          Stats: {activePetData.stats.map(s => STAT_LABELS[s] || s).join(', ')}
        </div>
      )}
    </div>
  );
}

// ── Boss Readiness Panel ──

/**
 * Build a flat list of all bosses across acts, in order, with positional labels.
 */
// Short keys used in profile.defeatedBosses (must match save-decoder's BOSS_SCENE_PATTERNS keys).
const BOSS_DEFEATED_KEY = {
  'Ice Mammoth': 'Mammoth',
  'Yrsainir (Fire Elemental)': 'Yrsainir',
};

function buildBossList() {
  const list = [];
  let actNum = 0;
  for (const actData of Object.values(enemies)) {
    actNum++;
    const bosses = actData.bosses || [];
    bosses.forEach((boss, idx) => {
      list.push({
        id: BOSS_DEFEATED_KEY[boss.name] || boss.name,
        name: boss.name,
        act: actNum,
        subtitle: `Act ${actNum} Boss ${idx + 1}`,
        hp: boss.hp,
        atk: boss.atk || 0,
        evasion: boss.evasion || 0,
        accuracy: boss.accuracy || 0,
      });
    });
  }
  return list;
}

const BOSS_LIST = buildBossList();

// Approximate difficulty multipliers per spreadsheet "Base material Drop X16" + observed
// monster HP/ATK ranges. Refine when in-game data is available.
const DIFFICULTY_MULTIPLIERS = {
  0: { name: 'Normal', hp: 1, atk: 1 },
  1: { name: 'Hard', hp: 16, atk: 16 },
  2: { name: 'Nightmare', hp: 64, atk: 32 },  // unconfirmed
  3: { name: 'Hell', hp: 256, atk: 64 },      // unconfirmed
};

function applyDifficulty(enemy, difficulty) {
  const m = DIFFICULTY_MULTIPLIERS[difficulty];
  if (!m || difficulty === 0) return enemy;
  return {
    ...enemy,
    hp: enemy.hp * m.hp,
    atk: (enemy.atk || 0) * m.atk,
  };
}

function fmtTime(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '\u2014';
  if (seconds < 60) return seconds.toFixed(0) + 's';
  if (seconds < 3600) return (seconds / 60).toFixed(1) + 'm';
  return (seconds / 3600).toFixed(1) + 'h';
}

const BOSS_READY_TTK_SECONDS = 300;

function BossReadinessPanel() {
  const profile = activeProfile.value;
  const stats = computeStats(profile);
  const defeated = profile.defeatedBosses || [];
  const actDifficulty = profile.actDifficulty || {};

  return (
    <div class="buffs-panel boss-readiness">
      <div class="buffs-panel__title">Boss Readiness</div>
      <div class="boss-readiness__list">
        {BOSS_LIST.map((boss) => {
          const difficulty = actDifficulty[boss.act] || 0;
          const scaled = applyDifficulty(boss, difficulty);
          const diffName = DIFFICULTY_MULTIPLIERS[difficulty]?.name || 'Normal';
          const isDefeated = defeated.includes(boss.id);
          const dps = computeEffectiveDPS(stats, scaled);
          const ttk = dps > 0 ? scaled.hp / dps : Infinity;
          const isReady = isFinite(ttk) && ttk <= BOSS_READY_TTK_SECONDS;
          const statusClass = isDefeated
            ? 'boss-readiness__status--defeated'
            : isReady
              ? 'boss-readiness__status--ready'
              : 'boss-readiness__status--not-ready';
          const icon = isDefeated ? '\u2605' : isReady ? '\u2713' : '\u2717';
          const ttkLabel = fmtTime(ttk);
          const label = isDefeated ? `Killed \u00b7 ${ttkLabel}` : ttkLabel;
          const subtitle = difficulty > 0 ? `${boss.subtitle} \u00b7 ${diffName}` : boss.subtitle;

          return (
            <div key={boss.id} class={`boss-readiness__row ${statusClass}`}>
              <span class="boss-readiness__icon">{icon}</span>
              <div class="boss-readiness__info">
                <span class="boss-readiness__name">{boss.name}</span>
                <span class="boss-readiness__subtitle">{subtitle}</span>
              </div>
              <span class="boss-readiness__label">{label}</span>
            </div>
          );
        })}
      </div>
      <div class="buffs-panel__hint" style="margin-top: 6px;">
        TTK = boss HP ÷ effective DPS. Ready ≤ 5min. Hard mode scales HP/ATK ×16 (approx).
      </div>
    </div>
  );
}

// ── Daily Reminders ──

/** Count how many Crystalized Yellow Substance all recipes for the player's class need. */
function getYellowSubstanceNeeds(profile) {
  const playerClass = (profile.class || '').toLowerCase();
  const ys = dropsData.resources['Yellow Substance'];
  if (!ys) return null;

  // Map class to weapon type
  const classWeapon = {
    warrior: 'Thorium Sword',
    ranger: 'Thorium Bow',
    mage: 'Thorium Staff',
    berserker: 'Thorium Longsword',
  };

  // Thorium armor pieces everyone needs + class weapon
  const relevantRecipes = ['Thorium Boots', 'Thorium Gloves', 'Thorium Helmet', 'Thorium Chestplate'];
  const weapon = classWeapon[playerClass];
  if (weapon) relevantRecipes.push(weapon);

  // Also add tools
  relevantRecipes.push('Thorium Pickaxe', 'Thorium Axe');

  let totalCrystalized = 0;
  const act2Recipes = recipesData['Act 2'] || {};
  for (const name of relevantRecipes) {
    const recipe = act2Recipes[name];
    if (!recipe) continue;
    const cys = recipe.ingredients.find(i => i.name === 'Crystalized Yellow Substance');
    if (cys) totalCrystalized += cys.qty;
  }

  // Each Crystalized Yellow Substance costs 1 Yellow Substance (enhancement recipe)
  const totalYS = totalCrystalized;
  const dailyLimit = ys.dailyLimit;
  const costPerUnit = ys.cost;
  const dailyCost = dailyLimit * costPerUnit;
  const daysNeeded = Math.ceil(totalYS / dailyLimit);

  return { totalYS, dailyLimit, costPerUnit, dailyCost, daysNeeded };
}

// Vendor items grouped by act. Pulled from drops.json (vendor:true entries
// tagged with `act`); item ordering is the in-game shop order.
const VENDOR_ITEMS_BY_ACT = {
  1: ['Solid Fuel', 'Enhance Stone 1'],
  2: ['Crystalized Yellow Substance', 'Enhance Stone 2'],
  3: ['Crystallized Blue Substance', 'Enhance Stone 3'],
};

// Per-act max bonus stock from Engineer upgrades:
//   Act 1: Vendor Stock (idea) +3 + Vendor Stock (blueprint) +3 = +6
//   Act 2: Vendor Stock (runic_blueprint) +3
//   Act 3: Vendor Stock (sun_scroll) +3
const VENDOR_BONUS_CAP = { 1: 6, 2: 3, 3: 3 };

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

function VendorPurchases() {
  const profile = activeProfile.value;
  if (!activeProfileKey.value) return null;

  const today = todayStr();
  const checks = profile.dailyVendorChecks?.date === today
    ? (profile.dailyVendorChecks.items || {})
    : {};
  const bonus = profile.engineerVendorBonus || {};

  const setBonus = useCallback((act, raw) => {
    const n = Math.max(0, Math.min(VENDOR_BONUS_CAP[act], Math.floor(Number(raw) || 0)));
    saveProfile(activeProfileKey.value, {
      ...profile,
      engineerVendorBonus: { ...bonus, [act]: n },
    });
  }, [profile]);

  const setOverride = useCallback((item, field, raw) => {
    // Persist user-observed daily limit / gold cost into the profile so the
    // numbers stick even if drops.json doesn't have them yet.
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    const overrides = { ...(profile.vendorOverrides || {}) };
    overrides[item] = { ...(overrides[item] || {}), [field]: n || null };
    saveProfile(activeProfileKey.value, { ...profile, vendorOverrides: overrides });
  }, [profile]);

  const toggleCheck = useCallback((item) => {
    const next = !checks[item];
    const items = { ...checks, [item]: next };
    saveProfile(activeProfileKey.value, {
      ...profile,
      dailyVendorChecks: { date: today, items },
    });
  }, [profile, checks]);

  const clearAll = useCallback(() => {
    saveProfile(activeProfileKey.value, {
      ...profile,
      dailyVendorChecks: { date: today, items: {} },
    });
  }, [profile]);

  function rowFor(item, act) {
    const drop = dropsData.resources[item] || {};
    const override = profile.vendorOverrides?.[item] || {};
    const baseLimit = override.dailyLimit ?? drop.dailyLimit ?? null;
    const cost = override.cost ?? drop.cost ?? null;
    const total = baseLimit != null ? baseLimit + (bonus[act] || 0) : null;
    const totalGold = total != null && cost != null ? total * cost : null;
    const checked = !!checks[item];
    return (
      <div key={item} class={`vendor-purchases__row ${checked ? 'vendor-purchases__row--done' : ''}`}>
        <input type="checkbox" checked={checked} onChange={() => toggleCheck(item)} />
        <span class="vendor-purchases__label">
          {total != null ? `Buy ${total}` : 'Buy ?'} {item}
          {totalGold != null && <span class="vendor-purchases__cost"> ({fmt(totalGold)} gold)</span>}
        </span>
        <span class="vendor-purchases__edits">
          /day:&nbsp;
          <input
            type="number" min="0" class="vendor-purchases__num"
            defaultValue={baseLimit ?? ''} placeholder="?"
            onBlur={(e) => setOverride(item, 'dailyLimit', e.target.value)}
            key={`${item}:limit:${baseLimit}`}
          />
          gold:&nbsp;
          <input
            type="number" min="0" class="vendor-purchases__num"
            defaultValue={cost ?? ''} placeholder="?"
            onBlur={(e) => setOverride(item, 'cost', e.target.value)}
            key={`${item}:cost:${cost}`}
          />
        </span>
      </div>
    );
  }

  return (
    <div class="vendor-purchases">
      <div class="vendor-purchases__header">
        <span class="vendor-purchases__title">Daily Vendor Purchases</span>
        <button class="vendor-purchases__reset" onClick={clearAll} title="Clear today's checks">↺ reset</button>
      </div>
      {[1, 2, 3].map((act) => (
        <div key={act} class="vendor-purchases__act">
          <div class="vendor-purchases__act-header">
            <span class="vendor-purchases__act-title">Act {act} Vendor</span>
            <span class="vendor-purchases__bonus-control">
              Engineer +stock:&nbsp;
              <input
                type="number" min="0" max={VENDOR_BONUS_CAP[act]} class="vendor-purchases__num"
                defaultValue={bonus[act] || 0}
                onBlur={(e) => setBonus(act, e.target.value)}
                key={`bonus:${act}:${bonus[act] || 0}`}
              />
              <span class="vendor-purchases__bonus-cap">/{VENDOR_BONUS_CAP[act]}</span>
            </span>
          </div>
          {VENDOR_ITEMS_BY_ACT[act].map(item => rowFor(item, act))}
        </div>
      ))}
      <div class="vendor-purchases__hint">
        Engineer +stock auto-fills once we map your save's slot-upgrade GUIDs to upgrade names. For now type your <code>Vendor Stock</code> rank manually (max +6 Act 1 from idea + blueprint slots, +3 Acts 2/3).
      </div>
    </div>
  );
}

// ── Main Dashboard ──

export function Dashboard() {
  const profile = activeProfile.value;
  const stats = computeStats(profile);

  const enemy = findEnemy(profile.currentZone);

  const edps = computeEffectiveDPS(stats, enemy);
  const ehp = computeEffectiveHP(stats, enemy);
  const rates = profile.farmingRates;

  return (
    <div class="dashboard">
      <div class="dashboard__grid">
        <StatCard title="Power Summary" accent="red" items={[
          { label: 'Offensive Power', value: fmt(edps), color: 'red' },
          { label: 'Defensive Power', value: fmt(ehp), color: 'blue' },
          { label: 'Effective DPS', value: fmt(edps) + '/s', color: 'orange' },
          { label: 'Total ATK', value: fmt(stats.totalAtk || stats.atk) },
        ]} />
        <StatCard title={`Farming Rates (${profile.currentZone})`} accent="green" items={[
          { label: 'Kills/Hour', value: fmt(rates.killsPerHour) },
          { label: 'XP/Hour', value: fmt(rates.xpPerHour), color: 'blue' },
          { label: 'Gold/Hour', value: fmt(rates.goldPerHour), color: 'yellow' },
        ]} />
        <StatCard title="Character Info" accent="purple" items={[
          { label: 'Name', value: profile.name },
          { label: 'Class', value: profile.class },
          { label: 'Level', value: String(profile.level) },
          { label: 'Zone', value: profile.currentZone },
        ]} />
      </div>

      <div class="dashboard__buffs">
        <BonfirePanel />
        <EquippedRunesPanel />
        <ActivePetPanel />
      </div>

      <div class="dashboard__buffs" style="margin-top: 0;">
        <BossReadinessPanel />
        <VendorPurchases />
      </div>

      <div class="dashboard__buffs" style="margin-top: 0;">
        <CardOverviewPanel />
      </div>
    </div>
  );
}
