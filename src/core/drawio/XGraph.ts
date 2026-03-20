// Port of XGraph from src/graph_class.ts
// Wraps the mxGraph Graph object for a single draw.io diagram.

import { DrawioEngine } from './DrawioEngine';
import { XCell } from './XCell';
import type { TSourceTypeKeys, TStyleColorKeys, TStyleAnimKeys, TRuleMapOptions } from '../../types';
import { GFCONSTANT } from '../../constants';
import { CellPickerService } from '../CellPickerService';
import chroma from 'chroma-js';

export type XGraphOptions = {
  zoom?: string;
  center?: boolean;
  scale?: boolean;
  lock?: boolean;
  enableAnim?: boolean;
  tooltip?: boolean;
  grid?: boolean;
  bgColor?: string | null;
};

export type CellHoverCallback = (cellId: string, x: number, y: number) => void;
export type CellHoverEndCallback = () => void;

export class XGraph {
  readonly container: HTMLDivElement;
  private _type: TSourceTypeKeys;
  private _xmlGraph = '';
  private _csvGraph = '';
  private _graph: any = undefined;
  private _isInitialized = false;
  private _scale = true;
  private _tooltip = true;
  private _lock = true;
  private _center = true;
  private _animation = true;
  private _grid = false;
  private _zoomPercent = '100%';
  private _cumulativeZoomFactor = 1;
  xcells: XCell[] = [];
  private _onCellHover?: CellHoverCallback;
  private _onCellHoverEnd?: CellHoverEndCallback;

  constructor(container: HTMLDivElement, type: TSourceTypeKeys, definition: string, options?: XGraphOptions) {
    this.container = container;
    this._type = type;
    this._applyOptions(options);

    if (type === 'xml') {
      this._xmlGraph = DrawioEngine.isEncoded(definition) ? DrawioEngine.decode(definition) : definition;
    } else {
      this._csvGraph = definition;
    }
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────────

  async initGraph(): Promise<void> {
    if (this._isInitialized || !DrawioEngine.isInitialized()) {
      return;
    }
    this._isInitialized = true;

    try {
      this._createGraph();
    } catch (e) {
      console.error('[XGraph] Failed to create graph', e);
      this._isInitialized = false;
      return;
    }

    // _display, _updateOptions, _initXCells may throw when custom stencils
    // (kubernetes, aws, azure) haven't been fetched yet. mxGraph tries to
    // call drawShape/getGraphBounds on shapes whose stencil XML is still
    // loading asynchronously. We catch ALL errors here, let the graph exist
    // in a partially-rendered state, and rely on _scheduleStencilRefresh()
    // to re-render once stencils are available.
    try { this._display(); } catch (e) {
      console.warn('[XGraph] display error (stencils may still be loading):', e);
    }
    try { this._updateOptions(); } catch (e) {
      console.warn('[XGraph] updateOptions error (stencils may still be loading):', e);
    }
    try { this._initXCells(); } catch (e) {
      console.warn('[XGraph] initXCells error:', e);
    }
    try { this._attachHoverListener(); } catch (e) {
      console.warn('[XGraph] attachHoverListener error:', e);
    }

    this._scheduleStencilRefresh();
  }

  /**
   * After init, schedule two refreshes — a short one (500ms) for fast local
   * stencils and a longer one (2s) for CDN fallback. Each refresh re-renders
   * all cells including those whose stencils are now available.
   */
  private _scheduleStencilRefresh(): void {
    const doRefresh = () => {
      if (!this._isInitialized || !this._graph) {
        return;
      }
      try {
        this._graph.refresh();
        this._updateOptions();
        // Re-init xcells in case the first attempt failed
        if (this.xcells.length === 0) {
          this._initXCells();
        }
      } catch (e) {
        console.warn('[XGraph] deferred refresh error:', e);
      }
    };
    setTimeout(doRefresh, 500);
    setTimeout(doRefresh, 2000);
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  /** Destroy graph — call in React cleanup / useEffect return. */
  free(): void {
    this._graph?.destroy();
    this._graph = undefined;
    this._isInitialized = false;
    this.xcells = [];
  }

  // ─── Options ──────────────────────────────────────────────────────────────────

  setOptions(options: XGraphOptions): void {
    this._applyOptions(options);
    if (this._isInitialized) {
      this._updateOptions();
    }
  }

  // ─── Hover callbacks ──────────────────────────────────────────────────────────

  setHoverCallbacks(onHover: CellHoverCallback, onHoverEnd: CellHoverEndCallback): void {
    this._onCellHover = onHover;
    this._onCellHoverEnd = onHoverEnd;
  }

  // ─── Cell access ──────────────────────────────────────────────────────────────

  getXCells(): XCell[] {
    return this.xcells;
  }

  getXCell(id: string): XCell | undefined {
    return this.xcells.find((x) => x.getId() === id);
  }

  findXCells(pattern: string, options: TRuleMapOptions): XCell[] {
    return this.xcells.filter((x) => x.match(pattern, options));
  }

  getXCellValues(prop: 'id' | 'value' | 'metadata'): string[] {
    return this.xcells.map((x) => x.getDefaultValue(prop));
  }

  getXmlModel(): string {
    if (!this._graph) {
      return '';
    }
    const encoder = new mxCodec();
    const node = encoder.encode(this._graph.getModel());
    return mxUtils.getXml(node);
  }

  // ─── Styling with animation ────────────────────────────────────────────────────

  setAnimColorCell(xcell: XCell, style: TStyleColorKeys, color: string | null): void {
    if (this._animation && color) {
      try {
        const startColor = xcell.getStyle(style);
        if (startColor) {
          const steps = chroma.scale([startColor, color]).mode('lrgb').colors(GFCONSTANT.CONF_COLORS_STEPS + 1);
          const ms = GFCONSTANT.CONF_COLORS_MS;
          for (let i = 1; i < steps.length; i++) {
            setTimeout(() => xcell.setStyle(style, steps[i]), ms * i);
          }
          return;
        }
      } catch {
        // fall through to instant set
      }
    }
    if (color !== null) {
      try {
        color = chroma(color).hex();
      } catch {
        // use as-is
      }
    }
    xcell.setStyle(style, color);
  }

  setAnimStyleCell(xcell: XCell, style: TStyleAnimKeys, endValue: string | null): void {
    if (this._animation && endValue !== null) {
      const end = Number(endValue);
      const begin = Number(xcell.getStyle(style as any) ?? 0);
      if (end !== begin && !isNaN(end) && !isNaN(begin)) {
        const steps = XGraph._interpolate(begin, end, GFCONSTANT.CONF_ANIMS_STEP);
        const ms = GFCONSTANT.CONF_ANIMS_MS;
        for (let i = 1; i < steps.length; i++) {
          setTimeout(() => xcell.setStyle(style as any, steps[i].toString()), ms * i);
        }
        return;
      }
    }
    xcell.setStyle(style as any, endValue);
  }

  // ─── Graph refresh ────────────────────────────────────────────────────────────

  refresh(): void {
    if (!this._isInitialized) {
      return;
    }
    this._cumulativeZoomFactor = 1;
    this._graph?.zoomActual();
    this._updateOptions();
    this._graph?.refresh();
  }

  // ─── Private: graph creation ──────────────────────────────────────────────────

  private _createGraph(): void {
    this._graph = new Graph(this.container);
    this._graph.setPanning(true);
    this._graph.foldingEnabled = true;
    this._graph.cellRenderer.forceControlClickHandler = true;

    // Zoom on mouse wheel
    mxEvent.addMouseWheelListener(
      mxUtils.bind(this, (evt: WheelEvent, up: boolean) => {
        if (this._graph.isZoomWheelEvent(evt)) {
          const rect = this.container.getBoundingClientRect();
          const x = evt.clientX - rect.left;
          const y = evt.clientY - rect.top;
          if (up === undefined || up === null) {
            up = evt.deltaY < 0;
          }
          this._cumulativeZoomFactor *= up ? 1.2 : 0.8;
          this._zoomPointer(this._cumulativeZoomFactor, x, y);
          mxEvent.consume(evt);
        }
      }),
      this.container
    );

    // Escape key resets zoom
    mxEvent.addListener(document, 'keydown', (evt: KeyboardEvent) => {
      if (!mxEvent.isConsumed(evt) && evt.keyCode === 27) {
        this.refresh();
      }
    });

    // Prevent context menu
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private _display(): void {
    if (!this._graph) {
      return;
    }
    this._graph.getModel().beginUpdate();
    this._graph.getModel().clear();
    try {
      if (this._type === 'xml') {
        const xmlDoc = mxUtils.parseXml(this._xmlGraph);
        const codec = new mxCodec(xmlDoc);
        this._graph.model.clear();
        this._graph.view.scale = 1;
        // .drawio files wrap the model in <mxfile><diagram><mxGraphModel>.
        // mxCodec.decode() requires <mxGraphModel> as the root element.
        const root = XGraph._extractGraphModel(xmlDoc);
        codec.decode(root, this._graph.getModel());
        this._initFonts();
        this._graph.updateCssTransform?.();
        this._graph.selectUnlockedLayer?.();
      }
      // CSV import would go here if needed
    } catch (e) {
      // Do NOT rethrow — mxGraph may fail on first render when custom stencils
      // (kubernetes, aws, etc.) are still loading asynchronously. The shapes will
      // appear blank initially, and subsequent refresh() calls will pick them up
      // once the stencil XML has been fetched and registered.
      console.warn('[XGraph] Error during initial diagram decode (may resolve after stencils load):', e);
    } finally {
      this._graph.getModel().endUpdate();
    }
  }

  /**
   * .drawio / mxfile format nests the model inside:
   *   <mxfile> → <diagram> → <mxGraphModel>   (uncompressed)
   *   <mxfile> → <diagram textContent=base64>  (compressed — already decoded by DrawioEngine)
   * If the document root is already <mxGraphModel>, return it as-is.
   */
  private static _extractGraphModel(xmlDoc: Document): Element {
    const root = xmlDoc.documentElement;
    if (root.nodeName === 'mxGraphModel') {
      return root;
    }
    if (root.nodeName === 'mxfile') {
      const diagram = root.getElementsByTagName('diagram')[0];
      if (diagram) {
        const model = diagram.getElementsByTagName('mxGraphModel')[0];
        if (model) {
          return model;
        }
      }
    }
    // Fallback — let mxCodec try with whatever we have
    return root;
  }

  private _initXCells(): void {
    const model = this._graph.getModel();
    this.xcells = [];
    const cells: mxCell[] = Object.values(model.cells);
    for (const mxcell of cells) {
      // Skip root cells (id '0' = root, '1' = default layer)
      if (mxcell.id === '0' || mxcell.id === '1') {
        continue;
      }
      this.xcells.push(XCell.refactore(this._graph, mxcell));
    }
  }

  private _initFonts(): void {
    if (!this._graph) {
      return;
    }
    const model = this._graph.getModel();
    const extFonts: string | undefined = model.extFonts;
    if (!extFonts) {
      return;
    }
    try {
      const fonts = extFonts.split('|').map((ef: string) => {
        const parts = ef.split('^');
        return { name: parts[0], url: parts[1] };
      });
      for (const font of fonts) {
        this._graph.addExtFont?.(font.name, font.url);
      }
    } catch (e: any) {
      console.error('[XGraph] ExtFonts format error:', e.message);
    }
  }

  private _updateOptions(): void {
    if (!this._isInitialized || !this._graph) {
      return;
    }
    // Lock
    this._graph.setEnabled(!this._lock);
    // Tooltip
    this._graph.setTooltips(this._tooltip);
    // Grid background
    this.container.style.backgroundImage = this._grid
      ? "url('data:image/gif;base64,R0lGODlhCgAKAJEAAAAAAP///8zMzP///yH5BAEAAAMALAAAAAAKAAoAAAIJ1I6py+0Po2wFADs=')"
      : '';
    // Background color
    this.container.style.backgroundColor = this._graph.background ?? '';
    // Scale / center / zoom
    if (this._scale) {
      if (this._center) {
        this._fitDisplay();
      } else {
        this._graph.fit();
        this._graph.zoomActual();
      }
    } else {
      this._zoomDisplay();
    }
  }

  private _fitDisplay(): void {
    const margin = 2;
    const max = 3;
    const bounds = this._graph.getGraphBounds();
    const cw = this._graph.container.clientWidth - margin;
    const ch = this._graph.container.clientHeight - margin;
    const w = bounds.width / this._graph.view.scale;
    const h = bounds.height / this._graph.view.scale;
    const s = Math.min(max, Math.min(cw / w, ch / h));
    this._graph.view.scaleAndTranslate(
      s,
      (margin + cw - w * s) / (2 * s) - bounds.x / this._graph.view.scale,
      (margin + ch - h * s) / (2 * s) - bounds.y / this._graph.view.scale
    );
  }

  private _zoomDisplay(): void {
    const percent = this._zoomPercent;
    if (percent && percent.length > 0 && percent !== '100%' && percent !== '0%') {
      const ratio = Number(percent.replace('%', '')) / 100;
      this._graph.zoomTo(ratio, true);
    } else {
      this._graph.zoomActual();
    }
  }

  private _zoomPointer(factor: number, offsetX: number, offsetY: number): void {
    let dx = offsetX * 2;
    let dy = offsetY * 2;
    factor = Math.max(0.01, Math.min(this._graph.view.scale * factor, 160)) / this._graph.view.scale;
    factor = this._cumulativeZoomFactor / this._graph.view.scale;
    const scale = Math.round(this._graph.view.scale * factor * 100) / 100;
    factor = scale / this._graph.view.scale;
    if (factor > 1) {
      const f = (factor - 1) / (scale * 2);
      dx *= -f;
      dy *= -f;
    } else {
      const f = (1 / factor - 1) / (this._graph.view.scale * 2);
      dx *= f;
      dy *= f;
    }
    this._graph.view.scaleAndTranslate(scale, this._graph.view.translate.x + dx, this._graph.view.translate.y + dy);
  }

  private _attachHoverListener(): void {
    if (!this._graph) {
      return;
    }
    this._graph.addMouseListener({
      mouseMove: (_sender: any, evt: mxMouseEvent) => {
        const cell = evt.getCell?.();
        if (cell) {
          const nativeEvt = evt.getEvent?.() as MouseEvent | undefined;
          const x = nativeEvt?.clientX ?? 0;
          const y = nativeEvt?.clientY ?? 0;
          this._onCellHover?.(cell.id, x, y);
        } else {
          this._onCellHoverEnd?.();
        }
      },
      mouseDown: (_sender: any, evt: mxMouseEvent) => {
        if (CellPickerService.isActive()) {
          const cell = evt.getCell?.();
          if (cell && cell.id !== '0' && cell.id !== '1') {
            evt.consume?.();
            CellPickerService.notifyPick(cell.id);
          }
        }
      },
      mouseUp: () => {},
    });
  }

  private _applyOptions(options?: XGraphOptions): void {
    if (!options) {
      return;
    }
    if (options.zoom !== undefined) {
      this._zoomPercent = options.zoom;
    }
    if (options.center !== undefined) {
      this._center = options.center;
    }
    if (options.scale !== undefined) {
      this._scale = options.scale;
    }
    if (options.lock !== undefined) {
      this._lock = options.lock;
    }
    if (options.enableAnim !== undefined) {
      this._animation = options.enableAnim;
    }
    if (options.tooltip !== undefined) {
      this._tooltip = options.tooltip;
    }
    if (options.grid !== undefined) {
      this._grid = options.grid;
    }
  }

  private static _interpolate(begin: number, end: number, steps: number): number[] {
    const result: number[] = [begin];
    const delta = (end - begin) / steps;
    for (let i = 1; i <= steps; i++) {
      result.push(begin + delta * i);
    }
    return result;
  }
}
