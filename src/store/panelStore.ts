// Tooltip view-state shared between the panel, renderer and tooltip component.
// (Panel runtime state is held with local React state in FlowChartingPanel —
// there is no global store.)

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
