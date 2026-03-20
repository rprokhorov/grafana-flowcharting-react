import { DrawioEngine } from '../core/drawio/DrawioEngine';

export function encodeXml(xml: string): string {
  return DrawioEngine.encode(xml);
}

export function decodeXml(data: string): string {
  return DrawioEngine.decode(data);
}

export function isEncoded(data: string): boolean {
  return DrawioEngine.isEncoded(data);
}
