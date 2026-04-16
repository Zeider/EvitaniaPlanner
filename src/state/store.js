import { signal, computed } from '@preact/signals';

// UI State
export const activeTab = signal('dashboard');
export const theme = signal(localStorage.getItem('ic-theme') || 'boushoku');
export const lightMode = signal(false);

// Profiles
export const profiles = signal(loadProfiles());
export const activeProfileKey = signal(localStorage.getItem('ic-active-profile') || '');

export const activeProfile = computed(() => {
  const key = activeProfileKey.value;
  return profiles.value[key] || createDefaultProfile();
});

export function createDefaultProfile() {
  return {
    name: 'New Character', class: 'rogue', level: 1,
    miningLevel: 1, woodcuttingLevel: 1,
    gear: {}, talents: {}, professionSkills: {},
    hunterUpgrades: {}, ashUpgrades: {}, sacrificeUpgrades: {},
    cards: {}, bonfireHeat: 0, equippedRunes: [],
    activePet: null, petLevel: 1, equippedCurios: [],
    maxUnlockedZone: '',
    farmingRates: { killsPerHour: 0, xpPerHour: 0, goldPerHour: 0 },
    currentZone: '1.0',
  };
}

export function setActiveProfile(key) {
  activeProfileKey.value = key;
  localStorage.setItem('ic-active-profile', key);
}

export function saveProfile(key, profile) {
  const current = { ...profiles.value };
  current[key] = profile;
  profiles.value = current;
  localStorage.setItem('ic-profiles', JSON.stringify(current));
}

export function importProfiles(extractedProfiles) {
  const current = { ...profiles.value };
  for (const p of extractedProfiles) {
    const key = p.name.toLowerCase().replace(/\s/g, '-');
    current[key] = p;
  }
  profiles.value = current;
  localStorage.setItem('ic-profiles', JSON.stringify(current));
  if (extractedProfiles.length > 0) {
    setActiveProfile(extractedProfiles[0].name.toLowerCase().replace(/\s/g, '-'));
  }
}

export function setTheme(t) {
  theme.value = t;
  localStorage.setItem('ic-theme', t);
}

export function setLightMode(on) {
  lightMode.value = on;
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem('ic-profiles');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
