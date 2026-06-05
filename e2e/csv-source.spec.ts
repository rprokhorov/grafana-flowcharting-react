import { test, expect } from '@grafana/plugin-e2e';
import { diagramSvg, expectRendered } from './helpers';

// Group B — CSV diagram source. A CSV-source flowchart is imported into nodes
// and edges by XGraph._importCsv (see provisioning fc-csv).

test.describe('B. CSV source', () => {
  test('B4 a CSV source renders nodes', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-csv' });
    const panel = dashboardPage.getPanelByTitle('K8s topology');
    await expectRendered(diagramSvg(dashboardPage));

    // The CSV rows became labelled vertices.
    await expect(panel.locator.getByText('pod-a', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(panel.locator.getByText('pod-b', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(panel.getErrorIcon()).not.toBeVisible();
  });
});
