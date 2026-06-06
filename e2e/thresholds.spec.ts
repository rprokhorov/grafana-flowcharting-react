import { test, expect } from '@grafana/plugin-e2e';
import { THRESHOLD_COLORS, ORIGINAL_FILL } from './fixtures';
import { diagramSvg, pathFills, expectRendered, expectSomePathColored } from './helpers';

// Group E — Thresholds & coloring.
// Each case opens a provisioned dashboard (see e2e/gen-dashboard.ts) whose panel
// has a single shape-map rule on the ingress cell and a CSV series with a fixed
// current value, then asserts the rendered SVG's fill colors.

test.describe('E. Thresholds & coloring', () => {
  // E2 / E3 — value crosses a threshold → the matching color is painted.
  for (const { uid, value, color, name } of [
    { uid: 'fc-th-yellow', value: 50, color: THRESHOLD_COLORS.yellow, name: 'E2 level 1 (yellow)' },
    { uid: 'fc-th-red', value: 80, color: THRESHOLD_COLORS.red, name: 'E3 level 2 (red)' },
  ]) {
    test(`${name} — value ${value} paints ${color}`, async ({ gotoDashboardPage }) => {
      const dashboardPage = await gotoDashboardPage({ uid });
      const svg = diagramSvg(dashboardPage);
      await expectRendered(svg);
      await expectSomePathColored(svg, color);
    });
  }

  test('E1 below first threshold — cell keeps its original fill', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-th-below' });
    const svg = diagramSvg(dashboardPage);
    await expectRendered(svg);

    // colorOn=when-condition + value 10 (level 0) → no recolor: the ingress
    // cell still shows its original blue, and no level-1/2 color appears.
    await expectSomePathColored(svg, ORIGINAL_FILL);
    const fills = await pathFills(svg);
    expect(fills).not.toContain(THRESHOLD_COLORS.yellow);
    expect(fills).not.toContain(THRESHOLD_COLORS.red);
  });

  test('E4 invert — painted color is still the matched threshold', async ({ gotoDashboardPage }) => {
    // value 90 with invert on: the severity LEVEL is mirrored (used for
    // cross-rule comparison) but the painted COLOR must remain the matched
    // threshold's red — regression guard for the invert fix.
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-th-invert' });
    const svg = diagramSvg(dashboardPage);
    await expectRendered(svg);
    await expectSomePathColored(svg, THRESHOLD_COLORS.red);
  });
});
