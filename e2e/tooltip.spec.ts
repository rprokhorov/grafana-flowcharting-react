import { test, expect, type DashboardPage } from '@grafana/plugin-e2e';
import type { Page, Locator } from '@playwright/test';
import { diagramSvg, expectRendered } from './helpers';

// Group H — Tooltip. The mxGraph hover listener fires on real mouseMove events
// over a cell (not synthetic .hover()), so we sweep a grid of points across the
// diagram with page.mouse.move until the tooltip (rendered in a body Portal)
// appears.

async function hoverUntilTooltip(page: Page, svg: Locator): Promise<boolean> {
  const tooltip = page.locator('.fc-tooltip');
  const box = await svg.boundingBox();
  if (!box) {
    return false;
  }
  for (let gx = 0; gx <= 10; gx++) {
    for (let gy = 0; gy <= 10; gy++) {
      await page.mouse.move(box.x + (box.width * gx) / 10, box.y + (box.height * gy) / 10);
      await page.waitForTimeout(40);
      if (await tooltip.isVisible().catch(() => false)) {
        return true;
      }
    }
  }
  return false;
}

async function openTooltipDashboard(gotoDashboardPage: (a: { uid: string }) => Promise<DashboardPage>) {
  const dashboardPage = await gotoDashboardPage({ uid: 'fc-tooltip' });
  const svg = diagramSvg(dashboardPage);
  await expectRendered(svg);
  return svg;
}

test.describe('H. Tooltip', () => {
  test('H1/H2 hovering a cell shows a tooltip with a sparkline', async ({ gotoDashboardPage, page }) => {
    const svg = await openTooltipDashboard(gotoDashboardPage);
    const tooltip = page.locator('.fc-tooltip');

    expect(await hoverUntilTooltip(page, svg)).toBe(true);
    await expect(tooltip).toBeVisible();
    // The multi-point series (10,40,90) yields a sparkline.
    await expect(tooltip.locator('.fc-tooltip-sparkline')).toBeVisible({ timeout: 5_000 });
  });

  test('H4 tooltip hides on mouse-out', async ({ gotoDashboardPage, page }) => {
    const svg = await openTooltipDashboard(gotoDashboardPage);
    const tooltip = page.locator('.fc-tooltip');

    expect(await hoverUntilTooltip(page, svg)).toBe(true);
    await expect(tooltip).toBeVisible();

    // Move to an empty corner of the diagram (no cell there) → onCellHoverEnd
    // fires and the tooltip disappears. Step in several hops so the synthetic
    // path doesn't pass over another cell on the way out.
    const box = await svg.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width - 4, box.y + 4, { steps: 8 });
      await page.waitForTimeout(60);
      await page.mouse.move(box.x + box.width - 2, box.y + 2, { steps: 4 });
    }
    await expect(tooltip).toBeHidden({ timeout: 5_000 });
  });
});
