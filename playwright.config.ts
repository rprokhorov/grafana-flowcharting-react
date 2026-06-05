import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Load .env (credentials for the local container) without pulling in dotenv.
// Only sets keys that aren't already in the real environment, so CI/shell vars win.
const envFile = resolve(__dirname, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

// @grafana/plugin-e2e connects to an already-running Grafana instance — it does
// NOT spin up its own. We point it at the local Docker container `grafana-fc`
// (see memory/local-deploy.md) which has dist/ bind-mounted as the plugin.
//
//   docker start grafana-fc   # or the full `docker run` from the deploy notes
//   npm run e2e
//
// Override the target with GRAFANA_URL / GRAFANA_ADMIN_USER / GRAFANA_ADMIN_PASSWORD.

const GRAFANA_URL = process.env.GRAFANA_URL ?? 'http://localhost:3000';
const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: GRAFANA_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Logs in once and stores the session for the test projects to reuse.
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*auth\.setup\.js/],
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});
