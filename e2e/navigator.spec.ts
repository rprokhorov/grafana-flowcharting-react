import { test, expect } from '@grafana/plugin-e2e';
import { diagramSvg, expectRendered } from './helpers';

// Group I — Navigator (multi-diagram). Shown only when a panel has 2+ flowcharts.

test.describe('I. Navigator', () => {
  test('I1 hidden with a single diagram', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-rule-color' });
    const panelLoc = dashboardPage.getPanelByTitle('K8s topology').locator;
    await expectRendered(diagramSvg(dashboardPage));
    await expect(panelLoc.locator('.fc-navigator')).toHaveCount(0);
  });

  test('I2/I3 paging and button disabling', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-nav' });
    const panelLoc = dashboardPage.getPanelByTitle('K8s topology').locator;
    await expectRendered(diagramSvg(dashboardPage));

    const nav = panelLoc.locator('.fc-navigator');
    await expect(nav).toBeVisible();
    await expect(nav.locator('.fc-navigator-label')).toHaveText('1 / 2');

    // I3: on the first diagram, Prev is disabled and Next is enabled.
    const prev = nav.getByRole('button', { name: 'Previous diagram' });
    const next = nav.getByRole('button', { name: 'Next diagram' });
    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();

    // I2: clicking Next moves to the second diagram.
    await next.click();
    await expect(nav.locator('.fc-navigator-label')).toHaveText('2 / 2');
    await expect(next).toBeDisabled();
    await expect(prev).toBeEnabled();
  });
});
