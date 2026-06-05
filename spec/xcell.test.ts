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
