import { expect, test } from '@playwright/test';

test.describe('MacBook Air M4 3D landing page E2E', () => {
  test('loads cleanly at 1440x900, scrolls through Acts 1-5 without wheel trap, and runs full Studio workflow', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`console.error: ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      errors.push(`pageerror: ${err.message}`);
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /^MacBook Air M4$/i })).toBeVisible();

    const stage = page.getByTestId('stage-container');
    await expect(stage).toBeVisible();
    const stageBox = await stage.boundingBox();
    expect(stageBox).not.toBeNull();
    expect(stageBox!.width).toBeGreaterThan(800);
    expect(stageBox!.height).toBeGreaterThan(500);

    // Ensure WebGL canvas or static fallback mounted cleanly inside the stage
    const canvasCount = await stage.locator('canvas').count();
    const fallbackCount = await stage.getByTestId('static-macbook-fallback').count();
    expect(canvasCount + fallbackCount).toBeGreaterThan(0);

    // Scroll into Act 3 (M4 Silicon) and verify chapter indicator updates
    await page.locator('#silicon').scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    await expect(page.getByRole('button', { name: 'M4 Silicon' })).toHaveAttribute(
      'aria-current',
      'location',
    );

    // Navigate to Interactive Studio
    await page.getByRole('button', { name: /Configure/i }).click();
    await page.waitForTimeout(450);

    const studio = page.getByTestId('studio-configurator');
    await expect(studio).toBeVisible();
    await expect(stage).toHaveClass(/pointer-events-auto/);

    // Verify wheel event over the 3D stage does NOT trap vertical page scrolling
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.move(300, 450);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(250);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBeLessThan(scrollBefore);

    // Return to Studio for hardware & pricing interactions
    await page.getByRole('button', { name: /Configure/i }).click();
    await page.waitForTimeout(350);

    await studio.getByRole('button', { name: /^15-inch/i }).click();
    await studio.getByRole('button', { name: /Midnight/i }).click();
    await studio.getByRole('button', { name: /^24GB/i }).click();
    await studio.getByRole('button', { name: /^512GB/i }).click();
    await expect(page.getByTestId('studio-configurator-price')).toHaveText('$1,599');

    const xrayBtn = studio.getByRole('button', { name: /X-Ray Mode/i });
    await xrayBtn.click();
    await expect(xrayBtn).toHaveAttribute('aria-pressed', 'true');

    await studio.getByRole('button', { name: /Review Configuration/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('15-inch MacBook Air (M4)');
    await expect(dialog).toContainText('$1,599');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    expect(errors).toEqual([]);
  });

  for (const viewport of [
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 },
  ]) {
    test(`has zero horizontal overflow and keyboard reachability on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      await expect(page.getByRole('heading', { name: /^MacBook Air M4$/i })).toBeVisible();

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);

      // Verify keyboard Tab reaches interactive controls cleanly
      await page.keyboard.press('Tab');
      const activeTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(activeTag);

      // Also check #studio section overflow
      await page.locator('#studio').scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const studioOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(studioOverflow.scrollWidth).toBeLessThanOrEqual(studioOverflow.innerWidth);

      expect(errors).toEqual([]);
    });
  }

  test('operates cleanly under prefers-reduced-motion: reduce', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /^MacBook Air M4$/i })).toBeVisible();

    await page.getByRole('button', { name: /Configure/i }).click();
    const studio = page.getByTestId('studio-configurator');
    await studio.getByRole('button', { name: /Starlight/i }).click();
    await studio.getByRole('button', { name: /Review Configuration/i }).click();

    await expect(page.getByRole('dialog')).toContainText('Starlight');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    expect(errors).toEqual([]);
  });
});
