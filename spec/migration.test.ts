import { migrateOptions } from '../src/migration';

describe('migrateOptions', () => {
  it('migrates old-style panel with root-level data', () => {
    const panel: any = {
      options: {},
      flowchartsData: {
        editorUrl: 'https://embed.diagrams.net',
        editorTheme: 'kennedy',
        allowDrawio: true,
        flowcharts: [
          {
            name: 'Main',
            xml: '<mxGraphModel></mxGraphModel>',
            type: 'xml',
            zoom: '100%',
            center: true,
            scale: true,
            lock: true,
            enableAnim: true,
            tooltip: true,
            grid: false,
            bgColor: null,
            download: false,
            csv: '',
            url: '',
          },
        ],
      },
      rulesData: {
        rulesData: [
          {
            order: 0,
            pattern: '/cpu.*/',
            alias: 'CPU Rule',
            metricType: 'serie',
            refId: 'A',
            column: 'Value',
            aggregation: 'current',
            unit: 'percent',
            type: 'number',
            hidden: false,
            decimals: 2,
            reduce: true,
            numberTHData: [
              { level: 0, value: 0, color: '#73BF69', comparator: 'ge' },
              { level: 1, value: 80, color: '#F2495C', comparator: 'ge' },
            ],
            stringTHData: [],
            dateTHData: [],
            mapsDat: {
              shapes: { options: { identByProp: 'id', metadata: '', enableRegEx: true }, dataList: [] },
              texts: { options: { identByProp: 'id', metadata: '', enableRegEx: true }, dataList: [] },
              links: { options: { identByProp: 'id', metadata: '', enableRegEx: true }, dataList: [] },
              events: { options: { identByProp: 'id', metadata: '', enableRegEx: true }, dataList: [] },
            },
            mappingType: 1,
            valueData: [],
            rangeData: [],
            sanitize: false,
            newRule: false,
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
            dateColumn: '',
            dateFormat: 'YYYY-MM-DD HH:mm:ss',
          },
        ],
      },
    };

    const result = migrateOptions(panel);

    expect(result.flowchartsData).toBeDefined();
    expect(result.flowchartsData?.flowcharts).toHaveLength(1);
    expect(result.flowchartsData?.flowcharts[0].name).toBe('Main');
    expect(result.flowchartsData?.flowcharts[0].xml).toBe('<mxGraphModel></mxGraphModel>');

    expect(result.rulesData).toBeDefined();
    expect(result.rulesData?.rulesData).toHaveLength(1);
    expect(result.rulesData?.rulesData[0].alias).toBe('CPU Rule');
    expect(result.rulesData?.rulesData[0].pattern).toBe('/cpu.*/');
  });

  it('handles old plugin format with colors/thresholds arrays', () => {
    const panel: any = {
      options: {},
      rulesData: {
        rulesData: [
          {
            order: 0,
            pattern: '/mem.*/',
            alias: 'Memory',
            colors: ['#73BF69', '#FADE2A', '#F2495C'],
            thresholds: [0, 50, 80],
          },
        ],
      },
    };

    const result = migrateOptions(panel);
    expect(result.rulesData?.rulesData[0].numberTHData).toHaveLength(3);
    expect(result.rulesData?.rulesData[0].numberTHData[0].color).toBe('#73BF69');
    expect(result.rulesData?.rulesData[0].numberTHData[1].value).toBe(50);
  });

  it('returns empty when no old data found', () => {
    const panel: any = { options: {} };
    const result = migrateOptions(panel);
    expect(result).toEqual({});
  });
});
