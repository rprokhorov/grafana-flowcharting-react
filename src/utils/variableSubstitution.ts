// Substitute _value, _color, _metric, _rule, _level, _formated, _date variables
// in tooltip labels and text maps.

export interface VariableContext {
  _value: string | number | null;
  _color: string;
  _metric: string;
  _rule: string;
  _level: number;
  _formated: string;
  _date: string;
}

export function substituteVariables(template: string, ctx: VariableContext): string {
  return template
    .replace(/_value/g, String(ctx._value ?? ''))
    .replace(/_color/g, ctx._color)
    .replace(/_metric/g, ctx._metric)
    .replace(/_rule/g, ctx._rule)
    .replace(/_level/g, String(ctx._level))
    .replace(/_formated/g, ctx._formated)
    .replace(/_date/g, ctx._date);
}
