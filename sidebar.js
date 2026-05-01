/**
 * sidebar.js
 * ─────────────────────────────────────────────────────────────────────────
 * Builds the WMS layer panel from GIS.CONFIG and handles:
 *   • Sidebar collapse / expand
 *   • Section accordion (open/close)
 *   • Dynamic layer rows + opacity sliders
 *
 * Exposes on GIS:
 *   GIS.toggleSidebar()  — called by the collapse button in index.html
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {

  let sidebarOpen = true;

  // ── Sidebar collapse ───────────────────────────────────────────────────

  GIS.toggleSidebar = function () {
    sidebarOpen = !sidebarOpen;

    const sidebar = document.getElementById('sidebar');
    const tab     = document.getElementById('sidebar-tab');

    sidebar.classList.toggle('collapsed', !sidebarOpen);

    // Show the re-open tab only when collapsed
    tab.style.display = sidebarOpen ? 'none' : 'flex';

    // Give Leaflet time to see the new map width
    setTimeout(() => GIS.map.invalidateSize(), 250);
  };

  // ── Accordion (event delegation, no inline handlers needed) ───────────

  document.addEventListener('click', function (e) {
    const header = e.target.closest('[data-target]');
    if (!header) return;

    const targetId = header.dataset.target;
    const body     = document.getElementById(targetId);
    const chevron  = header.querySelector('.chevron');

    if (!body) return;

    const isOpen = !body.classList.contains('hidden');
    body.classList.toggle('hidden', isOpen);
    if (chevron) chevron.classList.toggle('open', !isOpen);
  });

  // ── Layer row builder ──────────────────────────────────────────────────

  /**
   * Builds a toggle + opacity-slider row for one WMS layer.
   * @param {{ id:string, name:string, label:string }} layer
   * @returns {string} HTML string
   */
  function buildLayerRow(layer) {
    return `
      <div class="layer-row">
        <label class="toggle-switch">
          <input
            type="checkbox"
            id="toggle-${layer.id}"
            onchange="GIS.toggleLayer('${layer.id}', this.checked)"
          />
          <span class="track"></span>
          <span class="thumb"></span>
        </label>
        <span class="layer-name">${layer.label}</span>
      </div>
      <div class="opacity-row">
        <span class="opacity-label">Opacity</span>
        <input
          type="range" min="0" max="100" value="80" step="1"
          oninput="
            GIS.setLayerOpacity('${layer.id}', this.value);
            document.getElementById('opv-${layer.id}').textContent = this.value + '%';
          "
        />
        <span class="opacity-val" id="opv-${layer.id}">80%</span>
      </div>
    `;
  }

  // ── Build LULC section ─────────────────────────────────────────────────

  function buildLulcSection() {
    const lulcCfg = GIS.CONFIG.LULC;

    // Default year layer (LULC 2025)
    const defaultLayer = {
      id:     `lulc-${lulcCfg.defaultYear}`,
      label:  lulcCfg.defaultLabel,
      legend: lulcCfg.legend
    };

    // Other year layers share the same legend
    const otherRows = lulcCfg.otherYears.map(yr => buildLayerRow({
      id:     `lulc-${yr}`,
      label:  `Land Use Land Cover (${yr})`,
      legend: lulcCfg.legend
    })).join('');

    return `
      <div class="sidebar-section">
        <div class="section-header" data-target="lulc-body">
          <span class="section-label">Land Use / Land Cover</span>
          <svg class="chevron open" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 4l4 4 4-4"/>
          </svg>
        </div>
        <div class="section-body" id="lulc-body">

          ${buildLayerRow(defaultLayer)}

          <!-- ─ Other years (collapsed by default) ─ -->
          <div class="sub-header" data-target="lulc-other-body">
            <span class="sub-label">Show other years (2018–2024)</span>
            <svg class="chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </div>
          <div class="sub-body hidden" id="lulc-other-body">
            ${otherRows}
          </div>

        </div>
      </div>
    `;
  }

  // ── Build all layer group sections from config ─────────────────────────

  function buildLayerGroups() {
    const container = document.getElementById('layer-groups-container');
    if (!container) return;

    // Regular groups (terrain, vegetation, etc.)
    GIS.CONFIG.LAYER_GROUPS.forEach(group => {
      const rows     = group.layers.map(buildLayerRow).join('');
      const bodyId   = `group-${group.id}-body`;
      const isOpen   = group.expanded;

      const html = `
        <div class="sidebar-section">
          <div class="section-header" data-target="${bodyId}">
            <span class="section-label">${group.label}</span>
            <svg class="chevron ${isOpen ? 'open' : ''}" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </div>
          <div class="section-body ${isOpen ? '' : 'hidden'}" id="${bodyId}">
            ${rows}
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });

    // LULC section (special: default year on by default + other years nested)
    container.insertAdjacentHTML('beforeend', buildLulcSection());
  }

  // Run after DOM is ready
  document.addEventListener('DOMContentLoaded', buildLayerGroups);

})();
