/**
 * layers.js
 * ─────────────────────────────────────────────────────────────────────────
 * Manages WMS layers served by GeoServer.
 *
 * Each layer is a Leaflet L.tileLayer.wms pointed at GIS.CONFIG.GEOSERVER_URL.
 *
 * Exposes on GIS:
 *   GIS.tileLayers         — map of layer id → L.TileLayer.WMS
 *   GIS.toggleLayer()      — add or remove a layer from the map
 *   GIS.setLayerOpacity()  — adjust opacity of an active layer
 *   GIS.initDefaultLayers()— called once on startup to enable defaults
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {

  GIS.tileLayers = {};

  /**
   * Returns a cached L.TileLayer.WMS for a layer config object,
   * creating it if it doesn't exist yet.
   *
   * @param {{ id, name }} layerCfg
   * @returns {L.TileLayer.WMS}
   */
  function getOrCreate(layerCfg) {
    if (!GIS.tileLayers[layerCfg.id]) {
      GIS.tileLayers[layerCfg.id] = L.tileLayer.wms(GIS.CONFIG.GEOSERVER_URL, {
        layers:      layerCfg.name,
        format:      'image/png',
        transparent: true,
        version:     '1.1.1',
        opacity:     0.8,
        attribution: 'Savak GIS'
      });
    }
    return GIS.tileLayers[layerCfg.id];
  }

  /**
   * Finds a layer config object by id, searching all groups + LULC.
   * @param {string} id
   * @returns {{ id, name }|null}
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
      if (id === `lulc-${yr}`) {
        return { id, name: `${lulc.workspace}:${yr}` };
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
