import React from 'react';
import { Button, Input, Select } from '@grafana/ui';
import type { TShapeMapData, TTextMapData, TLinkMapData, TEventMapData } from '../../types';
import { ShapeMap } from '../../core/rules/mappings/ShapeMap';
import { TextMap } from '../../core/rules/mappings/TextMap';
import { LinkMap } from '../../core/rules/mappings/LinkMap';
import { EventMap } from '../../core/rules/mappings/EventMap';

const COLOR_ON_OPTIONS = [
  { label: 'Never', value: 'n' },
  { label: 'When condition', value: 'wc' },
  { label: 'Always', value: 'a' },
];
const TEXT_ON_OPTIONS = [
  { label: 'Never', value: 'n' },
  { label: 'When metric data', value: 'wmd' },
  { label: 'When condition', value: 'wc' },
  { label: 'Critical only', value: 'co' },
];
const LINK_ON_OPTIONS = [
  { label: 'When condition', value: 'wc' },
  { label: 'Always', value: 'a' },
];
const STYLE_KEYS = [
  { label: 'fillColor', value: 'fillColor' },
  { label: 'strokeColor', value: 'strokeColor' },
  { label: 'fontColor', value: 'fontColor' },
  { label: 'gradientColor', value: 'gradientColor' },
];

// ─── Shape Maps ───────────────────────────────────────────────────────────────

interface ShapeMapsEditorProps {
  data: TShapeMapData[];
  onChange: (data: TShapeMapData[]) => void;
}

export const ShapeMapsEditor: React.FC<ShapeMapsEditorProps> = ({ data, onChange }) => {
  const add = () => onChange([...data, ShapeMap.getDefaultData()]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<TShapeMapData>) =>
    onChange(data.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
          <Input value={item.pattern} onChange={(e) => update(i, { pattern: (e.target as HTMLInputElement).value })} placeholder="pattern" width={16} />
          <Select options={STYLE_KEYS} value={item.style} onChange={(v) => update(i, { style: v.value as any })} width={14} />
          <Select options={COLOR_ON_OPTIONS} value={item.colorOn} onChange={(v) => update(i, { colorOn: v.value as any })} width={12} />
          <Button variant="destructive" size="sm" icon="trash-alt" onClick={() => remove(i)} />
        </div>
      ))}
      <Button variant="secondary" size="sm" icon="plus" onClick={add}>Add shape map</Button>
    </div>
  );
};

// ─── Text Maps ────────────────────────────────────────────────────────────────

interface TextMapsEditorProps {
  data: TTextMapData[];
  onChange: (data: TTextMapData[]) => void;
}

export const TextMapsEditor: React.FC<TextMapsEditorProps> = ({ data, onChange }) => {
  const add = () => onChange([...data, TextMap.getDefaultData()]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<TTextMapData>) =>
    onChange(data.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
          <Input value={item.pattern} onChange={(e) => update(i, { pattern: (e.target as HTMLInputElement).value })} placeholder="cell pattern" width={16} />
          <Select options={TEXT_ON_OPTIONS} value={item.textOn} onChange={(v) => update(i, { textOn: v.value as any })} width={14} />
          <Button variant="destructive" size="sm" icon="trash-alt" onClick={() => remove(i)} />
        </div>
      ))}
      <Button variant="secondary" size="sm" icon="plus" onClick={add}>Add text map</Button>
    </div>
  );
};

// ─── Link Maps ────────────────────────────────────────────────────────────────

interface LinkMapsEditorProps {
  data: TLinkMapData[];
  onChange: (data: TLinkMapData[]) => void;
}

export const LinkMapsEditor: React.FC<LinkMapsEditorProps> = ({ data, onChange }) => {
  const add = () => onChange([...data, LinkMap.getDefaultData()]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<TLinkMapData>) =>
    onChange(data.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
          <Input value={item.pattern} onChange={(e) => update(i, { pattern: (e.target as HTMLInputElement).value })} placeholder="cell pattern" width={14} />
          <Input value={item.linkUrl} onChange={(e) => update(i, { linkUrl: (e.target as HTMLInputElement).value })} placeholder="https://…" width={20} />
          <Select options={LINK_ON_OPTIONS} value={item.linkOn} onChange={(v) => update(i, { linkOn: v.value as any })} width={12} />
          <Button variant="destructive" size="sm" icon="trash-alt" onClick={() => remove(i)} />
        </div>
      ))}
      <Button variant="secondary" size="sm" icon="plus" onClick={add}>Add link map</Button>
    </div>
  );
};

// ─── Event Maps ───────────────────────────────────────────────────────────────

interface EventMapsEditorProps {
  data: TEventMapData[];
  onChange: (data: TEventMapData[]) => void;
}

export const EventMapsEditor: React.FC<EventMapsEditorProps> = ({ data, onChange }) => {
  const add = () => onChange([...data, EventMap.getDefaultData()]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<TEventMapData>) =>
    onChange(data.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
          <Input value={item.pattern} onChange={(e) => update(i, { pattern: (e.target as HTMLInputElement).value })} placeholder="cell pattern" width={14} />
          <Input value={item.value} onChange={(e) => update(i, { value: (e.target as HTMLInputElement).value })} placeholder="value" width={10} />
          <Button variant="destructive" size="sm" icon="trash-alt" onClick={() => remove(i)} />
        </div>
      ))}
      <Button variant="secondary" size="sm" icon="plus" onClick={add}>Add event map</Button>
    </div>
  );
};
