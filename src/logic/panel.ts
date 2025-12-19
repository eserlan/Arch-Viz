import { NodeSingular, EdgeSingular } from 'cytoscape';
import { saveGraphData } from './storage';
import { deleteNode } from './nodeOperations';
import { updateStatus } from './ui';
import { CyInstance } from '../types';

const TIER_LABELS: Record<number, string> = {
    1: 'Tier 1 (Critical)',
    2: 'Tier 2 (Major)',
    3: 'Tier 3 (Minor)',
    4: 'Tier 4 (Low)'
};

let currentSelectedNode: NodeSingular | null = null;
let cyRef: CyInstance | null = null;
let updateStatusRef: ((msg: string) => void) | null = null;
let originalData: Record<string, string> = {}; // Store original values for dirty checking

interface PanelElements {
    servicePanel: HTMLElement | null;
    panelContent: HTMLElement | null;
    editBtn: HTMLElement | null;
    editActions: HTMLElement | null;
    saveBtn: HTMLButtonElement | null;
    cancelBtn: HTMLElement | null;
    deleteNodeBtn: HTMLElement | null;
}

const getElements = (): PanelElements => ({
    servicePanel: document.getElementById('servicePanel'),
    panelContent: document.getElementById('panelContent'),
    editBtn: document.getElementById('editBtn'),
    editActions: document.getElementById('editActions'),
    saveBtn: document.getElementById('saveBtn') as HTMLButtonElement | null,
    cancelBtn: document.getElementById('cancelBtn'),
    deleteNodeBtn: document.getElementById('deleteNodeBtn'),
});

const updateSaveButtonState = (): void => {
    const { saveBtn, panelContent } = getElements();
    if (!saveBtn || !panelContent) return;

    const inputs = panelContent.querySelectorAll('input[data-key], select[data-key]');
    let isDirty = false;

    inputs.forEach(input => {
        const el = input as HTMLInputElement | HTMLSelectElement;
        const key = el.dataset.key;
        if (key && originalData[key] !== el.value) {
            isDirty = true;
        }
    });

    saveBtn.disabled = !isDirty;
    saveBtn.classList.toggle('opacity-50', !isDirty);
    saveBtn.classList.toggle('cursor-not-allowed', !isDirty);
};

export const showPanel = (node: NodeSingular): void => {
    const { servicePanel, panelContent, editBtn, editActions } = getElements();
    if (!panelContent || !servicePanel) return;

    // Auto-initialize listeners if cy instance changed
    const cy = node.cy() as CyInstance;
    if (cyRef !== cy) {
        initPanel(cy, updateStatus);
    }

    currentSelectedNode = node;
    const data = node.data();
    const outgoingEdges = node.outgoers('edge');
    const connections = outgoingEdges.map((edge: EdgeSingular) => ({
        id: edge.id(),
        target: edge.target().data('name') || edge.target().data('label') || edge.target().id(),
        targetId: edge.target().id()
    }));

    // Store original data for dirty checking
    originalData = {
        name: data.name || data.label || '',
        labels: data.labelsDisplay || '',
        tier: data.tier?.toString() || '',
        owner: data.owner || '',
        repoUrl: data.repoUrl || '',
        verified: data.verified ? 'true' : 'false'
    };

    const verifiedBadge = data.verified
        ? `<span class="inline-flex items-center gap-1 text-red-400 font-bold"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>Verified</span>`
        : `<span class="text-slate-500 italic">Not verified</span>`;

    panelContent.innerHTML = `
    <div class="info-item">
      <label>Service ID</label>
      <div class="info-value text-slate-500 font-mono">${data.id}</div>
    </div>
    <div class="info-item">
      <label>Verified</label>
      <div class="info-value" data-key="verified">${verifiedBadge}</div>
    </div>
    <div class="info-item">
      <label>Name</label>
      <div class="info-value" data-key="name">${data.name || data.label || ''}</div>
    </div>
    <div class="info-item">
      <label>Labels</label>
      <div class="info-value" data-key="labels">${data.labelsDisplay || ''}</div>
    </div>
    <div class="info-item">
      <label>Tier</label>
      <div class="info-value" data-key="tier">${TIER_LABELS[data.tier] || data.tier || ''}</div>
    </div>
    <div class="info-item">
      <label>Owner</label>
      <div class="info-value" data-key="owner">${data.owner || ''}</div>
    </div>
    <div class="info-item">
      <label>Repo URL</label>
      <div class="info-value" data-key="repoUrl">${data.repoUrl
            ? `<a href="${data.repoUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline break-all">${data.repoUrl}</a>`
            : '<span class="text-slate-500 italic">Not set</span>'}</div>
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

export const hidePanel = (): void => {
    const { servicePanel } = getElements();
    if (servicePanel) servicePanel.classList.remove('active');
    currentSelectedNode = null;
    originalData = {};
};

export const toggleEdit = (editing: boolean): void => {
    const { panelContent, editBtn, editActions, saveBtn } = getElements();
    if (!panelContent || !currentSelectedNode) return;

    const values = panelContent.querySelectorAll('.info-value[data-key]');
    values.forEach(el => {
        const htmlEl = el as HTMLElement;
        const key = htmlEl.dataset.key;
        if (!key) return;

        if (editing) {
            if (key === 'tier') {
                const currentTier = parseInt(originalData.tier || '4', 10);
                const options = Object.entries(TIER_LABELS).map(([val, label]) =>
                    `<option value="${val}" ${parseInt(val) === currentTier ? 'selected' : ''}>${label}</option>`
                ).join('');
                htmlEl.innerHTML = `<select data-key="tier" class="w-full bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-emerald-500">${options}</select>`;
            } else if (key === 'verified') {
                const isVerified = originalData.verified === 'true';
                htmlEl.innerHTML = `
                    <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox" data-key="verified" ${isVerified ? 'checked' : ''} class="sr-only peer">
                        <div class="relative w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        <span class="ms-2 text-xs text-slate-400 peer-checked:text-emerald-400">Mark as verified</span>
                    </label>
                `;
            } else {
                const currentVal = originalData[key] || htmlEl.textContent;
                htmlEl.innerHTML = `<input type="text" data-key="${key}" value="${currentVal}" class="w-full bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm">`;
            }
        } else {
            const input = htmlEl.querySelector('input');
            const select = htmlEl.querySelector('select');

            if (select) {
                const val = parseInt(select.value, 10);
                htmlEl.textContent = TIER_LABELS[val] || val.toString();
            } else {
                const val = input ? input.value : htmlEl.textContent || '';
                htmlEl.textContent = val;
            }
        }
    });

    // Add input listeners for dirty checking
    if (editing) {
        const inputs = panelContent.querySelectorAll('input[data-key], select[data-key]');
        inputs.forEach(input => {
            input.addEventListener('input', updateSaveButtonState);
            input.addEventListener('change', updateSaveButtonState);
        });
        // Initially disable save button
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    const connectionsList = panelContent.querySelector('.connections-list');
    if (editing && cyRef && connectionsList) {
        const cy = cyRef;
        const outgoingEdges = currentSelectedNode.outgoers('edge');
        const existingTargets = new Set(outgoingEdges.targets().map(n => n.id()));

        // Build "Remove" view for connections
        let connectionsHtml = outgoingEdges.map((edge: EdgeSingular) => `
            <div class="flex items-center justify-between mb-1 bg-slate-800/50 p-1 rounded group">
                <span class="text-xs truncate mr-2">${edge.target().data('label') || edge.target().id()}</span>
                <button class="remove-connection btn-icon text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${edge.id()}">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        `).join('');

        // Build "Add" dropdown
        const allNodes = cy.nodes().filter(n => n.id() !== currentSelectedNode!.id() && !existingTargets.has(n.id()));
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
        const select = document.getElementById('newConnectionId') as HTMLSelectElement | null;
        const addBtn = document.getElementById('addConnectionBtn') as HTMLButtonElement | null;
        if (select && addBtn) {
            select.addEventListener('change', () => { addBtn.disabled = !select.value; });

            addBtn.addEventListener('click', () => {
                const targetId = select.value;
                if (!targetId || !currentSelectedNode) return;
                const edgeId = `${currentSelectedNode.id()}-${targetId}`;

                // Add edge in Cytoscape
                cy.add({
                    group: 'edges',
                    data: { id: edgeId, source: currentSelectedNode.id(), target: targetId }
                });

                // Re-toggle edit to refresh list
                toggleEdit(true);
            });
        }

        panelContent.querySelectorAll('.remove-connection').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = (btn as HTMLElement).dataset.id;
                if (id) {
                    cy.getElementById(id).remove();
                    toggleEdit(true);
                }
            });
        });
    }

    if (editing) {
        editBtn?.classList.add('hidden');
        editActions?.classList.remove('hidden');
    } else {
        editBtn?.classList.remove('hidden');
        editActions?.classList.add('hidden');
    }
};

const handleSave = (): void => {
    if (!currentSelectedNode || !cyRef) {
        console.error('handleSave: No node or cy reference');
        return;
    }
    const { panelContent } = getElements();
    if (!panelContent) {
        console.error('handleSave: No panelContent');
        return;
    }

    const inputs = panelContent.querySelectorAll('input[data-key], select[data-key]');
    const newData: any = {};
    inputs.forEach(input => {
        const el = input as HTMLInputElement | HTMLSelectElement;
        const key = el.dataset.key;
        if (key) {
            if (el.type === 'checkbox') {
                newData[key] = (el as HTMLInputElement).checked;
            } else {
                newData[key] = el.value;
            }
        }
    });

    // Handle verified toggle - update class
    if (typeof newData.verified === 'boolean') {
        if (newData.verified) {
            currentSelectedNode.addClass('verified');
        } else {
            currentSelectedNode.removeClass('verified');
        }
    }

    if (newData.tier) {
        newData.tier = parseInt(newData.tier, 10);

        // Update classes to reflect new tier color
        [1, 2, 3, 4].forEach(t => currentSelectedNode!.removeClass(`tier-${t}`));
        currentSelectedNode.addClass(`tier-${newData.tier}`);
    }

    // Handle 'name' field - also update 'label' for Cytoscape display
    if (newData.name) {
        newData.label = newData.name;
    }

    // Handle 'labels' field - parse semicolon or comma separated values
    if (newData.labels) {
        const labels = newData.labels.split(/[;,]/).map((d: string) => d.trim()).filter(Boolean);
        newData.labelsDisplay = labels.join(', ');
        newData.labels = labels;
        const newLabelClasses = labels.map((d: string) => `label-${d.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
        // Get current classes as array, filter out old label classes, add new ones
        const currentClasses = currentSelectedNode.classes();
        const classArray = Array.isArray(currentClasses) ? currentClasses : [];
        const filteredClasses = classArray.filter(c => !c.startsWith('label-'));
        currentSelectedNode.classes([...filteredClasses, ...newLabelClasses]);
    }

    // Update node data
    currentSelectedNode.data(newData);

    // Save to localStorage
    const elements = cyRef.elements().jsons();
    saveGraphData(elements as any);

    if (updateStatusRef) {
        updateStatusRef(`Saved changes to ${newData.name || newData.label || currentSelectedNode.id()}`);
    }

    // Refresh panel to show saved state
    showPanel(currentSelectedNode);
};

export const initPanel = (cy: CyInstance, updateStatus: (msg: string) => void): void => {
    // Update module-level references every time
    cyRef = cy;
    updateStatusRef = updateStatus;

    const { editBtn, cancelBtn, saveBtn } = getElements();

    // Remove old listeners by cloning and replacing elements
    if (editBtn && editBtn.parentNode) {
        const newEditBtn = editBtn.cloneNode(true) as HTMLElement;
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        newEditBtn.addEventListener('click', () => toggleEdit(true));
    }

    if (cancelBtn && cancelBtn.parentNode) {
        const newCancelBtn = cancelBtn.cloneNode(true) as HTMLElement;
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', () => {
            if (currentSelectedNode) {
                showPanel(currentSelectedNode);
            }
        });
    }

    if (saveBtn && saveBtn.parentNode) {
        const newSaveBtn = saveBtn.cloneNode(true) as HTMLElement;
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', handleSave);
    }

    const { deleteNodeBtn } = getElements();
    if (deleteNodeBtn && deleteNodeBtn.parentNode) {
        const newDeleteBtn = deleteNodeBtn.cloneNode(true) as HTMLElement;
        deleteNodeBtn.parentNode.replaceChild(newDeleteBtn, deleteNodeBtn);
        newDeleteBtn.addEventListener('click', () => {
            if (currentSelectedNode) {
                const label = currentSelectedNode.data('name') || currentSelectedNode.id();
                if (confirm(`Are you sure you want to delete "${label}"?\nThis action cannot be undone.`)) {
                    const id = currentSelectedNode.id();
                    if (deleteNode(cy, id)) {
                        if (updateStatusRef) updateStatusRef(`Deleted service: ${label}`);
                        hidePanel();
                        cy.elements().removeClass('dimmed');
                    }
                }
            }
        });
    }
};
