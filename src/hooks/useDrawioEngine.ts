import { useState, useEffect } from 'react';
import { config } from '@grafana/runtime';
import { DrawioEngine } from '../core/drawio/DrawioEngine';

/**
 * Initializes the draw.io engine (viewer-static.min.js) once.
 * Returns `ready = true` when the engine is loaded and eval'd.
 *
 * Guards against React StrictMode double-invoke via DrawioEngine.isInitialized().
 */
export interface DrawioEngineState {
  ready: boolean;
  error: string | null;
}

export function useDrawioEngine(): DrawioEngineState {
  const [ready, setReady] = useState(() => DrawioEngine.isInitialized());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (DrawioEngine.isInitialized()) {
      setReady(true);
      return;
    }

    // Derive baseUrl from Grafana plugin config or fall back to relative path
    const panels = (config as any).panels ?? {};
    const panelCfg = panels['flowcharting-react-panel'];
    const baseUrl: string =
      panelCfg?.baseUrl ??
      (config as any).appSubUrl ??
      '';

    // Allow operators to disable the draw.io CDN stencil fallback for
    // air-gapped / strict-CSP installs, via the plugin's jsonData or a global.
    const noCdn =
      panelCfg?.jsonData?.disableStencilCdn === true ||
      (globalThis as any).GF_FLOWCHARTING_NO_CDN === true;
    if (noCdn) {
      DrawioEngine.cdnFallbackEnabled = false;
    }

    DrawioEngine.init(baseUrl)
      .then(() => setReady(true))
      .catch((err) => {
        console.error('[useDrawioEngine] Failed to initialize draw.io engine', err);
        setError(err?.message ?? String(err));
      });
  }, []);

  return { ready, error };
}
