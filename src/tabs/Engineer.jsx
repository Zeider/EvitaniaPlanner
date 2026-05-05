import { useState } from 'preact/hooks';
import { activeProfile, activeProfileKey } from '../state/store.js';
import engineerUpgradesData from '../data/engineer-upgrades.json';

// .NET DateTime.ToBinary() with Kind=Local → JS Date. Top 2 bits encode Kind
// (10 = Local), low 62 bits are 100ns ticks since 0001-01-01. Number precision
// loss near 2^62 is negligible for the second-resolution display below.
const KIND_LOCAL_OFFSET = 4611686018427387904; // 2^62
const EPOCH_OFFSET_TICKS = 621355968000000000; // ticks at 1970-01-01 UTC
function dotNetLocalBinaryToMs(value) {
  if (!value) return null;
  return (value - KIND_LOCAL_OFFSET - EPOCH_OFFSET_TICKS) / 10000;
}

function fmtRelative(timestamp) {
  const ms = dotNetLocalBinaryToMs(timestamp);
  if (ms === null) return '—';
  const diffSec = (Date.now() - ms) / 1000;
  if (diffSec < 0) return 'in the future';
  if (diffSec < 60) return `${Math.round(diffSec)}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  return `${Math.round(diffSec / 86400)}d ago`;
}

function shortGuid(guid) {
  return guid ? guid.slice(0, 8) : '';
}

// Index slots and upgrades from our catalog by slot number for fast lookup.
const CATALOG_BY_SLOT = (() => {
  const m = {};
  for (const slot of engineerUpgradesData.slots) m[slot.index] = { meta: slot, upgrades: [] };
  for (const u of engineerUpgradesData.upgrades) {
    (m[u.slot] ||= { meta: { produces: '?' }, upgrades: [] }).upgrades.push(u);
  }
  return m;
})();

function fmtCost(u) {
  if (!u.costs?.length) return '—';
  if (u.costs.length === 1) return `${u.costs[0].toLocaleString()}`;
  if (u.costs.length <= 5) return u.costs.map(c => c.toLocaleString()).join(' / ');
  // Long progression — show first 3 and last
  const first = u.costs.slice(0, 3).map(c => c.toLocaleString()).join(' / ');
  const last = u.costs[u.costs.length - 1].toLocaleString();
  return `${first} … ${last}`;
}

function fmtEffect(u) {
  if (!u.unit) return u.effect;
  const sign = u.perLevel >= 0 ? '+' : '';
  const valFmt = u.unit === 'percent' ? `${sign}${u.perLevel}%/lvl` : `${sign}${u.perLevel}/lvl`;
  return `${u.effect} (${valFmt}, max ${u.maxLevel})`;
}

function CatalogTable({ upgrades }) {
  return (
    <table class="engineer__catalog-table">
      <thead>
        <tr>
          <th scope="col">Upgrade</th>
          <th scope="col">Effect</th>
          <th scope="col">Cost ({upgrades[0]?.costItem || '—'})</th>
        </tr>
      </thead>
      <tbody>
        {upgrades.map((u) => (
          <tr key={u.name}>
            <td>{u.name}</td>
            <td class="engineer__catalog-effect">{fmtEffect(u)}</td>
            <td class="engineer__catalog-cost">{fmtCost(u)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SlotCard({ slot, isSelected }) {
  const upgradeEntries = Object.entries(slot.upgrades);
  const totalRanks = upgradeEntries.reduce((sum, [, level]) => sum + level, 0);
  const slotIndex = slot.index + 1; // game-facing number
  const catalog = CATALOG_BY_SLOT[slotIndex] || { meta: { produces: '?' }, upgrades: [] };
  const [showCatalog, setShowCatalog] = useState(false);
  const stateLabel = !slot.enabled ? 'disabled' : slot.stalled ? 'stalled' : 'active';

  return (
    <div class={`engineer__slot ${slot.enabled ? '' : 'engineer__slot--disabled'} ${slot.stalled ? 'engineer__slot--stalled' : ''} ${isSelected ? 'engineer__slot--selected' : ''}`}>
      <div class="engineer__slot-header">
        <span class="engineer__slot-index">Slot {slotIndex}</span>
        <span class="engineer__slot-state">
          {stateLabel}
          {isSelected && <span class="engineer__slot-marker"> · selected</span>}
        </span>
      </div>
      <div class="engineer__slot-produces">
        Produces <strong>{catalog.meta.produces}</strong> · {catalog.upgrades.length} upgrades available
      </div>
      <div class="engineer__slot-meta">Last produced: {fmtRelative(slot.lastProduced)}</div>

      <div class="engineer__slot-upgrades">
        <div class="engineer__slot-upgrades-summary">
          {upgradeEntries.length === 0
            ? 'No upgrades invested yet.'
            : `${upgradeEntries.length} of ${catalog.upgrades.length} upgrades invested · ${totalRanks} total ranks`}
        </div>
        {upgradeEntries.length > 0 && (
          <table class="engineer__upgrade-table">
            <thead>
              <tr><th scope="col">Your invested GUID</th><th scope="col">Level</th></tr>
            </thead>
            <tbody>
              {upgradeEntries.map(([guid, level]) => (
                <tr key={guid}>
                  <td><code class="engineer__guid">{shortGuid(guid)}…</code></td>
                  <td>{level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button
          class="engineer__catalog-toggle"
          onClick={() => setShowCatalog((v) => !v)}
        >
          {showCatalog ? '▾ Hide catalog' : `▸ Show all ${catalog.upgrades.length} upgrades`}
        </button>
        {showCatalog && <CatalogTable upgrades={catalog.upgrades} />}
      </div>
    </div>
  );
}

export function Engineer() {
  const profile = activeProfile.value;

  if (!activeProfileKey.value) {
    return (
      <div class="engineer">
        <p class="engineer__empty">Import a save file or create a profile to view Engineer state.</p>
      </div>
    );
  }

  const eng = profile.engineer;
  if (!eng) {
    return (
      <div class="engineer">
        <p class="engineer__empty">
          No Engineer data on this profile. The Engineer is an Act 2 mechanic introduced in patch 0.310.0 — re-import a save from a patched client to populate this tab.
        </p>
      </div>
    );
  }

  const stockpileEntries = Object.entries(eng.stockpile);
  const slotUpgradeLevel = eng.enhancements?.engineer_slot_upgrade ?? 0;

  return (
    <div class="engineer">
      <section class="engineer__summary">
        <div>
          <strong>{eng.slots.filter((s) => s.enabled).length}/{eng.slots.length}</strong> slots enabled
          {' · '}
          Gem-shop slot upgrade rank: <strong>{slotUpgradeLevel}</strong>
        </div>
        <div class="engineer__hint">
          Each slot produces a different item (Idea / Blueprint / Runic Blueprint / Sun Scroll) and has its own upgrade tree. Click "Show all upgrades" on a slot to see what's available; your invested GUIDs are listed separately. Once we map GUIDs to upgrade names, both columns will resolve to readable rows.
        </div>
      </section>

      <section class="engineer__slots">
        {eng.slots.map((slot) => (
          <SlotCard key={slot.index} slot={slot} isSelected={slot.index === eng.lastSelectedSlot} />
        ))}
      </section>

      <section class="engineer__stockpile">
        <h2 class="engineer__panel-title">Stockpile</h2>
        {stockpileEntries.length === 0 ? (
          <p class="engineer__empty">Stockpile is empty.</p>
        ) : (
          <table class="engineer__stockpile-table">
            <thead>
              <tr><th scope="col">Item GUID</th><th scope="col">Count</th></tr>
            </thead>
            <tbody>
              {stockpileEntries.map(([guid, count]) => (
                <tr key={guid}>
                  <td><code class="engineer__guid">{guid}</code></td>
                  <td>{count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
