import { useMemo, useCallback, useState, useEffect } from 'preact/hooks';
import { activeProfile, activeProfileKey, saveProfile, migrateCraftingInventory } from '../state/store.js';
import { buildProgressionPlan } from '../state/progression-planner.js';
import recipesData from '../data/recipes.json';

/** Extract gear set tier names from recipes (e.g. "Copper", "Bronze", "Thorium", ...). */
function getAvailableSets() {
  const tiers = new Set();
  for (const category of Object.values(recipesData)) {
    for (const name of Object.keys(category)) {
      const match = name.match(/^(\w+)\s+(Helmet|Chestplate|Boots|Gloves)$/);
      if (match) tiers.add(match[1]);
    }
  }
  return Array.from(tiers);
}

/** Extract all gear piece recipe names (for single-piece targets). */
function getAvailablePieces() {
  const names = [];
  for (const category of Object.values(recipesData)) {
    for (const name of Object.keys(category)) {
      names.push(name);
    }
  }
  return names.sort();
}

function fmtHours(h) {
  if (!isFinite(h)) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)} hrs`;
  return `${(h / 24).toFixed(1)} days`;
}

export function Progression() {
  const profile = activeProfile.value;
  const plan = useMemo(() => buildProgressionPlan(profile), [profile]);

  const setTarget = useCallback((type, value) => {
    const next = type === 'none' ? null : { type, value };
    saveProfile(activeProfileKey.value, { ...profile, progressionTarget: next });
  }, [profile]);

  const sets = useMemo(() => getAvailableSets(), []);
  const pieces = useMemo(() => getAvailablePieces(), []);
  const target = profile.progressionTarget;

  const sortedMaterials = useMemo(
    () => [...plan.aggregateMaterials].sort((a, b) => (b.etaHrs || 0) - (a.etaHrs || 0)),
    [plan.aggregateMaterials]
  );

  const [expandedPieces, setExpandedPieces] = useState({});
  const toggleExpand = (name) => setExpandedPieces(p => ({ ...p, [name]: !p[name] }));

  const updateInventory = useCallback((matName, raw) => {
    // Ignore invalid input instead of clobbering existing value with 0.
    // `qty | 0` would silently reset large numbers (>2^31), NaN, and paste typos.
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return;
    const inv = { ...profile.inventory, [matName]: Math.floor(n) };
    saveProfile(activeProfileKey.value, { ...profile, inventory: inv });
  }, [profile]);

  const togglePieceCompleted = useCallback((pieceName) => {
    const completed = { ...(profile.completedPieces || {}) };
    if (completed[pieceName]) {
      delete completed[pieceName];
    } else {
      completed[pieceName] = true;
    }
    saveProfile(activeProfileKey.value, { ...profile, completedPieces: completed });
  }, [profile]);

  const updateObservedRate = useCallback((matName, raw) => {
    const rates = { ...profile.observedRates };
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      // Empty/zero/negative clears the entry so the rough-estimate branch kicks back in.
      delete rates[matName];
    } else {
      rates[matName] = n;
    }
    saveProfile(activeProfileKey.value, { ...profile, observedRates: rates });
  }, [profile]);

  // One-time migration from Crafting tab's legacy inventory. Re-runs when the
  // active profile changes (e.g. the user imports a save mid-session).
  useEffect(() => {
    if (!activeProfileKey.value) return;
    if (Object.keys(profile.inventory || {}).length > 0) return;
    const migrated = migrateCraftingInventory({ ...profile, inventory: {} });
    if (Object.keys(migrated.inventory).length > 0) {
      saveProfile(activeProfileKey.value, { ...profile, inventory: migrated.inventory });
    }
  }, [activeProfileKey.value]);

  if (!activeProfileKey.value) {
    return (
      <div class="progression">
        <section class="progression__panel">
          <p class="progression__empty">
            Import a save file or create a profile to start planning a progression target.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div class="progression">
      <section class="progression__panel">
        <h2 class="progression__panel-title">Target</h2>
        <div class="progression__picker">
          <label>
            Set:
            <select
              value={target?.type === 'gearSet' ? target.value : ''}
              onChange={(e) => e.target.value ? setTarget('gearSet', e.target.value) : setTarget('none')}
            >
              <option value="">— none —</option>
              {sets.map(s => <option key={s} value={s}>{s} Set</option>)}
            </select>
          </label>
          <label>
            Piece:
            <select
              value={target?.type === 'gearPiece' ? target.value : ''}
              onChange={(e) => e.target.value ? setTarget('gearPiece', e.target.value) : setTarget('none')}
            >
              <option value="">— none —</option>
              {pieces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section class="progression__panel">
        <h2 class="progression__panel-title">Summary</h2>
        {!target ? (
          <p class="progression__empty">Pick a target above to see progress.</p>
        ) : (
          <div class="progression__summary">
            <div class="progression__summary-line">
              <strong>{Math.round(plan.percentComplete * 100)}% complete</strong>
              {' · '}
              <span>{fmtHours(plan.totalEtaHrs)} remaining</span>
            </div>
            <div class="progression__progress-bar">
              <div class="progression__progress-fill" style={{ width: `${plan.percentComplete * 100}%` }} />
            </div>
          </div>
        )}
      </section>

      <section class="progression__panel">
        <h2 class="progression__panel-title">Pieces</h2>
        {!target ? (
          <p class="progression__empty">—</p>
        ) : plan.pieces.length === 0 ? (
          <p class="progression__empty">No pieces in this target.</p>
        ) : (
          plan.pieces.map(piece => {
            const isEquipped = piece.owned && !piece.completedManually;
            const statusLabel = isEquipped ? 'equipped' : piece.owned ? 'done' : fmtHours(piece.pieceEtaHrs);
            return (
            <div key={piece.name} class="progression__piece">
              <div class="progression__piece-header">
                <span class="progression__piece-name">
                  <input
                    type="checkbox"
                    class="progression__piece-check"
                    checked={piece.owned}
                    disabled={isEquipped}
                    title={isEquipped ? 'Detected as equipped in your gear' : 'Click to mark complete'}
                    onChange={() => togglePieceCompleted(piece.name)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span onClick={() => toggleExpand(piece.name)}>{piece.name}</span>
                </span>
                <span
                  class={piece.owned ? 'progression__piece-owned' : ''}
                  onClick={() => toggleExpand(piece.name)}
                >
                  {statusLabel}
                </span>
              </div>
              {expandedPieces[piece.name] && (
                <div class="progression__piece-mats">
                  <div class="progression__piece-mats-hint">
                    Materials needed for this piece (see Shopping List below for your shared inventory and ETAs):
                  </div>
                  {piece.materials.map(m => (
                    <div key={m.name}>
                      {m.name}: {m.needed}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
          })
        )}
      </section>

      <section class="progression__panel">
        <h2 class="progression__panel-title">Shopping List</h2>
        {!target ? (
          <p class="progression__empty">—</p>
        ) : plan.aggregateMaterials.length === 0 ? (
          <p class="progression__empty">No materials required.</p>
        ) : (
          <table class="progression__shopping-list">
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col">Owned / Needed</th>
                <th scope="col">ETA</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedMaterials.map(m => {
                const className =
                  m.remaining === 0 ? 'progression__mat-complete'
                  : m.source === 'unknown' ? 'progression__mat-unknown'
                  : m.isRough ? 'progression__mat-rough'
                  : '';
                return (
                  <tr key={m.name} class={className}>
                    <td>{m.name}</td>
                    <td>{m.owned} / {m.totalNeeded}</td>
                    <td>{m.remaining === 0 ? '✓' : fmtHours(m.etaHrs)}{m.isRough ? ' (rough)' : ''}</td>
                    <td title={m.reason || ''}>
                      {m.location || (m.reason ? '⚠ ' + m.reason : '—')}
                      {(m.source === 'mining' || m.source === 'woodcutting') && (
                        <span class="progression__observed-prompt">
                          {' [rate/hr: '}
                          <input
                            type="number"
                            class="progression__inv-input"
                            min="0"
                            defaultValue={profile.observedRates?.[m.name] || ''}
                            onBlur={(e) => updateObservedRate(m.name, e.target.value)}
                            key={profile.observedRates?.[m.name] || 0}
                          />
                          {']'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section class="progression__panel">
        <h2 class="progression__panel-title">Inventory</h2>
        {!target ? (
          <p class="progression__empty">Pick a target to see required materials here.</p>
        ) : (
          <table class="progression__shopping-list">
            <thead>
              <tr><th scope="col">Material</th><th scope="col">Owned</th></tr>
            </thead>
            <tbody>
              {plan.aggregateMaterials.map(m => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td>
                    <input
                      type="number"
                      class="progression__inv-input"
                      min="0"
                      step="1"
                      defaultValue={m.owned}
                      onBlur={(e) => updateInventory(m.name, e.target.value)}
                      key={`${m.name}:${m.owned}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
