# FlowCharting React

[![CI](https://github.com/rprokhorov/grafana-flowcharting-react/actions/workflows/ci.yml/badge.svg)](https://github.com/rprokhorov/grafana-flowcharting-react/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

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

## Versioning

This project follows [Semantic Versioning](https://semver.org/). See
[CHANGELOG.md](CHANGELOG.md) for the history of changes. Releases are tagged
`vMAJOR.MINOR.PATCH`; tagging a `v*` tag builds the plugin and attaches a
packaged `.zip` to the GitHub Release (the built `dist/` is not committed).

## Contributing

Issues and pull requests are welcome. Before opening a PR:

```bash
npm install
npx tsc --noEmit   # type-check
npm test           # unit tests
npm run build      # production build
```

For end-to-end tests against a real Grafana, see [TESTING.md](TESTING.md).

## License

Licensed under the [Apache License 2.0](LICENSE). The plugin bundles the
draw.io / mxGraph viewer and shape libraries, which are also Apache-2.0
licensed by their respective authors — see [NOTICE](NOTICE).
