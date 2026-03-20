import { MetricProcessor, SeriesMetric, TableMetric } from '../src/core/metrics/MetricProcessor';

// Mock @grafana/data
jest.mock('@grafana/data', () => {
  const FieldType = { time: 'time', number: 'number', string: 'string', other: 'other' };
  const ReducerID = {
    min: 'min', max: 'max', mean: 'mean', sum: 'sum', count: 'count',
    first: 'first', last: 'last', delta: 'delta', range: 'range', diff: 'diff',
  };
  const reduceField = ({ field, reducers }: any) => {
    const values: number[] = Array.from({ length: field.values.length }, (_, i) => field.values.get(i)).filter((v: any) => v !== null);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const count = values.length;
    return {
      min, max, mean: sum / count, sum, count,
      first: values[0], last: values[values.length - 1],
      delta: 0, range: max - min, diff: values[values.length - 1] - values[0],
    };
  };
  return { FieldType, ReducerID, reduceField };
});

function makeField(type: string, values: any[], name = 'value') {
  return {
    type,
    name,
    values: {
      length: values.length,
      get: (i: number) => values[i],
    },
  };
}

function makeFrame(name: string, fields: any[], refId = 'A') {
  return { name, refId, fields };
}

describe('SeriesMetric', () => {
  const frame = makeFrame('cpu_usage', [
    makeField('time', [1000, 2000, 3000]),
    makeField('number', [10, 50, 80]),
  ]);

  it('computes min/max/avg', () => {
    const metric = new SeriesMetric(frame as any);
    expect(metric.getValue('min')).toBe(10);
    expect(metric.getValue('max')).toBe(80);
    expect(metric.getValue('avg')).toBeCloseTo(46.67, 1);
  });

  it('returns data points', () => {
    const metric = new SeriesMetric(frame as any);
    const pts = metric.getDataPoints();
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual({ x: 1000, y: 10 });
  });

  it('has correct name', () => {
    const metric = new SeriesMetric(frame as any);
    expect(metric.name).toBe('cpu_usage');
  });
});

describe('MetricProcessor', () => {
  it('processes time-series frames', () => {
    const processor = new MetricProcessor();
    const data = {
      series: [
        makeFrame('my_metric', [
          makeField('time', [1000, 2000]),
          makeField('number', [10, 20]),
        ]),
      ],
    };
    processor.process(data as any);
    expect(processor.getMetricNames()).toContain('my_metric');
    const metric = processor.getMetric('my_metric');
    expect(metric?.type).toBe('serie');
  });

  it('matches metrics by pattern', () => {
    const processor = new MetricProcessor();
    const data = {
      series: [
        makeFrame('cpu_usage', [makeField('time', [1000]), makeField('number', [10])]),
        makeFrame('mem_usage', [makeField('time', [1000]), makeField('number', [20])]),
      ],
    };
    processor.process(data as any);
    const matched = processor.matchMetrics('/cpu.*/');
    expect(matched).toHaveLength(1);
    expect(matched[0].name).toBe('cpu_usage');
  });
});
