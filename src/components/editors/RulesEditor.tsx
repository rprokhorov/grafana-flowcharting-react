import React, { useState } from 'react';
import type { StandardEditorProps } from '@grafana/data';
import { Button, Collapse } from '@grafana/ui';
import type { TIRulesHandlerData, TIRuleData } from '../../types';
import { getDefaultRuleData } from '../../defaults';
import { RuleEditor } from './RuleEditor';

type Props = StandardEditorProps<TIRulesHandlerData>;

export const RulesEditor: React.FC<Props> = ({ value, onChange }) => {
  const rules: TIRuleData[] = value?.rulesData ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(rules.length > 0 ? 0 : null);

  const addRule = () => {
    const newRule = getDefaultRuleData(rules.length);
    onChange({ rulesData: [...rules, newRule] });
    setOpenIndex(rules.length);
  };

  const removeRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index).map((r, i) => ({ ...r, order: i }));
    onChange({ rulesData: updated });
    setOpenIndex(null);
  };

  const updateRule = (index: number, rule: TIRuleData) => {
    const updated = rules.map((r, i) => (i === index ? rule : r));
    onChange({ rulesData: updated });
  };

  const moveUp = (index: number) => {
    if (index === 0) {
      return;
    }
    const updated = [...rules];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange({ rulesData: updated.map((r, i) => ({ ...r, order: i })) });
  };

  const moveDown = (index: number) => {
    if (index === rules.length - 1) {
      return;
    }
    const updated = [...rules];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange({ rulesData: updated.map((r, i) => ({ ...r, order: i })) });
  };

  return (
    <div>
      {rules.map((rule, index) => (
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
              {rule.alias || `Rule ${index + 1}`}
            </span>
            <Button variant="secondary" size="sm" icon="arrow-up" onClick={() => moveUp(index)} style={{ marginRight: 4 }} />
            <Button variant="secondary" size="sm" icon="arrow-down" onClick={() => moveDown(index)} style={{ marginRight: 4 }} />
            <Button variant="destructive" size="sm" icon="trash-alt" onClick={() => removeRule(index)} />
          </div>
          {openIndex === index && (
            <div style={{ padding: 8 }}>
              <RuleEditor rule={rule} onChange={(updated) => updateRule(index, updated)} />
            </div>
          )}
        </div>
      ))}
      <Button variant="primary" size="sm" icon="plus" onClick={addRule}>
        Add rule
      </Button>
    </div>
  );
};
