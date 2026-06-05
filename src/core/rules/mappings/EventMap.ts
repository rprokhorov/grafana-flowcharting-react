import type { TEventMapData, TRuleMapOptions, TComparatorKeys } from '../../../types';
import type { XCell } from '../../drawio/XCell';
import type { XGraph } from '../../drawio/XGraph';

export class EventMap {
  data: TEventMapData;

  constructor(data: TEventMapData) {
    this.data = data;
  }

  apply(
    xgraph: XGraph,
    xcells: XCell[],
    value: number | string | null,
    level: number,
    options: TRuleMapOptions
  ): void {
    const { pattern, hidden, style, comparator, eventOn, value: threshold } = this.data;
    if (hidden) {
      return;
    }
    const matchedCells = xcells.filter((x) => x.match(pattern, options));

    // The event fires when the comparator matches AND the rule level reaches the
    // configured eventOn threshold (eventOn <= 0 means "any level").
    const fires =
      this._evalComparator(value, comparator, threshold) && level >= (eventOn ?? 0);

    for (const xcell of matchedCells) {
      if (fires) {
        // Apply numeric style change for animation keys; static otherwise.
        xgraph.setAnimStyleCell(xcell, style as any, threshold);
      } else {
        // Revert to the cell's default for this style when the event is off.
        xcell.restoreStyle(style as any);
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
