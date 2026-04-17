import { useState, useMemo, useCallback } from 'preact/hooks';
import { profiles, activeProfileKey, saveProfile } from '../state/store.js';
import { detectBottlenecks } from '../state/bottleneck-detector.js';
import { buildCapabilityMatrix, assignAlts } from '../state/alt-optimizer.js';
import enemies from '../data/enemies.json';

/**
 * Convert a zone string like "2.6" to a numeric value for comparison.
 * act * 100 + zone  →  "2.6" = 206
 */
function zoneToNum(zoneStr) {
  if (!zoneStr) return 0;
  const [act, zone] = zoneStr.split('.').map(Number);
  return (act || 0) * 100 + (zone || 0);
}

const FOURTH_SLOT_ZONE_THRESHOLD = 206; // zone "2.6"
const MAX_SLOTS_WITHOUT_FOURTH = 3; // main + 2 alts  →  3 profiles total

/** Build flat zone list for dropdown. */
function buildZoneList() {
  const list = [];
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    for (const e of act.zones) list.push(e);
  }
  return list;
}
const allZones = buildZoneList();

function fmt(n) {
  if (!isFinite(n) || isNaN(n)) return '---';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

function fmtEta(hours) {
  if (!isFinite(hours) || hours <= 0) return '---';
  if (hours < 1 / 60) return '< 1 min';
  if (hours < 1) return Math.round(hours * 60) + ' min';
  return hours.toFixed(1) + ' hrs';
}

function zoneMobName(zoneId) {
  for (const act of Object.values(enemies)) {
    if (!act.zones) continue;
    const match = act.zones.find(e => e.zone === zoneId);
    if (match) return match.name;
  }
  return zoneId;
}

function AltCard({ assignment, isMain, profileKey, onZoneChange }) {
  const p = assignment.profile;
  const maxZone = p.maxUnlockedZone || '';
  return (
    <div class={`alt-card ${isMain ? 'alt-card--active' : ''}`}>
      <div class="alt-card__header">
        <span class="alt-card__name">
          {p.name} ({p.class} {p.level})
        </span>
        <span class={`alt-card__badge ${isMain ? 'alt-card__badge--active' : 'alt-card__badge--offline'}`}>
          {isMain ? 'Active' : 'Offline'}
        </span>
      </div>
      <div class="alt-card__zone-setting">
        <label class="alt-card__override-label">Max unlocked zone:</label>
        <select
          class="alt-card__override-select"
          value={maxZone}
          onChange={(e) => onZoneChange(profileKey, e.target.value)}
        >
          <option value="">Auto (stat-based)</option>
          {allZones.map(z => (
            <option key={z.zone} value={z.zone}>{z.zone} - {z.name}</option>
          ))}
        </select>
      </div>
      {isMain ? (
        <div class="alt-card__recommendation">
          <div class="alt-card__rec-reason">
            Farming: {assignment.zone} {zoneMobName(assignment.zone)}
          </div>
        </div>
      ) : (
        <div class="alt-card__recommendation">
          <div class="alt-card__rec-title">
            {assignment.type === 'farm' && `Farm ${assignment.zone} (${assignment.resource})`}
            {assignment.type === 'profession' && `${assignment.activity === 'mining' ? 'Mine' : 'Chop'} ${assignment.resource}`}
            {assignment.type === 'push' && `Push zones (at ${assignment.zone})`}
            {assignment.type === 'xp' && `Farm XP at ${assignment.zone}`}
          </div>
          <div class="alt-card__rec-reason">{assignment.reason}</div>
          <div class="alt-card__rec-stats">
            {assignment.rate > 0 && (
              <div class="alt-card__rec-stat">
                Rate: <span class="alt-card__rec-stat-value">~{fmt(assignment.rate)} {assignment.rateUnit}</span>
              </div>
            )}
            {assignment.eta > 0 && isFinite(assignment.eta) && (
              <div class="alt-card__rec-stat">
                ETA: <span class="alt-card__rec-stat-value">{fmtEta(assignment.eta)}</span>
              </div>
            )}
          </div>
          {assignment.throughputTip && (
            <div class="alt-card__tip">{assignment.throughputTip}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function AltAdvisor() {
  const [refreshKey, setRefresh] = useState(0);

  const handleZoneChange = useCallback((profileKey, zone) => {
    const prof = profiles.value[profileKey];
    if (!prof) return;
    saveProfile(profileKey, { ...prof, maxUnlockedZone: zone || '' });
    setRefresh(k => k + 1);
  }, []);

  // Force re-read profiles on every render triggered by refreshKey or signal change
  const currentProfiles = profiles.value;
  const currentMainKey = activeProfileKey.value;
  const allProfileEntries = Object.entries(currentProfiles);

  // Gate the 4th character slot: only available if any profile has maxUnlockedZone >= "2.6"
  const fourthSlotUnlocked = allProfileEntries.some(
    ([, p]) => zoneToNum(p.maxUnlockedZone) >= FOURTH_SLOT_ZONE_THRESHOLD
  );
  const currentProfileList = fourthSlotUnlocked
    ? allProfileEntries
    : allProfileEntries.slice(0, MAX_SLOTS_WITHOUT_FOURTH);

  const result = useMemo(() => {
    if (currentProfileList.length === 0) return null;
    const mainProfile = currentProfiles[currentMainKey] || currentProfileList[0][1];
    const altEntries = currentProfileList.filter(([key]) => key !== currentMainKey);

    const bottlenecks = detectBottlenecks(mainProfile);
    const matrices = altEntries.map(([, p]) => buildCapabilityMatrix(p));
    const assignments = assignAlts(bottlenecks, matrices);

    for (const a of assignments) {
      const entry = altEntries.find(([, p]) => p.name === a.altName);
      if (entry) a._profileKey = entry[0];
    }

    return { mainProfile, mainKey: currentMainKey, assignments, bottlenecks };
  }, [currentProfiles, currentMainKey, refreshKey]);

  if (!result || currentProfileList.length === 0) {
    return (
      <div class="alt-advisor">
        <div class="alt-advisor__empty">
          Import a save file with multiple characters to see alt farming recommendations.
        </div>
      </div>
    );
  }

  const { mainProfile, assignments } = result;

  return (
    <div class="alt-advisor">
      <div class="alt-advisor__refresh">
        <button class="alt-advisor__refresh-btn" onClick={() => setRefresh(k => k + 1)}>
          Refresh Recommendations
        </button>
      </div>
      <div class="alt-advisor__board">
        <AltCard
          assignment={{ type: 'active', zone: mainProfile.currentZone, profile: mainProfile }}
          isMain={true}
          profileKey={result.mainKey}
          onZoneChange={handleZoneChange}
        />
        {assignments.map((a, i) => (
          <AltCard
            key={a.altName || i}
            assignment={a}
            isMain={false}
            profileKey={a._profileKey}
            onZoneChange={handleZoneChange}
          />
        ))}
      </div>
    </div>
  );
}
