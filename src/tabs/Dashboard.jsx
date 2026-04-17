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

const BOSS_THRESHOLDS = [
  { id: 'Mammoth', name: 'Ice Mammoth', subtitle: 'Act 2 Boss 1', killsPerHour: 500 },
  { id: 'Jotunn', name: 'Jotunn', subtitle: 'Act 2 Boss 2', killsPerHour: 1000 },
  { id: 'Maevath', name: 'Maevath / Blue Dragon', subtitle: 'Act 2 Boss 3', killsPerHour: 1000 },
];

function BossReadinessPanel() {
  const profile = activeProfile.value;
  const kph = profile.farmingRates?.killsPerHour || 0;
  const defeated = profile.defeatedBosses || [];

  return (
    <div class="buffs-panel boss-readiness">
      <div class="buffs-panel__title">Boss Readiness</div>
      <div class="boss-readiness__list">
        {BOSS_THRESHOLDS.map((boss) => {
          const isDefeated = defeated.includes(boss.id);
          const isReady = kph >= boss.killsPerHour;
          const statusClass = isDefeated
            ? 'boss-readiness__status--defeated'
            : isReady
              ? 'boss-readiness__status--ready'
              : 'boss-readiness__status--not-ready';
          const icon = isDefeated ? '\u2605' : isReady ? '\u2713' : '\u2717';
          const label = isDefeated ? 'Defeated' : isReady ? 'Ready' : `Need ${fmt(boss.killsPerHour)} k/hr`;

          return (
            <div key={boss.id} class={`boss-readiness__row ${statusClass}`}>
              <span class="boss-readiness__icon">{icon}</span>
              <div class="boss-readiness__info">
                <span class="boss-readiness__name">{boss.name}</span>
                <span class="boss-readiness__subtitle">{boss.subtitle}</span>
              </div>
              <span class="boss-readiness__label">{label}</span>
            </div>
          );
        })}
      </div>
      <div class="buffs-panel__hint" style="margin-top: 6px;">
        Current: {fmt(kph)} kills/hr
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

function DailyReminders() {
  const profile = activeProfile.value;
  const ys = dropsData.resources['Yellow Substance'];
  if (!ys || !ys.vendor) return null;

  const needs = getYellowSubstanceNeeds(profile);

  return (
    <div class="daily-reminders">
      <div class="daily-reminders__title">Daily Tasks</div>
      <div class="daily-reminders__item">
        <span class="daily-reminders__label">
          Buy {ys.dailyLimit} Yellow Substance ({fmt(ys.dailyLimit * ys.cost)} gold)
        </span>
        <span class="daily-reminders__source">Act 2 Vendor</span>
      </div>
      {needs && needs.daysNeeded > 0 && (
        <div class="daily-reminders__detail">
          {needs.totalYS} needed for Thorium gear — {needs.daysNeeded} day{needs.daysNeeded !== 1 ? 's' : ''} of purchases
        </div>
      )}
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
        <DailyReminders />
      </div>

      <div class="dashboard__buffs" style="margin-top: 0;">
        <CardOverviewPanel />
      </div>
    </div>
  );
}
