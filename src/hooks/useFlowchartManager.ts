import { useState, useRef, useCallback, useEffect } from 'react';
import type { TFlowchartHandlerData } from '../types';
import { FlowchartManager } from '../core/flowchart/FlowchartManager';
import type { Flowchart } from '../core/flowchart/Flowchart';

export interface UseFlowchartManagerResult {
  manager: FlowchartManager;
  activeFlowchart: Flowchart | undefined;
  activeIndex: number;
  total: number;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
}

/**
 * Manages active flowchart state for the panel.
 */
export function useFlowchartManager(flowchartsData: TFlowchartHandlerData): UseFlowchartManagerResult {
  const managerRef = useRef<FlowchartManager | null>(null);
  if (managerRef.current === null) {
    managerRef.current = new FlowchartManager(flowchartsData);
  }

  const [activeIndex, setActiveIndex] = useState(0);

  const manager = managerRef.current;

  // Sync data when options change
  manager.update(flowchartsData);

  const total = manager.getFlowcharts().length;

  // If the flowcharts list shrank below the current index, clamp it so we don't
  // read past the end (which would render undefined).
  useEffect(() => {
    if (total > 0 && activeIndex > total - 1) {
      setActiveIndex(total - 1);
    }
  }, [total, activeIndex]);

  // Clamp on read too, so the same render is consistent before the effect runs.
  const safeIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0;
  const activeFlowchart = manager.getFlowcharts()[safeIndex];

  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < total) {
        setActiveIndex(index);
      }
    },
    [total]
  );

  return { manager, activeFlowchart, activeIndex: safeIndex, total, goNext, goPrev, goTo };
}
