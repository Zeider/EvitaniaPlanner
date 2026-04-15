import { useState, useMemo } from 'preact/hooks';
import { profiles, activeProfileKey } from '../state/store.js';
import { detectBottlenecks } from '../state/bottleneck-detector.js';
import { buildCapabilityMatrix, assignAlts } from '../state/alt-optimizer.js';
import enemies from '../data/enemies.json';

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

function AltCard({ assignment, isMain }) {
  const p = assignment.profile;
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
  const allProfiles = profiles.value;
  const mainKey = activeProfileKey.value;
  const profileList = Object.entries(allProfiles);
  const [refreshKey, setRefresh] = useState(0);

  const result = useMemo(() => {
    if (profileList.length === 0) return null;
    const mainProfile = allProfiles[mainKey] || profileList[0][1];
    const altProfiles = profileList
      .filter(([key]) => key !== mainKey)
      .map(([, p]) => p);

    const bottlenecks = detectBottlenecks(mainProfile);
    const matrices = altProfiles.map(p => buildCapabilityMatrix(p));
    const assignments = assignAlts(bottlenecks, matrices);

    return { mainProfile, assignments, bottlenecks };
  }, [allProfiles, mainKey, refreshKey]);

  if (!result || profileList.length === 0) {
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
        />
        {assignments.map((a, i) => (
          <AltCard key={a.altName || i} assignment={a} isMain={false} />
        ))}
      </div>
    </div>
  );
}
