import { saveGraphData } from './storage';

let currentSelectedNode = null;
let cyRef = null;
let updateStatusRef = null;
let listenersAttached = false;

const getElements = () => ({
  servicePanel: document.getElementById('servicePanel'),
  panelContent: document.getElementById('panelContent'),
  editBtn: document.getElementById('editBtn'),
  editActions: document.getElementById('editActions'),
  saveBtn: document.getElementById('saveBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
});

export const showPanel = (node) => {
  const { servicePanel, panelContent, editBtn, editActions } = getElements();
  if (!panelContent || !servicePanel) return;

  currentSelectedNode = node;
  const data = node.data();
  const outgoingEdges = node.outgoers('edge');
  const connections = outgoingEdges.map(edge => ({
    id: edge.id(),
    target: edge.target().data('label') || edge.target().id(),
    targetId: edge.target().id()
  }));

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
    <div class="info-item">
      <label>Depends On</label>
      <div class="info-value connections-list">
        ${connections.length > 0
      ? connections.map(c => `<span class="connection-tag" data-id="${c.id}">${c.target}</span>`).join('')
      : '<span class="text-slate-500 italic text-xs">No dependencies</span>'}
      </div>
    </div>
  `;

  servicePanel.classList.add('active');
  editBtn?.classList.remove('hidden');
  editActions?.classList.add('hidden');
};

export const hidePanel = () => {
  const { servicePanel } = getElements();
  if (servicePanel) servicePanel.classList.remove('active');
  currentSelectedNode = null;
};

const toggleEdit = (editing) => {
  const { panelContent, editBtn, editActions } = getElements();
  if (!panelContent || !currentSelectedNode) return;

  const values = panelContent.querySelectorAll('.info-value[data-key]');
  values.forEach(el => {
    if (editing) {
      const currentVal = el.textContent;
      const key = el.dataset.key;
      el.innerHTML = `<input type="text" data-key="${key}" value="${currentVal}" class="w-full bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm">`;
    } else {
      const input = el.querySelector('input');
      const val = input ? input.value : el.textContent;
      el.textContent = val;
    }
  });

  const connectionsList = panelContent.querySelector('.connections-list');
  if (editing && cyRef) {
    const cy = cyRef;
    const outgoingEdges = currentSelectedNode.outgoers('edge');
    const existingTargets = new Set(outgoingEdges.targets().map(n => n.id()));

    // Build "Remove" view for connections
    let connectionsHtml = outgoingEdges.map(edge => `
            <div class="flex items-center justify-between mb-1 bg-slate-800/50 p-1 rounded group">
                <span class="text-xs truncate mr-2">${edge.target().data('label') || edge.target().id()}</span>
                <button class="remove-connection btn-icon text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${edge.id()}">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        `).join('');

    // Build "Add" dropdown
    const allNodes = cy.nodes().filter(n => n.id() !== currentSelectedNode.id() && !existingTargets.has(n.id()));
    let optionsHtml = allNodes.map(n => `<option value="${n.id()}">${n.data('label') || n.id()}</option>`).sort().join('');

    connectionsList.innerHTML = `
            <div id="editConnectionsList">${connectionsHtml}</div>
            <div class="mt-2 flex gap-1">
                <select id="newConnectionId" class="flex-1 bg-slate-800 border-slate-700 rounded px-1 py-1 text-xs text-slate-300">
                    <option value="">Add dependency...</option>
                    ${optionsHtml}
                </select>
                <button id="addConnectionBtn" class="bg-blue-600 hover:bg-blue-500 p-1 rounded text-white disabled:opacity-50" disabled>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
            </div>
        `;

    // Add event listeners for connection editing
    const select = document.getElementById('newConnectionId');
    const addBtn = document.getElementById('addConnectionBtn');
    select?.addEventListener('change', () => { addBtn.disabled = !select.value; });

    addBtn?.addEventListener('click', () => {
      const targetId = select.value;
      if (!targetId) return;
      const edgeId = `${currentSelectedNode.id()}-${targetId}`;

      // Add temp edge in Cytoscape immediately
      cy.add({
        group: 'edges',
        data: { id: edgeId, source: currentSelectedNode.id(), target: targetId }
      });

      // Re-toggle edit to refresh list (simplest way to update UI)
      toggleEdit(true);
    });

    panelContent.querySelectorAll('.remove-connection').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        cy.getElementById(id).remove();
        toggleEdit(true);
      });
    });

  } else {
    // Handled by showPanel in next call, but let's clean up for consistency
  }

  if (editing) {
    editBtn?.classList.add('hidden');
    editActions?.classList.remove('hidden');
  } else {
    editBtn?.classList.remove('hidden');
    editActions?.classList.add('hidden');
  }
};

const handleSave = () => {
  if (!currentSelectedNode || !cyRef) return;
  const { panelContent } = getElements();

  const inputs = panelContent.querySelectorAll('input');
  const newData = {};
  inputs.forEach(input => {
    const key = input.dataset.key;
    if (key) {
      newData[key] = input.value;
    }
  });

  if (newData.domain) {
    const domains = newData.domain.split(',').map(d => d.trim()).filter(Boolean);
    newData.domains = domains;
    const newDomainClasses = domains.map(d => `domain-${d.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).join(' ');
    currentSelectedNode.classes(currentSelectedNode.classes().replace(/domain-\S+/g, '').trim() + ' ' + newDomainClasses);
  }

  currentSelectedNode.data(newData);

  // Save total state
  saveGraphData(cyRef.elements().jsons());

  if (updateStatusRef) {
    updateStatusRef(`Updated ${newData.label || currentSelectedNode.id()} and its connections`);
  }
  showPanel(currentSelectedNode);
};

export const initPanel = (cy, updateStatus) => {
  // Update module-level references
  cyRef = cy;
  updateStatusRef = updateStatus;

  // Only attach event listeners once
  if (listenersAttached) return;
  listenersAttached = true;

  const { editBtn, cancelBtn, saveBtn } = getElements();

  editBtn?.addEventListener('click', () => toggleEdit(true));
  cancelBtn?.addEventListener('click', () => {
    if (currentSelectedNode) {
      showPanel(currentSelectedNode);
    }
  });

  saveBtn?.addEventListener('click', handleSave);
};
