// Port of GFDrawio from src/drawio_base.ts
// Handles loading the draw.io viewer-static.min.js via fetch + eval,
// and provides encode/decode utilities using pako.

import { inflateRaw, deflateRaw } from 'pako';
import { GFCONSTANT } from '../../constants';

let _libInitialized = false;
let _loadPromise: Promise<void> | null = null;

export class DrawioEngine {
  // ─── Initialization ─────────────────────────────────────────────────────────

  static isInitialized(): boolean {
    return _libInitialized;
  }

  /**
   * Load and eval the mxGraph/draw.io library from the plugin's static dir.
   * Safe to call multiple times — will only eval once.
   * Guard against React StrictMode double-invoke.
   */
  static async init(baseUrl: string): Promise<void> {
    if (_libInitialized) {
      return;
    }
    // Return existing promise if already in progress (StrictMode double-invoke)
    if (_loadPromise) {
      return _loadPromise;
    }

    _loadPromise = (async () => {
      try {
        await DrawioEngine._preLoad(baseUrl);
        const libUrl = `${baseUrl.replace(/\/$/, '')}/${GFCONSTANT.CONF_FILE_DRAWIOLIB}`;
        const code = await DrawioEngine._fetchText(libUrl);
        await DrawioEngine._evalLib(code, baseUrl);
        await DrawioEngine._postLoad();
        _libInitialized = true;
      } finally {
        _loadPromise = null;
      }
    })();

    return _loadPromise;
  }

  // ─── Encode / Decode ─────────────────────────────────────────────────────────

  static decode(data: string): string {
    try {
      const node = DrawioEngine._parseXml(data).documentElement;
      if (node != null && node.nodeName === 'mxfile') {
        const diagrams = node.getElementsByTagName('diagram');
        if (diagrams.length > 0) {
          data = diagrams[0].textContent ?? '';
        }
      }
    } catch {
      throw new Error('parseXml: Unable to decode mxfile wrapper');
    }

    // base64 → binary string (browser-native; no Node Buffer dependency)
    data = atob(data);

    if (data.length > 0) {
      try {
        data = inflateRaw(
          Uint8Array.from(data, (c) => c.charCodeAt(0)),
          { to: 'string' }
        );
      } catch {
        throw new Error('pako: Unable to inflate raw data');
      }
    }

    try {
      data = decodeURIComponent(data);
    } catch {
      console.error('[DrawioEngine] Unable to decodeURIComponent');
      return '';
    }

    return data;
  }

  static encode(data: string): string {
    try {
      data = encodeURIComponent(data);
    } catch (e) {
      console.error('[DrawioEngine] encodeURIComponent failed', e);
      return '';
    }

    if (data.length > 0) {
      try {
        const deflated = deflateRaw(data) as Uint8Array;
        // Build the binary string in chunks — spreading a large Uint8Array into
        // String.fromCharCode(...) overflows the call stack on big diagrams.
        let binary = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < deflated.length; i += CHUNK) {
          binary += String.fromCharCode.apply(null, Array.from(deflated.subarray(i, i + CHUNK)));
        }
        data = binary;
      } catch (e) {
        console.error('[DrawioEngine] deflateRaw failed', e);
        return '';
      }
    }

    try {
      data = btoa(data);
    } catch (e) {
      console.error('[DrawioEngine] base64 encode failed', e);
      return '';
    }

    return data;
  }

  static isEncoded(data: string): boolean {
    try {
      const node = DrawioEngine._parseXml(data).documentElement;
      if (node?.nodeName === 'mxfile') {
        const diagrams = node.getElementsByTagName('diagram');
        if (diagrams.length > 0) {
          const content = diagrams[0].textContent?.trim() ?? '';
          // If the diagram tag contains child elements it's uncompressed XML,
          // not a base64-encoded string
          return diagrams[0].children.length === 0 && content.length > 0;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // ─── XML utilities ────────────────────────────────────────────────────────────

  static parseXml(xmlString: string): Document {
    return DrawioEngine._parseXml(xmlString);
  }

  static isValidXml(source: string): boolean {
    try {
      const div = document.createElement('div');
      const g = new Graph(div);
      if (DrawioEngine.isEncoded(source)) {
        source = DrawioEngine.decode(source);
      }
      const xmlDoc = mxUtils.parseXml(source);
      const codec = new mxCodec(xmlDoc);
      g.getModel().beginUpdate();
      codec.decode(xmlDoc.documentElement, g.getModel());
      g.getModel().endUpdate();
      g.destroy();
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private static _parseXml(xmlString: string): Document {
    return new DOMParser().parseFromString(xmlString, 'text/xml');
  }

  private static async _fetchText(url: string): Promise<string> {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`[DrawioEngine] Failed to fetch ${url}: ${resp.status}`);
    }
    return resp.text();
  }

  private static async _preLoad(baseUrl: string) {
    const g = globalThis as any;
    const basePath = `${baseUrl.replace(/\/$/, '')}/static/libs/`;
    g.BASE_PATH = basePath;
    g.RESOURCES_PATH = basePath + 'resources/';
    g.RESOURCE_BASE = basePath + 'resources/';
    // Stencils are served from the plugin's own static directory (bundled at
    // build time via CopyPlugin). If a stencil is missing locally (404), the
    // loader falls back to the official draw.io CDN automatically — see
    // _patchStencilLoader() called after eval.
    g.STENCIL_PATH = basePath + 'stencils';
    g.SHAPES_PATH = basePath + 'shapes/';
    g.IMAGE_PATH = basePath + 'images/';
    g.GRAPH_IMAGE_PATH = 'https://viewer.diagrams.net/img';
    g.STYLE_PATH = basePath + 'styles/';
    g.CSS_PATH = basePath + 'css/';
    g.mxLanguages = ['en'];
    g.DRAWIO_BASE_URL = basePath;
    g.DRAW_MATH_URL = basePath;
    g.DRAWIO_VIEWER_URL = `${basePath}viewer.min.js`;
    g.DRAW_MATH_URL = `${basePath}math/`;
    g.DRAWIO_CONFIG = null;
    g.urlParams = {
      sync: 'none',
      lightbox: '1',
      nav: '1',
      local: '1',
      embed: '1',
      ui: 'min',
    };
    g.mxImageBasePath = g.IMAGE_PATH;
    g.mxBasePath = basePath;
    g.mxLoadStylesheets = true;
    g.mxLanguage = 'en';
    g.mxLoadResources = true;
  }

  private static async _evalLib(code: string, _baseUrl: string) {
    // NOTE: eval() is required — viewer-static.min.js is not an ES module.
    // Installations with strict CSP may block this (known limitation).
    globalThis.eval(code);

    // Apply tooltip delay
    if (typeof mxTooltipHandler !== 'undefined') {
      mxTooltipHandler.prototype.delay = GFCONSTANT.CONF_TOOLTIPS_DELAY;
    }

    DrawioEngine._patchStencilLoader();
    DrawioEngine._patchDrawShape();
  }

  /**
   * Patches mxStencilRegistry.loadStencil so that when a local stencil fetch
   * returns 404 (file not bundled), the request is automatically retried
   * against the official draw.io CDN (https://stencils.drawio.com).
   *
   * This gives offline-first behaviour: bundled stencils are served locally
   * with zero latency; exotic/new stencils fall back to the CDN transparently.
   */
  private static _patchStencilLoader() {
    const g = globalThis as any;
    const registry = g.mxStencilRegistry;
    if (!registry || !registry.loadStencil) {
      return;
    }

    const CDN = 'https://stencils.drawio.com';
    const localPrefix: string = g.STENCIL_PATH ?? '';
    const originalLoadStencil = registry.loadStencil.bind(registry);

    // loadStencil is called in two modes:
    // 1. Synchronous: loadStencil(url) — returns XML Document directly
    // 2. Async: loadStencil(url, callback) — calls callback(doc)
    // We must handle both and fall back to CDN when local returns null/error.
    registry.loadStencil = function (url: string, cb?: (doc: Document | null) => void) {
      if (!url.startsWith(localPrefix)) {
        // Not a local URL — pass through unchanged
        return cb ? originalLoadStencil(url, cb) : originalLoadStencil(url);
      }

      const relative = url.slice(localPrefix.length).replace(/^\/+/, '');
      const cdnUrl = `${CDN}/${relative}`;

      if (cb) {
        // Async mode — try local, fall back to CDN
        originalLoadStencil(url, (doc: Document | null) => {
          if (doc != null) {
            cb(doc);
            return;
          }
          console.warn(`[DrawioEngine] Stencil not found locally, trying CDN: ${cdnUrl}`);
          originalLoadStencil(cdnUrl, cb);
        });
      } else {
        // Synchronous mode — try local, fall back to CDN
        try {
          const doc = originalLoadStencil(url);
          if (doc != null) {
            return doc;
          }
        } catch {
          // local fetch failed — fall through to CDN
        }
        console.warn(`[DrawioEngine] Stencil not found locally, trying CDN: ${cdnUrl}`);
        try {
          return originalLoadStencil(cdnUrl);
        } catch {
          return null;
        }
      }
    };
  }

  /**
   * Wraps mxShape.prototype.paint so that if a stencil's drawShape is missing
   * (stencil XML not yet loaded), the shape silently renders as a blank
   * rectangle instead of crashing with "Cannot read properties of undefined
   * (reading 'drawShape')".
   */
  private static _patchDrawShape() {
    const g = globalThis as any;
    const mxShapeProto = g.mxShape?.prototype;
    if (!mxShapeProto || !mxShapeProto.paint) {
      return;
    }
    const originalPaint = mxShapeProto.paint;
    mxShapeProto.paint = function (this: any, c: any) {
      try {
        originalPaint.call(this, c);
      } catch (e: any) {
        // Silently ignore drawShape errors from missing stencils.
        // The deferred refresh in XGraph will re-paint once stencils load.
        if (e?.message?.includes('drawShape') || e?.message?.includes('undefined')) {
          // Draw a placeholder rectangle so the cell is visible
          try {
            if (this.bounds) {
              c.begin();
              c.rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
              c.fillAndStroke();
            }
          } catch { /* ignore */ }
        } else {
          throw e;
        }
      }
    };
  }

  private static async _postLoad() {
    const g = globalThis as any;
    if (g.mxClient) {
      g.mxClient.mxBasePath = g.mxBasePath;
      g.mxClient.mxImageBasePath = g.mxImageBasePath;
      g.mxClient.mxLoadResources = true;
      g.mxClient.mxLanguage = 'en';
      g.mxClient.mxLoadStylesheets = true;
    }
    g.VSD_CONVERT_URL = null;
    g.EMF_CONVERT_URL = null;
    g.ICONSEARCH_PATH = null;
  }
}
