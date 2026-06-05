// Compiling a RegExp is relatively expensive, and the rule engine matches the
// same user-supplied patterns against every cell on every refresh. These
// helpers memoize compiled RegExp objects so each distinct pattern is only
// parsed once.

const _cache = new Map<string, RegExp>();

/**
 * Compile a pattern into a (cached) RegExp, supporting the `/pattern/flags`
 * syntax. Returns null if the pattern is not a valid regular expression.
 */
export function compileRegex(pattern: string): RegExp | null {
  const cached = _cache.get(pattern);
  if (cached !== undefined) {
    return cached;
  }
  let re: RegExp | null;
  try {
    const m = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
    re = m ? new RegExp(m[1], m[2]) : new RegExp(pattern);
  } catch {
    re = null;
  }
  _cache.set(pattern, re as RegExp);
  return re;
}

/**
 * Test a value against a pattern. Falls back to exact string equality when the
 * pattern is not a valid regular expression.
 */
export function regexTest(pattern: string, value: string): boolean {
  const re = compileRegex(pattern);
  return re ? re.test(value) : value === pattern;
}
