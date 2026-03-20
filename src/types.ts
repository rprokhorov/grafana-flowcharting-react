// TypeScript interfaces for grafana-flowcharting-react
// Ported from old plugin's src/index.d.ts

// ─── mxGraph ambient declarations ────────────────────────────────────────────
declare global {
  type mxCell = any;
  type mxCellState = any;
  type mxMouseEvent = any;
  type mxGeometry = { x: number; y: number; width: number; height: number };
  var mxUtils: any;
  var mxCellHighlight: any;
  var mxConstants: any;
  var mxEvent: any;
  var mxClient: any;
  var mxCodec: any;
  var mxUrlConverter: any;
  var mxCellOverlay: any;
  var mxRectangle: any;
  var mxLog: any;
  var Graph: any;
  var mxTooltipHandler: any;
}

export {};

// ─── Select helpers ───────────────────────────────────────────────────────────
export interface TSelectString {
  text: string;
  value: string;
}
export interface TSelectAny {
  text: string;
  value: any;
}
export interface TSelectNumber {
  text: string;
  value: number;
}
export interface TSelectBoolean {
  text: string;
  value: boolean;
}

// ─── Property keys ────────────────────────────────────────────────────────────
export type TPropertieKey = 'id' | 'value' | 'metadata';
export type TPropertieList = Array<{ text: string; value: TPropertieKey }>;

// ─── Style keys ───────────────────────────────────────────────────────────────
export type TStyleColorKeys =
  | 'fillColor'
  | 'strokeColor'
  | 'gradientColor'
  | 'fontColor'
  | 'labelBackgroundColor'
  | 'labelBorderColor'
  | 'imageBorder'
  | 'imageBackground';

export type TStyleAnimEventKey = 'barPos' | 'gaugePos' | 'fontSize' | 'opacity' | 'textOpacity' | 'rotation';
export type TStyleStaticEventKeys =
  | 'shape'
  | 'endArrow'
  | 'startArrow'
  | 'flipH'
  | 'flipV'
  | 'gradientDirection'
  | 'image';
export type TStyleEventKeys = TStyleAnimEventKey | TStyleStaticEventKeys;
export type TOtherEventKeys =
  | 'blink'
  | 'class'
  | 'visibility'
  | 'fold'
  | 'height'
  | 'width'
  | 'size'
  | 'text'
  | 'tpText'
  | 'tpMetadata'
  | 'class_mxEdgeFlow';
export type TTypeEventKeys = TStyleEventKeys | TOtherEventKeys;
export type TStyleAnimKeys = TStyleAnimEventKey | TStyleColorKeys;
export type TStyleKeys = TStyleColorKeys | TStyleEventKeys;

export type TTypeEventElt = {
  text: string;
  value: TTypeEventKeys;
  type: 'number' | 'text';
  placeholder: string;
  typeahead?: string;
  default?: any;
};
export type TTypeEventList = TTypeEventElt[];

// ─── Tooltip ──────────────────────────────────────────────────────────────────
export type TDirectionKeys = 'v' | 'h';
export type TDirectionList = Array<{ text: string; value: TDirectionKeys }>;
export type TGraphTypeKeys = 'line' | 'bar';
export type TGraphTypeList = Array<{ text: string; value: TGraphTypeKeys }>;
export type TGraphCoordinate = { x?: number; y: number };
export type TGraphScaleKeys = 'linear' | 'log';
export type TGraphScaleList = Array<{ text: string; value: TGraphScaleKeys }>;
export type TGraphSizeKeys = '100%' | '100px' | '200px' | '400px';
export type TGraphSizeList = Array<{ text: string; value: TGraphSizeKeys }>;

// ─── Value/Range mapping ──────────────────────────────────────────────────────
export type TValueMappingKeys = 1 | 2;
export type TCounterKeys = 'linear' | 'progressive';

// ─── draw.io theme ────────────────────────────────────────────────────────────
export type TDioThemeKeys = 'dark' | 'kennedy' | 'minimal' | 'atlas';
export type TDioThemeList = Array<{ text: string; value: TDioThemeKeys }>;

// ─── Aggregation ─────────────────────────────────────────────────────────────
export type TAggregationKeys =
  | 'first'
  | 'first_notnull'
  | 'current'
  | 'current_notnull'
  | 'min'
  | 'max'
  | 'total'
  | 'avg'
  | 'count'
  | 'delta'
  | 'range'
  | 'diff'
  | 'last_time'
  | 'graph-hover';
export type TAggregationList = Array<{ text: string; value: TAggregationKeys }>;

// ─── Source type ──────────────────────────────────────────────────────────────
export type TSourceTypeKeys = 'xml' | 'csv';

// ─── Metric type ──────────────────────────────────────────────────────────────
export type TMetricTypeKeys = 'table' | 'serie';

// ─── Rule map options ─────────────────────────────────────────────────────────
export type TColorOnKeys = 'n' | 'wc' | 'a';
export type TTextOnKeys = 'n' | 'wmd' | 'wc' | 'co';
export type TLinkOnKeys = 'wc' | 'a';
export type TTooltipOnKeys = 'wc' | 'a';
export type TValueTypeKeys = 'number' | 'string' | 'date';

export type TTextMethodKeys = 'content' | 'pattern' | 'as' | 'anl';
export type TDateFormatKeys =
  | 'YYYY-MM-DD HH:mm:ss'
  | 'YYYY-MM-DD HH:mm:ss.SSS'
  | 'MM/DD/YY h:mm:ss a'
  | 'MMMM D, YYYY LT'
  | 'YYYY-MM-DD';

export type TComparatorKeys = 'lt' | 'le' | 'eq' | 'ne' | 'ge' | 'gt' | 'al';
export type TVariableKeys = '_rule' | '_level' | '_value' | '_color' | '_formated' | '_date' | '_metric';

// ─── Threshold data ───────────────────────────────────────────────────────────
export type TTHType = 'string' | 'number' | 'date';
export type TTHNumberComparator = 'ge' | 'gt';
export type TTHStringComparator = 'eq' | 'ne';
export type TTHDateComparator = 'eq' | 'ne' | 'ge' | 'gt';
export type TEventComparator = 'lt' | 'le' | 'eq' | 'ne' | 'ge' | 'gt' | 'al';
export type THDatePrecision = 'y' | 'M' | 'w' | 'd' | 'h' | 'm' | 's';

export interface TTHData {
  color: string;
  comparator: string;
  value: unknown;
  level: number;
}
export interface TTHStringData extends TTHData {
  comparator: TTHStringComparator;
  value: string;
}
export interface TTHNumberData extends TTHData {
  comparator: TTHNumberComparator;
  value: number;
}
export interface TTHDateData extends TTHData {
  comparator: TTHDateComparator;
  value: string | number;
}

// ─── Map data ─────────────────────────────────────────────────────────────────
export interface TDefObjMapData {
  pattern: string;
  hidden: boolean;
}
export interface TShapeMapData extends TDefObjMapData {
  style: TStyleColorKeys;
  colorOn: TColorOnKeys;
}
export interface TEventMapData extends TDefObjMapData {
  style: TTypeEventKeys;
  comparator: TComparatorKeys;
  eventOn: number;
  value: string;
}
export interface TTextMapData extends TDefObjMapData {
  textReplace: TTextMethodKeys;
  textPattern: string;
  textOn: TTextOnKeys;
}
export interface TLinkMapData extends TDefObjMapData {
  linkUrl: string;
  linkParams: boolean;
  linkOn: TLinkOnKeys;
}
export interface TDefMapData {
  text: string | undefined;
  hidden: boolean;
}
export interface TRangeMapData extends TDefMapData {
  from: string | undefined;
  to: string | undefined;
}
export interface TValueMapData extends TDefMapData {
  value: string | undefined;
}

// ─── Rule map container ───────────────────────────────────────────────────────
export type TMapDataArray = TShapeMapData[] | TTextMapData[] | TLinkMapData[] | TEventMapData[];

export interface TRuleMapOptions {
  identByProp: TPropertieKey;
  metadata: string;
  enableRegEx: boolean;
}
export type TTypeMap = 'shape' | 'text' | 'link' | 'event';
export interface TRuleMapData {
  options: TRuleMapOptions;
  dataList: TMapDataArray;
}
export interface TRuleShapeMapData extends TRuleMapData {
  dataList: TShapeMapData[];
}
export interface TRuleTextMapData extends TRuleMapData {
  dataList: TTextMapData[];
}
export interface TRuleLinkMapData extends TRuleMapData {
  dataList: TLinkMapData[];
}
export interface TRuleEventMapData extends TRuleMapData {
  dataList: TEventMapData[];
}

// ─── Rule data ────────────────────────────────────────────────────────────────
export interface TIRuleData {
  order: number;
  pattern: string;
  metricType: TMetricTypeKeys;
  alias: string;
  refId: string;
  column: string;
  aggregation: TAggregationKeys;
  unit: string;
  type: TValueTypeKeys;
  hidden: boolean;
  decimals: number;
  reduce: boolean;
  dateColumn: string;
  dateFormat: TDateFormatKeys;
  invert: boolean;
  gradient: boolean;
  overlayIcon: boolean;
  tooltip: boolean;
  tooltipLabel: string;
  tooltipColors: boolean;
  tooltipOn: TTooltipOnKeys;
  tpDirection: TDirectionKeys;
  tpMetadata: boolean;
  tpGraph: boolean;
  tpGraphSize: TGraphSizeKeys;
  tpGraphType: TGraphTypeKeys;
  tpGraphLow: number | null;
  tpGraphHigh: number | null;
  tpGraphScale: TGraphScaleKeys;
  mapsDat: {
    shapes: TRuleShapeMapData;
    texts: TRuleTextMapData;
    links: TRuleLinkMapData;
    events: TRuleEventMapData;
  };
  numberTHData: TTHNumberData[];
  stringTHData: TTHStringData[];
  dateTHData: TTHDateData[];
  mappingType: number;
  valueData: TValueMapData[];
  rangeData: TRangeMapData[];
  sanitize: boolean;
  newRule: boolean;
}

export interface TIRulesHandlerData {
  rulesData: TIRuleData[];
}

// ─── Flowchart data ───────────────────────────────────────────────────────────
export interface TFlowchartData {
  name: string;
  xml: string;
  csv: string;
  download: boolean;
  type: TSourceTypeKeys;
  url: string;
  zoom: string;
  center: boolean;
  scale: boolean;
  lock: boolean;
  enableAnim: boolean;
  tooltip: boolean;
  grid: boolean;
  bgColor: string | null;
}

export interface TFlowchartHandlerData {
  editorUrl: string;
  editorTheme: string;
  allowDrawio: boolean;
  flowcharts: TFlowchartData[];
}

// ─── Cell data ────────────────────────────────────────────────────────────────
export type TXCellMetadata = Map<string, any>;
export type TXCellStyles = Map<TStyleKeys, any>;

export interface TXCellGF {
  defaultValues: {
    id: string | null | undefined;
    value: string | null | undefined;
    metadata: TXCellMetadata | undefined;
    link: string | null | undefined;
    styles: TXCellStyles | undefined;
    dimension: mxGeometry | undefined;
  };
  tooltip: {
    enableTooltip: boolean;
    displayMetadata: boolean;
    tooltipHandler: any;
  };
}

// ─── Panel options (root type exposed to Grafana) ────────────────────────────
export interface FlowChartingOptions {
  flowchartsData: TFlowchartHandlerData;
  rulesData: TIRulesHandlerData;
}

// ─── Table column ─────────────────────────────────────────────────────────────
export type TTableAlign = 'left' | 'center' | 'right';
export type TTableSort = 'asc' | 'desc';
export interface TTableColumn {
  index: number;
  id: string;
  label: string;
  desc: string;
  width: string;
  align?: TTableAlign;
  sort?: TTableSort;
  select: boolean;
}
export interface TTableData {
  data: any[];
  columns: TTableColumn[];
}
