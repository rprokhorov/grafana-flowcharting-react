import { Rule } from '../src/core/rules/Rule';
import { getDefaultRuleData } from '../src/defaults';

// Mock @grafana/data
jest.mock('@grafana/data', () => ({
  getValueFormat: () => (value: number) => ({ text: String(value), suffix: '' }),
  formattedValueToString: (fv: { text: string; suffix?: string }) => fv.text + (fv.suffix ?? ''),
}));

describe('Rule.matchMetric', () => {
  it('matches by regex pattern', () => {
    const rule = new Rule({ ...getDefaultRuleData(), pattern: '/cpu.*/' });
    expect(rule.matchMetric('cpu_usage')).toBe(true);
    expect(rule.matchMetric('memory')).toBe(false);
  });

  it('matches wildcard pattern', () => {
    const rule = new Rule({ ...getDefaultRuleData(), pattern: '/.+/' });
    expect(rule.matchMetric('anything')).toBe(true);
  });
});

describe('Rule.getThresholdLevel', () => {
  it('returns correct level for number thresholds', () => {
    const rule = new Rule({
      ...getDefaultRuleData(),
      type: 'number',
      numberTHData: [
        { level: 0, value: 0, color: '#73BF69', comparator: 'ge' },
        { level: 1, value: 50, color: '#FADE2A', comparator: 'ge' },
        { level: 2, value: 80, color: '#F2495C', comparator: 'ge' },
      ],
    });
    expect(rule.getThresholdLevel(10)).toBe(0);
    expect(rule.getThresholdLevel(60)).toBe(1);
    expect(rule.getThresholdLevel(90)).toBe(2);
    expect(rule.getThresholdLevel(null)).toBe(-1);
  });

  it('returns -1 for no matching thresholds', () => {
    const rule = new Rule({
      ...getDefaultRuleData(),
      type: 'number',
      numberTHData: [{ level: 0, value: 50, color: '#73BF69', comparator: 'ge' }],
    });
    expect(rule.getThresholdLevel(10)).toBe(-1);
  });
});

describe('Rule.getFormattedValue', () => {
  it('formats numbers using unit', () => {
    const rule = new Rule({ ...getDefaultRuleData(), unit: 'short', decimals: 2, type: 'number' });
    const result = rule.getFormattedValue(42);
    expect(result).toBeDefined();
  });

  it('applies value mapping', () => {
    const rule = new Rule({
      ...getDefaultRuleData(),
      valueData: [{ value: '1', text: 'Active', hidden: false }],
    });
    expect(rule.getFormattedValue(1)).toBe('Active');
  });

  it('applies range mapping', () => {
    const rule = new Rule({
      ...getDefaultRuleData(),
      rangeData: [{ from: '0', to: '10', text: 'Low', hidden: false }],
    });
    expect(rule.getFormattedValue(5)).toBe('Low');
    expect(rule.getFormattedValue(11)).not.toBe('Low');
  });
});

describe('Rule.getColorForLevel', () => {
  it('returns correct color for level', () => {
    const rule = new Rule({
      ...getDefaultRuleData(),
      type: 'number',
      numberTHData: [
        { level: 0, value: 0, color: '#73BF69', comparator: 'ge' },
        { level: 1, value: 50, color: '#FADE2A', comparator: 'ge' },
      ],
    });
    expect(rule.getColorForLevel(0)).toBe('#73BF69');
    expect(rule.getColorForLevel(1)).toBe('#FADE2A');
  });
});
