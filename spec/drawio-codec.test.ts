import { DrawioEngine } from '../src/core/drawio/DrawioEngine';

describe('DrawioEngine encode/decode', () => {
  it('round-trips a small payload', () => {
    const original = '<mxGraphModel><root><mxCell id="2" value="hello"/></root></mxGraphModel>';
    const encoded = DrawioEngine.encode(original);
    expect(encoded).not.toBe('');
    expect(DrawioEngine.decode(encoded)).toBe(original);
  });

  it('round-trips a large payload without overflowing the call stack', () => {
    // ~500 KB of content — large enough that a naive String.fromCharCode(...spread)
    // would throw "Maximum call stack size exceeded".
    const original = '<root>' + 'x'.repeat(500_000) + '</root>';
    const encoded = DrawioEngine.encode(original);
    expect(encoded).not.toBe('');
    expect(DrawioEngine.decode(encoded)).toBe(original);
  });
});
