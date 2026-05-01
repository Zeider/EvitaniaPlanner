import { activeProfile, activeProfileKey } from '../state/store.js';

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

function SlotCard({ slot, isSelected }) {
  const upgradeEntries = Object.entries(slot.upgrades);
  const totalRanks = upgradeEntries.reduce((sum, [, level]) => sum + level, 0);
  return (
    <div class={`engineer__slot ${slot.enabled ? '' : 'engineer__slot--disabled'} ${slot.stalled ? 'engineer__slot--stalled' : ''} ${isSelected ? 'engineer__slot--selected' : ''}`}>
      <div class="engineer__slot-header">
        <span class="engineer__slot-index">Slot {slot.index + 1}</span>
        <span class="engineer__slot-state">
          {!slot.enabled ? 'disabled' : slot.stalled ? 'stalled' : 'active'}
          {isSelected && <span class="engineer__slot-marker"> · selected</span>}
        </span>
      </div>
      <div class="engineer__slot-meta">Last produced: {fmtRelative(slot.lastProduced)}</div>
      <div class="engineer__slot-upgrades">
        {upgradeEntries.length === 0 ? (
          <span class="engineer__empty">No upgrades.</span>
        ) : (
          <>
            <div class="engineer__slot-upgrades-summary">
              {upgradeEntries.length} categor{upgradeEntries.length === 1 ? 'y' : 'ies'} upgraded · {totalRanks} total ranks
            </div>
            <table class="engineer__upgrade-table">
              <thead>
                <tr><th scope="col">Upgrade GUID</th><th scope="col">Level</th></tr>
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
          </>
        )}
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
          Upgrade GUIDs and recipe outputs aren't yet mapped to names — observe in-game and add entries to a future <code>ENGINEER_UPGRADE_GUID_MAP</code> in <code>save-decoder.js</code> to surface them here.
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
