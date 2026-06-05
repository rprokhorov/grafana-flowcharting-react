import type { TTextMapData, TRuleMapOptions } from '../../../types';
import type { XCell } from '../../drawio/XCell';

export class TextMap {
  data: TTextMapData;

  constructor(data: TTextMapData) {
    this.data = data;
  }

  apply(xcells: XCell[], formattedValue: string, rawValue: string | number | null, options: TRuleMapOptions): void {
    const { pattern, hidden, textReplace, textOn } = this.data;
    if (hidden) {
      return;
    }
    const matchedCells = xcells.filter((x) => x.match(pattern, options));

    for (const xcell of matchedCells) {
      if (textOn === 'n') {
        continue;
      }
      if (textOn === 'wmd' && (rawValue === null || rawValue === undefined)) {
        xcell.restoreLabel();
        continue;
      }

      let newLabel = formattedValue;

      if (textReplace === 'content') {
        xcell.setLabel(newLabel);
      } else if (textReplace === 'pattern') {
        const currentLabel = xcell.getLabel();
        try {
          const re = new RegExp(this.data.textPattern);
          xcell.setLabel(currentLabel.replace(re, newLabel));
        } catch {
          xcell.setLabel(newLabel);
        }
      } else if (textReplace === 'as') {
        xcell.setLabel(newLabel);
      } else {
        xcell.setLabel(newLabel);
      }
    }
  }

  static getDefaultData(): TTextMapData {
    return {
      pattern: '',
      hidden: false,
      textReplace: 'content',
      textPattern: '',
      textOn: 'wc',
    };
  }
}
