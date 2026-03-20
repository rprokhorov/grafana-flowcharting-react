import React from 'react';
import { Portal } from '@grafana/ui';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { TooltipState } from '../store/panelStore';
import '../styles/tooltip.css';

interface DiagramTooltipProps {
  tooltip: TooltipState;
}

export const DiagramTooltip: React.FC<DiagramTooltipProps> = ({ tooltip }) => {
  const { x, y, color, formattedValue, label, dataPoints } = tooltip;
  const hasSparkline = dataPoints.length > 1;

  const style: React.CSSProperties = {
    left: x + 16,
    top: y + 16,
  };

  return (
    <Portal>
      <div className="fc-tooltip" style={style}>
        {label && <div className="fc-tooltip-header">{label}</div>}
        <div className="fc-tooltip-value" style={{ color }}>
          {formattedValue}
        </div>
        {hasSparkline && (
          <div className="fc-tooltip-sparkline">
            <ResponsiveContainer width="100%" height={50}>
              <LineChart data={dataPoints}>
                <YAxis domain={['auto', 'auto']} hide />
                <Line type="monotone" dataKey="y" stroke={color} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Portal>
  );
};
