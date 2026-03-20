// Entry point for the Grafana panel plugin.
// Grafana 10+ PanelPlugin API.

import { PanelPlugin } from '@grafana/data';
import type { FlowChartingOptions } from './types';
import { FlowChartingPanel } from './components/FlowChartingPanel';
import { migrateOptions } from './migration';
import { buildOptionsUI } from './optionsUI';
import { getDefaultOptions } from './defaults';

export const plugin = new PanelPlugin<FlowChartingOptions>(FlowChartingPanel)
  .setMigrationHandler(migrateOptions)
  .setPanelOptions(buildOptionsUI)
  .useFieldConfig();
