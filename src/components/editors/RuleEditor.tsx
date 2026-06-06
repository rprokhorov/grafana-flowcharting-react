import React from 'react';
import { Collapse, InlineField, Input, Select, Switch } from '@grafana/ui';
import type { TIRuleData } from '../../types';
import { ThresholdEditor } from './ThresholdEditor';
import { ShapeMapsEditor, TextMapsEditor, LinkMapsEditor, EventMapsEditor, MapOptionsRow } from './MappingEditor';
import type { TRuleMapOptions } from '../../types';

const AGGREGATION_OPTIONS = [
  { label: 'Current', value: 'current' },
  { label: 'Current (not null)', value: 'current_notnull' },
  { label: 'First', value: 'first' },
  { label: 'Min', value: 'min' },
  { label: 'Max', value: 'max' },
  { label: 'Average', value: 'avg' },
  { label: 'Total', value: 'total' },
  { label: 'Count', value: 'count' },
  { label: 'Delta', value: 'delta' },
  { label: 'Range', value: 'range' },
  { label: 'Diff', value: 'diff' },
];
const VALUE_TYPE_OPTIONS = [
  { label: 'Number', value: 'number' },
  { label: 'String', value: 'string' },
  { label: 'Date', value: 'date' },
];
const METRIC_TYPE_OPTIONS = [
  { label: 'Serie', value: 'serie' },
  { label: 'Table', value: 'table' },
];

interface RuleEditorProps {
  rule: TIRuleData;
  onChange: (rule: TIRuleData) => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onChange }) => {
  const update = (patch: Partial<TIRuleData>) => onChange({ ...rule, ...patch });

  const updateMapOptions = (
    group: 'shapes' | 'texts' | 'links' | 'events',
    options: TRuleMapOptions
  ) =>
    update({
      mapsDat: { ...rule.mapsDat, [group]: { ...rule.mapsDat[group], options } },
    });

  const [openMetric, setOpenMetric] = React.useState(true);
  const [openThresholds, setOpenThresholds] = React.useState(true);
  const [openShapeMaps, setOpenShapeMaps] = React.useState(false);
  const [openTextMaps, setOpenTextMaps] = React.useState(false);
  const [openLinkMaps, setOpenLinkMaps] = React.useState(false);
  const [openEventMaps, setOpenEventMaps] = React.useState(false);

  return (
    <div>
      {/* Metric binding */}
      <Collapse label="Metric" isOpen={openMetric} onToggle={() => setOpenMetric((v) => !v)}>
        <InlineField label="Pattern" grow>
          <Input
            value={rule.pattern}
            onChange={(e) => update({ pattern: (e.target as HTMLInputElement).value })}
            placeholder="/.*/"
          />
        </InlineField>
        <InlineField label="Alias">
          <Input
            value={rule.alias}
            onChange={(e) => update({ alias: (e.target as HTMLInputElement).value })}
            placeholder="Rule name"
          />
        </InlineField>
        <InlineField label="Metric type">
          <Select
            options={METRIC_TYPE_OPTIONS}
            value={rule.metricType}
            onChange={(v) => update({ metricType: v.value as any })}
            width={14}
          />
        </InlineField>
        <InlineField label="Aggregation">
          <Select
            options={AGGREGATION_OPTIONS}
            value={rule.aggregation}
            onChange={(v) => update({ aggregation: v.value as any })}
            width={18}
          />
        </InlineField>
        <InlineField label="Value type">
          <Select
            options={VALUE_TYPE_OPTIONS}
            value={rule.type}
            onChange={(v) => update({ type: v.value as any })}
            width={14}
          />
        </InlineField>
        <InlineField label="Unit">
          <Input
            value={rule.unit}
            onChange={(e) => update({ unit: (e.target as HTMLInputElement).value })}
            placeholder="short"
            width={12}
          />
        </InlineField>
        <InlineField label="Decimals">
          <Input
            type="number"
            value={rule.decimals}
            onChange={(e) => update({ decimals: Number((e.target as HTMLInputElement).value) })}
            width={8}
          />
        </InlineField>
        <InlineField label="Column" tooltip="Table metric column to read (e.g. Value)">
          <Input
            value={rule.column}
            onChange={(e) => update({ column: (e.target as HTMLInputElement).value })}
            placeholder="Value"
            width={12}
          />
        </InlineField>
        <InlineField label="Invert" tooltip="Mirror the threshold severity (low values treated as high)">
          <Switch
            value={rule.invert}
            onChange={(e) => update({ invert: (e.target as HTMLInputElement).checked })}
          />
        </InlineField>
        <InlineField label="Hidden" tooltip="Disable this rule without deleting it">
          <Switch
            value={rule.hidden}
            onChange={(e) => update({ hidden: (e.target as HTMLInputElement).checked })}
          />
        </InlineField>
      </Collapse>

      {/* Thresholds */}
      <Collapse label="Thresholds" isOpen={openThresholds} onToggle={() => setOpenThresholds((v) => !v)}>
        <ThresholdEditor
          type={rule.type}
          numberData={rule.numberTHData}
          stringData={rule.stringTHData}
          dateData={rule.dateTHData}
          onChange={(type, numberData, stringData, dateData) =>
            update({ type, numberTHData: numberData, stringTHData: stringData, dateTHData: dateData })
          }
        />
      </Collapse>

      {/* Shape maps */}
      <Collapse label="Shape maps" isOpen={openShapeMaps} onToggle={() => setOpenShapeMaps((v) => !v)}>
        <MapOptionsRow options={rule.mapsDat.shapes.options} onChange={(o) => updateMapOptions('shapes', o)} />
        <ShapeMapsEditor
          data={rule.mapsDat.shapes.dataList}
          onChange={(dataList) =>
            update({ mapsDat: { ...rule.mapsDat, shapes: { ...rule.mapsDat.shapes, dataList } } })
          }
        />
      </Collapse>

      {/* Text maps */}
      <Collapse label="Text maps" isOpen={openTextMaps} onToggle={() => setOpenTextMaps((v) => !v)}>
        <MapOptionsRow options={rule.mapsDat.texts.options} onChange={(o) => updateMapOptions('texts', o)} />
        <TextMapsEditor
          data={rule.mapsDat.texts.dataList}
          onChange={(dataList) =>
            update({ mapsDat: { ...rule.mapsDat, texts: { ...rule.mapsDat.texts, dataList } } })
          }
        />
      </Collapse>

      {/* Link maps */}
      <Collapse label="Link maps" isOpen={openLinkMaps} onToggle={() => setOpenLinkMaps((v) => !v)}>
        <MapOptionsRow options={rule.mapsDat.links.options} onChange={(o) => updateMapOptions('links', o)} />
        <LinkMapsEditor
          data={rule.mapsDat.links.dataList}
          onChange={(dataList) =>
            update({ mapsDat: { ...rule.mapsDat, links: { ...rule.mapsDat.links, dataList } } })
          }
        />
      </Collapse>

      {/* Event maps */}
      <Collapse label="Event maps" isOpen={openEventMaps} onToggle={() => setOpenEventMaps((v) => !v)}>
        <MapOptionsRow options={rule.mapsDat.events.options} onChange={(o) => updateMapOptions('events', o)} />
        <EventMapsEditor
          data={rule.mapsDat.events.dataList}
          onChange={(dataList) =>
            update({ mapsDat: { ...rule.mapsDat, events: { ...rule.mapsDat.events, dataList } } })
          }
        />
      </Collapse>
    </div>
  );
};
