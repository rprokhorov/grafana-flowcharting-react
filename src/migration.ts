// Migration handler called by Grafana when loading a panel saved with
// the old agenty-flowcharting-panel plugin.
//
// Old plugin stored data at panel root level (panel.flowchartsData, panel.rulesData)
// rather than in panel.options — check both locations.

import type { PanelModel } from '@grafana/data';
import type { FlowChartingOptions, TFlowchartData, TIRuleData, TFlowchartHandlerData, TIRulesHandlerData } from './types';
import { getDefaultOptions, getDefaultFlowchartData, getDefaultRuleData } from './defaults';

export function migrateOptions(panel: PanelModel): Partial<FlowChartingOptions> {
  const raw = panel as any;
  const oldOpts = raw.options ?? {};

  // Old plugin stored at root; fallback to options
  const oldFlowchartsData =
    raw.flowchartsData ?? oldOpts.flowchartsData ?? raw.flowchartHandlerData ?? oldOpts.flowchartHandlerData;
  const oldRulesData =
    raw.rulesData ?? oldOpts.rulesData ?? raw.rulesHandlerData ?? oldOpts.rulesHandlerData;

  const defaults = getDefaultOptions();
  const result: Partial<FlowChartingOptions> = {};

  if (oldFlowchartsData) {
    result.flowchartsData = migrateFlowchartsData(oldFlowchartsData);
  }

  if (oldRulesData) {
    result.rulesData = migrateRulesData(oldRulesData);
  }

  // If nothing found, return empty (Grafana will use defaults from getDefaultOptions)
  return result;
}

function migrateFlowchartsData(old: any): TFlowchartHandlerData {
  const flowcharts = Array.isArray(old.flowcharts) ? old.flowcharts : [];
  return {
    editorUrl: old.editorUrl ?? 'https://embed.diagrams.net',
    editorTheme: old.editorTheme ?? 'kennedy',
    allowDrawio: old.allowDrawio ?? true,
    flowcharts: flowcharts.map((fc: any, i: number) => migrateFlowchart(fc, i)),
  };
}

function migrateFlowchart(old: any, index: number): TFlowchartData {
  const defaults = getDefaultFlowchartData(old.name ?? `Flowchart ${index + 1}`);
  return {
    name: old.name ?? defaults.name,
    xml: old.xml ?? old.source ?? '',
    csv: old.csv ?? '',
    download: old.download ?? defaults.download,
    type: old.type ?? 'xml',
    url: old.url ?? '',
    zoom: old.zoom ?? defaults.zoom,
    center: old.center ?? defaults.center,
    scale: old.scale ?? defaults.scale,
    lock: old.lock ?? defaults.lock,
    enableAnim: old.enableAnim ?? defaults.enableAnim,
    tooltip: old.tooltip ?? defaults.tooltip,
    grid: old.grid ?? defaults.grid,
    bgColor: old.bgColor ?? null,
  };
}

function migrateRulesData(old: any): TIRulesHandlerData {
  const rules = Array.isArray(old.rulesData) ? old.rulesData : Array.isArray(old) ? old : [];
  return {
    rulesData: rules.map((r: any, i: number) => migrateRule(r, i)),
  };
}

function migrateRule(old: any, index: number): TIRuleData {
  const defaults = getDefaultRuleData(index);
  return {
    order: old.order ?? index,
    pattern: old.pattern ?? defaults.pattern,
    metricType: old.metricType ?? defaults.metricType,
    alias: old.alias ?? old.name ?? defaults.alias,
    refId: old.refId ?? defaults.refId,
    column: old.column ?? defaults.column,
    aggregation: old.aggregation ?? defaults.aggregation,
    unit: old.unit ?? defaults.unit,
    type: old.type ?? defaults.type,
    hidden: old.hidden ?? defaults.hidden,
    decimals: old.decimals ?? defaults.decimals,
    reduce: old.reduce ?? defaults.reduce,
    dateColumn: old.dateColumn ?? defaults.dateColumn,
    dateFormat: old.dateFormat ?? defaults.dateFormat,
    invert: old.invert ?? defaults.invert,
    gradient: old.gradient ?? defaults.gradient,
    overlayIcon: old.overlayIcon ?? defaults.overlayIcon,
    tooltip: old.tooltip ?? defaults.tooltip,
    tooltipLabel: old.tooltipLabel ?? defaults.tooltipLabel,
    tooltipColors: old.tooltipColors ?? defaults.tooltipColors,
    tooltipOn: old.tooltipOn ?? defaults.tooltipOn,
    tpDirection: old.tpDirection ?? defaults.tpDirection,
    tpMetadata: old.tpMetadata ?? defaults.tpMetadata,
    tpGraph: old.tpGraph ?? defaults.tpGraph,
    tpGraphSize: old.tpGraphSize ?? defaults.tpGraphSize,
    tpGraphType: old.tpGraphType ?? defaults.tpGraphType,
    tpGraphLow: old.tpGraphLow ?? defaults.tpGraphLow,
    tpGraphHigh: old.tpGraphHigh ?? defaults.tpGraphHigh,
    tpGraphScale: old.tpGraphScale ?? defaults.tpGraphScale,
    mapsDat: migrateMapsDat(old.mapsDat, defaults.mapsDat),
    numberTHData: old.numberTHData ?? migrateOldThresholds(old),
    stringTHData: old.stringTHData ?? defaults.stringTHData,
    dateTHData: old.dateTHData ?? defaults.dateTHData,
    mappingType: old.mappingType ?? defaults.mappingType,
    valueData: old.valueData ?? defaults.valueData,
    rangeData: old.rangeData ?? defaults.rangeData,
    sanitize: old.sanitize ?? defaults.sanitize,
    newRule: false,
  };
}

function migrateMapsDat(old: any, defaults: any): TIRuleData['mapsDat'] {
  if (!old) {
    return defaults;
  }
  return {
    shapes: old.shapes ?? defaults.shapes,
    texts: old.texts ?? defaults.texts,
    links: old.links ?? defaults.links,
    events: old.events ?? defaults.events,
  };
}

function migrateOldThresholds(old: any): TIRuleData['numberTHData'] {
  // Old plugin stored thresholds as arrays: colors[], thresholds[]
  const colors: string[] = old.colors ?? [];
  const thresholds: number[] = old.thresholds ?? [];

  if (colors.length === 0 || thresholds.length === 0) {
    return getDefaultRuleData().numberTHData;
  }

  return thresholds.map((value: number, i: number) => ({
    level: i,
    value,
    color: colors[i] ?? '#73BF69',
    comparator: 'ge' as const,
  }));
}
