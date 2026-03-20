import type { TLinkMapData, TRuleMapOptions } from '../../../types';
import type { XCell } from '../../drawio/XCell';

export class LinkMap {
  data: TLinkMapData;

  constructor(data: TLinkMapData) {
    this.data = data;
  }

  apply(xcells: XCell[], level: number): void {
    const { pattern, hidden, linkUrl, linkOn } = this.data;
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
      if (linkOn === 'wc' && level > 0) {
        xcell.setLink(linkUrl);
      } else if (linkOn === 'a') {
        xcell.setLink(linkUrl);
      } else {
        xcell.restoreLink();
      }
    }
  }

  static getDefaultData(): TLinkMapData {
    return {
      pattern: '',
      hidden: false,
      linkUrl: '',
      linkParams: false,
      linkOn: 'wc',
    };
  }
}
