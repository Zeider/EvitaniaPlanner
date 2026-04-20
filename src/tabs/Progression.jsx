import { useMemo, useCallback } from 'preact/hooks';
import { activeProfile, activeProfileKey, saveProfile } from '../state/store.js';
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
    </div>
  );
}
