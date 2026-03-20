import type { TTHDateData, TTHDateComparator } from '../../../types';
import dayjs from 'dayjs';

export class DateThreshold {
  data: TTHDateData;

  constructor(data: TTHDateData) {
    this.data = data;
  }

  matches(value: string | number | null): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    const { comparator, value: threshold } = this.data;
    const a = dayjs(value as any);
    const b = dayjs(threshold as any);
    if (!a.isValid() || !b.isValid()) {
      return false;
    }
    switch (comparator) {
      case 'eq':
        return a.isSame(b);
      case 'ne':
        return !a.isSame(b);
      case 'ge':
        return a.isAfter(b) || a.isSame(b);
      case 'gt':
        return a.isAfter(b);
      default:
        return false;
    }
  }

  getLevel(): number {
    return this.data.level;
  }

  getColor(): string {
    return this.data.color;
  }

  static isValidDate(value: string | number | null | undefined): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    return dayjs(value as any).isValid();
  }

  static getDefaultData(level = 0, value = '', color = '#73BF69'): TTHDateData {
    const comparator: TTHDateComparator = 'ge';
    return { level, value, color, comparator };
  }
}
