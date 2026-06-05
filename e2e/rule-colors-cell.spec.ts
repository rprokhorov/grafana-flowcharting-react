import { test, expect } from '@grafana/plugin-e2e';

// Test plan: "A rule recolors a cell from metric data"
//   1. Log in to Grafana                      (auth fixture)
//   2. Open the provisioned dashboard         (fc-rule-color)
//   3. The panel queries TestData (current value = 90)
//   4. The rule (thresholds 0/50/80) maps level 2 → red and a shape map paints
//      the ingress cell's fillColor
//   5. Assert the diagram renders AND the ingress cell is painted red
//
// The dashboard + datasource are provisioned (see provisioning/), so the panel
// options and data are fixed — no UI clicking. Regenerate the dashboard JSON
// with `npx ts-node e2e/gen-dashboard.ts` after changing defaults or the diagram.

// level-2 threshold color from GFCONSTANT.CONF_COLORS_DEFAULT
const RED = '#F2495C';

test('a rule recolors a cell from metric data', async ({
  gotoDashboardPage,
  page,
}) => {
  const dashboardPage = await gotoDashboardPage({ uid: 'fc-rule-color' });

  const panel = dashboardPage.getPanelByTitle('K8s topology');
  const svg = panel.locator.locator('.fc-diagram-container svg');

  await test.step('the diagram renders', async () => {
    await expect(svg).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => svg.locator('path').count(), { timeout: 15_000 })
      .toBeGreaterThan(3);
  });

  await test.step('the rule paints a cell red', async () => {
    // Colour animation tweens over a few hundred ms; poll until a path is filled
    // with the level-2 red (case-insensitive; mxGraph may normalize the hex).
    await expect
      .poll(
        async () => {
          const fills = await svg.locator('path[fill]').evaluateAll((nodes) =>
            nodes.map((n) => (n.getAttribute('fill') || '').toUpperCase())
          );
          return fills.some((f) => f === RED);
        },
        { timeout: 15_000, message: 'expected a cell to be painted level-2 red' }
      )
      .toBe(true);
  });

  await test.step('no panel error', async () => {
    await expect(panel.getErrorIcon()).not.toBeVisible();
  });
});
