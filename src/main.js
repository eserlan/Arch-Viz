import './styles/main.css';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { parseCSV } from './logic/parser';
import { layoutConfig, stylesheet } from './logic/graphConfig';
import { initAccordion } from './logic/accordion';

cytoscape.use(fcose);

const cyContainer = document.getElementById('cy');
const statusEl = document.getElementById('status');
const csvUrl = `${import.meta.env.BASE_URL}data/services.csv`;

const updateStatus = (message) => {
  if (statusEl) {
    statusEl.textContent = message;
  }
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
    pixelRatio: 1,
    selectionType: 'single',
    minZoom: 0.2,
    maxZoom: 2.5,
  });

  cy.ready(() => {
    cy.fit(undefined, 80);
    updateStatus(
      `Loaded ${cy.nodes().length} nodes and ${cy.edges().length} edges` +
      (skipped ? ` (skipped ${skipped} invalid rows)` : ''),
    );
  });

  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    const domain = node.data('domain');
    const owner = node.data('owner');
    const tier = node.data('tier');
    const repoUrl = node.data('repoUrl');

    const details = [
      `Service: ${node.data('label') || node.id()}`,
      domain ? `Domain: ${domain}` : null,
      tier ? `Tier: ${tier}` : null,
      owner ? `Owner: ${owner}` : null,
      repoUrl ? `Repo: ${repoUrl}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    updateStatus(details);
  });
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
      padding: 80,
      randomize: false, // Keep it stable when switching
      nodeDimensionsIncludeLabels: true,
    };

    // Special handling for fCoSE which has its own config
    const finalConfig =
      layoutName === 'fcose' ? { ...layoutConfig, animate: true, animationDuration: 1000 } : animationOptions;

    const layout = cy.layout(finalConfig);
    layout.run();
  });
}

const loadData = async () => {
  try {
    updateStatus('Fetching CSV data…');
    cyContainer?.classList.add('cy-loading');

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Unable to load services.csv (${response.status})`);
    }

    const csvText = await response.text();
    updateStatus('Parsing CSV…');

    const { elements, skipped } = parseCSV(csvText);
    renderGraph(elements, skipped);
    cyContainer?.classList.remove('cy-loading');
  } catch (error) {
    console.error(error);
    updateStatus(error.message || 'Failed to load graph');
    cyContainer?.classList.remove('cy-loading');
  }
};

// Drag & Drop CSV Support
const dropZone = document.getElementById('dropZone');
const mainContainer = document.querySelector('main'); // Scope to main for better catch area

if (mainContainer && dropZone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    mainContainer.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    mainContainer.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('active');
    }, false);
  });

  mainContainer.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csvText = event.target.result;
          updateStatus(`Dropped file: ${file.name}. Parsing…`);
          const { elements, skipped } = parseCSV(csvText);

          // Re-render
          if (cy) {
            cy.destroy(); // Clean up existing instance
          }
          renderGraph(elements, skipped);
        };
        reader.readAsText(file);
      } else {
        updateStatus('Error: Only .csv files are supported for drop upload.');
      }
    }
  }, false);
}

initAccordion();
loadData();
