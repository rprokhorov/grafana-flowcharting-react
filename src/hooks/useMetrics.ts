import { useRef, useEffect } from 'react';
import type { PanelData } from '@grafana/data';
import { MetricProcessor } from '../core/metrics/MetricProcessor';

/**
 * Processes PanelData into a MetricProcessor on every data change.
 * Returns a stable MetricProcessor reference.
 */
export function useMetrics(data: PanelData): MetricProcessor {
  const processorRef = useRef<MetricProcessor>(new MetricProcessor());

  useEffect(() => {
    processorRef.current.process(data);
  }, [data]);

  return processorRef.current;
}
