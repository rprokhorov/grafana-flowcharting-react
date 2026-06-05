// Port of XCell from src/cell_class.ts
// Wraps an individual mxGraph cell (mxCell) with GF-specific logic.

import type { TStyleKeys, TStyleColorKeys, TPropertieKey, TRuleMapOptions } from '../../types';
import { regexTest } from '../../utils/regexCache';

export interface XCellDefaultValues {
  id: string | null | undefined;
  /** Original raw value (may be a UserObject DOM node) */
  value: any;
  /** Original visible label text, extracted from the value */
  label: string | null | undefined;
  link: string | null | undefined;
  styles: Map<TStyleKeys, any> | undefined;
  dimension: mxGeometry | undefined;
}

export class XCell {
  readonly mxcell: mxCell;
  readonly uid: string;
  private readonly _graph: any;
  private _defaultValues: XCellDefaultValues;
  /** Style keys written by setStyle that were not in the original style. */
  private _appliedStyleKeys = new Set<TStyleKeys>();
  percent = 100;

  constructor(graph: any, mxcell: mxCell) {
    this._graph = graph;
    this.mxcell = mxcell;
    this.uid = `xcell-${mxcell.id ?? Math.random().toString(36).slice(2)}`;
    this._defaultValues = this._captureDefaults();
  }

  // ─── Factory ──────────────────────────────────────────────────────────────────

  static refactore(graph: any, mxcell: mxCell): XCell {
    return new XCell(graph, mxcell);
  }

  // ─── ID ───────────────────────────────────────────────────────────────────────

  getId(): string {
    return this.mxcell.id ?? '';
  }

  getDefaultValue(key: TPropertieKey): string {
    if (key === 'id') {
      return this._defaultValues.id ?? '';
    }
    if (key === 'value') {
      return this._defaultValues.label ?? '';
    }
    if (key === 'metadata') {
      return '';
    }
    return '';
  }

  getDefaultValues(options: TRuleMapOptions): string[] {
    const key = options.identByProp;
    if (key === 'metadata' && options.metadata) {
      return this._getMetadataValues(options.metadata);
    }
    return [this.getDefaultValue(key)];
  }

  // ─── Label ────────────────────────────────────────────────────────────────────

  getLabel(): string {
    const value = this.mxcell.value;
    // draw.io stores labels as DOM nodes (UserObject) when a cell carries
    // metadata. In that case the visible text lives in the `label` attribute.
    if (value != null && typeof value === 'object') {
      return value.getAttribute?.('label') ?? '';
    }
    return value ?? '';
  }

  setLabel(value: string): void {
    const current = this.mxcell.value;
    // Preserve metadata: when the value is a UserObject DOM node, only update
    // its `label` attribute instead of replacing the whole node (which would
    // destroy the cell's metadata).
    if (current != null && typeof current === 'object' && current.setAttribute) {
      current.setAttribute('label', value);
      this._graph.getModel().setValue(this.mxcell, current);
      return;
    }
    this._graph.getModel().setValue(this.mxcell, value);
  }

  restoreLabel(): void {
    if (this._defaultValues.label !== undefined) {
      this.setLabel(this._defaultValues.label ?? '');
    }
  }

  // ─── Link ─────────────────────────────────────────────────────────────────────

  getLink(): string | null {
    const value = this.mxcell.value;
    if (value != null && typeof value === 'object') {
      return value.getAttribute?.('link') ?? value.getAttribute?.('href') ?? null;
    }
    return this._defaultValues.link ?? null;
  }

  setLink(url: string | null): void {
    // draw.io stores a cell link as the `link` attribute on a UserObject value.
    // graph.setLinkForCell wraps a plain value in a UserObject and makes the
    // cell clickable; fall back to setting the attribute directly if it's absent.
    if (typeof this._graph.setLinkForCell === 'function') {
      this._graph.setLinkForCell(this.mxcell, url ?? null);
      return;
    }
    const value = this.mxcell.value;
    if (value != null && typeof value === 'object' && value.setAttribute) {
      if (url) {
        value.setAttribute('link', url);
      } else {
        value.removeAttribute?.('link');
      }
      this._graph.getModel().setValue(this.mxcell, value);
    }
  }

  restoreLink(): void {
    this.setLink(this._defaultValues.link ?? null);
  }

  // ─── Style ────────────────────────────────────────────────────────────────────

  getStyle(key: TStyleKeys): string | null {
    const style = this.mxcell.style ?? '';
    const regex = new RegExp(`(?:^|;)${key}=([^;]*)`);
    const match = style.match(regex);
    return match ? match[1] : null;
  }

  setStyle(key: TStyleKeys, value: string | null): void {
    // Remember keys that weren't part of the cell's original style so they can
    // be removed on restore — otherwise a rule that adds e.g. gradientColor
    // would leave it behind once the rule no longer matches.
    if (value !== null && !this._defaultValues.styles?.has(key)) {
      this._appliedStyleKeys.add(key);
    }
    this._graph.setCellStyles(key, value, [this.mxcell]);
  }

  restoreStyle(key?: TStyleKeys): void {
    if (!this._defaultValues.styles) {
      return;
    }
    if (key) {
      const defaultVal = this._defaultValues.styles.get(key) ?? null;
      this.setStyle(key, defaultVal);
    } else {
      this._defaultValues.styles.forEach((val, k) => {
        this.setStyle(k, val ?? null);
      });
    }
  }

  restoreAllStyles(): void {
    // Remove any keys a rule added that weren't in the original style.
    if (this._appliedStyleKeys.size > 0) {
      this._appliedStyleKeys.forEach((k) => {
        this._graph.setCellStyles(k, null, [this.mxcell]);
      });
      this._appliedStyleKeys.clear();
    }
    if (!this._defaultValues.styles) {
      return;
    }
    this._defaultValues.styles.forEach((val, k) => {
      this._graph.setCellStyles(k, val ?? null, [this.mxcell]);
    });
  }

  // ─── Dimension / Geometry ─────────────────────────────────────────────────────

  getDimension(): mxGeometry {
    const geo = this._graph.getCellGeometry(this.mxcell);
    return geo ?? { x: 0, y: 0, width: 100, height: 60 };
  }

  zoom(percent: number): void {
    const dim = this._defaultValues.dimension;
    if (!dim) {
      return;
    }
    const factor = percent / 100;
    const geo = this._graph.getCellGeometry(this.mxcell)?.clone();
    if (geo) {
      geo.width = dim.width * factor;
      geo.height = dim.height * factor;
      this._graph.getModel().setGeometry(this.mxcell, geo);
    }
    this.percent = percent;
  }

  resize(width: number | undefined, height: number | undefined): void {
    const geo = this._graph.getCellGeometry(this.mxcell)?.clone();
    if (geo) {
      if (width !== undefined) {
        geo.width = width;
      }
      if (height !== undefined) {
        geo.height = height;
      }
      this._graph.getModel().setGeometry(this.mxcell, geo);
    }
  }

  // ─── Visual effects ───────────────────────────────────────────────────────────

  highlight(bool = true): void {
    if (bool) {
      const highlight = new mxCellHighlight(this._graph, '#00FF00', 2);
      highlight.highlight(this._graph.view.getState(this.mxcell));
    }
  }

  hide(): void {
    this.setStyle('visibility' as TStyleKeys, 'hidden');
  }

  show(): void {
    this.setStyle('visibility' as TStyleKeys, 'visible');
  }

  // ─── Match ────────────────────────────────────────────────────────────────────

  match(pattern: string, options: TRuleMapOptions): boolean {
    const values = this.getDefaultValues(options);
    for (const v of values) {
      if (!v) {
        continue;
      }
      if (options.enableRegEx) {
        if (regexTest(pattern, v)) {
          return true;
        }
      } else if (v === pattern) {
        return true;
      }
    }
    return false;
  }

  // ─── Utilities ────────────────────────────────────────────────────────────────

  isVertex(): boolean {
    return this.mxcell.isVertex?.() ?? !this.mxcell.edge;
  }

  getMxCell(): mxCell {
    return this.mxcell;
  }

  getMxCellState(): mxCellState | null {
    return this._graph.view?.getState(this.mxcell) ?? null;
  }

  cloneMxCell(): mxCell {
    return this._graph.getModel().cloneCell(this.mxcell);
  }

  // ─── Private ──────────────────────────────────────────────────────────────────

  private _captureDefaults(): XCellDefaultValues {
    const styles = new Map<TStyleKeys, any>();
    const styleStr: string = this.mxcell.style ?? '';
    const parts = styleStr.split(';').filter(Boolean);
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx > -1) {
        const k = part.slice(0, eqIdx) as TStyleKeys;
        const v = part.slice(eqIdx + 1);
        styles.set(k, v);
      }
    }

    const geo: mxGeometry | undefined = this._graph?.getCellGeometry?.(this.mxcell) ?? undefined;

    const rawValue = this.mxcell.value ?? null;
    const label =
      rawValue != null && typeof rawValue === 'object'
        ? rawValue.getAttribute?.('label') ?? ''
        : rawValue;
    const link =
      rawValue != null && typeof rawValue === 'object'
        ? rawValue.getAttribute?.('link') ?? null
        : null;

    return {
      id: this.mxcell.id ?? null,
      value: rawValue,
      label,
      link,
      styles,
      dimension: geo ? { x: geo.x, y: geo.y, width: geo.width, height: geo.height } : undefined,
    };
  }

  private _getMetadataValues(metadataKey: string): string[] {
    // For cells with XML value (like <UserObject label="..." key="val">)
    try {
      if (typeof this.mxcell.value === 'object' && this.mxcell.value?.getAttribute) {
        const v = this.mxcell.value.getAttribute(metadataKey);
        if (v) {
          return [v];
        }
      }
    } catch {
      // ignore
    }
    return [];
  }
}
