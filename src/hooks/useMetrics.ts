import { useRef, useEffect, useState } from 'react';
import type { PanelData } from '@grafana/data';
import { MetricProcessor } from '../core/metrics/MetricProcessor';

/**
 * Processes PanelData into a MetricProcessor on every data change.
 * Returns the stable MetricProcessor reference AND a revision counter that
 * increments on every data refresh — so dependents can react to new values.
 */
export function useMetrics(data: PanelData): { metrics: MetricProcessor; metricsRevision: number } {
  const processorRef = useRef<MetricProcessor>(new MetricProcessor());
  const [metricsRevision, setMetricsRevision] = useState(0);

  useEffect(() => {
    processorRef.current.process(data);
    setMetricsRevision((v) => v + 1);
  }, [data]);

  return { metrics: processorRef.current, metricsRevision };
}
