/**
 * kml.js  —  OPTIONAL MODULE
 * ─────────────────────────────────────────────────────────────────────────
 * Adds a KML file upload panel to the sidebar for testing purposes.
 *
 * TO REMOVE THIS FEATURE ENTIRELY:
 *   1. Delete this file (js/kml.js)
 *   2. Remove the two lines in index.html marked "KML UPLOAD"
 *      (the omnivore <script> tag and the kml.js <script> tag)
 *   3. The #kml-section-mount <div> in index.html can also be deleted
 *      (it's harmless if left in)
 *
 * Requires: leaflet-omnivore (loaded before this script in index.html)
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {

  // Registry: filename → { layer: L.GeoJSON, id: string }
  const kmlFiles = {};
  let fileCounter = 0;

  // ── Inject the KML sidebar section ────────────────────────────────────

  function buildSection() {
    return `
      <div class="sidebar-section" id="kml-section">
        <div class="section-header" data-target="kml-body">
          <span class="section-label">KML Upload (Testing)</span>
          <svg class="chevron open" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 4l4 4 4-4"/>
          </svg>
        </div>
        <div class="section-body" id="kml-body">

          <!-- Hidden file input — triggered by the button below -->
          <input
            type="file"
            id="kml-file-input"
            accept=".kml"
            multiple
            style="display:none"
            onchange="GIS.KML.handleFiles(this.files)"
          />

          <button class="kml-upload-btn" onclick="document.getElementById('kml-file-input').click()">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8 2v8M5 5l3-3 3 3"/>
              <path d="M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2"/>
            </svg>
            Upload .kml file
          </button>

          <div class="kml-file-list" id="kml-file-list"></div>

        </div>
      </div>
    `;
  }

  // ── KML loading ────────────────────────────────────────────────────────

  /**
   * Loads a KML file using leaflet-omnivore, adds it to the map,
   * and appends a removable entry to the file list.
   * @param {File} file
   */
  function loadKML(file) {
    const name = file.name;

    // Prevent duplicate uploads
    if (kmlFiles[name]) {
      alert(`"${name}" is already loaded. Remove it first to reload.`);
      return;
    }

    const fileId = `kml-${++fileCounter}`;
    const url    = URL.createObjectURL(file);

    const kmlLayer = omnivore.kml(url)
      .on('ready', function () {
        URL.revokeObjectURL(url);

        // Zoom to the KML bounds
        try {
          GIS.map.fitBounds(kmlLayer.getBounds(), { padding: [30, 30] });
        } catch (_) {
          // Layer may have no bounds if the KML was empty / malformed
        }
      })
      .on('error', function () {
        alert(`Failed to load "${name}". Make sure it is a valid KML file.`);
        removeKML(name);
      })
      .addTo(GIS.map);

    kmlFiles[name] = { layer: kmlLayer, id: fileId };
    renderFileList();
  }

  /**
   * Removes a KML layer from the map and the file list.
   * @param {string} name — original filename
   */
  function removeKML(name) {
    const entry = kmlFiles[name];
    if (!entry) return;
    GIS.map.removeLayer(entry.layer);
    delete kmlFiles[name];
    renderFileList();
  }

  // Expose removeKML globally so the inline onclick in the list can call it
  function removeKMLGlobal(name) {
    removeKML(decodeURIComponent(name));
  }

  // ── File list rendering ────────────────────────────────────────────────

  function renderFileList() {
    const listEl = document.getElementById('kml-file-list');
    if (!listEl) return;

    const names = Object.keys(kmlFiles);

    if (names.length === 0) {
      listEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = names.map(name => {
      const encoded = encodeURIComponent(name);
      return `
        <div class="kml-file-item">
          <svg style="width:12px;height:12px;flex-shrink:0;color:#2D8A59" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/>
            <path d="M9 2v4h4"/>
          </svg>
          <span class="kml-file-item-name" title="${name}">${name}</span>
          <button
            class="kml-remove-btn"
            onclick="GIS.KML._remove('${encoded}')"
            title="Remove layer"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 2l8 8M10 2L2 10"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }

  // ── Public interface ───────────────────────────────────────────────────

  GIS.KML = {
    /**
     * handleFiles(fileList)
     * Called when the user selects files via the file input.
     * @param {FileList} fileList
     */
    handleFiles: function (fileList) {
      Array.from(fileList).forEach(loadKML);
      // Reset input so the same file can be re-uploaded after removal
      document.getElementById('kml-file-input').value = '';
    },

    // Internal — used by the remove button's onclick
    _remove: removeKMLGlobal
  };

  // ── Mount the section into the sidebar ────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    const mount = document.getElementById('kml-section-mount');
    if (mount) mount.innerHTML = buildSection();
  });

})();
