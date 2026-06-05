import { RuleEngine } from '../src/core/rules/RuleEngine';
import { getDefaultRuleData } from '../src/defaults';

jest.mock('@grafana/data', () => ({
  getValueFormat: () => (value: number) => ({ text: String(value), suffix: '' }),
  formattedValueToString: (fv: { text: string; suffix?: string }) => fv.text + (fv.suffix ?? ''),
}));

// Minimal metric stub.
function metric(name: string, value: number) {
  return {
    name,
    type: 'serie' as const,
    getValue: () => value,
    getDataPoints: () => [],
    getColumnNames: () => [],
  };
}

// Minimal MetricProcessor stub: matchMetrics returns every metric (pattern /.*/).
function metricsStub(metrics: any[]) {
  return { matchMetrics: () => metrics } as any;
}

// One xcell that always matches; records style writes.
function xcellStub(id: string) {
  const styles: Record<string, string | null> = {};
  return {
    getId: () => id,
    match: () => true,
    restoreAllStyles: () => {},
    restoreLabel: () => {},
    setStyle: (k: string, v: string | null) => { styles[k] = v; },
    getStyle: () => null,
    _styles: styles,
  } as any;
}

function xgraphStub(xcells: any[]) {
  return {
    findXCells: () => xcells,
    setAnimColorCell: (xc: any, style: string, color: string) => xc.setStyle(style, color),
    setAnimStyleCell: () => {},
  } as any;
}

describe('RuleEngine.applyAll with multiple matched metrics', () => {
  it('styles by the highest-level metric and keeps a tooltip entry per metric', () => {
    const ruleData = {
      ...getDefaultRuleData(),
      pattern: '/.*/',
      type: 'number' as const,
      aggregation: 'current' as const,
      numberTHData: [
        { level: 0, value: 0, color: '#73BF69', comparator: 'ge' as const },
        { level: 1, value: 50, color: '#FADE2A', comparator: 'ge' as const },
        { level: 2, value: 80, color: '#F2495C', comparator: 'ge' as const },
      ],
    };
    ruleData.mapsDat.shapes.dataList = [
      { pattern: 'x', hidden: false, style: 'fillColor', colorOn: 'a' },
    ];

    const engine = new RuleEngine({ rulesData: [ruleData] });
    const xcell = xcellStub('cell-1');
    const metrics = metricsStub([metric('low', 30), metric('high', 90)]);

    const stateMap = engine.applyAll(metrics, xgraphStub([xcell]), [xcell]);
    const state = stateMap.get('cell-1')!;

    // Highest level wins for styling (90 → level 2 red).
    expect(state.level).toBe(2);
    expect(state.color).toBe('#F2495C');
    // Both metrics produce a tooltip entry.
    expect(state.allMatches).toHaveLength(2);
    expect(state.allMatches.map((m) => m.metricPattern).sort()).toEqual(['high', 'low']);
  });
});
