import { expect, type DashboardPage } from '@grafana/plugin-e2e';
import type { Locator } from '@playwright/test';

/** The diagram SVG inside the named panel. */
export function diagramSvg(dashboardPage: DashboardPage, panelTitle = 'K8s topology'): Locator {
  return dashboardPage
    .getPanelByTitle(panelTitle)
    .locator.locator('.fc-diagram-container svg');
}

/** All uppercase `fill` values currently on the SVG's paths. */
export async function pathFills(svg: Locator): Promise<string[]> {
  return svg.locator('path[fill]').evaluateAll((nodes) =>
    nodes.map((n) => (n.getAttribute('fill') || '').toUpperCase())
  );
}

/** Wait for the diagram to render (stencils loaded → several paths). */
export async function expectRendered(svg: Locator): Promise<void> {
  await expect(svg).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => svg.locator('path').count(), { timeout: 15_000 })
    .toBeGreaterThan(3);
}

/** Poll until some path carries the given fill (colour animation tweens). */
export async function expectSomePathColored(svg: Locator, hex: string): Promise<void> {
  const want = hex.toUpperCase();
  await expect
    .poll(async () => (await pathFills(svg)).some((f) => f === want), {
      timeout: 15_000,
      message: `expected a path filled ${hex}`,
    })
    .toBe(true);
}
