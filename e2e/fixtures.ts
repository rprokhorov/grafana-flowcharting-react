import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES_DIR = join(__dirname, 'fixtures');

/** Read a fixture file from e2e/fixtures as a UTF-8 string. */
export function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), 'utf8');
}

/**
 * The shared test diagram — a Kubernetes topology (ingress → service → 3 pods)
 * that exercises the mxgraph.kubernetes stencil loader. This is the canonical
 * schema used across e2e tests (added as XML, opened from file, etc.).
 */
export const TEST_DIAGRAM_FILE = 'тестовая схема.drawio';

/** The draw.io XML of the shared test diagram. */
export function testDiagramXml(): string {
  return readFixture(TEST_DIAGRAM_FILE);
}
