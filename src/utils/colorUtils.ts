import chroma from 'chroma-js';

export function isValidColor(color: string): boolean {
  try {
    chroma(color);
    return true;
  } catch {
    return false;
  }
}

export function toHex(color: string): string {
  try {
    return chroma(color).hex();
  } catch {
    return color;
  }
}

export function interpolateColors(from: string, to: string, steps: number): string[] {
  try {
    return chroma.scale([from, to]).mode('lrgb').colors(steps);
  } catch {
    return [from, to];
  }
}
