import './styles/main.css';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { parseCSV } from './logic/parser';
import { layoutConfig, stylesheet } from './logic/graphConfig';
import { initAccordion } from './logic/accordion';
import { loadGraphData, saveGraphData, clearGraphData, getDirtyState, downloadCSV } from './logic/storage';
import { initPanel, showPanel, hidePanel } from './logic/panel';
import { initFilters, populateLabelFilter } from './logic/filters';
import { initUploader } from './logic/uploader';
import { initEdgeEditor, toggleEditMode, isInEditMode } from './logic/edgeEditor';

cytoscape.use(fcose);

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

const renderGraph = (elements, skipped) => {
  updateStatus('Rendering graph…');

  cy = cytoscape({
    container: cyContainer,
    elements,
    layout: layoutConfig,
    style: stylesheet,
    wheelSensitivity: 0.2,
    selectionType: 'single',
    minZoom: 0.1, // Allow more zoom out for large graphs
    maxZoom: 2.5,
  });

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

  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    showPanel(node);
    cy.elements().addClass('dimmed');
    node.closedNeighborhood().removeClass('dimmed');
  });

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
    const layoutName = e.target.value;
    updateStatus(`Switching to ${layoutName} layout…`);

    const animationOptions = {
      name: layoutName,
      animate: true,
      animationDuration: 1000,
      fit: false, // Don't fit during layout to avoid animation conflicts
      padding: 160,
      randomize: false,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: (layoutName === 'circle' || layoutName === 'concentric') ? 0.7 : 1,
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
initUploader(renderGraph, updateStatus, () => cy);
loadData();
