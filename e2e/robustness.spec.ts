import { test, expect } from '@grafana/plugin-e2e';
import { diagramSvg, expectRendered } from './helpers';

// Group J — Robustness & errors. These assert the panel degrades gracefully.

test.describe('J. Robustness', () => {
  test('J1 invalid XML does not crash the panel', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-bad-xml' });
    const panel = dashboardPage.getPanelByTitle('K8s topology');
    // The panel still mounts and shows no error banner; the diagram area is just
    // empty rather than breaking the dashboard.
    await expect(panel.locator.locator('.fc-panel-wrapper')).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
  });

  test('J3 no data — diagram renders at default styles', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-nodata' });
    const panel = dashboardPage.getPanelByTitle('K8s topology');
    await expectRendered(diagramSvg(dashboardPage));
    await expect(panel.getErrorIcon()).not.toBeVisible();
  });

  test('J4 two panels render independently', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-two-panels' });
    const p1 = dashboardPage.getPanelByTitle('K8s topology 1');
    const p2 = dashboardPage.getPanelByTitle('K8s topology 2');
    await expectRendered(p1.locator.locator('.fc-diagram-container svg'));
    await expectRendered(p2.locator.locator('.fc-diagram-container svg'));
    await expect(p1.getErrorIcon()).not.toBeVisible();
    await expect(p2.getErrorIcon()).not.toBeVisible();
  });
});
