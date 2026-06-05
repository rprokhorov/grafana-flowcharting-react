// Generates the provisioned dashboards used by the e2e tests.
// Run: npm run e2e:gen-dashboard
//
// Each dashboard is built from the plugin's own defaults so the option shape
// always matches what FlowChartingPanel expects, then overridden per scenario.
// Regenerate after changing src/defaults.ts or the shared diagram.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDefaultOptions } from '../src/defaults';
import type { FlowChartingOptions } from '../src/types';
import { testDiagramXml } from './fixtures';

// The ingress cell in the shared test diagram — rules target it.
const TARGET_CELL_ID = 'oG_fwXk9lUamU_ajUwbq-3';
const DASHBOARDS_DIR = join(__dirname, '..', 'provisioning', 'dashboards');

type ScenarioOpts = {
  /** Series values; the last is the "current" value rules act on. */
  values: number[];
  /** Threshold/value-type/invert/colorOn overrides on the single rule. */
  invert?: boolean;
  colorOn?: 'a' | 'wc';
};

/** Build panel options: the shared diagram + one shape-map rule on the ingress cell. */
function buildOptions(s: ScenarioOpts): FlowChartingOptions {
  const options = getDefaultOptions();

  options.flowchartsData.flowcharts = [
    { ...options.flowchartsData.flowcharts[0], name: 'K8s', xml: testDiagramXml() },
  ];

  const rule = options.rulesData.rulesData[0];
  rule.alias = 'ingress-status';
  rule.pattern = '/.*/';
  rule.aggregation = 'current';
  rule.invert = s.invert ?? false;
  rule.mapsDat.shapes.dataList = [
    { pattern: TARGET_CELL_ID, hidden: false, style: 'fillColor', colorOn: s.colorOn ?? 'a' },
  ];
  return options;
}

function csv(values: number[]): string {
  const rows = values.map(
    (v, i) => `2026-01-01T00:0${i}:00Z,${v}`
  );
  return ['time,value', ...rows].join('\n');
}

/** Write one dashboard with a single FlowCharting panel. */
function writeDashboard(uid: string, title: string, s: ScenarioOpts): void {
  const dashboard = {
    uid,
    title,
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
            csvContent: csv(s.values),
          },
        ],
        options: buildOptions(s),
        fieldConfig: { defaults: {}, overrides: [] },
      },
    ],
  };
  const out = join(DASHBOARDS_DIR, `${uid}.json`);
  writeFileSync(out, JSON.stringify(dashboard, null, 2));
  console.log('wrote', out);
}

// TC-03 / D1 / F1: current 90 → level 2 red (colorOn=always).
writeDashboard('fc-rule-color', 'FC e2e — rule colors a cell', { values: [10, 90] });

// E1: below first threshold, colorOn=when-condition → cell keeps original fill.
writeDashboard('fc-th-below', 'FC e2e — below threshold', { values: [10], colorOn: 'wc' });

// E2: value 50 → level 1 yellow.
writeDashboard('fc-th-yellow', 'FC e2e — level 1 yellow', { values: [50] });

// E3: value 80 → level 2 red (boundary).
writeDashboard('fc-th-red', 'FC e2e — level 2 red', { values: [80] });

// E4: value 90 with invert on → painted color is still the matched threshold.
writeDashboard('fc-th-invert', 'FC e2e — invert', { values: [90], invert: true });
