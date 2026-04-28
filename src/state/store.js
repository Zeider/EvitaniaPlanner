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
    inventory: {},
    progressionTarget: null,
    observedRates: {},
    completedPieces: {},
  };
}

/** One-time migration: if profile.inventory is empty and ic-invent-v1
 *  has data, copy it over. Returns the (possibly mutated) profile.
 *  Safe to call multiple times — no-op once inventory is populated. */
export function migrateCraftingInventory(profile) {
  if (!profile.inventory) profile.inventory = {};
  if (Object.keys(profile.inventory).length > 0) return profile;
  try {
    const raw = localStorage.getItem('ic-invent-v1');
    if (!raw) return profile;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      profile.inventory = { ...parsed };
    }
  } catch (e) {
    // Don't swallow silently — if legacy inventory is corrupt, the user would
    // otherwise see an empty Progression-tab inventory with no indication that
    // migration was attempted. Log enough breadcrumb to diagnose from DevTools.
    const rawLen = localStorage.getItem('ic-invent-v1')?.length ?? 0;
    // eslint-disable-next-line no-console
    console.warn(`[migrateCraftingInventory] failed to migrate ic-invent-v1 (raw length=${rawLen}):`, e);
  }
  return profile;
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

// ── Card overrides ─────────────────────────────────────────────────────────
// Save's Currency.cards is incomplete (server-side storage for many mobs).
// User can manually override card counts; overrides persist to localStorage
// and win over save-imported counts in the Cards tab.
const CARD_OVERRIDES_KEY = 'ic-card-overrides-v1';

function loadCardOverrides() {
  try {
    const raw = localStorage.getItem(CARD_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export const cardOverrides = signal(loadCardOverrides());

export function setCardOverride(cardName, count) {
  const next = { ...cardOverrides.value };
  if (count == null || count === '' || Number.isNaN(Number(count))) {
    delete next[cardName];
  } else {
    next[cardName] = Math.max(0, Math.floor(Number(count)));
  }
  cardOverrides.value = next;
  localStorage.setItem(CARD_OVERRIDES_KEY, JSON.stringify(next));
}

export function clearCardOverride(cardName) {
  setCardOverride(cardName, null);
}

export function clearAllCardOverrides() {
  cardOverrides.value = {};
  localStorage.removeItem(CARD_OVERRIDES_KEY);
}

/** Resolve a card's effective count: override (if set) wins over save-imported. */
export function resolveCardCount(cardName, importedCount) {
  const override = cardOverrides.value[cardName];
  return override != null ? override : (importedCount || 0);
}

/** Normalize old capitalized gear slot keys to lowercase IDs. */
const SLOT_MIGRATE = {
  Helmet: 'helmet', Chest: 'chest', Legs: 'gloves', Boots: 'boots',
  Belt: 'belt', Amulet: 'amulet', Ring: 'ring',
  Weapon1: 'weapon', Weapon2: 'weapon2', Potion: 'potion',
  Axe: 'axe', Pickaxe: 'pickaxe',
};

function migrateGearSlots(profile) {
  if (!profile.gear) return;
  const newGear = {};
  for (const [key, val] of Object.entries(profile.gear)) {
    const mapped = SLOT_MIGRATE[key] || key;
    newGear[mapped] = val;
  }
  profile.gear = newGear;
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem('ic-profiles');
    if (!raw) return {};
    const data = JSON.parse(raw);
    // Migrate old gear slot names
    for (const profile of Object.values(data)) {
      migrateGearSlots(profile);
    }
    return data;
  } catch { return {}; }
}
