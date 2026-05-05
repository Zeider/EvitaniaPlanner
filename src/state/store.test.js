import { describe, it, expect, beforeEach } from 'vitest';
import { createDefaultProfile, migrateCraftingInventory, importProfiles, profiles, activeProfileKey } from './store.js';

describe('createDefaultProfile', () => {
  it('returns a profile with empty inventory, null target, and empty observedRates', () => {
    const p = createDefaultProfile();
    expect(p.inventory).toEqual({});
    expect(p.progressionTarget).toBeNull();
    expect(p.observedRates).toEqual({});
  });
});

describe('migrateCraftingInventory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('copies ic-invent-v1 into the profile inventory when profile inventory is empty', () => {
    localStorage.setItem('ic-invent-v1', JSON.stringify({ 'Thorium Bar': 67 }));
    const profile = { inventory: {} };
    const migrated = migrateCraftingInventory(profile);
    expect(migrated.inventory).toEqual({ 'Thorium Bar': 67 });
  });

  it('leaves profile inventory untouched when it already has entries', () => {
    localStorage.setItem('ic-invent-v1', JSON.stringify({ 'Thorium Bar': 999 }));
    const profile = { inventory: { 'Thorium Bar': 100 } };
    const migrated = migrateCraftingInventory(profile);
    expect(migrated.inventory).toEqual({ 'Thorium Bar': 100 });
  });

  it('returns the same object reference when nothing to migrate', () => {
    const profile = { inventory: { a: 1 } };
    expect(migrateCraftingInventory(profile)).toBe(profile);
  });
});

describe('importProfiles — keying', () => {
  beforeEach(() => {
    localStorage.clear();
    profiles.value = {};
  });

  it('keys profiles by `<slug>-<heroIndex>` so same-named heroes do not collide', () => {
    // Two heroes both named "Legalize" — under the old name-only keying the
    // second would have overwritten the first; with the new keying they live
    // in distinct slots based on their position in the save.
    importProfiles([
      { name: 'Legalize', class: 'warrior', level: 50 },
      { name: 'Legalize', class: 'rogue',   level: 30 },
    ]);
    const keys = Object.keys(profiles.value);
    expect(keys).toContain('legalize-0');
    expect(keys).toContain('legalize-1');
    expect(keys).toHaveLength(2);
    expect(profiles.value['legalize-0'].class).toBe('warrior');
    expect(profiles.value['legalize-1'].class).toBe('rogue');
  });

  it('re-importing the same save re-keys cleanly without duplicates', () => {
    const heroes = [{ name: 'Zeider', class: 'rogue', level: 1 }];
    importProfiles(heroes);
    importProfiles(heroes);
    const keys = Object.keys(profiles.value);
    expect(keys).toEqual(['zeider-0']);
  });

  it('migrates legacy bare-slug keys when re-importing the same hero', () => {
    // Simulate a localStorage entry from before the indexed-key change.
    profiles.value = { 'zeider': { name: 'Zeider', class: 'rogue', level: 1 } };
    importProfiles([{ name: 'Zeider', class: 'rogue', level: 5 }]);
    const keys = Object.keys(profiles.value);
    expect(keys).toContain('zeider-0');
    expect(keys).not.toContain('zeider'); // legacy bare slug removed
  });

  it('leaves unrelated legacy keys alone (only deletes ones being re-imported)', () => {
    profiles.value = { 'someoneelse': { name: 'SomeoneElse', class: 'mage', level: 10 } };
    importProfiles([{ name: 'Zeider', class: 'rogue', level: 1 }]);
    expect(profiles.value['someoneelse']).toBeDefined();
    expect(profiles.value['zeider-0']).toBeDefined();
  });

  it('sets activeProfile to the first imported hero with the new key format', () => {
    importProfiles([
      { name: 'First', class: 'rogue', level: 1 },
      { name: 'Second', class: 'mage', level: 1 },
    ]);
    expect(activeProfileKey.value).toBe('first-0');
  });
});
