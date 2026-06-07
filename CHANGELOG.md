# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-07

Initial public release. A React port of the Angular-based grafana-flowcharting
plugin for Grafana 10+, rendering draw.io / mxGraph diagrams bound to metrics.

### Added
- Render draw.io diagrams from XML, with bundled stencil libraries (AWS, Azure,
  GCP, Cisco, Kubernetes, …) and an opt-out CDN fallback for missing stencils.
- CSV diagram source: import nodes/edges from a draw.io-style CSV.
- Rule engine: number/string/date thresholds, value/range mapping, unit and
  decimals formatting, and an `invert` mode.
- Map types: shape (color), text (label replace/append modes), link (clickable
  cell links) and event (style change) maps, each with per-map match options
  (by id / value / metadata, with regex).
- Per-rule multi-series tooltip with sparklines.
- Multi-diagram navigator.
- Display options: lock, grid, zoom, scale/center, background color, animation.
- Migration handler for options from the original plugin format.

### Testing
- Jest unit tests for the rule/threshold/metric/codec core.
- Playwright + `@grafana/plugin-e2e` end-to-end suite with provisioned
  dashboards (coloring, aggregation, mapping, tooltip, navigator, robustness).

[Unreleased]: https://github.com/rprokhorov/grafana-flowcharting-react/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rprokhorov/grafana-flowcharting-react/releases/tag/v0.1.0
