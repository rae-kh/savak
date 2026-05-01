/**
 * map.js
 * ─────────────────────────────────────────────────────────────────────────
 * Initialises the Leaflet map and handles basemap switching.
 *
 * Exposes on GIS:
 *   GIS.map          — the Leaflet map instance
 *   GIS.setBasemap() — switch between 'satellite' and 'street'
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {
  const cfg = GIS.CONFIG;

  // Create the Leaflet map
  GIS.map = L.map('map', {
    center: cfg.DEFAULT_CENTER,
    zoom:   cfg.DEFAULT_ZOOM,
    zoomControl: false  // we add our own below
  });

  // Custom zoom control position
  L.control.zoom({ position: 'topleft' }).addTo(GIS.map);

  // Start with satellite basemap
  GIS._baseTile = L.tileLayer(cfg.BASEMAPS.satellite.url, {
    attribution: cfg.BASEMAPS.satellite.attribution,
    maxZoom: 19
  }).addTo(GIS.map);

  GIS._currentBasemap = 'satellite';

  /**
   * setBasemap(type)
   * Switches the basemap tile layer.
   * @param {'satellite'|'street'} type
   */
  GIS.setBasemap = function (type) {
    if (GIS._currentBasemap === type) return;

    GIS.map.removeLayer(GIS._baseTile);

    GIS._baseTile = L.tileLayer(cfg.BASEMAPS[type].url, {
      attribution: cfg.BASEMAPS[type].attribution,
      maxZoom: 19
    }).addTo(GIS.map);

    // Basemap must sit below all WMS and drawn layers
    GIS._baseTile.bringToBack();

    GIS._currentBasemap = type;

    // Sync all buttons that carry a data-basemap attribute (sidebar + overlay)
    document.querySelectorAll('[data-basemap]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.basemap === type);
    });
  };

})();
