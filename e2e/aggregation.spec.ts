import { test, expect } from '@grafana/plugin-e2e';
import { THRESHOLD_COLORS } from './fixtures';
import { diagramSvg, pathFills, expectRendered, expectSomePathColored } from './helpers';

// Group D — Metrics & aggregation. The rule reduces the series with a given
// aggregation, then colors the ingress cell by the resulting level.

test.describe('D. Metrics & aggregation', () => {
  test('D2 max — max of [10,90,30] → red', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-agg-max' });
    const svg = diagramSvg(dashboardPage);
    await expectRendered(svg);
    await expectSomePathColored(svg, THRESHOLD_COLORS.red);
  });

  test('D3 avg — avg of [40,60]=50 → yellow', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-agg-avg' });
    const svg = diagramSvg(dashboardPage);
    await expectRendered(svg);
    await expectSomePathColored(svg, THRESHOLD_COLORS.yellow);
  });

  test('D5 no match — non-matching pattern leaves cells untouched', async ({ gotoDashboardPage }) => {
    const dashboardPage = await gotoDashboardPage({ uid: 'fc-nomatch' });
    const svg = diagramSvg(dashboardPage);
    await expectRendered(svg);
    // Pattern matches no series → rule never fires → no threshold color appears.
    const fills = await pathFills(svg);
    expect(fills).not.toContain(THRESHOLD_COLORS.yellow);
    expect(fills).not.toContain(THRESHOLD_COLORS.red);
  });
});
