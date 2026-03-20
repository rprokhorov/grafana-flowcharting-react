import type { TEventMapData, TRuleMapOptions, TComparatorKeys } from '../../../types';
import type { XCell } from '../../drawio/XCell';
import type { XGraph } from '../../drawio/XGraph';

export class EventMap {
  data: TEventMapData;

  constructor(data: TEventMapData) {
    this.data = data;
  }

  apply(xgraph: XGraph, xcells: XCell[], value: number | string | null): void {
    const { pattern, hidden, style, comparator, eventOn, value: threshold } = this.data;
    if (hidden) {
      return;
    }
    const matchedCells = xcells.filter((x) =>
      x.match(pattern, {
        identByProp: 'id',
        metadata: '',
        enableRegEx: true,
      } as TRuleMapOptions)
    );

    const matches = this._evalComparator(value, comparator, threshold);

    for (const xcell of matchedCells) {
      if (matches) {
        // Apply numeric style change for animation keys; static otherwise
        xgraph.setAnimStyleCell(xcell, style as any, threshold);
      }
    }
  }

  private _evalComparator(value: number | string | null, comparator: TComparatorKeys, threshold: string): boolean {
    if (value === null) {
      return comparator === 'al';
    }
    if (comparator === 'al') {
      return true;
    }
    const numVal = Number(value);
    const numThr = Number(threshold);
    if (!isNaN(numVal) && !isNaN(numThr)) {
      switch (comparator) {
        case 'lt':
          return numVal < numThr;
        case 'le':
          return numVal <= numThr;
        case 'eq':
          return numVal === numThr;
        case 'ne':
          return numVal !== numThr;
        case 'ge':
          return numVal >= numThr;
        case 'gt':
          return numVal > numThr;
      }
    }
    // String comparison
    switch (comparator) {
      case 'eq':
        return String(value) === threshold;
      case 'ne':
        return String(value) !== threshold;
      default:
        return false;
    }
  }

  static getDefaultData(): TEventMapData {
    return {
      pattern: '',
      hidden: false,
      style: 'opacity',
      comparator: 'ge',
      eventOn: 0,
      value: '0',
    };
  }
}
