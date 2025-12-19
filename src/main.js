import './styles/main.css';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { parseCSV } from './logic/parser';
import { layoutConfig, stylesheet } from './logic/graphConfig';
import { initAccordion } from './logic/accordion';
import { loadGraphData, saveGraphData, clearGraphData } from './logic/storage';
import { initPanel, showPanel, hidePanel } from './logic/panel';
import { initFilters, populateDomainFilter } from './logic/filters';
import { initUploader } from './logic/uploader';

cytoscape.use(fcose);

const cyContainer = document.getElementById('cy');
const statusEl = document.getElementById('status');
const csvUrl = `${import.meta.env.BASE_URL}data/services.csv`;

const updateStatus = (message) => {
  if (statusEl) statusEl.textContent = message;
};

let cy;

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
  populateDomainFilter(elements);
};

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
      fit: true,
      padding: 150, // More padding for safety
      randomize: false,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: layoutName === 'circle' ? 0.75 : 1, // Compress circle layout
    };

    const finalConfig = layoutName === 'fcose' ?
      { ...layoutConfig, animate: true, animationDuration: 1000, fit: true, padding: 150 } :
      animationOptions;

    const layout = cy.layout(finalConfig);

    layout.one('layoutstop', () => {
      cy.animate({
        fit: { padding: 150 },
        duration: 500
      });
      updateStatus(`Layout: ${layoutName} applied`);
    });

    layout.run();
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
