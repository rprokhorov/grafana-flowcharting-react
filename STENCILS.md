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

If you operate in a strict network environment where outbound requests to
`stencils.drawio.com` must be blocked:

1. Block the domain at the network level (firewall / egress policy).
2. The plugin will attempt the CDN fetch, get a network error, and log a
   warning in the browser console:
   ```
   [DrawioEngine] Stencil not found locally, trying CDN: https://stencils.drawio.com/…
   ```
3. The shape will not render (the cell will appear as a blank rectangle).
4. Add the missing stencil file locally (Option A above) to fix it.

There is no configuration flag to disable the CDN fallback attempt — the
worst case in a blocked environment is a failed `fetch()` that is silently
caught, with no impact on the rest of the diagram.

---

## Adding new stencils to the bundle

To add a stencil file to future plugin releases:

```bash
cp my-new-stencil.xml src/static/libs/stencils/
npx webpack --config webpack.config.js   # CopyPlugin copies it to dist/
```

Commit the XML file — it is tracked in git along with the rest of the plugin
sources.
