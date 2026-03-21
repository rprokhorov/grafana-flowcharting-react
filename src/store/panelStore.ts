// Zustand per-panel runtime state.
// IMPORTANT: Never use as a module-level singleton.
// Create per panel instance: useRef(create(...))

import { create } from 'zustand';
import type { CellRuleState } from '../core/rules/RuleEngine';
import type { DataPoint } from '../core/metrics/MetricProcessor';

export interface TooltipSeries {
  label: string;
  color: string;
  formattedValue: string;
  dataPoints: DataPoint[];
}

export interface TooltipState {
  cellId: string;
  x: number;
  y: number;
  level: number;
  color: string;
  formattedValue: string;
  dataPoints: DataPoint[];
  label: string;
  /** Multiple series when several rules match the same cell */
  series: TooltipSeries[];
}

export interface PanelStoreState {
  engineReady: boolean;
  setEngineReady: (ready: boolean) => void;

  cellStates: Map<string, CellRuleState>;
  setCellStates: (states: Map<string, CellRuleState>) => void;

  tooltip: TooltipState | null;
  setTooltip: (tooltip: TooltipState | null) => void;

  activeFlowchartIndex: number;
  setActiveFlowchartIndex: (index: number) => void;
}

export function createPanelStore() {
  return create<PanelStoreState>((set) => ({
    engineReady: false,
    setEngineReady: (ready) => set({ engineReady: ready }),

    cellStates: new Map(),
    setCellStates: (states) => set({ cellStates: states }),

    tooltip: null,
    setTooltip: (tooltip) => set({ tooltip }),

    activeFlowchartIndex: 0,
    setActiveFlowchartIndex: (index) => set({ activeFlowchartIndex: index }),
  }));
}

export type PanelStore = ReturnType<typeof createPanelStore>;
