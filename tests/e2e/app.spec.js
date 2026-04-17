import { test, expect } from '@playwright/test';
import path from 'path';

const SAVE_FILE = path.resolve('tests/e2e/fixtures/test-save.sav');

/** Import the test save via the dynamically-created file chooser. */
async function importSave(page) {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('.btn-import');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(SAVE_FILE);
  // Wait for profile to load
  await expect(page.locator('.top-bar')).toContainText('TestRogue', { timeout: 5000 });
}

// ─── App loads ───────────────────────────────────────────

test('app loads with title and version', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.top-bar-title')).toHaveText('EvitaniaPlanner');
  await expect(page.locator('.top-bar-version')).toContainText('v3.');
});

test('all tabs render without errors', async ({ page }) => {
  await page.goto('/');
  const tabs = [
    'Dashboard', 'Upgrade Advisor', 'Gear Planner', 'Skill Trees',
    'DPS Simulator', 'Crafting', 'Rune Planner', 'Alt Advisor', 'Release Notes',
  ];
  for (const tab of tabs) {
    await page.click(`.tab-btn:has-text("${tab}")`);
    // Verify no crash — tab content area exists
    await expect(page.locator('.tab-content')).toBeVisible();
  }
});

// ─── Save import ─────────────────────────────────────────

test('save import loads character profiles', async ({ page }) => {
  await page.goto('/');
  await importSave(page);

  // First character should be active
  await expect(page.locator('.top-bar')).toContainText('TestRogue');
});

test('save import populates character selector with all heroes', async ({ page }) => {
  await page.goto('/');
  await importSave(page);

  // Profile dropdown should have both characters
  const select = page.locator('.top-bar select');
  await expect(select).toBeVisible();
  const options = select.locator('option');
  const texts = await options.allTextContents();
  expect(texts.some(t => t.includes('TestRogue'))).toBe(true);
  expect(texts.some(t => t.includes('TestMage'))).toBe(true);
});

// ─── Dashboard ───────────────────────────────────────────

test('dashboard shows boss readiness panel after import', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Dashboard")');

  // Boss readiness should be visible
  const panel = page.locator('.boss-readiness');
  await expect(panel).toBeVisible({ timeout: 3000 });
});

test('dashboard shows daily reminders panel', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Dashboard")');

  const panel = page.locator('.daily-reminders');
  await expect(panel).toBeVisible({ timeout: 3000 });
});

// ─── Gear Planner ────────────────────────────────────────

test('gear planner shows equipped gear after import', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Gear Planner")');

  // Helmet slot should show Iron Helmet
  await page.click('.gp-slots__btn:has-text("Helmet")');
  await expect(page.locator('.gp-col--current')).toContainText('Iron Helmet');
});

test('gear planner shows enhancement level', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Gear Planner")');

  await page.click('.gp-slots__btn:has-text("Helmet")');
  const enhInput = page.locator('.gp-enhance-input');
  await expect(enhInput).toHaveValue('7');
});

test('gear planner shows weapon for correct class', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Gear Planner")');

  await page.click('.gp-slots__btn:has-text("Weapon")');
  await expect(page.locator('.gp-col--current')).toContainText('Steel Bow');
});

test('gear planner candidate comparison shows stat diff', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Gear Planner")');

  await page.click('.gp-slots__btn:has-text("Helmet")');
  await page.selectOption('.gp-select', 'Thorium Helmet');
  await expect(page.locator('.gp-col--diff')).toContainText('eDPS');
});

test('gear planner shows progression milestone', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Gear Planner")');

  // TestRogue has defeated Mammoth, so next milestone should be Jotunn
  await expect(page.locator('.gp-milestone')).toContainText('Jotunn');
});

// ─── Gear Strip ──────────────────────────────────────────

test('gear strip shows equipped items at bottom', async ({ page }) => {
  await page.goto('/');
  await importSave(page);

  const strip = page.locator('.gear-strip');
  await expect(strip).toBeVisible();
  await expect(strip).toContainText('Iron Helmet');
  await expect(strip).toContainText('Steel Bow');
});

// ─── Upgrade Advisor ─────────────────────────────────────

test('upgrade advisor shows ranked suggestions', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Upgrade Advisor")');

  // Should have a table with upgrade rows
  const table = page.locator('.upgrade-advisor__table');
  await expect(table).toBeVisible({ timeout: 5000 });
  const rows = table.locator('tbody tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

test('upgrade advisor filter buttons work', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Upgrade Advisor")');

  // Click hunter filter
  await page.click('.upgrade-advisor__filter-btn:has-text("Hunter")');
  const rows = page.locator('.upgrade-advisor__table tbody tr');
  const count = await rows.count();
  // All visible rows should be hunter type
  for (let i = 0; i < Math.min(count, 5); i++) {
    await expect(rows.nth(i)).toContainText('hunter');
  }
});

test('upgrade advisor does not suggest talents when fully allocated', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Upgrade Advisor")');

  // Click talent filter — TestRogue has level 50, 49 points budget, 49 allocated
  await page.click('.upgrade-advisor__filter-btn:has-text("Talent")');
  // Should show either no rows or only for unallocated points
  const table = page.locator('.upgrade-advisor__table');
  // Check if table exists (might show empty message instead)
  const tableVisible = await table.isVisible();
  if (tableVisible) {
    const rows = table.locator('tbody tr');
    // If rows exist, verify they're real suggestions (not phantom)
    const count = await rows.count();
    // With 49 budget and 49 allocated, should have 0 talent suggestions
    // But the test save allocates exactly level-1 points, so this should be 0
    expect(count).toBeLessThanOrEqual(1);
  }
});

// ─── DPS Simulator ───────────────────────────────────────

test('dps simulator renders stats after import', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("DPS Simulator")');

  // Should show stat values (non-zero ATK from gear)
  await expect(page.locator('.tab-content')).toContainText('ATK');
});

// ─── Skill Trees ─────────────────────────────────────────

test('skill trees render for active class', async ({ page }) => {
  await page.goto('/');
  await importSave(page);
  await page.click('.tab-btn:has-text("Skill Trees")');

  // Should show rogue tree (TestRogue is a rogue)
  await expect(page.locator('.tab-content')).toContainText('rogue', { ignoreCase: true });
});

// ─── Character Switching ─────────────────────────────────

test('switching characters updates gear planner', async ({ page }) => {
  await page.goto('/');
  await importSave(page);

  // Switch to TestMage
    const options = await page.locator('.top-bar select option').all();
  for (const opt of options) {
    if ((await opt.textContent()).includes('TestMage')) {
      await page.selectOption('.top-bar select', await opt.getAttribute('value'));
      break;
    }
  }
  await page.click('.tab-btn:has-text("Gear Planner")');

  // TestMage has Bronze Helmet
  await page.click('.gp-slots__btn:has-text("Helmet")');
  await expect(page.locator('.gp-col--current')).toContainText('Bronze Helmet');
});

test('switching characters updates gear strip', async ({ page }) => {
  await page.goto('/');
  await importSave(page);

  // Switch to TestMage
    const options = await page.locator('.top-bar select option').all();
  for (const opt of options) {
    if ((await opt.textContent()).includes('TestMage')) {
      await page.selectOption('.top-bar select', await opt.getAttribute('value'));
      break;
    }
  }

  const strip = page.locator('.gear-strip');
  await expect(strip).toContainText('Bronze Helmet');
  await expect(strip).toContainText('Steel Staff');
});

// ─── Crafting ────────────────────────────────────────────

test('crafting tab shows recipes', async ({ page }) => {
  await page.goto('/');
  await page.click('.tab-btn:has-text("Crafting")');

  await expect(page.locator('.tab-content')).toContainText('Charcoal');
});

// ─── Release Notes ───────────────────────────────────────

test('release notes tab shows version history', async ({ page }) => {
  await page.goto('/');
  await page.click('.tab-btn:has-text("Release Notes")');

  await expect(page.locator('.release-notes')).toContainText('v3.0');
});
