/**
 * layers.js
 * ─────────────────────────────────────────────────────────────────────────
 * Manages raster layers served by TiTiler from COGs on Cloudflare R2.
 *
 * Instead of GeoServer WMS, each layer is a standard Leaflet L.tileLayer
 * pointed at TiTiler's /cog/tiles/{z}/{x}/{y} endpoint.
 *
 * TiTiler tile URL format:
 *   {TITILER_URL}/cog/tiles/{z}/{x}/{y}
 *     ?url={COG_URL}
 *     &colormap_name={colormap}
 *     &rescale={min},{max}
 *
 * Exposes on GIS:
 *   GIS.tileLayers         — map of layer id → L.TileLayer
 *   GIS.toggleLayer()      — add or remove a layer from the map
 *   GIS.setLayerOpacity()  — adjust opacity of an active layer
 *   GIS.initDefaultLayers()— called once on startup to enable defaults
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {

  GIS.tileLayers = {};

  /**
   * Builds the TiTiler XYZ tile URL for a given COG file.
   *
   * @param {string}   file      - filename in R2, e.g. "lulc_2025.tif"
   * @param {string}   colormap  - TiTiler colormap name, e.g. "tab20"
   * @param {number[]} rescale   - [min, max] value range
   * @returns {string} Leaflet-compatible tile URL with {z}, {x}, {y}
   */
  function buildTileURL(file, colormap, rescale) {
    const cfg    = GIS.CONFIG;
    const cogURL = encodeURIComponent(`${cfg.R2_BASE_URL}/${file}`);

    const colormapParam = typeof colormap === 'string'
      ? `colormap_name=${colormap}`
      : `colormap=${encodeURIComponent(JSON.stringify(colormap))}`;

    const params = [
      `url=${cogURL}`,
      colormapParam,
      `rescale=${rescale[0]},${rescale[1]}`
    ].join('&');

    return `${cfg.TITILER_URL}/cog/tiles/{z}/{x}/{y}?${params}`;
  }

  /**
   * Returns a cached L.TileLayer for a layer config object,
   * creating it if it doesn't exist yet.
   *
   * @param {{ id, file, colormap, rescale }} layerCfg
   * @returns {L.TileLayer}
   */
  function getOrCreate(layerCfg) {
    if (!GIS.tileLayers[layerCfg.id]) {
      GIS.tileLayers[layerCfg.id] = L.tileLayer(
        buildTileURL(layerCfg.file, layerCfg.colormap, layerCfg.rescale),
        {
          opacity:     0.8,
          tileSize:    256,
          // TiTiler tiles have no data outside the COG extent — keep transparent
          // Even if the tile server returns a 404, Leaflet will just show nothing
          errorTileUrl: '',
          attribution: 'Savak GIS'
        }
      );
    }
    return GIS.tileLayers[layerCfg.id];
  }

  /**
   * Finds a layer config object by id, searching all groups + LULC.
   * @param {string} id
   * @returns {{ id, file, colormap, rescale }|null}
   */
  function findLayerCfg(id) {
    const cfg = GIS.CONFIG;

    // Search regular layer groups
    for (const group of cfg.LAYER_GROUPS) {
      const found = group.layers.find(l => l.id === id);
      if (found) return found;
    }

    // Search LULC layers (default year + other years)
    const lulc     = cfg.LULC;
    const allYears = [lulc.defaultYear, ...lulc.otherYears];
    for (const yr of allYears) {
      const lulcId = `lulc-${yr}`;
      if (id === lulcId) {
        return {
          id,
          file:     lulc.filePattern.replace('{year}', yr),
          colormap: lulc.colormap,
          rescale:  lulc.rescale
        };
      }
    }

    return null;
  }

  /**
   * toggleLayer(id, enabled)
   * Adds or removes the layer with the given config id from the map.
   *
   * @param {string}  id      - layer config id (e.g. "ndvi", "lulc-2025")
   * @param {boolean} enabled
   */
  GIS.toggleLayer = function (id, enabled) {
    const cfg = findLayerCfg(id);
    if (!cfg) {
      console.warn(`[GIS] toggleLayer: no layer config found for id "${id}"`);
      return;
    }

    const layer = getOrCreate(cfg);

    if (enabled) {
      layer.addTo(GIS.map);
    } else {
      GIS.map.removeLayer(layer);
    }
  };

  /**
   * setLayerOpacity(id, value)
   * Sets the opacity of an already-created tile layer.
   *
   * @param {string}        id    - layer config id
   * @param {number|string} value - 0 to 100
   */
  GIS.setLayerOpacity = function (id, value) {
    const layer = GIS.tileLayers[id];
    if (layer) layer.setOpacity(Number(value) / 100);
  };

  /**
   * initDefaultLayers()
   * Enables the LULC 2025 layer on first load.
   * Called from index.html after DOMContentLoaded.
   */
  GIS.initDefaultLayers = function () {
    const defaultId = `lulc-${GIS.CONFIG.LULC.defaultYear}`;

    GIS.toggleLayer(defaultId, true);

    // Sync the sidebar checkbox
    const checkbox = document.getElementById(`toggle-${defaultId}`);
    if (checkbox) checkbox.checked = true;
  };

})();
