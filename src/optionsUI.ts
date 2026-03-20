// Panel options builder using Grafana 10 PanelOptionsEditorBuilder API
import type { PanelOptionsEditorBuilder } from '@grafana/data';
import type { FlowChartingOptions } from './types';
import { FlowchartsEditor } from './components/editors/FlowchartsEditor';
import { RulesEditor } from './components/editors/RulesEditor';
import { InspectPanel } from './components/editors/InspectPanel';

export function buildOptionsUI(builder: PanelOptionsEditorBuilder<FlowChartingOptions>) {
  builder
    .addCustomEditor({
      id: 'flowchartsData',
      path: 'flowchartsData',
      name: 'Flowcharts',
      description: 'Manage draw.io diagrams',
      editor: FlowchartsEditor,
      category: ['Flowcharts'],
    })
    .addCustomEditor({
      id: 'rulesData',
      path: 'rulesData',
      name: 'Rules',
      description: 'Define metric-to-cell mapping rules',
      editor: RulesEditor,
      category: ['Rules'],
    })
    .addCustomEditor({
      id: 'inspect',
      path: '',
      name: 'Inspect',
      description: 'Debug panel options',
      editor: InspectPanel as any,
      category: ['Debug'],
    });

  return builder;
}
