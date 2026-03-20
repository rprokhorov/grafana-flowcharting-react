import React from 'react';
import '../styles/panel.css';

interface FlowChartNavigatorProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export const FlowChartNavigator: React.FC<FlowChartNavigatorProps> = ({ current, total, onPrev, onNext }) => {
  return (
    <div className="fc-navigator">
      <button onClick={onPrev} disabled={current === 0} aria-label="Previous diagram">
        ‹
      </button>
      <span className="fc-navigator-label">
        {current + 1} / {total}
      </span>
      <button onClick={onNext} disabled={current === total - 1} aria-label="Next diagram">
        ›
      </button>
    </div>
  );
};
