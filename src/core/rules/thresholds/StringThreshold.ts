import type { TTHStringData, TTHStringComparator } from '../../../types';

export class StringThreshold {
  data: TTHStringData;

  constructor(data: TTHStringData) {
    this.data = data;
  }

  matches(value: string): boolean {
    const { comparator, value: threshold } = this.data;
    if (comparator === 'eq') {
      return value === threshold;
    }
    if (comparator === 'ne') {
      return value !== threshold;
    }
    return false;
  }

  getLevel(): number {
    return this.data.level;
  }

  getColor(): string {
    return this.data.color;
  }

  static getDefaultData(level = 0, value = '', color = '#73BF69'): TTHStringData {
    const comparator: TTHStringComparator = 'eq';
    return { level, value, color, comparator };
  }
}
