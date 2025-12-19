import './styles/main.css';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import dagre from 'cytoscape-dagre';
import { parseCSV } from './logic/parser';
import { layoutConfig, stylesheet } from './logic/graphConfig';
import { initAccordion } from './logic/accordion';
import { loadGraphData, getDirtyState, clearGraphData, downloadCSV } from './logic/storage';
import { initFilters, populateLabelFilter, populateTeamFilter } from './logic/filters';
import { initUploader } from './logic/uploader';
import { initEdgeEditor, toggleEditMode } from './logic/edgeEditor';
import { calculateDynamicZoom } from './logic/zoom';
import { showToast, updateStatus, initFloatingPanel, initModal } from './logic/ui';
import { copyImageToClipboard, saveImageAsPng } from './logic/exports';
import { initLayoutManager } from './logic/layoutManager';
import { initGraphEvents } from './logic/graphEvents';
import { initServiceForm } from './logic/serviceForm';

cytoscape.use(fcose);
cytoscape.use(dagre);

const cyContainer = document.getElementById('cy');
const csvUrl = `${import.meta.env.BASE_URL}data/services.csv`;

let cy;

// Dirty state UI management
const dirtyStateContainer = document.getElementById('dirtyStateContainer');
const updateDirtyUI = (isDirty) => {
  if (dirtyStateContainer) {
    dirtyStateContainer.classList.toggle('hidden', !isDirty);
  }
};

window.addEventListener('dirty-state-change', (e) => {
  updateDirtyUI(e.detail.isDirty);
});

// Sidebar Actions logic
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
downloadCsvBtn?.addEventListener('click', () => {
  if (cy) {
    downloadCSV(cy);
    updateStatus(`Downloaded updated CSV`);
  }
});

document.getElementById('copyImageBtn')?.addEventListener('click', () => copyImageToClipboard(cy));
document.getElementById('saveImageBtn')?.addEventListener('click', () => saveImageAsPng(cy));

const renderGraph = (elements, skipped) => {
  updateStatus('Rendering graph…');

  cy = cytoscape({
    container: cyContainer,
    elements,
    layout: layoutConfig,
    style: stylesheet,
    userZoomingEnabled: false,
    selectionType: 'single',
    minZoom: 0.1,
    maxZoom: 2.5,
  });

  // Zoom management
  cyContainer.addEventListener('wheel', (e) => {
    if (!cy) return;
    e.preventDefault();
    const currentZoom = cy.zoom();
    const newZoom = calculateDynamicZoom(currentZoom, e.deltaY, cy.minZoom(), cy.maxZoom());
    const rect = cyContainer.getBoundingClientRect();
    cy.zoom({ level: newZoom, renderedPosition: { x: e.clientX - rect.left, y: e.clientY - rect.top } });
  }, { passive: false });

  window.cy = cy;

  cy.ready(() => {
    cy.fit(undefined, 100);
    updateStatus(`Loaded ${cy.nodes().length} nodes and ${cy.edges().length} edges` + (skipped ? ` (skipped ${skipped} invalid rows)` : ''));
    updateDirtyUI(getDirtyState());
  });

  // Initialize modular controllers
  initFilters(cy);
  initEdgeEditor(cy, updateStatus);
  initLayoutManager(cy);
  initGraphEvents(cy);
  initServiceForm(cy, () => updateDirtyUI(true));

  populateLabelFilter(elements);
  populateTeamFilter(elements);
};

// Edit Mode UI
const editModeBtn = document.getElementById('editModeBtn');
const editModeLabel = document.getElementById('editModeLabel');
editModeBtn?.addEventListener('click', () => {
  const active = toggleEditMode(updateStatus);
  const addServiceBtn = document.getElementById('addServiceBtnSidebar');

  if (active) {
    editModeBtn.className = 'w-full bg-amber-600 border border-amber-500 text-white text-xs rounded px-3 py-2 flex items-center justify-center gap-2 transition-colors';
    editModeLabel.textContent = 'Exit Edit Mode';
    addServiceBtn?.classList.remove('hidden');
  } else {
    editModeBtn.className = 'w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-3 py-2 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors flex items-center justify-center gap-2';
    editModeLabel.textContent = 'Enter Edit Mode';
    addServiceBtn?.classList.add('hidden');
  }
});

const loadData = async () => {
  try {
    const savedData = loadGraphData();
    if (savedData) {
      renderGraph(savedData, 0);
      return;
    }

    cyContainer?.classList.add('cy-loading');
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`Unable to load services.csv`);
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

document.getElementById('resetDataBtn')?.addEventListener('click', () => {
  if (confirm('Clear all local edits and reset to the default services.csv?')) {
    clearGraphData();
    window.location.reload();
  }
});

// Setup Modals
initModal('helpModal', 'openHelpBtn', 'closeHelpBtn');

// Initialize Floating Panels
initFloatingPanel({
  panelId: 'floatingFilterPanel',
  menuBtnId: 'panelMenuBtn',
  menuId: 'panelMenu',
  moveBtnId: 'movePanelBtn',
  storageKey: 'panel-pos',
  defaultClasses: ['-translate-x-1/2', 'left-1/2', 'top-6']
});

initFloatingPanel({
  panelId: 'floatingTeamPanel',
  menuBtnId: 'teamPanelMenuBtn',
  menuId: 'teamPanelMenu',
  moveBtnId: 'moveTeamPanelBtn',
  storageKey: 'team-panel-pos',
  defaultClasses: ['right-6', 'top-6']
});

// Bootstrap
initAccordion();
initUploader(renderGraph, updateStatus, () => cy, showToast);
loadData();
