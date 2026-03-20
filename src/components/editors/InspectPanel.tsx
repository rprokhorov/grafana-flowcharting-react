import React from 'react';
import type { StandardEditorProps } from '@grafana/data';
import type { FlowChartingOptions } from '../../types';

type Props = StandardEditorProps<FlowChartingOptions>;

export const InspectPanel: React.FC<Props> = ({ value }) => {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 11, padding: 8 }}>
      <details>
        <summary style={{ cursor: 'pointer', marginBottom: 4 }}>Options JSON</summary>
        <pre style={{ maxHeight: 400, overflow: 'auto', background: '#111', padding: 8, borderRadius: 4 }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    </div>
  );
};
