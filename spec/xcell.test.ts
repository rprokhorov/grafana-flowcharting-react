import { XCell } from '../src/core/drawio/XCell';

// Minimal mxGraph stub: tracks a single cell's style string and supports the
// methods XCell calls (setCellStyles add/remove a key, getCellGeometry).
function makeGraph(cell: any) {
  return {
    getCellGeometry: () => undefined,
    getModel: () => ({ setValue: () => {} }),
    setCellStyles: (key: string, value: string | null, cells: any[]) => {
      const c = cells[0];
      const parts = (c.style || '').split(';').filter(Boolean).filter((p: string) => !p.startsWith(`${key}=`));
      if (value !== null && value !== undefined) {
        parts.push(`${key}=${value}`);
      }
      c.style = parts.join(';');
    },
  };
}

describe('XCell.restoreAllStyles', () => {
  it('removes style keys added by a rule that were not in the original', () => {
    const cell: any = { id: '2', value: '', style: 'fillColor=#111111' };
    const xcell = new XCell(makeGraph(cell), cell);

    // A rule recolors fill and adds a brand-new key.
    xcell.setStyle('fillColor' as any, '#ff0000');
    xcell.setStyle('gradientColor' as any, '#00ff00');
    expect(cell.style).toContain('fillColor=#ff0000');
    expect(cell.style).toContain('gradientColor=#00ff00');

    xcell.restoreAllStyles();

    // Original fill restored, rule-added gradient removed entirely.
    expect(cell.style).toContain('fillColor=#111111');
    expect(cell.style).not.toContain('gradientColor');
  });

  it('keeps original keys intact when nothing extra was added', () => {
    const cell: any = { id: '3', value: '', style: 'fillColor=#222222;strokeColor=#333333' };
    const xcell = new XCell(makeGraph(cell), cell);
    xcell.setStyle('fillColor' as any, '#abcdef');
    xcell.restoreAllStyles();
    expect(cell.style).toContain('fillColor=#222222');
    expect(cell.style).toContain('strokeColor=#333333');
  });
});

describe('XCell links', () => {
  it('uses graph.setLinkForCell when available', () => {
    const calls: Array<[any, string | null]> = [];
    const cell: any = { id: '5', value: '', style: '' };
    const graph: any = {
      getCellGeometry: () => undefined,
      setLinkForCell: (c: any, url: string | null) => calls.push([c, url]),
    };
    const xcell = new XCell(graph, cell);
    xcell.setLink('https://example.com');
    expect(calls).toEqual([[cell, 'https://example.com']]);
  });

  it('falls back to the link attribute on a UserObject value', () => {
    const attrs: Record<string, string> = { label: 'node' };
    const userObject: any = {
      getAttribute: (k: string) => attrs[k] ?? null,
      setAttribute: (k: string, v: string) => { attrs[k] = v; },
      removeAttribute: (k: string) => { delete attrs[k]; },
    };
    const cell: any = { id: '6', value: userObject, style: '' };
    const graph: any = { getCellGeometry: () => undefined, getModel: () => ({ setValue: () => {} }) };
    const xcell = new XCell(graph, cell);

    xcell.setLink('https://example.com/x');
    expect(attrs.link).toBe('https://example.com/x');
    expect(xcell.getLink()).toBe('https://example.com/x');

    xcell.restoreLink(); // original had no link → removed
    expect(attrs.link).toBeUndefined();
  });
});
