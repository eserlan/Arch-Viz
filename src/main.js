import './styles/main.css';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import dagre from 'cytoscape-dagre';
import { parseCSV } from './logic/parser';
import { layoutConfig, stylesheet } from './logic/graphConfig';
import { initAccordion } from './logic/accordion';
import { loadGraphData, saveGraphData, clearGraphData, getDirtyState, downloadCSV } from './logic/storage';
import { initPanel, showPanel, hidePanel } from './logic/panel';
import { initFilters, populateLabelFilter, populateTeamFilter } from './logic/filters';
import { initUploader } from './logic/uploader';
import { initEdgeEditor, toggleEditMode, isInEditMode } from './logic/edgeEditor';
import { calculateDynamicZoom } from './logic/zoom';

cytoscape.use(fcose);
cytoscape.use(dagre);

const cyContainer = document.getElementById('cy');
const toastContainer = document.getElementById('toastContainer');
const csvUrl = `${import.meta.env.BASE_URL}data/services.csv`;

const showToast = (message, type = 'info') => {
  if (!toastContainer) return;

  const colors = {
    info: 'bg-slate-800 border-slate-600 text-slate-200',
    success: 'bg-emerald-900/90 border-emerald-500 text-emerald-200',
    warning: 'bg-amber-900/90 border-amber-500 text-amber-200',
    error: 'bg-red-900/90 border-red-500 text-red-200'
  };

  const toast = document.createElement('div');
  toast.className = `${colors[type] || colors.info} px-4 py-2 rounded-lg border backdrop-blur-sm shadow-lg text-sm font-medium transform transition-all duration-300 opacity-0 translate-y-2`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');
  });

  // Auto dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const updateStatus = (message) => {
  showToast(message, 'info');
};

let cy;

// Dirty state UI management
const dirtyStateContainer = document.getElementById('dirtyStateContainer');
const updateDirtyUI = (isDirty) => {
  if (dirtyStateContainer) {
    dirtyStateContainer.classList.toggle('hidden', !isDirty);
  }
};

// Listen for dirty state changes
window.addEventListener('dirty-state-change', (e) => {
  updateDirtyUI(e.detail.isDirty);
});

// Download CSV button
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
if (downloadCsvBtn) {
  downloadCsvBtn.addEventListener('click', () => {
    if (cy) {
      downloadCSV(cy);
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      updateStatus(`Downloaded services-${timestamp}.csv`);
    }
  });
}

// Copy Image to Clipboard button
const copyImageBtn = document.getElementById('copyImageBtn');
if (copyImageBtn) {
  copyImageBtn.addEventListener('click', async () => {
    if (!cy) {
      showToast('No graph to copy', 'warning');
      return;
    }
    try {
      // Generate PNG with higher resolution
      const png64 = cy.png({ scale: 2, bg: '#0f172a', full: true });

      // Convert base64 to blob
      const response = await fetch(png64);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      showToast('Graph copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy image:', err);
      showToast('Failed to copy image to clipboard', 'error');
    }
  });
}

// Save Image button
const saveImageBtn = document.getElementById('saveImageBtn');
if (saveImageBtn) {
  saveImageBtn.addEventListener('click', () => {
    if (!cy) {
      showToast('No graph to save', 'warning');
      return;
    }
    try {
      // Generate PNG with higher resolution
      const png64 = cy.png({ scale: 2, bg: '#0f172a', full: true });

      // Generate timestamped filename
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `service-map-${timestamp}.png`;

      // Create download link
      const link = document.createElement('a');
      link.href = png64;
      link.download = filename;
      link.click();

      showToast(`Saved ${filename}`, 'success');
    } catch (err) {
      console.error('Failed to save image:', err);
      showToast('Failed to save image', 'error');
    }
  });
}

const renderGraph = (elements, skipped) => {
  updateStatus('Rendering graph…');

  cy = cytoscape({
    container: cyContainer,
    elements,
    layout: layoutConfig,
    style: stylesheet,
    userZoomingEnabled: false, // We'll handle zoom manually
    selectionType: 'single',
    minZoom: 0.1, // Allow more zoom out for large graphs
    maxZoom: 2.5,
  });

  // Custom wheel zoom handler for dynamic sensitivity
  cyContainer.addEventListener('wheel', (e) => {
    // Only handle if no other modifiers are pressed (to avoid conflicting with browser zoom etc)
    if (!cy) return;

    e.preventDefault();

    const currentZoom = cy.zoom();
    const minZoom = cy.minZoom();
    const maxZoom = cy.maxZoom();

    const newZoom = calculateDynamicZoom(currentZoom, e.deltaY, minZoom, maxZoom);

    // Zoom towards the mouse pointer
    const rect = cyContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cy.zoom({
      level: newZoom,
      renderedPosition: { x, y }
    });
  }, { passive: false });

  window.cy = cy; // Export for debugging

  cy.ready(() => {
    cy.fit(undefined, 100);
    updateStatus(
      `Loaded ${cy.nodes().length} nodes and ${cy.edges().length} edges` +
      (skipped ? ` (skipped ${skipped} invalid rows)` : ''),
    );
    // Update dirty UI on initial load
    updateDirtyUI(getDirtyState());
  });

  // Helper for highlighting connections
  const highlightConnections = (node) => {
    const depthVal = document.getElementById('depthSelect')?.value || '1';
    let highlightCollection = node;

    if (depthVal === 'all') {
      const components = cy.elements().components();
      const component = components.find(c => c.contains(node));
      if (component) highlightCollection = component;
    } else {
      const depth = parseInt(depthVal, 10);
      for (let i = 0; i < depth; i++) {
        highlightCollection = highlightCollection.union(highlightCollection.neighborhood());
      }
    }

    cy.elements().addClass('dimmed');
    highlightCollection.removeClass('dimmed');
  };

  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    showPanel(node);
    highlightConnections(node);
  });

  // Handle depth change immediately
  const depthSelect = document.getElementById('depthSelect');
  if (depthSelect) {
    // Clone to remove old listeners (simple cleanup)
    const newSelect = depthSelect.cloneNode(true);
    depthSelect.parentNode.replaceChild(newSelect, depthSelect);

    newSelect.addEventListener('change', () => {
      // Find currently selected/active node
      // We check cy :selected or look for active class?
      // Cytoscape handles selection state on tap by default
      const selected = cy.nodes(':selected');
      if (selected.length > 0) {
        highlightConnections(selected[0]);
      }
    });
  }

  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      hidePanel();
      cy.elements().removeClass('dimmed');
    }
  });

  // Re-initialize UI components with the new cy instance
  initFilters(cy);
  initPanel(cy, updateStatus);
  initEdgeEditor(cy, updateStatus);
  populateLabelFilter(elements);
  populateTeamFilter(elements);
};

// Edit Mode Toggle Button
const editModeBtn = document.getElementById('editModeBtn');
const editModeLabel = document.getElementById('editModeLabel');
if (editModeBtn) {
  editModeBtn.addEventListener('click', () => {
    const active = toggleEditMode(updateStatus);
    if (active) {
      editModeBtn.classList.remove('bg-slate-800', 'border-slate-700');
      editModeBtn.classList.add('bg-amber-600', 'border-amber-500', 'text-white');
      editModeLabel.textContent = 'Exit Edit Mode';
    } else {
      editModeBtn.classList.add('bg-slate-800', 'border-slate-700');
      editModeBtn.classList.remove('bg-amber-600', 'border-amber-500', 'text-white');
      editModeLabel.textContent = 'Enter Edit Mode';
    }
  });
}

const layoutSelect = document.getElementById('layoutSelect');
if (layoutSelect) {
  layoutSelect.addEventListener('change', (e) => {
    if (!cy) return;
    const layoutValue = e.target.value;
    const isHorizontalDagre = layoutValue === 'dagre-horizontal';
    const isVerticalDagre = layoutValue === 'dagre-vertical' || layoutValue === 'dagre';

    // Normalize layout name for Cytoscape
    const layoutName = (isHorizontalDagre || isVerticalDagre) ? 'dagre' : layoutValue;

    updateStatus(`Switching to ${layoutName} layout…`);

    const animationOptions = {
      name: layoutName,
      animate: true,
      animationDuration: 1000,
      fit: false,
      padding: 160,
      randomize: false,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: (layoutName === 'circle' || layoutName === 'concentric') ? 0.7 : 1,
      // Dagre specific options
      rankDir: isHorizontalDagre ? 'LR' : 'TB',
    };

    const finalConfig = layoutName === 'fcose' ?
      { ...layoutConfig, animate: true, animationDuration: 1000, fit: false, padding: 160 } :
      animationOptions;

    const layout = cy.layout(finalConfig);

    let layoutFinished = false;
    const onStop = () => {
      if (layoutFinished) return;
      layoutFinished = true;
      cy.animate({
        fit: { padding: 160 },
        duration: 800,
        easing: 'ease-in-out-cubic'
      });
      updateStatus(`Layout: ${layoutName} applied`);
    };

    layout.one('layoutstop', onStop);
    layout.run();

    // Fallback in case layoutstop doesn't fire for some reason
    setTimeout(() => {
      if (!layoutFinished) {
        onStop();
      }
    }, 2500);
  });
}

const loadData = async () => {
  try {
    const savedData = loadGraphData();
    if (savedData) {
      updateStatus('Loading data from local storage…');
      renderGraph(savedData, 0);
      return;
    }

    updateStatus('Fetching CSV data…');
    cyContainer?.classList.add('cy-loading');

    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`Unable to load services.csv (${response.status})`);

    const csvText = await response.text();
    const { elements, skipped } = parseCSV(csvText);
    renderGraph(elements, skipped);
    cyContainer?.classList.remove('cy-loading');
  } catch (error) {
    console.error(error);
    updateStatus(error.message || 'Failed to load graph');
    cyContainer?.classList.remove('cy-loading');
  }
};

const resetDataBtn = document.getElementById('resetDataBtn');
resetDataBtn?.addEventListener('click', () => {
  if (confirm('Clear all local edits and reset to the default services.csv?')) {
    clearGraphData();
    window.location.reload();
  }
});

// Bootstrap
initAccordion();
initUploader(renderGraph, updateStatus, () => cy, showToast);
loadData();
