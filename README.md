# Savak GIS Dashboard

Interactive GIS dashboard for Sindh, built with Leaflet.js and GeoServer WMS.

## Architecture

```
GeoTIFFs published on GeoServer
        ↓
GeoServer WMS  ←  serves raster tiles
        ↓
Leaflet in the browser  ←  displays tiles on the map
```

---

## File Structure

```
savak-gis/
├── index.html    — HTML shell; loads all scripts
├── config.js     — ✏️  EDIT THIS to configure GeoServer URL and layers
├── map.js        — Map init and basemap switching
├── layers.js     — WMS layer management and map legend
├── draw.js       — Drawing tools (polygon, rectangle, edit, clear)
├── sidebar.js    — Sidebar UI builder and accordion logic
├── kml.js        — KML upload (optional — see below)
└── styles.css    — All visual styles and design tokens
```

---

## Configuration

All settings live in `config.js`. The only file you need to edit.

| Setting | What to change |
|---|---|
| `GEOSERVER_URL` | Your GeoServer WMS endpoint |
| `LAYER_GROUPS` | Add, remove, or rename layers |
| `layer.name` | GeoServer layer name (`workspace:layerName`) |
| `layer.legend` | Sidebar/map legend colour entries |
| `LULC.workspace` | GeoServer workspace for LULC layers |
| `DEFAULT_CENTER` | Starting map position `[lat, lon]` |
| `DEFAULT_ZOOM` | Starting zoom level |

---

## Setup

### 1 — Point to your GeoServer

In `config.js`, set `GEOSERVER_URL` to your GeoServer WMS endpoint:

```js
GEOSERVER_URL: "https://geoserver.yourdomain.com/geoserver/wms"
```

For local development:
```js
GEOSERVER_URL: "http://localhost:8080/geoserver/wms"
```

### 2 — Enable CORS on GeoServer

The dashboard fetches WMS `GetCapabilities` to auto-zoom to each layer's extent. GeoServer must allow cross-origin requests from your dashboard's domain.

In GeoServer: **Security → CORS** → add your domain (or `*` for development).

### 3 — Run the dashboard

Open with any static file server — do **not** open `index.html` directly as a `file://` URL.

```bash
# Python
python -m http.server 3000
# Open http://localhost:3000
```

Or in VS Code: right-click `index.html` → **Open with Live Server**.

---

## Adding a New Layer

1. Publish the GeoTIFF in GeoServer under the `silvagrid` workspace
2. Add an entry to `config.js` → `LAYER_GROUPS`:

```js
{
  id:     "my-layer",           // unique, no spaces
  name:   "silvagrid:MyLayer",  // GeoServer workspace:layerName
  label:  "My Layer",           // shown in sidebar
  legend: [                     // optional colour key
    { color: "#1a9641", label: "Low"  },
    { color: "#d7191c", label: "High" }
  ]
}
```

The sidebar and map legend update automatically — no other files need touching.

---

## Removing the KML Upload Feature

1. Delete `kml.js`
2. Remove from `index.html`:
   ```html
   <script src="https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js"></script>
   <script src="kml.js" defer></script>
   ```
3. Optionally remove `<div id="kml-section-mount"></div>` from `index.html`

---

## Dependencies (all via CDN — no install needed)

| Library | Version | Purpose |
|---|---|---|
| Leaflet | 1.9.4 | Map rendering |
| Leaflet.Draw | 1.0.4 | Drawing tools |
| leaflet-omnivore | 0.3.4 | KML upload (optional) |
