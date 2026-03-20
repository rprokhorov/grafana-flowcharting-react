import type { TShapeMapData, TRuleMapOptions } from '../../../types';
import type { XCell } from '../../drawio/XCell';
import type { XGraph } from '../../drawio/XGraph';

export class ShapeMap {
  data: TShapeMapData;

  constructor(data: TShapeMapData) {
    this.data = data;
  }

  apply(xgraph: XGraph, xcells: XCell[], level: number, color: string, highestLevel: number): void {
    const { colorOn, style, hidden, pattern } = this.data;
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
    for (const xcell of matchedCells) {
      if (colorOn === 'n') {
        // Never apply color
        continue;
      }
      if (colorOn === 'wc') {
        // Apply when condition matches (level > 0)
        if (level > 0) {
          xgraph.setAnimColorCell(xcell, style, color);
        } else {
          xcell.restoreStyle(style);
        }
      }
      if (colorOn === 'a') {
        // Always apply
        xgraph.setAnimColorCell(xcell, style, color);
      }
    }
  }

  static getDefaultData(): TShapeMapData {
    return {
      pattern: '',
      hidden: false,
      style: 'fillColor',
      colorOn: 'wc',
    };
  }
}
