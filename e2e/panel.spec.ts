import { test, expect } from '@grafana/plugin-e2e';

// Smoke test: the panel plugin loads in the visualization picker and renders
// without throwing. This is the cheapest end-to-end signal that the bundle is
// valid and Grafana can instantiate the panel — the layer jsdom can't cover.
test.describe('FlowCharting React panel', () => {
  test('can be selected as a visualization and renders', async ({
    panelEditPage,
    page,
  }) => {
    // Provide some data so the panel has a non-empty PanelData to process.
    await panelEditPage.datasource.set('-- Grafana --');

    // Switch the visualization to our plugin by its display name.
    await panelEditPage.setVisualization('FlowCharting React');

    // The panel container should mount. We assert no React error boundary /
    // crash banner appeared and the panel wrapper is present in the DOM.
    await expect(
      panelEditPage.panel.locator.locator('.fc-panel-wrapper')
    ).toBeVisible();

    // Grafana shows a "panel error" affordance when a panel throws on render —
    // assert it is absent.
    await expect(
      panelEditPage.panel.getErrorIcon()
    ).not.toBeVisible();
  });
});
