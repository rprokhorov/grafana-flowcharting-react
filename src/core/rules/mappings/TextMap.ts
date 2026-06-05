import type { TTextMapData, TRuleMapOptions } from '../../../types';
import type { XCell } from '../../drawio/XCell';

export class TextMap {
  data: TTextMapData;

  constructor(data: TTextMapData) {
    this.data = data;
  }

  apply(
    xcells: XCell[],
    formattedValue: string,
    rawValue: string | number | null,
    level: number,
    options: TRuleMapOptions
  ): void {
    const { pattern, hidden, textReplace, textOn } = this.data;
    if (hidden) {
      return;
    }
    const matchedCells = xcells.filter((x) => x.match(pattern, options));

    for (const xcell of matchedCells) {
      // textOn decides whether to write the value at all.
      //   n   — never;  wmd — only when there's metric data;
      //   wc  — only when the rule's condition matched (level > 0);
      //   co  — critical only (highest level, i.e. level >= 1 here too but
      //         conceptually the top threshold).
      if (textOn === 'n') {
        continue;
      }
      if (textOn === 'wmd' && (rawValue === null || rawValue === undefined)) {
        xcell.restoreLabel();
        continue;
      }
      if ((textOn === 'wc' || textOn === 'co') && level <= 0) {
        xcell.restoreLabel();
        continue;
      }

      const value = formattedValue;

      if (textReplace === 'content') {
        // Replace the whole label.
        xcell.setLabel(value);
      } else if (textReplace === 'pattern') {
        // Replace the part of the current label matching textPattern.
        const currentLabel = xcell.getLabel();
        try {
          const re = new RegExp(this.data.textPattern);
          xcell.setLabel(currentLabel.replace(re, value));
        } catch {
          xcell.setLabel(value);
        }
      } else if (textReplace === 'as') {
        // Append the value after the original label.
        const base = xcell.getDefaultValue('value');
        xcell.setLabel(base ? `${base} ${value}` : value);
      } else if (textReplace === 'anl') {
        // Append the value on a new line below the original label.
        const base = xcell.getDefaultValue('value');
        xcell.setLabel(base ? `${base}\n${value}` : value);
      } else {
        xcell.setLabel(value);
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
