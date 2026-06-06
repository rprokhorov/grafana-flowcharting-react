// Port of Rule class from src/rule_class.ts — Angular dependencies removed.

import { getValueFormat, formattedValueToString } from '@grafana/data';
import type {
  TIRuleData,
  TRuleMapOptions,
  TValueTypeKeys,
  TTHNumberData,
  TTHStringData,
  TTHDateData,
  TShapeMapData,
  TTextMapData,
  TLinkMapData,
  TEventMapData,
  TValueMapData,
  TRangeMapData,
} from '../../types';
import type { IMetric } from '../metrics/MetricProcessor';
import type { XCell } from '../drawio/XCell';
import type { XGraph } from '../drawio/XGraph';
import { NumberThreshold } from './thresholds/NumberThreshold';
import { StringThreshold } from './thresholds/StringThreshold';
import { DateThreshold } from './thresholds/DateThreshold';
import { ShapeMap } from './mappings/ShapeMap';
import { TextMap } from './mappings/TextMap';
import { LinkMap } from './mappings/LinkMap';
import { EventMap } from './mappings/EventMap';
import { regexTest } from '../../utils/regexCache';

export interface RuleEvaluationResult {
  level: number;
  color: string;
  formattedValue: string;
  rawValue: string | number | null;
}

export class Rule {
  data: TIRuleData;
  private _numberTH: NumberThreshold[] = [];
  private _stringTH: StringThreshold[] = [];
  private _dateTH: DateThreshold[] = [];
  private _shapeMaps: ShapeMap[] = [];
  private _textMaps: TextMap[] = [];
  private _linkMaps: LinkMap[] = [];
  private _eventMaps: EventMap[] = [];

  constructor(data: TIRuleData) {
    this.data = data;
    this._buildThresholds();
    this._buildMaps();
  }

  // ─── Metric matching ──────────────────────────────────────────────────────────

  matchMetric(name: string): boolean {
    return regexTest(this.data.pattern, name);
  }

  // ─── Threshold evaluation ─────────────────────────────────────────────────────

  getThresholdLevel(value: string | number | null): number {
    if (value === null || value === undefined) {
      return -1;
    }
    const type: TValueTypeKeys = this.data.type;

    if (type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        return -1;
      }
      let highestLevel = -1;
      for (const th of this._numberTH) {
        if (th.matches(num) && th.getLevel() > highestLevel) {
          highestLevel = th.getLevel();
        }
      }
      return highestLevel;
    }

    if (type === 'string') {
      const str = String(value);
      let highestLevel = -1;
      for (const th of this._stringTH) {
        if (th.matches(str) && th.getLevel() > highestLevel) {
          highestLevel = th.getLevel();
        }
      }
      return highestLevel;
    }

    if (type === 'date') {
      let highestLevel = -1;
      for (const th of this._dateTH) {
        if (th.matches(value as string | number) && th.getLevel() > highestLevel) {
          highestLevel = th.getLevel();
        }
      }
      return highestLevel;
    }

    return -1;
  }

  getColorForLevel(level: number): string {
    if (level < 0) {
      return this._getDefaultColor();
    }
    if (this.data.type === 'number') {
      const th = this._numberTH.find((t) => t.getLevel() === level);
      return th?.getColor() ?? this._getDefaultColor();
    }
    if (this.data.type === 'string') {
      const th = this._stringTH.find((t) => t.getLevel() === level);
      return th?.getColor() ?? this._getDefaultColor();
    }
    if (this.data.type === 'date') {
      const th = this._dateTH.find((t) => t.getLevel() === level);
      return th?.getColor() ?? this._getDefaultColor();
    }
    return this._getDefaultColor();
  }

  // ─── Value formatting ─────────────────────────────────────────────────────────

  getFormattedValue(value: string | number | null): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Value mapping (exact match)
    const mapped = this._applyValueMapping(value);
    if (mapped !== null) {
      return mapped;
    }

    // Range mapping
    const rangeMapped = this._applyRangeMapping(value);
    if (rangeMapped !== null) {
      return rangeMapped;
    }

    // Grafana formatter
    if (this.data.type === 'number') {
      const num = Number(value);
      if (!isNaN(num)) {
        try {
          const formatter = getValueFormat(this.data.unit || 'short');
          return formattedValueToString(formatter(num, this.data.decimals ?? 2));
        } catch {
          return String(value);
        }
      }
    }

    return String(value);
  }

  // ─── Evaluate against metric ──────────────────────────────────────────────────

  evaluate(metric: IMetric): RuleEvaluationResult {
    const rawValue = metric.getValue(this.data.aggregation, this.data.column || undefined);
    // matchedLevel = the threshold the value actually crossed; its color is the
    // one we paint with. `level` is the severity used for cross-rule comparison
    // and may be inverted (low values treated as high) when `invert` is set.
    const matchedLevel = this.getThresholdLevel(rawValue);
    const color = this.getColorForLevel(matchedLevel);
    const level = this._applyInvert(matchedLevel);
    const formattedValue = this.getFormattedValue(rawValue);
    return { level, color, formattedValue, rawValue };
  }

  /** Mirror a matched level across the threshold range when `invert` is on. */
  private _applyInvert(level: number): number {
    if (!this.data.invert || level < 0 || this.data.type !== 'number') {
      return level;
    }
    const maxLevel = this._numberTH.reduce((m, t) => Math.max(m, t.getLevel()), 0);
    return maxLevel - level;
  }

  // ─── Apply maps to cells ──────────────────────────────────────────────────────

  applyMapsToXCells(
    xgraph: XGraph,
    xcells: XCell[],
    result: RuleEvaluationResult
  ): void {
    const { level, color, formattedValue, rawValue } = result;
    const maps = this.data.mapsDat;

    for (const sm of this._shapeMaps) {
      sm.apply(xgraph, xcells, level, color, level, maps.shapes.options);
    }
    for (const tm of this._textMaps) {
      tm.apply(xcells, formattedValue, rawValue, level, maps.texts.options);
    }
    for (const lm of this._linkMaps) {
      lm.apply(xcells, level, maps.links.options);
    }
    for (const em of this._eventMaps) {
      em.apply(xgraph, xcells, rawValue, level, maps.events.options);
    }
  }

  // ─── Default map options ──────────────────────────────────────────────────────

  static getDefaultMapOptions(): TRuleMapOptions {
    return {
      identByProp: 'id',
      metadata: '',
      enableRegEx: true,
    };
  }

  // ─── Private ──────────────────────────────────────────────────────────────────

  private _buildThresholds(): void {
    this._numberTH = (this.data.numberTHData ?? []).map((d) => new NumberThreshold(d));
    this._stringTH = (this.data.stringTHData ?? []).map((d) => new StringThreshold(d));
    this._dateTH = (this.data.dateTHData ?? []).map((d) => new DateThreshold(d));
  }

  private _buildMaps(): void {
    this._shapeMaps = (this.data.mapsDat?.shapes?.dataList ?? []).map((d: TShapeMapData) => new ShapeMap(d));
    this._textMaps = (this.data.mapsDat?.texts?.dataList ?? []).map((d: TTextMapData) => new TextMap(d));
    this._linkMaps = (this.data.mapsDat?.links?.dataList ?? []).map((d: TLinkMapData) => new LinkMap(d));
    this._eventMaps = (this.data.mapsDat?.events?.dataList ?? []).map((d: TEventMapData) => new EventMap(d));
  }

  private _getDefaultColor(): string {
    if (this.data.numberTHData?.length > 0) {
      return this.data.numberTHData[0].color;
    }
    return '#73BF69';
  }

  private _applyValueMapping(value: string | number | null): string | null {
    if (!this.data.valueData?.length || value === null) {
      return null;
    }
    const strVal = String(value);
    for (const vm of this.data.valueData) {
      if (vm.value === strVal && vm.text !== undefined) {
        return vm.text;
      }
    }
    return null;
  }

  private _applyRangeMapping(value: string | number | null): string | null {
    if (!this.data.rangeData?.length || value === null) {
      return null;
    }
    const num = Number(value);
    if (isNaN(num)) {
      return null;
    }
    for (const rm of this.data.rangeData) {
      const from = rm.from !== undefined ? Number(rm.from) : -Infinity;
      const to = rm.to !== undefined ? Number(rm.to) : Infinity;
      if (num >= from && num <= to && rm.text !== undefined) {
        return rm.text;
      }
    }
    return null;
  }
}
