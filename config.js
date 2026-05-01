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
  TITILER_URL: "https://rae-k-savak.hf.space",

  // ── Cloudflare R2 public bucket URL ──────────────────────────────────
  // After creating an R2 bucket and enabling public access, your base URL
  // will look like: https://pub-xxxxxxxxxxxxxxxx.r2.dev
  // or a custom domain: https://gis-data.savak.pk
  //
  // All COG files are accessed as: R2_BASE_URL + "/" + filename
  // e.g. https://pub-xxxx.r2.dev/lulc_2025.tif
  //
  // Setup steps → see README.md → "Step 1: Cloudflare R2"
  R2_BASE_URL: "https://github.com/rae-kh/savak/releases/download/savak",

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
          rescale:  [0, 4],
          colormap: { "0": [26,150,65,255], "1": [166,217,106,255], "2": [255,255,191,255], "3": [253,174,97,255], "4": [215,25,28,255] },
          legend:   [
            { color: "#1a9641", label: "Very Low"  },
            { color: "#a6d96a", label: "Low"       },
            { color: "#ffffbf", label: "Moderate"  },
            { color: "#fdae61", label: "High"      },
            { color: "#d7191c", label: "Very High" }
          ]
        },
        {
          id:       "flood",
          file:     "floodrisk.tif",
          label:    "Flood Risk",
          rescale:  [0, 4],
          colormap: { "0": [33,102,172,255], "1": [116,173,209,255], "2": [255,255,191,255], "3": [244,109,67,255], "4": [165,0,38,255] },
          legend:   [
            { color: "#2166ac", label: "Very Low"  },
            { color: "#74add1", label: "Low"       },
            { color: "#ffffbf", label: "Moderate"  },
            { color: "#f46d43", label: "High"      },
            { color: "#a50026", label: "Very High" }
          ]
        },
        {
          id:       "waterlogging",
          file:     "waterlogging.tif",
          label:    "Waterlogging (Sindh)",
          rescale:  [0, 37],
          colormap: [ [[0,1],[255,255,255,255]], [[1,6],[179,217,255,255]], [[6,16],[77,166,255,255]], [[16,26],[0,102,204,255]], [[26,38],[0,51,128,255]] ],
          legend:   [
            { color: "#ffffff", label: "Never"              },
            { color: "#b3d9ff", label: "Rare (1–5 yrs)"    },
            { color: "#4da6ff", label: "Occasional (6–15)"  },
            { color: "#0066cc", label: "Frequent (16–25)"   },
            { color: "#003380", label: "Chronic (26+)"      }
          ]
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
          rescale:  [0, 3],
          colormap: { "0": [240,255,240,255], "1": [178,226,178,255], "2": [102,194,102,255], "3": [0,100,0,255] },
          legend:   [
            { color: "#f0fff0", label: "No Trees" },
            { color: "#b2e2b2", label: "Sparse"   },
            { color: "#66c266", label: "Moderate" },
            { color: "#006400", label: "Dense"    }
          ]
        },
        {
          id:       "plantation",
          file:     "plantation_history.tif",
          label:    "Plantation History",
          rescale:  [2015, 2026],
          colormap: { "2016": [230,57,70,230], "2017": [255,107,53,230], "2018": [255,190,11,230], "2019": [138,201,38,230], "2020": [0,196,154,230], "2021": [0,180,216,230], "2022": [58,134,255,230], "2023": [123,47,190,230], "2024": [255,0,110,230], "2025": [11,102,35,230] },
          legend:   [
            { color: "#E63946", label: "2016" },
            { color: "#FF6B35", label: "2017" },
            { color: "#FFBE0B", label: "2018" },
            { color: "#8AC926", label: "2019" },
            { color: "#00C49A", label: "2020" },
            { color: "#00B4D8", label: "2021" },
            { color: "#3A86FF", label: "2022" },
            { color: "#7B2FBE", label: "2023" },
            { color: "#FF006E", label: "2024" },
            { color: "#0b6623", label: "2025" }
          ]
        }
      ]
    }
  ],

  // ── Land Use / Land Cover (LULC) ─────────────────────────────────────
  LULC: {
    defaultYear:  2025,
    defaultLabel: "Land Use Land Cover (2025)",
    rescale:      [0, 5],
    colormap:     { "0": [43,131,186,255], "1": [194,178,128,255], "2": [215,48,39,255], "3": [166,217,106,255], "4": [26,152,80,255], "5": [253,174,97,255] },
    legend:       [
      { color: "#2b83ba", label: "Water"    },
      { color: "#c2b280", label: "Bareland" },
      { color: "#d73027", label: "Built-up" },
      { color: "#a6d96a", label: "Grassland"},
      { color: "#1a9850", label: "Trees"    },
      { color: "#fdae61", label: "Cropland" }
    ],
    otherYears:   [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    filePattern:  "lulc_{year}.tif"
  }

};
