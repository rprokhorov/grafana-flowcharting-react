// Generates the provisioned dashboard JSON used by the rule-coloring e2e test.
// Run: npx ts-node e2e/gen-dashboard.ts
//
// We build the panel options from the plugin's own defaults so the shape always
// matches what FlowChartingPanel expects, then override the one diagram + one
// rule we want to assert on. Regenerate after changing defaults or the diagram.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDefaultOptions } from '../src/defaults';
import { testDiagramXml } from './fixtures';

// The ingress cell in the shared test diagram — the rule will recolor it.
const TARGET_CELL_ID = 'oG_fwXk9lUamU_ajUwbq-3';

const options = getDefaultOptions();

// One flowchart: the shared Kubernetes diagram, unlocked so styles apply.
options.flowchartsData.flowcharts = [
  {
    ...options.flowchartsData.flowcharts[0],
    name: 'K8s',
    xml: testDiagramXml(),
  },
];

// One rule: matches any series (current value), thresholds 0/50/80, and a shape
// map that targets the ingress cell's fill so a high value paints it red.
const rule = options.rulesData.rulesData[0];
rule.alias = 'ingress-status';
rule.pattern = '/.*/';
rule.aggregation = 'current';
rule.mapsDat.shapes.dataList = [
  { pattern: TARGET_CELL_ID, hidden: false, style: 'fillColor', colorOn: 'a' },
];

const dashboard = {
  uid: 'fc-rule-color',
  title: 'FC e2e — rule colors a cell',
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
          // A single series whose last (current) value is 90 → level 2 → red.
          csvContent: 'time,value\n2026-01-01T00:00:00Z,10\n2026-01-01T00:01:00Z,90',
        },
      ],
      options,
      fieldConfig: { defaults: {}, overrides: [] },
    },
  ],
};

const out = join(__dirname, '..', 'provisioning', 'dashboards', 'rule-color.json');
writeFileSync(out, JSON.stringify(dashboard, null, 2));
console.log('wrote', out);
