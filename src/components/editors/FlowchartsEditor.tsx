import React, { useState } from 'react';
import type { StandardEditorProps } from '@grafana/data';
import { Button, Collapse, InlineField, Input, Select, Switch, TextArea } from '@grafana/ui';
import type { TFlowchartHandlerData, TFlowchartData } from '../../types';
import { getDefaultFlowchartData } from '../../defaults';

type Props = StandardEditorProps<TFlowchartHandlerData>;

const SOURCE_TYPE_OPTIONS = [
  { label: 'XML', value: 'xml' },
  { label: 'CSV', value: 'csv' },
];

export const FlowchartsEditor: React.FC<Props> = ({ value, onChange }) => {
  const data: TFlowchartHandlerData = value ?? {
    editorUrl: 'https://embed.diagrams.net',
    editorTheme: 'kennedy',
    allowDrawio: true,
    flowcharts: [],
  };

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const addFlowchart = () => {
    const name = `Flowchart ${data.flowcharts.length + 1}`;
    const updated = { ...data, flowcharts: [...data.flowcharts, getDefaultFlowchartData(name)] };
    onChange(updated);
    setOpenIndex(data.flowcharts.length);
  };

  const removeFlowchart = (index: number) => {
    onChange({ ...data, flowcharts: data.flowcharts.filter((_, i) => i !== index) });
    setOpenIndex(null);
  };

  const updateFlowchart = (index: number, patch: Partial<TFlowchartData>) => {
    const updated = data.flowcharts.map((fc, i) => (i === index ? { ...fc, ...patch } : fc));
    onChange({ ...data, flowcharts: updated });
  };

  const openDrawioEditor = (index: number) => {
    const fc = data.flowcharts[index];
    const editorUrl = data.editorUrl || 'https://embed.diagrams.net';
    const url = `${editorUrl}?embed=1&spin=1&proto=json&libraries=1&ui=${data.editorTheme || 'kennedy'}`;
    const win = window.open(url, '_blank', 'width=1200,height=800');
    if (!win) {
      alert('Popup blocked. Allow popups to use the draw.io editor.');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== win) {
        return;
      }
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'init') {
          win.postMessage(JSON.stringify({ action: 'load', xml: fc.xml }), '*');
        } else if (msg.event === 'save') {
          updateFlowchart(index, { xml: msg.xml });
          win.postMessage(JSON.stringify({ action: 'export', format: 'xml', xml: msg.xml }), '*');
        } else if (msg.event === 'exit') {
          window.removeEventListener('message', handleMessage);
          win.close();
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);
  };

  return (
    <div>
      {/* Global editor settings */}
      <div style={{ marginBottom: 12 }}>
        <InlineField label="Editor URL" grow>
          <Input
            value={data.editorUrl}
            onChange={(e) => onChange({ ...data, editorUrl: (e.target as HTMLInputElement).value })}
            placeholder="https://embed.diagrams.net"
          />
        </InlineField>
      </div>

      {/* Flowchart list */}
      {data.flowcharts.map((fc, index) => (
        <div key={index} style={{ marginBottom: 8, border: '1px solid #444', borderRadius: 4 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              background: '#1e2028',
              borderRadius: '4px 4px 0 0',
            }}
          >
            <span
              style={{ flex: 1, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              {fc.name}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon="edit"
              onClick={() => openDrawioEditor(index)}
              style={{ marginRight: 4 }}
            >
              Edit
            </Button>
            <Button variant="destructive" size="sm" icon="trash-alt" onClick={() => removeFlowchart(index)} />
          </div>
          {openIndex === index && (
            <div style={{ padding: 8 }}>
              <InlineField label="Name">
                <Input value={fc.name} onChange={(e) => updateFlowchart(index, { name: (e.target as HTMLInputElement).value })} />
              </InlineField>
              <InlineField label="Source type">
                <Select
                  options={SOURCE_TYPE_OPTIONS}
                  value={fc.type}
                  onChange={(v) => updateFlowchart(index, { type: v.value as any })}
                  width={10}
                />
              </InlineField>
              {fc.type === 'csv' ? (
                <InlineField label="CSV" grow>
                  <TextArea
                    value={fc.csv}
                    onChange={(e) => updateFlowchart(index, { csv: (e.target as HTMLTextAreaElement).value })}
                    rows={6}
                    placeholder={'# style: whiteSpace=wrap;html=1;\nname,group\nPod A,svc\nPod B,svc'}
                  />
                </InlineField>
              ) : (
                <InlineField label="XML" grow>
                  <TextArea
                    value={fc.xml}
                    onChange={(e) => updateFlowchart(index, { xml: (e.target as HTMLTextAreaElement).value })}
                    rows={6}
                    placeholder="Paste draw.io XML here or use the Edit button"
                  />
                </InlineField>
              )}
              <InlineField label="Zoom">
                <Input
                  value={fc.zoom}
                  onChange={(e) => updateFlowchart(index, { zoom: (e.target as HTMLInputElement).value })}
                  width={10}
                  placeholder="100%"
                />
              </InlineField>
              <InlineField label="Center">
                <Switch value={fc.center} onChange={(e) => updateFlowchart(index, { center: (e.target as HTMLInputElement).checked })} />
              </InlineField>
              <InlineField label="Scale">
                <Switch value={fc.scale} onChange={(e) => updateFlowchart(index, { scale: (e.target as HTMLInputElement).checked })} />
              </InlineField>
              <InlineField label="Lock">
                <Switch value={fc.lock} onChange={(e) => updateFlowchart(index, { lock: (e.target as HTMLInputElement).checked })} />
              </InlineField>
              <InlineField label="Animation">
                <Switch value={fc.enableAnim} onChange={(e) => updateFlowchart(index, { enableAnim: (e.target as HTMLInputElement).checked })} />
              </InlineField>
              <InlineField label="Grid">
                <Switch value={fc.grid} onChange={(e) => updateFlowchart(index, { grid: (e.target as HTMLInputElement).checked })} />
              </InlineField>
            </div>
          )}
        </div>
      ))}
      <Button variant="primary" size="sm" icon="plus" onClick={addFlowchart}>
        Add flowchart
      </Button>
    </div>
  );
};
