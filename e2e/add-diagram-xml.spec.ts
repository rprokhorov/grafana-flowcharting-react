import { test, expect } from '@grafana/plugin-e2e';
import { testDiagramXml } from './fixtures';

// Test plan: "Add a draw.io diagram via XML"
//   1. Log in to Grafana            (handled by the plugin-e2e auth fixture)
//   2. Create a new dashboard       \
//   3. Add a new visualization       } provided by the `panelEditPage` fixture
//   4. Pick a data source           /
//   5. Switch the visualization to FlowCharting React
//   6. Paste the draw.io XML into the flowchart editor and verify it renders
//
// The XML is a Kubernetes topology (ingress → service → 3 pods) that exercises
// the mxgraph.kubernetes stencil loader.

const DIAGRAM_XML = testDiagramXml();

test('add a draw.io diagram via XML', async ({ panelEditPage, page }) => {
  // Steps 1–4: the panelEditPage fixture lands us on a fresh panel editor of a
  // new dashboard, already authenticated.
  await test.step('select a data source', async () => {
    await panelEditPage.datasource.set('-- Grafana --');
  });

  await test.step('switch visualization to FlowCharting React', async () => {
    await panelEditPage.setVisualization('FlowCharting React');
    await expect(
      panelEditPage.panel.locator.locator('.fc-panel-wrapper')
    ).toBeVisible();
  });

  await test.step('add the draw.io XML in the Flowcharts options', async () => {
    const flowcharts = panelEditPage.getCustomOptions('Flowcharts');
    await flowcharts.expand();

    // The flowchart list starts empty — create one so the XML field appears.
    await flowcharts.element.getByRole('button', { name: 'Add flowchart' }).click();

    // The new card opens expanded; fill its XML textarea.
    const xmlField = flowcharts.element.getByPlaceholder(
      'Paste draw.io XML here or use the Edit button'
    );
    await expect(xmlField).toBeVisible();
    await xmlField.fill(DIAGRAM_XML);
    // Commit the value (Grafana options update on blur).
    await xmlField.blur();
  });

  await test.step('the diagram renders as SVG without a panel error', async () => {
    await panelEditPage.refreshPanel();

    const panel = panelEditPage.panel.locator;
    // mxGraph renders the diagram into an <svg> inside our container.
    await expect(panel.locator('.fc-diagram-container svg')).toBeVisible({
      timeout: 15_000,
    });
    // The Kubernetes diagram has multiple shape cells + connecting edges, so
    // the SVG must contain several path/rect nodes (not an empty canvas).
    await expect
      .poll(async () => panel.locator('.fc-diagram-container svg path').count(), {
        timeout: 15_000,
      })
      .toBeGreaterThan(3);

    await expect(panelEditPage.panel.getErrorIcon()).not.toBeVisible();
  });
});
