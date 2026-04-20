import { test, expect } from '@playwright/test';

/**
 * Seed a minimal profile via localStorage before the app reads it on load.
 * This runs in the browser context — not the Node context.
 */
async function seedProfile(page) {
  await page.addInitScript(() => {
    // Only seed if no existing profile data — preserves inventory written during tests
    if (!localStorage.getItem('ic-profiles')) {
      const profile = {
        name: 'Test', class: 'rogue', level: 1,
        miningLevel: 1, woodcuttingLevel: 1,
        gear: {}, talents: {}, professionSkills: {},
        hunterUpgrades: {}, ashUpgrades: {}, sacrificeUpgrades: {},
        cards: {}, bonfireHeat: 0, equippedRunes: [],
        activePet: null, petLevel: 1, equippedCurios: [],
        maxUnlockedZone: '',
        farmingRates: { killsPerHour: 1000, xpPerHour: 0, goldPerHour: 0 },
        currentZone: '1.0',
        inventory: {}, progressionTarget: null, observedRates: {},
      };
      localStorage.setItem('ic-profiles', JSON.stringify({ test: profile }));
      localStorage.setItem('ic-active-profile', 'test');
    }
  });
}

test('progression tab: target selection renders shopping list', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Progression' }).click();

  const setSelect = page.locator('.progression__picker select').first();
  await setSelect.selectOption('Thorium');

  // Summary appears
  await expect(page.getByText(/% complete/)).toBeVisible();

  // Shopping list has rows
  const shoppingRows = page.locator('.progression__shopping-list tbody tr');
  await expect(shoppingRows.first()).toBeVisible();
});

test('progression tab: inventory edit persists across reload', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Progression' }).click();

  const setSelect = page.locator('.progression__picker select').first();
  await setSelect.selectOption('Thorium');

  // Find the Inventory section (last panel) and its first numeric input
  const firstInvInput = page
    .locator('section.progression__panel', { hasText: 'Inventory' })
    .locator('.progression__inv-input')
    .first();
  await firstInvInput.fill('42');
  await firstInvInput.blur();

  await page.reload();
  await page.getByRole('button', { name: 'Progression' }).click();

  const reloadedInput = page
    .locator('section.progression__panel', { hasText: 'Inventory' })
    .locator('.progression__inv-input')
    .first();
  await expect(reloadedInput).toHaveValue('42');
});
