/**
 * draw.js
 * ─────────────────────────────────────────────────────────────────────────
 * Handles boundary drawing using Leaflet.Draw.
 * Draws are stored in GIS.drawnItems (a FeatureGroup).
 *
 * Exposes on GIS:
 *   GIS.drawnItems    — FeatureGroup containing all drawn shapes
 *   GIS.startDraw()   — activate a draw mode ('polygon' | 'rectangle')
 *   GIS.startEdit()   — activate edit mode for existing shapes
 *   GIS.clearDrawings()— remove all drawn shapes
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {

  // FeatureGroup that holds all drawn shapes
  GIS.drawnItems = new L.FeatureGroup();
  GIS.map.addLayer(GIS.drawnItems);

  // Leaflet.Draw handler currently active (if any)
  let activeHandler  = null;
  let activeEditHandler = null;

  // Style applied to drawn shapes
  const DRAW_STYLE = {
    color:       '#2D8A59',
    weight:      2.5,
    fillColor:   '#2D8A59',
    fillOpacity: 0.18
  };

  // ── Internal helpers ───────────────────────────────────────────────────

  function disableAll() {
    if (activeHandler)     { activeHandler.disable();  activeHandler = null; }
    if (activeEditHandler) {
      activeEditHandler.save();
      activeEditHandler.disable();
      activeEditHandler = null;
    }
  }

  function setButtonActive(id) {
    ['draw-polygon-btn', 'draw-rect-btn', 'draw-edit-btn'].forEach(btnId => {
      const el = document.getElementById(btnId);
      if (el) el.classList.toggle('active', btnId === id);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * startDraw(type)
   * Enables a Leaflet.Draw handler for the given shape type.
   * Clicking the same button a second time cancels the active draw.
   *
   * @param {'polygon'|'rectangle'} type
   */
  GIS.startDraw = function (type) {
    const btnId = type === 'polygon' ? 'draw-polygon-btn' : 'draw-rect-btn';
    const isAlreadyActive = document.getElementById(btnId)?.classList.contains('active');

    disableAll();

    if (isAlreadyActive) {
      // Toggle off — button already handled the visual above
      setButtonActive(null);
      return;
    }

    const opts = { shapeOptions: DRAW_STYLE };

    if (type === 'polygon') {
      activeHandler = new L.Draw.Polygon(GIS.map, opts);
    } else if (type === 'rectangle') {
      activeHandler = new L.Draw.Rectangle(GIS.map, opts);
    }

    if (activeHandler) {
      activeHandler.enable();
      setButtonActive(btnId);
    }
  };

  /**
   * startEdit()
   * Activates edit mode so drawn shapes can be moved / reshaped.
   */
  GIS.startEdit = function () {
    const isAlreadyActive = document.getElementById('draw-edit-btn')?.classList.contains('active');
    disableAll();

    if (isAlreadyActive) {
      setButtonActive(null);
      return;
    }

    if (GIS.drawnItems.getLayers().length === 0) return;

    activeEditHandler = new L.EditToolbar.Edit(GIS.map, {
      featureGroup: GIS.drawnItems
    });
    activeEditHandler.enable();
    setButtonActive('draw-edit-btn');
  };

  /**
   * clearDrawings()
   * Removes all drawn shapes from the map.
   */
  GIS.clearDrawings = function () {
    disableAll();
    setButtonActive(null);
    GIS.drawnItems.clearLayers();
  };

  // ── Leaflet.Draw events ────────────────────────────────────────────────

  // When the user finishes drawing a shape
  GIS.map.on(L.Draw.Event.CREATED, function (e) {
    GIS.drawnItems.addLayer(e.layer);
    disableAll();
    setButtonActive(null);
  });

  // Cancel draw on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      disableAll();
      setButtonActive(null);
    }
  });

})();
