import type { TTHNumberData, TTHNumberComparator } from '../../../types';

export class NumberThreshold {
  data: TTHNumberData;

  constructor(data: TTHNumberData) {
    this.data = data;
  }

  /**
   * Returns whether this threshold matches the given numeric value.
   * Comparator 'ge' = >=, 'gt' = >
   */
  matches(value: number): boolean {
    const { comparator, value: threshold } = this.data;
    if (comparator === 'ge') {
      return value >= threshold;
    }
    if (comparator === 'gt') {
      return value > threshold;
    }
    return false;
  }

  getLevel(): number {
    return this.data.level;
  }

  getColor(): string {
    return this.data.color;
  }

  static getDefaultData(level = 0, value = 0, color = '#73BF69'): TTHNumberData {
    const comparator: TTHNumberComparator = level === 0 ? 'ge' : 'ge';
    return { level, value, color, comparator };
  }
}
