# Testing

This plugin is tested at two levels:

| Level | Tool | Location | What it covers |
|---|---|---|---|
| **Unit / core** | Jest + ts-jest (jsdom) | `spec/*.test.ts` | Pure logic — rules, thresholds, metrics, migration, draw.io codec. Fast, no browser. |
| **End-to-end (e2e)** | Playwright + `@grafana/plugin-e2e` | `e2e/*.spec.ts` | The whole stack inside a real Grafana: the panel mounts, the draw.io/mxGraph diagram actually renders. |

The mxGraph/draw.io rendering layer **can only** be verified by e2e — jsdom does
not lay out or render its SVG. Component-level React tests (`@testing-library/react`)
are possible but not written yet; they would mock `XGraph`.

---

## Unit tests (Jest)

No setup needed — just run:

```bash
npm test           # runs all spec/*.test.ts
npx jest --watch   # watch mode while developing
npx jest spec/rule.test.ts   # a single file
```

These run headless in milliseconds and gate every change. `@grafana/data` is
mocked inside the specs, so no Grafana instance is required.

---

## End-to-end tests (Playwright)

`@grafana/plugin-e2e` connects to an **already-running** Grafana — it does not
start its own. So you must have the local container up first.

### 1. Start Grafana with the plugin

The plugin is loaded by bind-mounting `dist/` into a Grafana container named
`grafana-fc` (see the deploy notes / `STENCILS.md`). If it already exists:

```bash
docker start grafana-fc
```

To create it from scratch:

```bash
npm run build
docker run -d --name grafana-fc -p 3000:3000 \
  -v "$(pwd)/dist":/var/lib/grafana/plugins/flowcharting-react-panel \
  -v "$(pwd)/provisioning":/etc/grafana/provisioning \
  -e GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=flowcharting-react-panel \
  -e GF_DEFAULT_APP_MODE=development \
  grafana/grafana:10.4.0
```

The `provisioning/` mount is what makes the provisioned dashboard + TestData
datasource available to the e2e tests (see "Provisioned dashboards" below). If
you created the container earlier without it, recreate it with the command above.

Grafana comes up on http://localhost:3000 (admin / admin). Credentials and URL
are read from `.env` (gitignored); override with `GRAFANA_URL`,
`GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`.

### 2. Run the tests

```bash
npm run e2e                       # headless (CI mode)
npm run e2e -- add-diagram-xml    # a single spec by name
```

### Watching the tests run (visual modes)

| Command | What you see |
|---|---|
| `npm run e2e:ui` | **Playwright UI** — timeline of steps, screenshot per action, time-travel, re-run button. Best for inspecting a run. |
| `npm run e2e:headed` | A real Chromium window; the test runs live (fast). |
| `npm run e2e:debug` | Playwright Inspector — pauses before each action with a "Step over" button. |

Actions fly by in headed mode. Slow them down with `SLOW_MO` (milliseconds per action):

```bash
SLOW_MO=800 npm run e2e:headed -- add-diagram-xml
```

> These open a browser window on **your** screen, so run them in your own
> terminal (not over a headless/remote session).

### After a run

- A failing test stores a trace, screenshot, and video under `e2e/test-results/`.
- Open a trace with `npx playwright show-trace e2e/test-results/<…>/trace.zip`.

---

## Writing a new test

### A new e2e test plan

Drop a `*.spec.ts` into `e2e/` — Playwright picks it up automatically
(`testDir: './e2e'`). Map each manual step to a `test.step(...)` so the report
reads like a checklist. Put large data (XML/JSON) in `e2e/fixtures/`.

```ts
import { test, expect } from '@grafana/plugin-e2e';

test('my scenario', async ({ panelEditPage, page }) => {
  await test.step('select a data source', async () => {
    await panelEditPage.datasource.set('-- Grafana --');
  });
  await test.step('switch to FlowCharting React', async () => {
    await panelEditPage.setVisualization('FlowCharting React');
  });
  // …
});
```

`panelEditPage` already handles login → new dashboard → add panel → pick
datasource, so those steps don't need their own code.

### Provisioned dashboards

For tests that need fixed panel options + data (e.g. asserting a rule recolors a
cell), provisioning is more robust than clicking through the editor. Files live
under `provisioning/` and are mounted into the container at
`/etc/grafana/provisioning`:

```
provisioning/
├── datasources/testdata.yaml      # TestData datasource (uid: testdata)
└── dashboards/
    ├── dashboards.yaml            # file provider
    └── rule-color.json            # generated — panel + rule + csv data
```

`rule-color.json` is **generated** from the plugin's own defaults so its option
shape always matches the panel. Regenerate it after changing `src/defaults.ts`
or the shared diagram:

```bash
npx ts-node e2e/gen-dashboard.ts
```

Open a provisioned dashboard in a test via the `gotoDashboardPage` fixture:

```ts
const dashboardPage = await gotoDashboardPage({ uid: 'fc-rule-color' });
const panel = dashboardPage.getPanelByTitle('K8s topology');
```

### The shared test diagram

`e2e/fixtures/тестовая схема.drawio` is the canonical diagram used across e2e
tests (a Kubernetes topology: ingress → service → 3 pods). Read it through the
helper in `e2e/fixtures.ts` rather than re-reading the file directly:

```ts
import { testDiagramXml, readFixture } from './fixtures';

const xml = testDiagramXml();              // the shared diagram as a string
const other = readFixture('my-other.xml'); // any fixture by name
```

Add new fixtures to `e2e/fixtures/` and reuse the shared diagram where possible
so tests stay consistent.

---

## Test coverage

What is currently covered by automated tests. Keep this table up to date when
adding or removing tests.

### Unit / core (Jest)

| Area | Spec | Cases |
|---|---|---|
| Rules | `spec/rule.test.ts` | metric matching (regex/wildcard); threshold level; value/range mapping & unit formatting; `evaluate` uses the matched threshold's color; `invert` mirrors the severity level only |
| Thresholds | `spec/threshold.test.ts` | NumberThreshold `ge`/`gt`, level+color; StringThreshold `eq`/`ne`; DateThreshold `ge`/`eq`, null handling, date validation |
| Metrics | `spec/metrics.test.ts` | SeriesMetric min/max/avg, data points, name; MetricProcessor frame processing + pattern matching |
| Migration | `spec/migration.test.ts` | old root-level data; old colors/thresholds arrays; empty when no old data |
| draw.io codec | `spec/drawio-codec.test.ts` | encode/decode round-trip (small + 500 KB payload, no stack overflow) |

### End-to-end (Playwright)

| Test plan | Spec | What it asserts |
|---|---|---|
| Panel smoke | `e2e/panel.spec.ts` | "FlowCharting React" is selectable as a visualization; panel mounts (`.fc-panel-wrapper`) with no panel error |
| Add diagram via XML | `e2e/add-diagram-xml.spec.ts` | Paste the shared test diagram's XML (`e2e/fixtures/тестовая схема.drawio`) into the Flowcharts editor → the diagram renders as SVG (>3 path nodes, i.e. stencils loaded) with no panel error |
| Rule colors a cell | `e2e/rule-colors-cell.spec.ts` | Provisioned dashboard: TestData current value 90 → rule level 2 → shape map paints the ingress cell's fillColor red (`#F2495C`) in the rendered SVG |

### Not yet covered

- Flowchart navigator paging between multiple diagrams (e2e).
- React component tests for `FlowChartNavigator`, `DiagramTooltip`,
  `StatusOverlay`, and the rule editors (`@testing-library/react`).
- `LinkMap` behaviour (currently a no-op in `XCell.setLink`).
