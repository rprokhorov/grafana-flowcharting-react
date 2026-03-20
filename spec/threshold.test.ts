import { NumberThreshold } from '../src/core/rules/thresholds/NumberThreshold';
import { StringThreshold } from '../src/core/rules/thresholds/StringThreshold';
import { DateThreshold } from '../src/core/rules/thresholds/DateThreshold';

describe('NumberThreshold', () => {
  it('matches when value >= threshold (ge)', () => {
    const th = new NumberThreshold({ level: 1, value: 50, color: '#FADE2A', comparator: 'ge' });
    expect(th.matches(50)).toBe(true);
    expect(th.matches(51)).toBe(true);
    expect(th.matches(49)).toBe(false);
  });

  it('matches when value > threshold (gt)', () => {
    const th = new NumberThreshold({ level: 1, value: 50, color: '#FADE2A', comparator: 'gt' });
    expect(th.matches(51)).toBe(true);
    expect(th.matches(50)).toBe(false);
    expect(th.matches(49)).toBe(false);
  });

  it('returns level and color', () => {
    const th = new NumberThreshold({ level: 2, value: 80, color: '#F2495C', comparator: 'ge' });
    expect(th.getLevel()).toBe(2);
    expect(th.getColor()).toBe('#F2495C');
  });
});

describe('StringThreshold', () => {
  it('matches equal string (eq)', () => {
    const th = new StringThreshold({ level: 1, value: 'WARN', color: '#FADE2A', comparator: 'eq' });
    expect(th.matches('WARN')).toBe(true);
    expect(th.matches('OK')).toBe(false);
  });

  it('matches not equal string (ne)', () => {
    const th = new StringThreshold({ level: 1, value: 'OK', color: '#FADE2A', comparator: 'ne' });
    expect(th.matches('WARN')).toBe(true);
    expect(th.matches('OK')).toBe(false);
  });
});

describe('DateThreshold', () => {
  it('matches ge comparator', () => {
    const th = new DateThreshold({ level: 1, value: '2024-01-01', color: '#FADE2A', comparator: 'ge' });
    expect(th.matches('2024-06-01')).toBe(true);
    expect(th.matches('2023-12-31')).toBe(false);
    expect(th.matches('2024-01-01')).toBe(true);
  });

  it('matches eq comparator', () => {
    const th = new DateThreshold({ level: 1, value: '2024-01-01', color: '#FADE2A', comparator: 'eq' });
    expect(th.matches('2024-01-01')).toBe(true);
    expect(th.matches('2024-01-02')).toBe(false);
  });

  it('returns false for null value', () => {
    const th = new DateThreshold({ level: 1, value: '2024-01-01', color: '#FADE2A', comparator: 'ge' });
    expect(th.matches(null)).toBe(false);
  });

  it('validates dates', () => {
    expect(DateThreshold.isValidDate('2024-01-01')).toBe(true);
    expect(DateThreshold.isValidDate(null)).toBe(false);
    expect(DateThreshold.isValidDate('not-a-date')).toBe(false);
  });
});
