// Port of metric_class.ts + metric_handler.ts adapted for Grafana 10 DataFrame API.

import type { PanelData, DataFrame, Field } from '@grafana/data';
import { FieldType, reduceField, ReducerID } from '@grafana/data';
import type { TAggregationKeys, TMetricTypeKeys } from '../../types';
import { regexTest } from '../../utils/regexCache';

export type DataPoint = { x: number; y: number };

// ─── Metric interface ─────────────────────────────────────────────────────────

export interface IMetric {
  name: string;
  type: TMetricTypeKeys;
  getValue(aggregation: TAggregationKeys, column?: string): number | string | null;
  getDataPoints(column?: string): DataPoint[];
  getColumnNames(): string[];
}

// ─── Series metric ────────────────────────────────────────────────────────────

export class SeriesMetric implements IMetric {
  readonly name: string;
  readonly type: TMetricTypeKeys = 'serie';
  private readonly _frame: DataFrame;
  private _stats: Record<string, number | null> = {};

  constructor(frame: DataFrame) {
    this._frame = frame;
    this.name = frame.name ?? frame.refId ?? 'unknown';
    this._computeStats();
  }

  getValue(aggregation: TAggregationKeys): number | string | null {
    if (aggregation === 'graph-hover') {
      return null;
    }
    return this._stats[aggregation] ?? null;
  }

  getDataPoints(): DataPoint[] {
    const timeField = this._frame.fields.find((f) => f.type === FieldType.time);
    const valueField = this._frame.fields.find((f) => f.type === FieldType.number);
    if (!timeField || !valueField) {
      return [];
    }
    const pts: DataPoint[] = [];
    const len = Math.min(timeField.values.length, valueField.values.length);
    for (let i = 0; i < len; i++) {
      pts.push({ x: timeField.values.get(i), y: valueField.values.get(i) });
    }
    return pts;
  }

  getColumnNames(): string[] {
    return ['Time', this.name];
  }

  private _computeStats(): void {
    const valueField = this._frame.fields.find((f) => f.type === FieldType.number);
    if (!valueField) {
      return;
    }

    const vals = valueField.values;
    const len = vals.length;
    if (len === 0) {
      return;
    }

    // Use Grafana's built-in reducers where available
    const reducerIds = [
      ReducerID.min,
      ReducerID.max,
      ReducerID.mean,
      ReducerID.sum,
      ReducerID.count,
      ReducerID.first,
      ReducerID.last,
      ReducerID.delta,
      ReducerID.range,
      ReducerID.diff,
    ];
    const reduced = reduceField({ field: valueField, reducers: reducerIds });

    this._stats['min'] = reduced[ReducerID.min] ?? null;
    this._stats['max'] = reduced[ReducerID.max] ?? null;
    this._stats['avg'] = reduced[ReducerID.mean] ?? null;
    this._stats['total'] = reduced[ReducerID.sum] ?? null;
    this._stats['count'] = reduced[ReducerID.count] ?? null;
    this._stats['first'] = reduced[ReducerID.first] ?? null;
    this._stats['current'] = reduced[ReducerID.last] ?? null;
    this._stats['delta'] = reduced[ReducerID.delta] ?? null;
    this._stats['range'] = reduced[ReducerID.range] ?? null;
    this._stats['diff'] = reduced[ReducerID.diff] ?? null;

    // Custom: first_notnull
    let firstNN: number | null = null;
    for (let i = 0; i < len; i++) {
      const v = vals.get(i);
      if (v !== null && v !== undefined) {
        firstNN = v;
        break;
      }
    }
    this._stats['first_notnull'] = firstNN;

    // Custom: current_notnull
    let currentNN: number | null = null;
    for (let i = len - 1; i >= 0; i--) {
      const v = vals.get(i);
      if (v !== null && v !== undefined) {
        currentNN = v;
        break;
      }
    }
    this._stats['current_notnull'] = currentNN;

    // last_time from time field
    const timeField = this._frame.fields.find((f) => f.type === FieldType.time);
    if (timeField && timeField.values.length > 0) {
      this._stats['last_time'] = timeField.values.get(timeField.values.length - 1);
    }
  }
}

// ─── Table metric ─────────────────────────────────────────────────────────────

export class TableMetric implements IMetric {
  readonly name: string;
  readonly type: TMetricTypeKeys = 'table';
  private readonly _frame: DataFrame;
  private _columnStats: Map<string, Record<string, number | null>> = new Map();

  constructor(frame: DataFrame) {
    this._frame = frame;
    this.name = frame.refId ?? frame.name ?? 'table';
    this._computeStats();
  }

  getValue(aggregation: TAggregationKeys, column = 'Value'): number | string | null {
    if (aggregation === 'graph-hover') {
      return null;
    }
    return this._columnStats.get(column)?.[aggregation] ?? null;
  }

  getDataPoints(column = 'Value'): DataPoint[] {
    const timeField = this._frame.fields.find((f) => f.type === FieldType.time);
    const valueField = this._frame.fields.find((f) => f.name === column);
    if (!valueField) {
      return [];
    }
    const len = valueField.values.length;
    const pts: DataPoint[] = [];
    for (let i = 0; i < len; i++) {
      pts.push({
        x: timeField ? timeField.values.get(i) : i,
        y: valueField.values.get(i),
      });
    }
    return pts;
  }

  getColumnNames(): string[] {
    return this._frame.fields.map((f) => f.name);
  }

  private _computeStats(): void {
    for (const field of this._frame.fields) {
      if (field.type !== FieldType.number) {
        continue;
      }
      const reduced = reduceField({
        field,
        reducers: [
          ReducerID.min,
          ReducerID.max,
          ReducerID.mean,
          ReducerID.sum,
          ReducerID.count,
          ReducerID.first,
          ReducerID.last,
          ReducerID.delta,
          ReducerID.range,
          ReducerID.diff,
        ],
      });
      const stats: Record<string, number | null> = {
        min: reduced[ReducerID.min] ?? null,
        max: reduced[ReducerID.max] ?? null,
        avg: reduced[ReducerID.mean] ?? null,
        total: reduced[ReducerID.sum] ?? null,
        count: reduced[ReducerID.count] ?? null,
        first: reduced[ReducerID.first] ?? null,
        current: reduced[ReducerID.last] ?? null,
        delta: reduced[ReducerID.delta] ?? null,
        range: reduced[ReducerID.range] ?? null,
        diff: reduced[ReducerID.diff] ?? null,
      };

      // first_notnull / current_notnull
      const vals = field.values;
      const len = vals.length;
      let firstNN: number | null = null;
      for (let i = 0; i < len; i++) {
        if (vals.get(i) !== null && vals.get(i) !== undefined) {
          firstNN = vals.get(i);
          break;
        }
      }
      stats['first_notnull'] = firstNN;

      let currentNN: number | null = null;
      for (let i = len - 1; i >= 0; i--) {
        if (vals.get(i) !== null && vals.get(i) !== undefined) {
          currentNN = vals.get(i);
          break;
        }
      }
      stats['current_notnull'] = currentNN;

      this._columnStats.set(field.name, stats);
    }
  }
}

// ─── MetricProcessor ──────────────────────────────────────────────────────────

export class MetricProcessor {
  private _metrics: Map<string, IMetric> = new Map();

  process(data: PanelData): void {
    this._metrics.clear();
    if (!data?.series) {
      return;
    }
    for (const frame of data.series) {
      const isTimeSeries = frame.fields.some((f: Field) => f.type === FieldType.time);
      if (isTimeSeries) {
        const metric = new SeriesMetric(frame);
        this._metrics.set(metric.name, metric);
      } else {
        const metric = new TableMetric(frame);
        this._metrics.set(metric.name, metric);
      }
    }
  }

  getMetric(name: string): IMetric | undefined {
    return this._metrics.get(name);
  }

  getMetrics(): Map<string, IMetric> {
    return this._metrics;
  }

  getValue(name: string, aggregation: TAggregationKeys, column?: string): number | string | null {
    return this._metrics.get(name)?.getValue(aggregation, column) ?? null;
  }

  getDataPoints(name: string, column?: string): DataPoint[] {
    return this._metrics.get(name)?.getDataPoints(column) ?? [];
  }

  /** Like getDataPoints but resolves via pattern matching (same as matchMetrics). */
  getDataPointsByPattern(pattern: string, column?: string): DataPoint[] {
    const matched = this.matchMetrics(pattern);
    return matched.length > 0 ? matched[0].getDataPoints(column) : [];
  }

  matchMetrics(pattern: string): IMetric[] {
    const result: IMetric[] = [];
    for (const [name, metric] of this._metrics) {
      if (regexTest(pattern, name)) {
        result.push(metric);
      }
    }
    return result;
  }

  getMetricNames(): string[] {
    return Array.from(this._metrics.keys());
  }
}
