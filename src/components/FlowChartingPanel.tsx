import React, { useState, useCallback, useEffect, Component } from 'react';
import type { PanelProps } from '@grafana/data';
import type { FlowChartingOptions } from '../types';
import { useDrawioEngine } from '../hooks/useDrawioEngine';
import { useMetrics } from '../hooks/useMetrics';
import { useRuleEngine } from '../hooks/useRuleEngine';
import { useFlowchartManager } from '../hooks/useFlowchartManager';
import { FlowChartRenderer } from './FlowChartRenderer';
import { FlowChartNavigator } from './FlowChartNavigator';
import { DiagramTooltip } from './DiagramTooltip';
import { StatusOverlay } from './StatusOverlay';
import type { TooltipState } from '../store/panelStore';
import { getDefaultOptions } from '../defaults';
import { CellPickerService } from '../core/CellPickerService';
import '../styles/panel.css';

type Props = PanelProps<FlowChartingOptions>;

const DEFAULTS = getDefaultOptions();

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface EBState { error: string | null }

class DiagramErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(err: any): EBState {
    return { error: err?.message ?? String(err) };
  }

  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    // Reset when children change (e.g. new XML loaded)
    if (prevProps.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: '#ff6666', fontSize: 13, wordBreak: 'break-word' }}>
          <strong>Diagram render error:</strong>
          <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{this.state.error}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export const FlowChartingPanel: React.FC<Props> = ({ data, options, width, height }) => {
  // Grafana passes options as {} when a panel is first added — fall back to defaults
  const rulesData = options?.rulesData ?? DEFAULTS.rulesData;
  const flowchartsData = options?.flowchartsData ?? DEFAULTS.flowchartsData;

  const engineReady = useDrawioEngine();
  const { metrics, metricsRevision } = useMetrics(data);
  const { ruleEngine, rulesRevision } = useRuleEngine(rulesData);
  const { activeFlowchart, activeIndex, total, goNext, goPrev } = useFlowchartManager(flowchartsData);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  useEffect(() => {
    return CellPickerService.onActiveChange(setIsPicking);
  }, []);

  const handleTooltip = useCallback((tp: TooltipState | null) => {
    // Suppress tooltips during cell-pick mode
    if (!CellPickerService.isActive()) {
      setTooltip(tp);
    }
  }, []);

  return (
    <div className={`fc-panel-wrapper${isPicking ? ' fc-picking' : ''}`} style={{ width, height }}>
      <StatusOverlay loading={!engineReady} />

      {isPicking && (
        <div className="fc-pick-overlay" onClick={() => CellPickerService.cancel()}>
          <span className="fc-pick-hint">Click a cell to capture its ID — or click here to cancel</span>
        </div>
      )}

      {engineReady && activeFlowchart && (
        <DiagramErrorBoundary key={`${activeIndex}-${activeFlowchart.name}`}>
          <FlowChartRenderer
            // key= forces remount and mxGraph cleanup when switching flowcharts
            key={`${activeIndex}-${activeFlowchart.name}`}
            flowchart={activeFlowchart.data}
            engineReady={engineReady}
            metrics={metrics}
            metricsRevision={metricsRevision}
            ruleEngine={ruleEngine}
            rulesRevision={rulesRevision}
            onTooltip={handleTooltip}
          />
        </DiagramErrorBoundary>
      )}

      {total > 1 && (
        <FlowChartNavigator
          current={activeIndex}
          total={total}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}

      {tooltip && <DiagramTooltip tooltip={tooltip} />}
    </div>
  );
};
