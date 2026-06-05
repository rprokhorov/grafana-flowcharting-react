# E2E Test Cases

Human-readable test cases for the FlowCharting React panel. Each case lists
preconditions, steps, and expected results. The **Automated** column links the
case to its Playwright spec (or marks it as not yet automated).

**Global preconditions (apply to every case unless noted):**

- The `grafana-fc` Docker container is running on http://localhost:3000 with the
  built `dist/` and `provisioning/` mounted (see [TESTING.md](../TESTING.md)).
- A user can authenticate as `admin` / `admin` (handled by the plugin-e2e auth
  fixture).
- The `FlowCharting React` panel plugin is registered and loadable.

| ID | Title | Automated |
|---|---|---|
| TC-01 | Select the panel as a visualization | ✅ `panel.spec.ts` |
| TC-02 | Add a draw.io diagram via XML | ✅ `add-diagram-xml.spec.ts` |
| TC-03 | A rule recolors a cell from metric data | ✅ `rule-colors-cell.spec.ts` |
| TC-04 | Hovering a ruled cell shows a tooltip with a sparkline | ⬜ not yet |
| TC-05 | Navigator pages between multiple diagrams | ⬜ not yet |
| TC-06 | A text map replaces a cell label with the metric value | ⬜ not yet |
| TC-07 | Invalid XML does not crash the panel | ⬜ not yet |
| TC-08 | Below-threshold value leaves the cell at its default color | ⬜ not yet |

---

## TC-01 — Select the panel as a visualization

**Priority:** High &nbsp;|&nbsp; **Automated:** `e2e/panel.spec.ts`

**Preconditions:** none beyond global.

**Steps:**
1. Create a new dashboard and add a new visualization.
2. Set the data source to `-- Grafana --`.
3. Open the visualization picker and choose **FlowCharting React**.

**Expected result:**
- The panel mounts: a `.fc-panel-wrapper` element is visible.
- No panel error icon / crash banner is shown.

---

## TC-02 — Add a draw.io diagram via XML

**Priority:** High &nbsp;|&nbsp; **Automated:** `e2e/add-diagram-xml.spec.ts`

**Preconditions:** the shared test diagram `e2e/fixtures/тестовая схема.drawio`
(Kubernetes topology: ingress → service → 3 pods).

**Steps:**
1. Create a new dashboard, add a visualization, set data source `-- Grafana --`.
2. Switch the visualization to **FlowCharting React**.
3. Expand the **Flowcharts** options category.
4. Click **Add flowchart**.
5. Paste the diagram XML into the flowchart's XML text area and blur the field.
6. Refresh the panel.

**Expected result:**
- The diagram renders as SVG inside `.fc-diagram-container`.
- The SVG contains more than 3 `<path>` nodes (the Kubernetes stencils loaded
  and the shapes painted, not an empty canvas).
- No panel error icon is shown.

---

## TC-03 — A rule recolors a cell from metric data

**Priority:** Critical &nbsp;|&nbsp; **Automated:** `e2e/rule-colors-cell.spec.ts`

**Preconditions:** provisioned dashboard `fc-rule-color` and the `TestData`
datasource. The panel has one flowchart (shared diagram) and one rule:
- thresholds 0 / 50 / 80 → green / yellow / red (levels 0 / 1 / 2),
- a shape map targeting the ingress cell (`oG_fwXk9lUamU_ajUwbq-3`) `fillColor`,
- a CSV series whose current value is **90**.

**Steps:**
1. Open the dashboard with uid `fc-rule-color`.
2. Locate the panel titled **K8s topology**.
3. Wait for the diagram to render.

**Expected result:**
- The diagram renders as SVG with more than 3 `<path>` nodes.
- At least one path's `fill` is the level-2 red `#F2495C` (the ingress cell was
  recolored from its original blue by the rule).
- No panel error icon is shown.

---

## TC-04 — Hovering a ruled cell shows a tooltip with a sparkline

**Priority:** Medium &nbsp;|&nbsp; **Automated:** not yet

**Preconditions:** as TC-03 (a rule maps to a cell and has time-series data with
≥ 2 points).

**Steps:**
1. Open the `fc-rule-color` dashboard.
2. Move the mouse over the ruled (ingress) cell.

**Expected result:**
- A tooltip (`.fc-tooltip`) appears near the cursor.
- It shows the rule alias / label and the formatted value.
- For multi-point series, a sparkline is rendered inside the tooltip.
- Moving the mouse off the cell hides the tooltip.

---

## TC-05 — Navigator pages between multiple diagrams

**Priority:** Medium &nbsp;|&nbsp; **Automated:** not yet

**Preconditions:** a panel configured with **two or more** flowcharts.

**Steps:**
1. Open a dashboard whose FlowCharting panel has 2+ flowcharts.
2. Observe the navigator control (prev / next, page indicator).
3. Click **next**.

**Expected result:**
- The navigator is visible only when there is more than one flowchart.
- Clicking next/prev switches the rendered diagram and updates the page
  indicator (e.g. `1 / 2` → `2 / 2`).
- Next is disabled / wraps appropriately at the last diagram.

---

## TC-06 — A text map replaces a cell label with the metric value

**Priority:** Medium &nbsp;|&nbsp; **Automated:** not yet

**Preconditions:** a panel with a rule whose **text map** targets a cell and a
data source returning a known current value.

**Steps:**
1. Open the dashboard.
2. Wait for the diagram to render.

**Expected result:**
- The targeted cell's visible label is replaced by the rule's formatted value
  (respecting unit/decimals and any value/range mapping).
- A cell carrying draw.io metadata (UserObject) keeps its metadata after the
  label is replaced (regression guard for the label/metadata fix).

---

## TC-07 — Invalid XML does not crash the panel

**Priority:** Medium &nbsp;|&nbsp; **Automated:** not yet

**Preconditions:** none beyond global.

**Steps:**
1. Add a FlowCharting panel and switch to it.
2. In the Flowcharts options, add a flowchart and paste malformed / non-draw.io
   XML into the XML field.
3. Refresh the panel.

**Expected result:**
- The panel does not throw a React crash / panel error banner.
- The diagram area renders empty (or a placeholder) rather than breaking the
  rest of the dashboard.

---

## TC-08 — Below-threshold value leaves the cell at its default color

**Priority:** Low &nbsp;|&nbsp; **Automated:** not yet

**Preconditions:** as TC-03 but the CSV series' current value is **below** the
first non-zero threshold (e.g. value `10`, thresholds 0 / 50 / 80, shape map
`colorOn = "when condition"`).

**Steps:**
1. Open the dashboard.
2. Wait for the diagram to render.

**Expected result:**
- No path is painted the level-1 yellow or level-2 red.
- The targeted cell keeps its original fill from the diagram XML (`#2875E2`).
- No panel error icon is shown.

---

> **Maintenance:** when you automate a "not yet" case, set its **Automated**
> column to the spec path and keep the coverage table in
> [TESTING.md](../TESTING.md) in sync.
