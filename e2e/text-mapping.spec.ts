import { test, expect } from '@grafana/plugin-e2e';
import { diagramSvg, expectRendered } from './helpers';

// Groups F (text maps) & G (value/range/unit mapping). The rule's text map
// replaces the targeted cell's label with the formatted/mapped value; mxGraph
// renders cell labels as HTML inside the diagram, so we assert on visible text.

test.describe('F/G. Text & value mapping', () => {
  async function openAndRender(gotoDashboardPage: any, uid: string) {
    const dashboardPage = await gotoDashboardPage({ uid });
    const svg = diagramSvg(dashboardPage);
    await expectRendered(svg);
    return dashboardPage.getPanelByTitle('K8s topology').locator;
  }

  test('F4 text map — label becomes the formatted value (90.00)', async ({ gotoDashboardPage }) => {
    // Default unit "short" + decimals 2 → "90.00".
    const panelLoc = await openAndRender(gotoDashboardPage, 'fc-text');
    await expect(panelLoc.getByText('90.00', { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('G1 value mapping — 90 → "CRIT"', async ({ gotoDashboardPage }) => {
    const panelLoc = await openAndRender(gotoDashboardPage, 'fc-valuemap');
    await expect(panelLoc.getByText('CRIT', { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('G2 range mapping — 0–100 → "OK"', async ({ gotoDashboardPage }) => {
    const panelLoc = await openAndRender(gotoDashboardPage, 'fc-rangemap');
    await expect(panelLoc.getByText('OK', { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('G3 unit & decimals — 42.5 → "42.5%"', async ({ gotoDashboardPage }) => {
    const panelLoc = await openAndRender(gotoDashboardPage, 'fc-unit');
    await expect(panelLoc.getByText('42.5%', { exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
