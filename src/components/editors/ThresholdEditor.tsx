import React from 'react';
import { Button, ColorPicker, Input, Select } from '@grafana/ui';
import type { TTHNumberData, TTHStringData, TTHDateData, TValueTypeKeys } from '../../types';

interface ThresholdEditorProps {
  type: TValueTypeKeys;
  numberData: TTHNumberData[];
  stringData: TTHStringData[];
  dateData: TTHDateData[];
  onChange: (type: TValueTypeKeys, numberData: TTHNumberData[], stringData: TTHStringData[], dateData: TTHDateData[]) => void;
}

const NUMBER_COMPARATORS = [
  { label: '>=', value: 'ge' },
  { label: '>', value: 'gt' },
];
const STRING_COMPARATORS = [
  { label: '==', value: 'eq' },
  { label: '!=', value: 'ne' },
];
const DATE_COMPARATORS = [
  { label: '==', value: 'eq' },
  { label: '!=', value: 'ne' },
  { label: '>=', value: 'ge' },
  { label: '>', value: 'gt' },
];

export const ThresholdEditor: React.FC<ThresholdEditorProps> = ({
  type,
  numberData,
  stringData,
  dateData,
  onChange,
}) => {
  const addNumberTH = () => {
    const newTH: TTHNumberData = {
      level: numberData.length,
      value: 0,
      color: '#73BF69',
      comparator: 'ge',
    };
    onChange(type, [...numberData, newTH], stringData, dateData);
  };

  const removeNumberTH = (index: number) => {
    onChange(
      type,
      numberData.filter((_, i) => i !== index),
      stringData,
      dateData
    );
  };

  const updateNumberTH = (index: number, patch: Partial<TTHNumberData>) => {
    const updated = numberData.map((th, i) => (i === index ? { ...th, ...patch } : th));
    onChange(type, updated, stringData, dateData);
  };

  const addStringTH = () => {
    const newTH: TTHStringData = {
      level: stringData.length,
      value: '',
      color: '#73BF69',
      comparator: 'eq',
    };
    onChange(type, numberData, [...stringData, newTH], dateData);
  };

  const removeStringTH = (index: number) => {
    onChange(
      type,
      numberData,
      stringData.filter((_, i) => i !== index),
      dateData
    );
  };

  const updateStringTH = (index: number, patch: Partial<TTHStringData>) => {
    const updated = stringData.map((th, i) => (i === index ? { ...th, ...patch } : th));
    onChange(type, numberData, updated, dateData);
  };

  return (
    <div>
      {type === 'number' && (
        <div>
          {numberData.map((th, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
              <Select
                options={NUMBER_COMPARATORS}
                value={th.comparator}
                onChange={(v) => updateNumberTH(i, { comparator: v.value as any })}
                width={8}
              />
              <Input
                type="number"
                value={th.value}
                onChange={(e) => updateNumberTH(i, { value: Number((e.target as HTMLInputElement).value) })}
                width={12}
              />
              <ColorPicker
                color={th.color}
                onChange={(color) => updateNumberTH(i, { color })}
              />
              <Button variant="destructive" size="sm" icon="trash-alt" onClick={() => removeNumberTH(i)} />
            </div>
          ))}
          <Button variant="secondary" size="sm" icon="plus" onClick={addNumberTH}>
            Add threshold
          </Button>
        </div>
      )}

      {type === 'string' && (
        <div>
          {stringData.map((th, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
              <Select
                options={STRING_COMPARATORS}
                value={th.comparator}
                onChange={(v) => updateStringTH(i, { comparator: v.value as any })}
                width={8}
              />
              <Input
                value={th.value}
                onChange={(e) => updateStringTH(i, { value: (e.target as HTMLInputElement).value })}
                width={16}
                placeholder="value"
              />
              <ColorPicker
                color={th.color}
                onChange={(color) => updateStringTH(i, { color })}
              />
              <Button variant="destructive" size="sm" icon="trash-alt" onClick={() => removeStringTH(i)} />
            </div>
          ))}
          <Button variant="secondary" size="sm" icon="plus" onClick={addStringTH}>
            Add threshold
          </Button>
        </div>
      )}
    </div>
  );
};
