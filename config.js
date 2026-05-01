/**
 * config.js
 * ─────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for the GIS dashboard.
 *
 * The other developer should only need to edit this file to:
 *   • Point to the TiTiler server and Cloudflare R2 bucket
 *   • Add / remove / rename layers
 *   • Adjust colormaps and value ranges per layer
 *
 * Architecture:
 *   GeoTIFFs (COGs) → Cloudflare R2 (file storage)
 *                    → TiTiler on Render.com (tile server)
 *                    → Leaflet (map display)
 * ─────────────────────────────────────────────────────────────────────────
 */

const GIS = {};

GIS.CONFIG = {

  // ── TiTiler server URL ───────────────────────────────────────────────
  // This is the Render.com URL you get after deploying titiler/main.py.
  // For local development, run TiTiler locally and use http://localhost:8000
  //
  // Deploy steps → see README.md → "Step 3: Deploy TiTiler"
  TITILER_URL: "https://YOUR-APP-NAME.onrender.com",

  // ── Cloudflare R2 public bucket URL ──────────────────────────────────
  // After creating an R2 bucket and enabling public access, your base URL
  // will look like: https://pub-xxxxxxxxxxxxxxxx.r2.dev
  // or a custom domain: https://gis-data.savak.pk
  //
  // All COG files are accessed as: R2_BASE_URL + "/" + filename
  // e.g. https://pub-xxxx.r2.dev/lulc_2025.tif
  //
  // Setup steps → see README.md → "Step 1: Cloudflare R2"
  R2_BASE_URL: "https://YOUR-BUCKET.r2.dev",

  // ── Default map view ─────────────────────────────────────────────────
  DEFAULT_CENTER: [25.52, 69.00],
  DEFAULT_ZOOM:   11,

  // ── Basemap tile sources ─────────────────────────────────────────────
  BASEMAPS: {
    satellite: {
      url:         "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Esri, USGS, USDA"
    },
    street: {
      url:         "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
    }
  },

  // ── WMS layer groups ─────────────────────────────────────────────────
  // Each entry becomes a collapsible sidebar section.
  //
  // Per-layer properties:
  //   id        — unique string, no spaces (used for DOM IDs)
  //   file      — filename of the COG in your R2 bucket (e.g. "dem.tif")
  //   label     — display name shown in the sidebar
  //   colormap  — TiTiler colormap name. Full list:
  //               https://developmentseed.org/titiler/endpoints/cog/#available-colormaps
  //   rescale   — [min, max] value range of your raster data.
  //               Run: GET /cog/statistics?url=YOUR_COG_URL to find yours.
  //               Wrong rescale = washed-out or invisible layer.
  //
  LAYER_GROUPS: [
    {
      id:       "terrain",
      label:    "Terrain & Risk",
      expanded: false,
      layers: [
        {
          id:       "dem",
          file:     "dem.tif",
          label:    "DEM",
          colormap: "terrain",
          rescale:  [0, 500]
        },
        {
          id:       "drought",
          file:     "drought.tif",
          label:    "Drought",
          colormap: "YlOrRd",
          rescale:  [0, 1]
        },
        {
          id:       "flood",
          file:     "floodrisk.tif",
          label:    "Flood Risk",
          colormap: "Blues",
          rescale:  [0, 1]
        },
        {
          id:       "waterlogging",
          file:     "waterlogging.tif",
          label:    "Waterlogging (Sindh)",
          colormap: "PuBu",
          rescale:  [0, 1]
        }
      ]
    },
    {
      id:       "vegetation",
      label:    "Vegetation",
      expanded: false,
      layers: [
        {
          id:       "ndvi",
          file:     "ndvi.tif",
          label:    "NDVI",
          colormap: "RdYlGn",
          rescale:  [-1, 1]
        },
        {
          id:       "tree",
          file:     "tree_density.tif",
          label:    "Tree Density",
          colormap: "Greens",
          rescale:  [0, 100]
        },
        {
          id:       "plantation",
          file:     "plantation_history.tif",
          label:    "Plantation History",
          colormap: "YlGn",
          rescale:  [0, 1]
        }
      ]
    }
  ],

  // ── Land Use / Land Cover (LULC) ─────────────────────────────────────
  // 2025 is shown by default. Other years are in a nested collapsed section.
  // "tab20" works well for categorical LULC with many classes.
  // Adjust rescale to match the number of classes in your LULC data.
  LULC: {
    defaultYear:  2025,
    defaultLabel: "Land Use Land Cover (2025)",
    colormap:     "tab20",
    rescale:      [0, 20],
    otherYears:   [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    filePattern:  "lulc_{year}.tif"
  }

};
