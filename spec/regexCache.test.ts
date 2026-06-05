import { compileRegex, regexTest } from '../src/utils/regexCache';

describe('regexCache', () => {
  it('matches a plain pattern', () => {
    expect(regexTest('cpu', 'cpu_usage')).toBe(true);
    expect(regexTest('mem', 'cpu_usage')).toBe(false);
  });

  it('supports /pattern/flags syntax', () => {
    expect(regexTest('/CPU/i', 'cpu_usage')).toBe(true);
  });

  it('falls back to exact equality for invalid patterns', () => {
    // unbalanced bracket → not a valid regex
    expect(regexTest('[', '[')).toBe(true);
    expect(regexTest('[', 'x')).toBe(false);
  });

  it('is stable across repeated calls with a /g pattern (no lastIndex drift)', () => {
    // Regression: a cached global regex would advance lastIndex and alternate
    // true/false across calls. All repeats must return the same result.
    for (let i = 0; i < 5; i++) {
      expect(regexTest('/pod/g', 'pod-1')).toBe(true);
    }
  });

  it('is stable across repeated calls with a /y (sticky) pattern', () => {
    for (let i = 0; i < 5; i++) {
      expect(regexTest('/pod/y', 'pod-1')).toBe(true);
    }
  });

  it('compileRegex strips g/y flags but keeps others', () => {
    const re = compileRegex('/abc/gi');
    expect(re).not.toBeNull();
    expect(re!.flags).toBe('i');
    expect(re!.global).toBe(false);
  });
});
