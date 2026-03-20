// Default values mirroring FlowchartCtrl.getDefaultData() from the old plugin
import type {
  TIRuleData,
  TFlowchartData,
  TFlowchartHandlerData,
  TIRulesHandlerData,
  FlowChartingOptions,
  TRuleShapeMapData,
  TRuleTextMapData,
  TRuleLinkMapData,
  TRuleEventMapData,
} from './types';
import { GFCONSTANT } from './constants';

export function getDefaultShapeMapData(): TRuleShapeMapData {
  return {
    options: { identByProp: 'id', metadata: '', enableRegEx: true },
    dataList: [],
  };
}

export function getDefaultTextMapData(): TRuleTextMapData {
  return {
    options: { identByProp: 'id', metadata: '', enableRegEx: true },
    dataList: [],
  };
}

export function getDefaultLinkMapData(): TRuleLinkMapData {
  return {
    options: { identByProp: 'id', metadata: '', enableRegEx: true },
    dataList: [],
  };
}

export function getDefaultEventMapData(): TRuleEventMapData {
  return {
    options: { identByProp: 'id', metadata: '', enableRegEx: true },
    dataList: [],
  };
}

export function getDefaultRuleData(order = 0): TIRuleData {
  return {
    order,
    pattern: '/.*/',
    metricType: 'serie',
    alias: `Rule ${order + 1}`,
    refId: 'A',
    column: 'Value',
    aggregation: 'current',
    unit: 'short',
    type: 'number',
    hidden: false,
    decimals: 2,
    reduce: true,
    dateColumn: '',
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    invert: false,
    gradient: false,
    overlayIcon: false,
    tooltip: false,
    tooltipLabel: '',
    tooltipColors: false,
    tooltipOn: 'wc',
    tpDirection: 'v',
    tpMetadata: false,
    tpGraph: false,
    tpGraphSize: '100%',
    tpGraphType: 'line',
    tpGraphLow: null,
    tpGraphHigh: null,
    tpGraphScale: 'linear',
    mapsDat: {
      shapes: getDefaultShapeMapData(),
      texts: getDefaultTextMapData(),
      links: getDefaultLinkMapData(),
      events: getDefaultEventMapData(),
    },
    numberTHData: [
      { color: GFCONSTANT.CONF_COLORS_DEFAULT[0], comparator: 'ge', value: 0, level: 0 },
      { color: GFCONSTANT.CONF_COLORS_DEFAULT[1], comparator: 'ge', value: 50, level: 1 },
      { color: GFCONSTANT.CONF_COLORS_DEFAULT[2], comparator: 'ge', value: 80, level: 2 },
    ],
    stringTHData: [],
    dateTHData: [],
    mappingType: 1,
    valueData: [],
    rangeData: [],
    sanitize: false,
    newRule: false,
  };
}

export function getDefaultFlowchartData(name = 'Main'): TFlowchartData {
  return {
    name,
    xml: '',
    csv: '',
    download: false,
    type: 'xml',
    url: '',
    zoom: '100%',
    center: true,
    scale: true,
    lock: true,
    enableAnim: true,
    tooltip: true,
    grid: false,
    bgColor: null,
  };
}

export function getDefaultFlowchartHandlerData(): TFlowchartHandlerData {
  return {
    editorUrl: 'https://embed.diagrams.net',
    editorTheme: 'kennedy',
    allowDrawio: true,
    flowcharts: [getDefaultFlowchartData('Main')],
  };
}

export function getDefaultRulesHandlerData(): TIRulesHandlerData {
  return {
    rulesData: [getDefaultRuleData(0)],
  };
}

export function getDefaultOptions(): FlowChartingOptions {
  return {
    flowchartsData: getDefaultFlowchartHandlerData(),
    rulesData: getDefaultRulesHandlerData(),
  };
}
