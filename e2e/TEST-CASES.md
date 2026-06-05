# E2E Test Cases

Human-readable test cases for the FlowCharting React panel, grouped by
functional area. Each case lists preconditions, steps, and expected results.
The **Auto** column links a case to its Playwright spec, or marks it ⬜ (planned,
not yet automated).

**Global preconditions (apply to every case unless noted):**

- The `grafana-fc` Docker container is running on http://localhost:3000 with the
  built `dist/` and `provisioning/` mounted (see [TESTING.md](../TESTING.md)).
- A user can authenticate as `admin` / `admin` (handled by the plugin-e2e auth
  fixture).
- The `FlowCharting React` panel plugin is registered and loadable.

**Shared fixtures:** the test diagram `e2e/fixtures/тестовая схема.drawio`
(Kubernetes topology: ingress → service → 3 pods). Cells:
`oG_fwXk9lUamU_ajUwbq-3` = ingress, `-8` = service, `-4 / -5 / -6` = pods.
Threshold colors: level 0 green `#73BF69`, level 1 yellow `#FADE2A`,
level 2 red `#F2495C`.

## Groups

| # | Group | Cases |
|---|---|---|
| A | Panel lifecycle & loading | A1–A4 |
| B | Diagram sources | B1–B5 |
| C | Display options | C1–C7 |
| D | Metrics & aggregation | D1–D5 |
| E | Thresholds & coloring | E1–E7 |
| F | Shape / text / link / event maps | F1–F8 |
| G | Value & range mapping | G1–G3 |
| H | Tooltip | H1–H4 |
| I | Navigator (multi-diagram) | I1–I3 |
| J | Robustness & errors | J1–J5 |

---

## A. Panel lifecycle & loading

### A1 — Select the panel as a visualization &nbsp;`✅ panel.spec.ts`
**Steps:** New dashboard → add visualization → data source `-- Grafana --` →
pick **FlowCharting React**.
**Expected:** `.fc-panel-wrapper` is visible; no panel error icon.

### A2 — Loading overlay shown until the draw.io engine is ready &nbsp;`⬜`
**Steps:** Add the panel and observe the panel during initial mount.
**Expected:** A `.fc-status-overlay` with "Loading draw.io engine…" appears
while the engine loads, then disappears once ready.

### A3 — Panel renders with no flowcharts configured &nbsp;`⬜`
**Preconditions:** panel added but the flowchart list is empty.
**Expected:** `.fc-panel-wrapper` is present; no diagram container; no crash.

### A4 — Panel survives a dashboard time-range change &nbsp;`⬜`
**Steps:** Open a dashboard with a ruled panel → change the time range.
**Expected:** The panel re-queries and re-renders; rules re-apply; no error.

---

## B. Diagram sources

### B1 — Add a draw.io diagram via XML &nbsp;`✅ add-diagram-xml.spec.ts`
**Steps:** Switch to the panel → Flowcharts options → **Add flowchart** → paste
the shared diagram XML → blur → refresh.
**Expected:** SVG renders in `.fc-diagram-container` with > 3 `<path>` nodes; no
panel error.

### B2 — Compressed (base64/deflate) mxfile XML is decoded &nbsp;`⬜`
**Preconditions:** the diagram XML in compressed `<diagram>…</diagram>` form.
**Expected:** The diagram renders identically to the uncompressed form.

### B3 — A bundled stencil (Kubernetes) renders offline &nbsp;`⬜`
**Preconditions:** network to `stencils.drawio.com` blocked.
**Expected:** The Kubernetes shapes still render from the bundled local stencils.
**Note:** the shared diagram already exercises the kubernetes stencil.

### B4 — Switching source type to CSV &nbsp;`⬜`
**Steps:** In the flowchart editor, set **Source type** to CSV.
**Expected:** The XML field is replaced by a CSV field; the editor does not crash.

### B5 — Replacing the XML re-renders the diagram &nbsp;`⬜`
**Steps:** With a rendered diagram, replace the XML with a different valid
diagram → refresh.
**Expected:** The previous diagram is torn down and the new one renders.

---

## C. Display options

### C1 — Lock toggle disables graph interaction &nbsp;`⬜`
**Steps:** Toggle **Lock** on.
**Expected:** The diagram cannot be dragged/selected (graph is read-only).

### C2 — Grid background toggle &nbsp;`⬜`
**Steps:** Toggle **Grid** on.
**Expected:** The diagram container shows the grid background image; off removes it.

### C3 — Zoom value is applied &nbsp;`⬜`
**Preconditions:** Scale off, Zoom = `200%`.
**Expected:** The diagram renders at the configured zoom.

### C4 — Scale-to-fit centers the diagram &nbsp;`⬜`
**Preconditions:** Scale on, Center on.
**Expected:** The diagram is scaled and centered within the panel.

### C5 — Background color is applied &nbsp;`⬜`
**Preconditions:** a non-null bgColor.
**Expected:** The diagram container background matches the configured color.

### C6 — Mouse-wheel zoom &nbsp;`⬜`
**Steps:** Ctrl/Cmd + wheel over the diagram.
**Expected:** The diagram zooms in/out around the pointer.

### C7 — Escape key resets zoom &nbsp;`⬜`
**Steps:** Zoom in, then press Escape.
**Expected:** The diagram returns to its fit/zoom baseline. With two panels,
only the focused panel resets (regression guard for the listener-leak fix).

---

## D. Metrics & aggregation

### D1 — Current aggregation drives coloring &nbsp;`✅ rule-colors-cell.spec.ts`
**Preconditions:** series current value 90, thresholds 0/50/80.
**Expected:** The ruled cell is painted level-2 red.

### D2 — Max aggregation &nbsp;`⬜`
**Preconditions:** series `[10, 90, 30]`, aggregation **Max**, thresholds 0/50/80.
**Expected:** Level resolves from 90 → red.

### D3 — Average aggregation &nbsp;`⬜`
**Preconditions:** series `[40, 60]`, aggregation **Average** (=50), thresholds
0/50/80.
**Expected:** Level resolves from 50 → level 1 yellow.

### D4 — Regex pattern matches the series &nbsp;`⬜`
**Preconditions:** rule pattern `/A-series/`, a series named `A-series`.
**Expected:** The rule matches and colors its cell.

### D5 — Non-matching pattern leaves cells untouched &nbsp;`⬜`
**Preconditions:** rule pattern that matches no series.
**Expected:** No cell is recolored; cells keep their original fills.

---

## E. Thresholds & coloring

### E1 — Below first threshold keeps default color &nbsp;`⬜`
**Preconditions:** current value 10, thresholds 0/50/80, shape map `colorOn=wc`.
**Expected:** No cell is yellow/red; the ingress cell keeps original `#2875E2`.

### E2 — Level 1 (yellow) boundary &nbsp;`⬜`
**Preconditions:** current value 50.
**Expected:** The cell is painted level-1 yellow `#FADE2A`.

### E3 — Level 2 (red) boundary &nbsp;`⬜`
**Preconditions:** current value 80.
**Expected:** The cell is painted level-2 red `#F2495C`.

### E4 — Invert mirrors the severity but keeps the matched color &nbsp;`⬜`
**Preconditions:** current value 90, `invert` on.
**Expected:** The painted color is still the matched threshold's color (the cell
is not recolored to the opposite end). Regression guard for the invert fix.

### E5 — String threshold (eq) &nbsp;`⬜`
**Preconditions:** value type String, threshold `eq "DOWN"`, value `DOWN`.
**Expected:** The matching level's color is applied.

### E6 — Date threshold &nbsp;`⬜`
**Preconditions:** value type Date with a date threshold.
**Expected:** The cell colors when the date condition is met.

### E7 — `colorOn = always` colors regardless of level &nbsp;`⬜`
**Preconditions:** shape map `colorOn=a`.
**Expected:** The cell is colored even when the value is below all thresholds.

---

## F. Shape / text / link / event maps

### F1 — Shape map by cell id &nbsp;`✅ rule-colors-cell.spec.ts`
**Expected:** The cell whose id matches the shape-map pattern is recolored.

### F2 — Shape map by cell value (identByProp = value) &nbsp;`⬜`
**Preconditions:** a cell with a label; shape map matches by `value`.
**Expected:** The cell is recolored by matching its label, not its id.

### F3 — Shape map by metadata (UserObject) &nbsp;`⬜`
**Preconditions:** a cell with metadata; shape map matches by `metadata`.
**Expected:** The cell is recolored; its metadata is preserved.

### F4 — Text map replaces label with the formatted value &nbsp;`⬜`
**Preconditions:** text map `textReplace=content`, `textOn=wc`, current value 90.
**Expected:** The cell's label becomes the formatted value (e.g. `90`).

### F5 — Text map preserves metadata on a UserObject cell &nbsp;`⬜`
**Preconditions:** a UserObject cell targeted by a text map.
**Expected:** The label updates but the cell's metadata attributes remain.
Regression guard for the label/metadata fix.

### F6 — Per-map options are independent &nbsp;`⬜`
**Preconditions:** a rule whose shape map matches by `id` and text map matches
by `value`.
**Expected:** Each map matches with its own options (not the shape map's for
all). Regression guard for the per-map-options fix.

### F7 — Event map applies a style change on condition &nbsp;`⬜`
**Preconditions:** event map (e.g. opacity) with a comparator that the value
satisfies.
**Expected:** The targeted cell's style (opacity) changes when the condition holds.

### F8 — Hidden map is ignored &nbsp;`⬜`
**Preconditions:** a map marked hidden.
**Expected:** The map produces no visual change.

---

## G. Value & range mapping

### G1 — Value mapping replaces the displayed value &nbsp;`⬜`
**Preconditions:** value mapping `1 → "Active"`, current value 1, text map on.
**Expected:** The cell label shows `Active`.

### G2 — Range mapping replaces the displayed value &nbsp;`⬜`
**Preconditions:** range mapping `0–10 → "Low"`, current value 5.
**Expected:** The cell label shows `Low`.

### G3 — Unit & decimals formatting &nbsp;`⬜`
**Preconditions:** unit `percent`, decimals 1, current value 42.5.
**Expected:** The label shows the formatted value (e.g. `42.5%`).

---

## H. Tooltip

### H1 — Hovering a ruled cell shows a tooltip &nbsp;`⬜`
**Steps:** Hover the ruled cell.
**Expected:** `.fc-tooltip` appears near the cursor with the rule label and value.

### H2 — Tooltip shows a sparkline for time-series &nbsp;`⬜`
**Preconditions:** series with ≥ 2 points.
**Expected:** The tooltip contains a sparkline (`.fc-tooltip-sparkline`).

### H3 — Multi-rule cell shows one series per rule &nbsp;`⬜`
**Preconditions:** two rules mapping to the same cell.
**Expected:** The tooltip lists a series entry per matching rule.

### H4 — Tooltip hides on mouse-out &nbsp;`⬜`
**Steps:** Hover the cell, then move off it.
**Expected:** The tooltip disappears.

---

## I. Navigator (multi-diagram)

### I1 — Navigator hidden with a single diagram &nbsp;`⬜`
**Preconditions:** one flowchart.
**Expected:** No `.fc-navigator` is shown.

### I2 — Navigator shown and pages between diagrams &nbsp;`⬜`
**Preconditions:** two flowcharts.
**Expected:** `.fc-navigator` shows `1 / 2`; clicking next renders the second
diagram and the label becomes `2 / 2`.

### I3 — Navigator buttons disable at the ends &nbsp;`⬜`
**Preconditions:** two flowcharts.
**Expected:** Prev is disabled on the first diagram; Next is disabled on the last.

---

## J. Robustness & errors

### J1 — Invalid XML does not crash the panel &nbsp;`⬜`
**Steps:** Paste malformed / non-draw.io XML → refresh.
**Expected:** No React crash / panel error banner; the diagram area is empty or
shows a placeholder; the rest of the dashboard is unaffected.

### J2 — Missing stencil falls back gracefully &nbsp;`⬜`
**Preconditions:** a diagram referencing a stencil not bundled and CDN blocked.
**Expected:** The unknown shape renders as a blank rectangle (placeholder); the
rest of the diagram renders; only a console warning is emitted.

### J3 — Empty data (no series) &nbsp;`⬜`
**Preconditions:** a ruled panel with a query that returns no data.
**Expected:** The diagram renders with cells at their default styles; no error.

### J4 — Two panels on one dashboard don't interfere &nbsp;`⬜`
**Preconditions:** two FlowCharting panels on one dashboard.
**Expected:** Each renders its own diagram; interacting with one (Escape/zoom)
does not affect the other. Regression guard for the listener-leak fix.

### J5 — Large diagram encodes/decodes without error &nbsp;`⬜`
**Preconditions:** a large diagram (hundreds of cells).
**Expected:** It renders without a stack overflow or codec error (matches the
500 KB unit round-trip test at the e2e level).

---

> **Maintenance:** when you automate a ⬜ case, change its tag to the spec path
> and keep the coverage table in [TESTING.md](../TESTING.md) in sync. Add new
> cases under the matching group (create a new group only for a genuinely new
> functional area).
