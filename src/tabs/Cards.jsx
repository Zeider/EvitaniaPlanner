import { activeProfile, cardOverrides, setCardOverride, clearAllCardOverrides } from '../state/store.js';
import { computeStats, computeEffectiveDPS, computeFarmingRates } from '../state/stat-engine.js';
import enemies from '../data/enemies.json';
import cardsData from '../data/cards.json';

const STAT_LABELS = {
  hp: 'HP',
  mana: 'Mana',
  hpRegen: 'HP Regen',
  atk: 'ATK',
  atkPercent: 'Attack',
  critChance: 'Crit Chance',
  critDamage: 'Crit Damage',
  physDef: 'Phys Defence',
  miningPower: 'Mining Power',
  wcPower: 'Woodcutting Power',
  miningXp: 'Mining XP',
  wcXp: 'Woodcutting XP',
  miningMultiloot: 'Mining Multiloot',
  wcMultiloot: 'Wc Multiloot',
  miningOffline: 'Mining Offline',
  wcOffline: 'Wc Offline',
  combatXp: 'Combat XP',
  combatOffline: 'Combat Offline',
  offlineGains: 'Offline Gains',
  goldMulti: 'Gold Multiplier',
  magicFind: 'Magic Find',
  smelterySpeed: 'Smeltery Speed',
  fuelCapacity: 'Fuel Capacity',
  fuelEfficiency: 'Fuel Efficiency',
  ashDiscount: 'Ash Discount',
  hunterCost: 'Hunter Cost',
  hunterMaxRank: 'Hunter Max Rank',
  sacrificeMaxRank: 'Sacrifice Max Rank',
  accuracy: 'Accuracy',
  unknown: '?',
};

function statLabel(stat) {
  return STAT_LABELS[stat] || stat;
}

function formatTierValue(value, card) {
  if (value == null) return '?';
  if (card.isMultiplier) return `x${value}`;
  if (card.isPercent) return `+${value}%`;
  return `+${value}`;
}

function formatProgression(card) {
  return card.tierValues.map((v) => formatTierValue(v, card)).join(' / ');
}

function tierOf(count, thresholds) {
  let tier = -1;
  for (let i = 0; i < thresholds.length; i++) {
    if (count >= thresholds[i]) tier = i;
    else break;
  }
  return tier;
}

function fmtCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(0);
}

function fmtDuration(hours) {
  if (!isFinite(hours) || hours <= 0) return '—';
  const seconds = hours * 3600;
  if (seconds < 60) return seconds.toFixed(0) + 's';
  if (seconds < 3600) return (seconds / 60).toFixed(0) + 'm';
  if (hours < 24) return hours.toFixed(1) + 'h';
  return (hours / 24).toFixed(1) + 'd';
}

function findEnemy(zoneId) {
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    const m = act.zones.find((e) => e.zone === zoneId);
    if (m) return m;
  }
  return null;
}

function findBoss(name) {
  for (const act of Object.values(enemies)) {
    for (const b of (act.bosses || [])) {
      if (b.name === name || b.name.startsWith(name)) return b;
    }
  }
  return null;
}

/** Estimate cards-per-hour for a zone card. Returns 0 if zone not in enemies.json. */
function cardsPerHour(card, stats) {
  const dropRate = card.dropRate || 0;
  if (dropRate <= 0) return 0;

  let enemy = null;
  if (card.zone === 'boss') {
    enemy = findBoss(card.enemy);
  } else {
    enemy = findEnemy(card.zone);
  }
  if (!enemy) return 0;

  const dps = computeEffectiveDPS(stats, enemy);
  const rates = computeFarmingRates(Math.max(dps, 0.01), enemy, stats);
  const kph = rates.killsPerHour || 0;
  return kph / dropRate;
}

function timeToNextTier(card, count, thresholds, stats) {
  const tier = tierOf(count, thresholds);
  if (tier >= thresholds.length - 1) return null; // already maxed
  const nextThreshold = thresholds[tier + 1];
  const cardsRemaining = nextThreshold - count;
  const cph = cardsPerHour(card, stats);
  if (cph <= 0) return null;
  return cardsRemaining / cph;
}

function CardRow({ card, importedCount, overrides, thresholds, stats }) {
  const name = card.enemy || card.resource || card.name;
  const displayName = card.displayName || name;
  const isOverridden = overrides[name] != null;
  const count = isOverridden ? overrides[name] : importedCount;
  const tier = tierOf(count, thresholds);
  const tierLabel = tier >= 0 ? `T${tier + 1}` : '—';
  const activeBonus = tier >= 0 ? formatTierValue(card.tierValues[tier], card) : '—';
  const stat = statLabel(card.stat);
  const cph = cardsPerHour(card, stats);
  const ttn = timeToNextTier(card, count, thresholds, stats);
  const ttnLabel = ttn != null ? fmtDuration(ttn) : (tier >= thresholds.length - 1 ? '★ Max' : '—');
  const cphLabel = cph > 0 ? fmtCount(cph) + '/hr' : '—';
  const zone = card.zone === 'boss' ? `boss · ${card.bossZone || ''}` : (card.zone || '—');

  const onCountChange = (e) => {
    const v = e.target.value.trim();
    setCardOverride(name, v === '' ? null : v);
  };

  return (
    <tr class={tier >= 0 ? 'cards-tab__row cards-tab__row--active' : 'cards-tab__row'}>
      <td class="cards-tab__name">{displayName}</td>
      <td class="cards-tab__zone">{zone}</td>
      <td class="cards-tab__stat">{stat}</td>
      <td class="cards-tab__bonus">{activeBonus}</td>
      <td class="cards-tab__progression">{formatProgression(card)}</td>
      <td class="cards-tab__count">
        <input
          type="number"
          min="0"
          class={`cards-tab__count-input ${isOverridden ? 'cards-tab__count-input--overridden' : ''}`}
          value={count}
          onInput={onCountChange}
          title={isOverridden ? `Override (save value: ${importedCount})` : 'Click to override'}
        />
      </td>
      <td class={`cards-tab__tier cards-tab__tier--${tier + 1}`}>{tierLabel}</td>
      <td class="cards-tab__cph">{cphLabel}</td>
      <td class="cards-tab__ttn">{ttnLabel}</td>
    </tr>
  );
}

function CardSection({ title, cards, thresholds, profileCards, overrides, stats }) {
  if (!cards || cards.length === 0) return null;
  return (
    <section class="cards-tab__section">
      <h3 class="cards-tab__section-title">{title}</h3>
      <div class="cards-tab__table-wrap">
        <table class="cards-tab__table">
          <thead>
            <tr>
              <th>Card</th>
              <th>Zone</th>
              <th>Stat</th>
              <th>Active</th>
              <th>Tier Values</th>
              <th>Count</th>
              <th>Tier</th>
              <th>Cards/hr</th>
              <th>To Next</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => {
              const key = c.enemy || c.resource || c.name;
              return (
                <CardRow
                  key={key}
                  card={c}
                  importedCount={profileCards[key] || 0}
                  overrides={overrides}
                  thresholds={thresholds}
                  stats={stats}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Cards() {
  const profile = activeProfile.value;
  const stats = computeStats(profile);
  const profileCards = profile.cards || {};
  const overrides = cardOverrides.value;
  const t = cardsData.tierThresholds;
  const overrideCount = Object.keys(overrides).length;

  return (
    <div class="cards-tab">
      <div class="cards-tab__intro">
        <div>
          Each card grants a stat bonus that scales by tier. Cards/hr estimated from your effective DPS at the drop zone.
          Boss-card rates assume keyless farming kill rate; in practice 3 keys/day caps boss kills.
        </div>
        <div style="margin-top: 8px; font-size: 0.78rem;">
          Save imports often miss cards (server-side data). <strong>Click any count to override</strong> — your edits persist locally and win over imports.
          {overrideCount > 0 && (
            <>
              {' '}<span style="color: #fa0;">({overrideCount} override{overrideCount > 1 ? 's' : ''} active)</span>
              {' '}
              <button class="cards-tab__clear-btn" onClick={clearAllCardOverrides}>Clear all</button>
            </>
          )}
        </div>
      </div>

      <CardSection
        title="Act 1"
        cards={cardsData.act1Cards}
        thresholds={t.act1}
        profileCards={profileCards}
        overrides={overrides}
        stats={stats}
      />
      <CardSection
        title="Act 2"
        cards={cardsData.act2Cards}
        thresholds={t.act2}
        profileCards={profileCards}
        overrides={overrides}
        stats={stats}
      />
      <CardSection
        title="Act 3"
        cards={cardsData.act3Cards}
        thresholds={t.act3}
        profileCards={profileCards}
        overrides={overrides}
        stats={stats}
      />

      <section class="cards-tab__section">
        <h3 class="cards-tab__section-title">Resource Cards</h3>
        <div class="cards-tab__table-wrap">
          <table class="cards-tab__table">
            <thead>
              <tr>
                <th>Card</th>
                <th>Zone</th>
                <th>Stat</th>
                <th>Active</th>
                <th>Tier Values</th>
                <th>Count</th>
                <th>Tier</th>
                <th>Cards/hr</th>
                <th>To Next</th>
              </tr>
            </thead>
            <tbody>
              {(cardsData.resourceCards || []).map((c) => {
                const key = c.resource;
                const thresholds = (t.resource && t.resource[c.thresholdKey]) || t.act1;
                return (
                  <CardRow
                    key={key}
                    card={c}
                    importedCount={profileCards[key] || 0}
                    overrides={overrides}
                    thresholds={thresholds}
                    stats={stats}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section class="cards-tab__section">
        <h3 class="cards-tab__section-title">Hard Mode Cards</h3>
        <div class="cards-tab__table-wrap">
          <table class="cards-tab__table">
            <thead>
              <tr>
                <th>Card</th>
                <th>Stat</th>
                <th>Active</th>
                <th>Tier Values</th>
                <th>Count</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {(cardsData.hardCards || []).map((c) => {
                const key = c.name;
                const importedCount = profileCards[key] || 0;
                const isOverridden = overrides[key] != null;
                const count = isOverridden ? overrides[key] : importedCount;
                const tier = tierOf(count, t.hard);
                const tierLabel = tier >= 0 ? `T${tier + 1}` : '—';
                const activeBonus = tier >= 0 ? formatTierValue(c.tierValues[tier], c) : '—';
                return (
                  <tr key={key} class={tier >= 0 ? 'cards-tab__row cards-tab__row--active' : 'cards-tab__row'}>
                    <td class="cards-tab__name">{key}</td>
                    <td class="cards-tab__stat">{statLabel(c.stat)}</td>
                    <td class="cards-tab__bonus">{activeBonus}</td>
                    <td class="cards-tab__progression">{formatProgression(c)}</td>
                    <td class="cards-tab__count">
                      <input
                        type="number"
                        min="0"
                        class={`cards-tab__count-input ${isOverridden ? 'cards-tab__count-input--overridden' : ''}`}
                        value={count}
                        onInput={(e) => setCardOverride(key, e.target.value.trim() === '' ? null : e.target.value.trim())}
                        title={isOverridden ? `Override (save value: ${importedCount})` : 'Click to override'}
                      />
                    </td>
                    <td class={`cards-tab__tier cards-tab__tier--${tier + 1}`}>{tierLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
