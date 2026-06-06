# Stencils (Shape Libraries)

draw.io supports hundreds of shape libraries ("stencils") — Kubernetes, AWS,
Azure, GCP, Cisco, network diagrams, and more. This document explains how
the plugin loads them and what to do in air-gapped environments.

---

## How stencil loading works

Stencils are **not embedded in `module.js`**. Instead, `viewer-static.min.js`
loads them lazily as separate XML files the first time a shape from that
library appears in a diagram.

The plugin uses a **two-tier strategy**:

```
1. Local (bundled)   →   dist/static/libs/stencils/<name>.xml
        ↓ 404 / missing
2. CDN fallback      →   https://stencils.drawio.com/<name>.xml
```

`DrawioEngine._patchStencilLoader()` (called once after the draw.io library
is eval'd) intercepts every stencil fetch. If the local file exists it is
served with zero network latency; if it is missing the request is
transparently retried against the official draw.io CDN.

---

## Bundled stencils

The following shape libraries are included in the plugin and work fully
offline (copied from the draw.io desktop app):

| File | Description |
|---|---|
| `kubernetes.xml` | Kubernetes icons (pods, services, ingress, …) |
| `aws4.xml` | AWS architecture icons (v4, latest) |
| `aws3.xml` | AWS architecture icons (v3) |
| `azure.xml` | Microsoft Azure icons |
| `gcp2.xml` | Google Cloud Platform icons |
| `network.xml` / `cisco*.xml` | Network / Cisco topology |
| `basic.xml` | Generic shapes (arrows, containers, …) |
| `bpmn.xml` | BPMN process diagrams |
| `flowchart.xml` | Classic flowchart shapes |
| `eip.xml` | Enterprise Integration Patterns |
| `electrical/` | Electrical engineering symbols |
| `office/` | Microsoft Office icons |
| … | (full list in `src/static/libs/stencils/`) |

Total bundled size: ~29 MB (XML is served as static files, not bundled into
`module.js`, so browser load time is unaffected).

---

## Air-gapped / offline environments

If the Grafana server has **no internet access**, all diagrams that use only
the bundled stencil libraries above will render correctly with no additional
configuration.

If your diagrams use a shape library that is **not bundled**, you have two options:

### Option A — Add the missing stencil file manually

1. Download the required XML from
   `https://stencils.drawio.com/<name>.xml`
   (or export from the draw.io desktop app via *Edit → XML*).
2. Place it in the container:
   ```bash
   docker cp my-stencil.xml grafana:/var/lib/grafana/plugins/flowcharting-react-panel/static/libs/stencils/my-stencil.xml
   ```
   No restart required — stencils are fetched on demand.

### Option B — Point `STENCIL_PATH` to an internal mirror

If your organisation hosts a mirror of `https://stencils.drawio.com`, you
can override the stencil path by setting the Grafana environment variable:

```bash
GF_PLUGIN_FLOWCHARTING_REACT_PANEL_STENCIL_URL=https://my-internal-mirror.example.com/stencils
```

> **Note:** This option requires exposing the setting through the plugin's
> `plugin.json` and reading it in `DrawioEngine._preLoad()`. It is not
> implemented yet; open an issue if you need it.

---

## Disabling CDN fallback

For air-gapped or strict-CSP installs you can turn the CDN fallback **off** so
the plugin never reaches out to `stencils.drawio.com`. A stencil that isn't
bundled locally then renders as a blank placeholder instead of triggering an
outbound request.

Two ways to disable it:

- **Plugin jsonData** — set `disableStencilCdn: true` in the plugin's config
  (`config.panels['flowcharting-react-panel'].jsonData`).
- **Global flag** — set `window.GF_FLOWCHARTING_NO_CDN = true` before the panel
  loads (e.g. via a Grafana custom script / boot config).

When disabled, missing stencils log a single warning and render blank:

```
[DrawioEngine] Stencil not found locally and CDN fallback disabled: <name>.xml
```

To make those shapes render, add the missing stencil file locally (Option A
above). Even with the fallback enabled, blocking the domain at the network layer
also works — the failed fetch is caught and the rest of the diagram is
unaffected — but disabling the fallback avoids the request entirely.

> **CSP note:** the draw.io viewer library is loaded with `eval()` (it is not an
> ES module). Installations with a strict Content-Security-Policy that forbids
> `unsafe-eval` will not be able to initialise the engine; the panel surfaces
> the load error via its status overlay. This is a known limitation of
> embedding the draw.io viewer.

---

## Adding new stencils to the bundle

To add a stencil file to future plugin releases:

```bash
cp my-new-stencil.xml src/static/libs/stencils/
npx webpack --config webpack.config.js   # CopyPlugin copies it to dist/
```

Commit the XML file — it is tracked in git along with the rest of the plugin
sources.
