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

  // ── GeoServer WMS endpoint ───────────────────────────────────────────
  // Replace with your deployed GeoServer URL.
  // Example:  "https://geoserver.savak.pk/geoserver/wms"
  // Local:    "http://localhost:8080/geoserver/wms"
  GEOSERVER_URL: "http://localhost:8080/geoserver/wms",

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

  // ── Layer groups ─────────────────────────────────────────────────────
  // Each entry becomes a collapsible sidebar section.
  //
  // Per-layer properties:
  //   id     — unique string, no spaces (used for DOM IDs)
  //   name   — GeoServer layer name (workspace:layerName)
  //   label  — display name shown in the sidebar
  //   legend — optional array of { color, label } entries for the sidebar key
  //
  LAYER_GROUPS: [
    {
      id:       "terrain",
      label:    "Terrain & Risk",
      expanded: false,
      layers: [
        {
          id:     "dem",
          name:   "silvagrid:DEM",
          label:  "DEM",
          legend: [
            { color: "#2c7bb6", label: "5.8 m" },
            { color: "#00a6ca", label: "8 m"   },
            { color: "#00ccbc", label: "11 m"  },
            { color: "#90eb9d", label: "15 m"  },
            { color: "#ffff8c", label: "18 m"  },
            { color: "#f9d057", label: "21 m"  },
            { color: "#f29e2e", label: "23 m"  },
            { color: "#d7191c", label: "25 m"  }
          ]
        },
        {
          id:     "drought",
          name:   "silvagrid:Drought",
          label:  "Drought",
          legend: [
            { color: "#1a9641", label: "Very Low"  },
            { color: "#a6d96a", label: "Low"       },
            { color: "#ffffbf", label: "Moderate"  },
            { color: "#fdae61", label: "High"      },
            { color: "#d7191c", label: "Very High" }
          ]
        },
        {
          id:     "flood",
          name:   "silvagrid:Flood Risk",
          label:  "Flood Risk",
          legend: [
            { color: "#2166ac", label: "Very Low"  },
            { color: "#74add1", label: "Low"       },
            { color: "#ffffbf", label: "Moderate"  },
            { color: "#f46d43", label: "High"      },
            { color: "#a50026", label: "Very High" }
          ]
        },
        {
          id:     "waterlogging",
          name:   "silvagrid:waterlogging",
          label:  "Waterlogging (Sindh)",
          legend: [
            { color: "#ffffff", label: "Never"             },
            { color: "#b3d9ff", label: "Rare (1–5 yrs)"   },
            { color: "#4da6ff", label: "Occasional (6–15)" },
            { color: "#0066cc", label: "Frequent (16–25)"  },
            { color: "#003380", label: "Chronic (26+)"     }
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
          id:     "tree",
          name:   "silvagrid:Tree_Density",
          label:  "Tree Density",
          legend: [
            { color: "#f0fff0", label: "No Trees" },
            { color: "#b2e2b2", label: "Sparse"   },
            { color: "#66c266", label: "Moderate" },
            { color: "#006400", label: "Dense"    }
          ]
        },
        {
          id:     "plantation",
          name:   "silvagrid:plantation_history",
          label:  "Plantation History",
          legend: [
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
    workspace:    "silvagrid",
    defaultYear:  2025,
    defaultLabel: "Land Use Land Cover (2025)",
    otherYears:   [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    legend: [
      { color: "#2b83ba", label: "Water"    },
      { color: "#c2b280", label: "Bareland" },
      { color: "#d73027", label: "Built-up" },
      { color: "#a6d96a", label: "Grassland"},
      { color: "#1a9850", label: "Trees"    },
      { color: "#fdae61", label: "Cropland" }
    ]
  }

};
