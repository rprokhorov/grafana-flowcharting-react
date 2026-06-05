// Generates the provisioned dashboards used by the e2e tests.
// Run: npm run e2e:gen-dashboard
//
// Each dashboard is built from the plugin's own defaults so the option shape
// always matches what FlowChartingPanel expects, then overridden per scenario.
// Regenerate after changing src/defaults.ts or the shared diagram.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDefaultOptions } from '../src/defaults';
import type {
  FlowChartingOptions,
  TAggregationKeys,
  TShapeMapData,
  TTextMapData,
  TValueMapData,
  TRangeMapData,
} from '../src/types';
import { testDiagramXml } from './fixtures';

// The ingress cell in the shared test diagram — rules target it.
const TARGET_CELL_ID = 'oG_fwXk9lUamU_ajUwbq-3';
const DASHBOARDS_DIR = join(__dirname, '..', 'provisioning', 'dashboards');

type ScenarioOpts = {
  /** Series values; the last is the "current" value rules act on. */
  values: number[];
  pattern?: string;
  aggregation?: TAggregationKeys;
  invert?: boolean;
  colorOn?: 'a' | 'wc';
  unit?: string;
  decimals?: number;
  shapeMaps?: TShapeMapData[];
  textMaps?: TTextMapData[];
  valueData?: TValueMapData[];
  rangeData?: TRangeMapData[];
  /** Render two copies of the shared diagram (for the navigator). */
  twoFlowcharts?: boolean;
};

/** Build panel options: the shared diagram + one rule on the ingress cell. */
function buildOptions(s: ScenarioOpts): FlowChartingOptions {
  const options = getDefaultOptions();

  const base = { ...options.flowchartsData.flowcharts[0], name: 'K8s', xml: testDiagramXml() };
  options.flowchartsData.flowcharts = s.twoFlowcharts
    ? [base, { ...base, name: 'K8s-2' }]
    : [base];

  const rule = options.rulesData.rulesData[0];
  rule.alias = 'ingress-status';
  rule.pattern = s.pattern ?? '/.*/';
  rule.aggregation = s.aggregation ?? 'current';
  rule.invert = s.invert ?? false;
  if (s.unit !== undefined) rule.unit = s.unit;
  if (s.decimals !== undefined) rule.decimals = s.decimals;
  if (s.valueData) rule.valueData = s.valueData;
  if (s.rangeData) rule.rangeData = s.rangeData;

  rule.mapsDat.shapes.dataList = s.shapeMaps ?? [
    { pattern: TARGET_CELL_ID, hidden: false, style: 'fillColor', colorOn: s.colorOn ?? 'a' },
  ];
  if (s.textMaps) rule.mapsDat.texts.dataList = s.textMaps;
  return options;
}

function csv(values: number[]): string {
  const rows = values.map((v, i) => `2026-01-01T00:0${i}:00Z,${v}`);
  return ['time,value', ...rows].join('\n');
}

/** Write one dashboard. `panelCount=2` puts two FlowCharting panels side by side. */
function writeDashboard(uid: string, title: string, s: ScenarioOpts, panelCount = 1): void {
  const makePanel = (id: number, x: number) => ({
    id,
    type: 'flowcharting-react-panel',
    title: panelCount > 1 ? `K8s topology ${id}` : 'K8s topology',
    gridPos: { h: 12, w: panelCount > 1 ? 12 : 18, x, y: 0 },
    datasource: { type: 'grafana-testdata-datasource', uid: 'testdata' },
    targets: [
      {
        refId: 'A',
        datasource: { type: 'grafana-testdata-datasource', uid: 'testdata' },
        scenarioId: 'csv_content',
        csvContent: csv(s.values),
      },
    ],
    options: buildOptions(s),
    fieldConfig: { defaults: {}, overrides: [] },
  });

  const panels =
    panelCount === 2 ? [makePanel(1, 0), makePanel(2, 12)] : [makePanel(1, 0)];

  const dashboard = {
    uid,
    title,
    schemaVersion: 39,
    version: 1,
    time: { from: 'now-6h', to: 'now' },
    panels,
  };
  const out = join(DASHBOARDS_DIR, `${uid}.json`);
  writeFileSync(out, JSON.stringify(dashboard, null, 2));
  console.log('wrote', out);
}

const TEXT_MAP: TTextMapData = {
  pattern: TARGET_CELL_ID,
  hidden: false,
  textReplace: 'content',
  textPattern: '',
  textOn: 'wc',
};

// ── E / D / F coloring scenarios ────────────────────────────────────────────
// TC-03 / D1 / F1: current 90 → level 2 red.
writeDashboard('fc-rule-color', 'FC e2e — rule colors a cell', { values: [10, 90] });
// E1: below first threshold, colorOn=when → keeps original fill.
writeDashboard('fc-th-below', 'FC e2e — below threshold', { values: [10], colorOn: 'wc' });
// E2: value 50 → level 1 yellow.
writeDashboard('fc-th-yellow', 'FC e2e — level 1 yellow', { values: [50] });
// E3: value 80 → level 2 red.
writeDashboard('fc-th-red', 'FC e2e — level 2 red', { values: [80] });
// E4: value 90 + invert → painted color is still the matched threshold.
writeDashboard('fc-th-invert', 'FC e2e — invert', { values: [90], invert: true });

// ── D. Metrics & aggregation ────────────────────────────────────────────────
// D2: max of [10,90,30] = 90 → red.
writeDashboard('fc-agg-max', 'FC e2e — max aggregation', { values: [10, 90, 30], aggregation: 'max' });
// D3: avg of [40,60] = 50 → yellow.
writeDashboard('fc-agg-avg', 'FC e2e — avg aggregation', { values: [40, 60], aggregation: 'avg' });
// D5: pattern matches no series → no recolor.
writeDashboard('fc-nomatch', 'FC e2e — no match', { values: [90], pattern: '/does-not-exist/', colorOn: 'wc' });

// ── F / G. Text & value mapping ─────────────────────────────────────────────
// F4: text map replaces the cell label with the formatted value (90).
writeDashboard('fc-text', 'FC e2e — text map', { values: [90], textMaps: [TEXT_MAP] });
// G1: value mapping 90 → "CRIT".
writeDashboard('fc-valuemap', 'FC e2e — value mapping', {
  values: [90],
  textMaps: [TEXT_MAP],
  valueData: [{ value: '90', text: 'CRIT', hidden: false }],
});
// G2: range mapping 0–100 → "OK".
writeDashboard('fc-rangemap', 'FC e2e — range mapping', {
  values: [90],
  textMaps: [TEXT_MAP],
  rangeData: [{ from: '0', to: '100', text: 'OK', hidden: false }],
});
// G3: unit=percent, decimals=1, value 42.5 → "42.5%".
writeDashboard('fc-unit', 'FC e2e — unit & decimals', {
  values: [42.5],
  textMaps: [TEXT_MAP],
  unit: 'percent',
  decimals: 1,
});

// ── H. Tooltip ──────────────────────────────────────────────────────────────
// Multi-point series so the tooltip can draw a sparkline. The shape map matches
// every cell (/.*/ over id) so any hovered cell has a rule state (and series).
writeDashboard('fc-tooltip', 'FC e2e — tooltip', {
  values: [10, 40, 90],
  shapeMaps: [{ pattern: '/.*/', hidden: false, style: 'fillColor', colorOn: 'a' }],
});

// ── I. Navigator ────────────────────────────────────────────────────────────
// Two flowcharts in one panel → navigator appears.
writeDashboard('fc-nav', 'FC e2e — navigator', { values: [90], twoFlowcharts: true });

// ── J. Robustness ───────────────────────────────────────────────────────────
// J4: two panels on one dashboard.
writeDashboard('fc-two-panels', 'FC e2e — two panels', { values: [90] }, 2);
// J3: no data — empty series; cells stay at defaults.
writeDashboard('fc-nodata', 'FC e2e — no data', { values: [], colorOn: 'wc' });

// J1: malformed XML must not crash the panel.
(() => {
  const options = getDefaultOptions();
  options.flowchartsData.flowcharts = [
    { ...options.flowchartsData.flowcharts[0], name: 'broken', xml: '<not-a-diagram><<<' },
  ];
  const dashboard = {
    uid: 'fc-bad-xml',
    title: 'FC e2e — invalid xml',
    schemaVersion: 39,
    version: 1,
    time: { from: 'now-6h', to: 'now' },
    panels: [
      {
        id: 1,
        type: 'flowcharting-react-panel',
        title: 'K8s topology',
        gridPos: { h: 12, w: 18, x: 0, y: 0 },
        datasource: { type: 'grafana-testdata-datasource', uid: 'testdata' },
        targets: [
          {
            refId: 'A',
            datasource: { type: 'grafana-testdata-datasource', uid: 'testdata' },
            scenarioId: 'csv_content',
            csvContent: csv([90]),
          },
        ],
        options,
        fieldConfig: { defaults: {}, overrides: [] },
      },
    ],
  };
  const out = join(DASHBOARDS_DIR, 'fc-bad-xml.json');
  writeFileSync(out, JSON.stringify(dashboard, null, 2));
  console.log('wrote', out);
})();
