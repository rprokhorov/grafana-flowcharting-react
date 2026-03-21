import React, { useRef, useEffect, useCallback } from 'react';
import type { TFlowchartData } from '../types';
import type { MetricProcessor } from '../core/metrics/MetricProcessor';
import type { RuleEngine, CellRuleState } from '../core/rules/RuleEngine';
import type { TooltipState, TooltipSeries } from '../store/panelStore';
import { XGraph } from '../core/drawio/XGraph';
import '../styles/panel.css';

interface FlowChartRendererProps {
  flowchart: TFlowchartData;
  engineReady: boolean;
  metrics: MetricProcessor;
  metricsRevision: number;
  ruleEngine: RuleEngine;
  rulesRevision: number;
  onTooltip: (tooltip: TooltipState | null) => void;
}

/**
 * Renders a single draw.io diagram.
 * Uses `key=` from parent to force remount when switching flowcharts.
 */
export const FlowChartRenderer: React.FC<FlowChartRendererProps> = ({
  flowchart,
  engineReady,
  metrics,
  metricsRevision,
  ruleEngine,
  rulesRevision,
  onTooltip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xgraphRef = useRef<XGraph | null>(null);
  // Persists the last stateMap between renders so hover can look up cell state
  const cellStateMapRef = useRef<Map<string, CellRuleState>>(new Map());
  // Keep latest metrics/ruleEngine accessible inside hover callback without re-binding
  const metricsRef = useRef(metrics);
  const ruleEngineRef = useRef(ruleEngine);
  useEffect(() => { metricsRef.current = metrics; }, [metrics]);
  useEffect(() => { ruleEngineRef.current = ruleEngine; }, [ruleEngine]);

  const handleCellHover = useCallback(
    (cellId: string, x: number, y: number) => {
      const state = cellStateMapRef.current.get(cellId);
      if (!state) {
        // Cell has no rule applied — show plain cell id
        onTooltip({ cellId, x, y, level: 0, color: '#aaa', formattedValue: cellId, dataPoints: [], label: cellId, series: [] });
        return;
      }

      // Build a series entry for every rule that matched this cell
      const series: TooltipSeries[] = (state.allMatches ?? []).map((m) => {
        const dp = metricsRef.current.getDataPointsByPattern(m.metricPattern);
        return {
          label: m.ruleAlias || m.metricPattern,
          color: m.color,
          formattedValue: m.formattedValue,
          dataPoints: dp,
        };
      });

      // First series dataPoints used as legacy fallback
      const dataPoints = series.length > 0 ? series[0].dataPoints : [];

      onTooltip({
        cellId,
        x,
        y,
        level: state.level,
        color: state.color,
        formattedValue: state.formattedValue,
        dataPoints,
        label: state.ruleAlias || cellId,
        series,
      });
    },
    [onTooltip]
  );

  const handleCellHoverEnd = useCallback(() => {
    onTooltip(null);
  }, [onTooltip]);

  useEffect(() => {
    if (!engineReady || !containerRef.current) {
      return;
    }

    const source = flowchart.type === 'csv' ? flowchart.csv : flowchart.xml;
    if (!source) {
      return;
    }

    const xgraph = new XGraph(containerRef.current, flowchart.type, source, {
      zoom: flowchart.zoom,
      center: flowchart.center,
      scale: flowchart.scale,
      lock: flowchart.lock,
      enableAnim: flowchart.enableAnim,
      tooltip: flowchart.tooltip,
      grid: flowchart.grid,
      bgColor: flowchart.bgColor,
    });

    xgraph.setHoverCallbacks(handleCellHover, handleCellHoverEnd);
    xgraphRef.current = xgraph;

    xgraph.initGraph()
      .then(() => applyRules(xgraph))
      .catch((e: any) => console.warn('[FlowChartRenderer] initGraph warning:', e));

    return () => {
      xgraph.free();
      xgraphRef.current = null;
    };
    // Re-mount when source XML or engine changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineReady, flowchart.xml, flowchart.csv, flowchart.type]);

  // Re-apply rules when metrics or rules change (without remounting mxGraph)
  useEffect(() => {
    if (xgraphRef.current?.isInitialized()) {
      applyRules(xgraphRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricsRevision, rulesRevision]);

  // Update display options without remounting
  useEffect(() => {
    xgraphRef.current?.setOptions({
      zoom: flowchart.zoom,
      center: flowchart.center,
      scale: flowchart.scale,
      lock: flowchart.lock,
      enableAnim: flowchart.enableAnim,
      tooltip: flowchart.tooltip,
      grid: flowchart.grid,
      bgColor: flowchart.bgColor,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    flowchart.zoom,
    flowchart.center,
    flowchart.scale,
    flowchart.lock,
    flowchart.enableAnim,
    flowchart.tooltip,
    flowchart.grid,
    flowchart.bgColor,
  ]);

  function applyRules(xgraph: XGraph) {
    const xcells = xgraph.getXCells();
    const stateMap = ruleEngineRef.current.applyAll(metricsRef.current, xgraph, xcells);
    cellStateMapRef.current = stateMap;
    xgraph.refresh();
  }

  const bgStyle: React.CSSProperties = flowchart.bgColor
    ? { backgroundColor: flowchart.bgColor }
    : {};

  return (
    <div
      ref={containerRef}
      className="fc-diagram-container"
      style={bgStyle}
    />
  );
};
