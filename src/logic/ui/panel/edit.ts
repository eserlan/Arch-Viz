import { EdgeSingular } from 'cytoscape';
import {
    getElements,
    getCurrentSelectedNode,
    getCyRef,
    getOriginalData,
    setIsEditMode,
    TIER_LABELS
} from './state';
import { updateSaveButtonState } from './actions';

// Constants for verified checkbox styling and text
const VERIFIED_CHECKBOX_LABEL_CLASSES = 'flex items-center gap-2 text-xs text-slate-300';
const VERIFIED_CHECKBOX_INPUT_CLASSES = 'h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500';
const VERIFIED_CHECKBOX_LABEL_TEXT = 'Toggle verification';

export const toggleEdit = (editing: boolean): void => {
    const { panelContent, editBtn, editActions, saveBtn } = getElements();
    const currentSelectedNode = getCurrentSelectedNode();
    const originalData = getOriginalData();
    if (!panelContent || !currentSelectedNode) return;

    if (!editing) {
        panelContent.querySelectorAll('[data-edit-only="verified"]').forEach(el => el.remove());
    }

    if (editing) {
        const existing = panelContent.querySelector('[data-edit-only="verified"]');
        if (!existing) {
            const verifiedItem = document.createElement('div');
            verifiedItem.className = 'info-item';
            verifiedItem.dataset.editOnly = 'verified';
            verifiedItem.innerHTML = `
                <label>Verified</label>
                <div class="info-value" data-key="verified"></div>
            `;

            const outboundItem = panelContent.querySelector('.connections-list')?.closest('.info-item');
            if (outboundItem && outboundItem.parentNode) {
                outboundItem.parentNode.insertBefore(verifiedItem, outboundItem);
            } else {
                panelContent.appendChild(verifiedItem);
            }
        }
    }

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
                const isVerified = Boolean(originalData.verified);
                htmlEl.innerHTML = `
                    <label class="${VERIFIED_CHECKBOX_LABEL_CLASSES}">
                        <input type="checkbox" data-key="verified" class="${VERIFIED_CHECKBOX_INPUT_CLASSES}" ${isVerified ? 'checked' : ''} />
                        ${VERIFIED_CHECKBOX_LABEL_TEXT}
                    </label>
                `;
            } else if (key === 'comment') {
                const currentVal = originalData[key] || '';
                htmlEl.innerHTML = `<textarea data-key="${key}" class="w-full bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm h-24 resize-y"></textarea>`;
                const textarea = htmlEl.querySelector('textarea');
                if (textarea) textarea.value = String(currentVal);
            } else {
                const currentVal = originalData[key] || htmlEl.textContent;
                htmlEl.innerHTML = `<input type="text" data-key="${key}" value="${currentVal}" class="w-full bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm">`;
            }
        } else {
            const input = htmlEl.querySelector('input');
            const textarea = htmlEl.querySelector('textarea');
            const select = htmlEl.querySelector('select');

            if (select) {
                const val = parseInt(select.value, 10);
                htmlEl.textContent = TIER_LABELS[val] || val.toString();
            } else {
                const val = input ? input.value : (textarea ? textarea.value : htmlEl.textContent || '');
                // For comments, we want to show placeholder if empty
                if (key === 'comment' && !val) {
                    htmlEl.innerHTML = '<span class="text-slate-500 italic">Not set</span>';
                } else {
                    htmlEl.textContent = val;
                }
            }
        }
    });

    // Add input listeners for dirty checking
    if (editing) {
        const inputs = panelContent.querySelectorAll('input[data-key], select[data-key], textarea[data-key]');
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
    const cyRef = getCyRef();
    if (editing && cyRef && connectionsList) {
        const cy = cyRef;
        const outgoingEdges = currentSelectedNode.outgoers('edge');
        const existingTargets = new Set(outgoingEdges.targets().map(n => n.id()));

        // Build "Remove" view for connections
        const connectionsHtml = outgoingEdges.map((edge: EdgeSingular) => `
            <div class="flex items-center justify-between mb-1 bg-slate-800/50 p-1 rounded group">
                <span class="text-xs truncate mr-2">${edge.target().data('label') || edge.target().id()}</span>
                <button class="remove-connection btn-icon text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${edge.id()}">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        `).join('');

        // Build "Add" dropdown
        const allNodes = cy.nodes().filter(n => n.id() !== currentSelectedNode!.id() && !existingTargets.has(n.id()));
        const optionsHtml = allNodes.map(n => `<option value="${n.id()}">${n.data('label') || n.id()}</option>`).sort().join('');

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

    // Update edit mode state
    setIsEditMode(editing);
};
