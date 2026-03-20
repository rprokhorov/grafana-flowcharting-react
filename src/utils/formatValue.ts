import { getValueFormat, formattedValueToString } from '@grafana/data';

export function formatValue(value: number, unit: string, decimals = 2): string {
  try {
    const formatter = getValueFormat(unit || 'short');
    return formattedValueToString(formatter(value, decimals));
  } catch {
    return String(value);
  }
}
