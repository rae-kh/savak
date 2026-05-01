---
title: Savak TiTiler
emoji: 🗺️
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
---

# Savak GIS Dashboard

Interactive map dashboard for GIS analysis, built with Leaflet.js.

## Architecture

```
Your GeoTIFFs (converted to COG format)
        ↓
Cloudflare R2  ←  free file storage, globally fast
        ↓
TiTiler on Render.com  ←  free tile server, reads COGs and serves XYZ tiles
        ↓
Leaflet in the browser  ←  displays the tiles on the map
```

---

## File Structure

```
savak-gis/
├── index.html              — HTML shell; loads all scripts
├── render.yaml             — Render.com deployment config for TiTiler
├── css/
│   └── styles.css          — All visual styles and design tokens
├── js/
│   ├── config.js           — ✏️  EDIT THIS FILE to configure URLs and layers
│   ├── map.js              — Map init and basemap switching
│   ├── layers.js           — TiTiler tile layer management
│   ├── draw.js             — Drawing tools (polygon, rectangle, edit, clear)
│   ├── sidebar.js          — Sidebar UI builder and accordion logic
│   └── kml.js              — KML upload (optional — see below)
├── titiler/
│   ├── main.py             — TiTiler FastAPI app (deploy this on Render.com)
│   └── requirements.txt    — Python dependencies
└── scripts/
    └── convert_to_cog.sh   — Converts your GeoTIFFs to Cloud-Optimised format
```

**Where to make common changes:**

| Task | File |
|------|------|
| Change TiTiler or R2 URL | `js/config.js` → `TITILER_URL`, `R2_BASE_URL` |
| Add / remove a layer | `js/config.js` → `LAYER_GROUPS` |
| Change a layer's colours | `js/config.js` → `colormap` and `rescale` per layer |
| Change default map view | `js/config.js` → `DEFAULT_CENTER`, `DEFAULT_ZOOM` |
| Change colours / fonts | `css/styles.css` → `:root` design tokens |
| Remove KML upload | See "Removing KML Upload" below |

---

## Setup: Step by Step

### Step 1 — Convert your GeoTIFFs to COGs

Cloud-Optimised GeoTIFF (COG) is a format that lets TiTiler read only the
parts of the file it needs, instead of downloading the whole thing per tile.

**Prerequisites:** Install GDAL.
- Mac: `brew install gdal`
- Ubuntu: `sudo apt install gdal-bin`
- Windows: install [OSGeo4W](https://trac.osgeo.org/osgeo4w/) or use the
  GDAL that ships with QGIS (open OSGeo4W Shell from the Start menu)

**Run the conversion script:**
```bash
chmod +x scripts/convert_to_cog.sh
./scripts/convert_to_cog.sh /path/to/your/tiffs /path/to/output
```

This creates a converted copy of every `.tif` in your input folder.
Your originals are not modified.

---

### Step 2 — Upload COGs to Cloudflare R2

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2**
2. Create a bucket (name it e.g. `savak-gis-data`)
3. Upload all the converted `.tif` files from Step 1
4. In the bucket settings, enable **Public Access**
5. Copy the public bucket URL — it looks like:
   `https://pub-xxxxxxxxxxxxxxxx.r2.dev`
6. Paste it into `js/config.js` → `R2_BASE_URL`

> R2 gives you 10 GB storage free and — unlike AWS S3 — charges nothing
> for downloads (egress). Perfect for serving map tiles.

---

### Step 3 — Deploy TiTiler on Render.com

1. Push this entire `savak-gis` folder to a GitHub repository
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Render detects `render.yaml` and configures everything automatically
5. Click **Deploy** — in ~2 minutes you get a URL like:
   `https://savak-titiler.onrender.com`
6. Paste that URL into `js/config.js` → `TITILER_URL`

**Free tier note:** Render's free tier sleeps after 15 minutes of inactivity.
The first tile load after a sleep takes ~30 seconds. Options:
- Use [UptimeRobot](https://uptimerobot.com) (free) to ping `/health`
  every 10 minutes so it never sleeps
- Or upgrade to Render Starter ($7/month) for always-on

**Test your deployment:**
Open `https://YOUR-APP.onrender.com/docs` — you should see the TiTiler API
docs and be able to test a COG URL there.

---

### Step 4 — Run the dashboard locally

Serve the frontend with any static server (do not open index.html directly
as a file:// URL — relative paths won't work):

```bash
# Python
cd savak-gis
python -m http.server 3000
# Open http://localhost:3000
```

Or in VS Code: right-click `index.html` → **Open with Live Server**.

---

### Step 5 — Find the correct rescale values for each layer

Wrong `rescale` values cause washed-out or invisible layers. To find the
actual min/max of each COG:

```
GET https://YOUR-APP.onrender.com/cog/statistics?url=https://YOUR-BUCKET.r2.dev/dem.tif
```

Open that URL in your browser. The response shows the min/max values:
```json
{
  "b1": {
    "min": 12.4,
    "max": 487.3,
    ...
  }
}
```

Update `js/config.js` → `rescale: [12.4, 487.3]` for that layer.

---

## Colormaps

TiTiler supports all matplotlib and colorbrewer colormaps.
Full list: https://developmentseed.org/titiler/endpoints/cog/#available-colormaps

Good defaults per layer type:

| Layer type | Colormap |
|------------|----------|
| Elevation / DEM | `terrain` or `viridis` |
| NDVI | `RdYlGn` |
| Drought / heat | `YlOrRd` |
| Flood / water | `Blues` or `PuBu` |
| Categorical LULC | `tab20` or `tab10` |
| Vegetation density | `Greens` |

---

## Removing the KML Upload Feature

1. Delete `js/kml.js`
2. Remove these two lines from `index.html`:
   ```html
   <script src="https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js"></script>
   <script src="js/kml.js" defer></script>
   ```
3. Optionally remove `<div id="kml-section-mount"></div>` from `index.html`

Nothing else needs to change.

---

## Adding a New Layer

1. Convert your GeoTIFF to COG (Step 1)
2. Upload to R2 (Step 2)
3. Add an entry to `js/config.js` → `LAYER_GROUPS`:

```js
{
  id:       "my-new-layer",   // unique, no spaces
  file:     "my_layer.tif",  // filename in R2
  label:    "My Layer",       // shown in sidebar
  colormap: "viridis",        // colormap name
  rescale:  [0, 100]          // [min, max] — check with /cog/statistics
}
```

The sidebar rebuilds itself from config on every page load. No other files need touching.

---

## Dependencies (all loaded via CDN — no install needed for frontend)

| Library | Version | Purpose |
|---------|---------|---------|
| Leaflet | 1.9.4 | Map rendering |
| Leaflet.Draw | 1.0.4 | Drawing tools |
| leaflet-omnivore | 0.3.4 | KML parsing (optional) |

TiTiler server dependencies are in `titiler/requirements.txt`.
