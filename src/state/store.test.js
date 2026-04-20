import { describe, it, expect, beforeEach } from 'vitest';
import { createDefaultProfile, migrateCraftingInventory } from './store.js';

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
