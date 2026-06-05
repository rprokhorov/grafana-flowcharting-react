# FlowCharting React

A Grafana 10+ **panel plugin** that renders [draw.io](https://www.drawio.com/) /
mxGraph diagrams and binds them to Grafana metrics — color cells by thresholds,
replace labels with values, trigger shape events, and show per-rule sparkline
tooltips.

This is a React port of the original Angular-based grafana-flowcharting plugin.

- **Plugin id:** `flowcharting-react-panel`
- **Type:** panel
- **Requires:** Grafana ≥ 10.0

---

## Build

The plugin is built with **webpack** (not grafana-toolkit):

```bash
npm install
npm run build          # outputs dist/ (module.js + plugin.json + static/libs)
npm run dev            # webpack --watch
```

`dist/` contains `module.js`, `plugin.json`, and `static/libs/` with the draw.io
viewer plus bundled stencil libraries (AWS, Azure, GCP, Cisco, Kubernetes, …).
See [STENCILS.md](STENCILS.md) for how stencils are loaded and how to work in
air-gapped environments.

## Run locally

Load the built plugin into a Grafana container by bind-mounting `dist/`:

```bash
docker run -d --name grafana-fc -p 3000:3000 \
  -v "$(pwd)/dist":/var/lib/grafana/plugins/flowcharting-react-panel \
  -e GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=flowcharting-react-panel \
  -e GF_DEFAULT_APP_MODE=development \
  grafana/grafana:10.4.0
```

Open http://localhost:3000 (admin / admin) → **Dashboards → New → Add
visualization → FlowCharting React**. After rebuilding, `docker restart
grafana-fc` and hard-refresh the browser (Cmd+Shift+R) to bust the cached bundle.

## Testing

The plugin has unit tests (Jest) and end-to-end tests (Playwright +
`@grafana/plugin-e2e`).

```bash
npm test               # unit tests (fast, no browser)
npm run e2e            # e2e tests (needs the grafana-fc container running)
```

📖 **See [TESTING.md](TESTING.md)** for the full guide: how to run each level,
the visual / headed / debug modes, how to write a new test plan, and the
**test-coverage table** tracking what is and isn't covered.

## Project layout

```
src/
  components/   React UI — panel, renderer, navigator, tooltip, option editors
  core/         Engine — drawio (XGraph/XCell), rules, thresholds, metrics
  hooks/        React hooks wiring core ↔ components
  store/        Tooltip view-state types
  utils/        Color, formatting, regex cache, xml helpers
spec/           Jest unit tests
e2e/            Playwright e2e tests + fixtures
```

## License

Apache-2.0
