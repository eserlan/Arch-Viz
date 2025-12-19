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

let currentSelectedNode = null;
const servicePanel = document.getElementById('servicePanel');
const panelContent = document.getElementById('panelContent');
const editBtn = document.getElementById('editBtn');
const editActions = document.getElementById('editActions');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

const showPanel = (node) => {
  currentSelectedNode = node;
  const data = node.data();

  panelContent.innerHTML = `
    <div class="info-item">
      <label>Service ID</label>
      <div class="info-value text-slate-500 font-mono">${data.id}</div>
    </div>
    <div class="info-item">
      <label>Label</label>
      <div class="info-value" data-key="label">${data.label || ''}</div>
    </div>
    <div class="info-item">
      <label>Domain</label>
      <div class="info-value" data-key="domain">${data.domain || ''}</div>
    </div>
    <div class="info-item">
      <label>Tier</label>
      <div class="info-value" data-key="tier">${data.tier || ''}</div>
    </div>
    <div class="info-item">
      <label>Owner</label>
      <div class="info-value" data-key="owner">${data.owner || ''}</div>
    </div>
    <div class="info-item">
      <label>Repo URL</label>
      <div class="info-value" data-key="repoUrl">${data.repoUrl || ''}</div>
    </div>
  `;

  servicePanel.classList.add('active');
  editBtn.classList.remove('hidden');
  editActions.classList.add('hidden');
};

const hidePanel = () => {
  servicePanel.classList.remove('active');
  currentSelectedNode = null;
};

const toggleEdit = (editing) => {
  const values = panelContent.querySelectorAll('.info-value[data-key]');
  values.forEach(el => {
    if (editing) {
      const currentVal = el.textContent;
      const key = el.dataset.key;
      el.innerHTML = `<input type="text" data-key="${key}" value="${currentVal}">`;
    } else {
      const input = el.querySelector('input');
      const val = input ? input.value : el.textContent;
      el.textContent = val;
    }
  });

  if (editing) {
    editBtn.classList.add('hidden');
    editActions.classList.remove('hidden');
  } else {
    editBtn.classList.remove('hidden');
    editActions.classList.add('hidden');
  }
};

editBtn?.addEventListener('click', () => toggleEdit(true));
cancelBtn?.addEventListener('click', () => toggleEdit(false));

saveBtn?.addEventListener('click', () => {
  if (!currentSelectedNode) return;

  const inputs = panelContent.querySelectorAll('input');
  const newData = {};
  inputs.forEach(input => {
    const key = input.dataset.key;
    newData[key] = input.value;
  });

  // Update Cytoscape node
  currentSelectedNode.data(newData);

  // Persist to localStorage
  const allElements = cy.elements().jsons();
  localStorage.setItem('arch-viz-elements', JSON.stringify(allElements));

  updateStatus(`Updated ${newData.label || currentSelectedNode.id()}`);
  toggleEdit(false);
});

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
    showPanel(node);

    // Highlighting Logic
    cy.elements().addClass('dimmed');
    node.closedNeighborhood().removeClass('dimmed');
  });

  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      hidePanel();
      // Restore all elements
      cy.elements().removeClass('dimmed');
    }
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
    const savedData = localStorage.getItem('arch-viz-elements');
    if (savedData) {
      updateStatus('Loading data from local storage…');
      const elements = JSON.parse(savedData);
      renderGraph(elements, 0);
      return;
    }

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

          // Persist dropped data to localStorage
          localStorage.setItem('arch-viz-elements', JSON.stringify(elements));
        };
        reader.readAsText(file);
      } else {
        updateStatus('Error: Only .csv files are supported for drop upload.');
      }
    }
  }, false);
}

const resetDataBtn = document.getElementById('resetDataBtn');
resetDataBtn?.addEventListener('click', () => {
  if (confirm('Clear all local edits and reset to the default services.csv?')) {
    localStorage.removeItem('arch-viz-elements');
    window.location.reload();
  }
});

initAccordion();
loadData();
