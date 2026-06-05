import React from 'react';
import { Portal } from '@grafana/ui';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { TooltipState, TooltipSeries } from '../store/panelStore';
import '../styles/tooltip.css';

interface DiagramTooltipProps {
  tooltip: TooltipState;
}

const TOOLTIP_WIDTH = 240;
const SPARKLINE_HEIGHT = 50;

const SparklineChart: React.FC<{ series: TooltipSeries }> = ({ series }) => {
  if (series.dataPoints.length < 2) {
    return null;
  }
  return (
    <div className="fc-tooltip-series">
      <div className="fc-tooltip-series-header">
        <span className="fc-tooltip-series-dot" style={{ backgroundColor: series.color }} />
        <span className="fc-tooltip-series-label">{series.label}</span>
        <span className="fc-tooltip-series-value" style={{ color: series.color }}>
          {series.formattedValue}
        </span>
      </div>
      <div className="fc-tooltip-sparkline">
        <ResponsiveContainer width="100%" height={SPARKLINE_HEIGHT}>
          <LineChart data={series.dataPoints}>
            <YAxis domain={['auto', 'auto']} hide />
            <Line type="monotone" dataKey="y" stroke={series.color} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const DiagramTooltip: React.FC<DiagramTooltipProps> = ({ tooltip }) => {
  const { x, y, label, series } = tooltip;
  const hasSeries = series && series.length > 0;

  // If we have multi-series, use series for display; otherwise fall back to legacy single sparkline
  const seriesData: TooltipSeries[] = hasSeries
    ? series
    : tooltip.dataPoints.length > 1
      ? [{ label: tooltip.label, color: tooltip.color, formattedValue: tooltip.formattedValue, dataPoints: tooltip.dataPoints }]
      : [];

  const sparklineCount = seriesData.filter((s) => s.dataPoints.length > 1).length;
  const estimatedHeight = 40 + sparklineCount * (SPARKLINE_HEIGHT + 30) + (hasSeries ? 0 : 30);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = x + 16 + TOOLTIP_WIDTH > vw ? x - TOOLTIP_WIDTH - 8 : x + 16;
  const top = y + 16 + estimatedHeight > vh ? y - estimatedHeight - 8 : y + 16;

  const style: React.CSSProperties = { left, top };

  return (
    <Portal>
      <div className="fc-tooltip" style={style}>
        {label && <div className="fc-tooltip-header">{label}</div>}

        {/* Single-series legacy view: show the value once. */}
        {!hasSeries && (
          <div className="fc-tooltip-value" style={{ color: tooltip.color }}>
            {tooltip.formattedValue}
          </div>
        )}

        {/* Multi-series: each gets its own sparkline */}
        {seriesData.map((s, i) => (
          <SparklineChart key={i} series={s} />
        ))}
      </div>
    </Portal>
  );
};
