import React, { useRef, useEffect, useCallback } from 'react';
import type { TFlowchartData } from '../types';
import type { MetricProcessor } from '../core/metrics/MetricProcessor';
import type { RuleEngine } from '../core/rules/RuleEngine';
import type { TooltipState } from '../store/panelStore';
import { XGraph } from '../core/drawio/XGraph';
import '../styles/panel.css';

interface FlowChartRendererProps {
  flowchart: TFlowchartData;
  engineReady: boolean;
  metrics: MetricProcessor;
  ruleEngine: RuleEngine;
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
  ruleEngine,
  onTooltip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xgraphRef = useRef<XGraph | null>(null);

  const handleCellHover = useCallback(
    (cellId: string, x: number, y: number) => {
      const states = metrics.getMetricNames();
      // Find state for this cell from rule engine results
      // We pass a simplified tooltip here; full state is computed in FlowChartingPanel
      onTooltip({
        cellId,
        x,
        y,
        level: 0,
        color: '#73BF69',
        formattedValue: '',
        dataPoints: [],
        label: cellId,
      });
    },
    [metrics, onTooltip]
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

    xgraph.initGraph().then(() => {
      // Apply rules after graph initializes
      applyRules(xgraph);
    });

    return () => {
      xgraph.free();
      xgraphRef.current = null;
    };
    // Re-mount when source XML or engine changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineReady, flowchart.xml, flowchart.csv, flowchart.type]);

  // Re-apply rules when metrics or options change (without remounting mxGraph)
  useEffect(() => {
    if (xgraphRef.current?.isInitialized()) {
      applyRules(xgraphRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, ruleEngine]);

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
    ruleEngine.applyAll(metrics, xgraph, xcells);
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
