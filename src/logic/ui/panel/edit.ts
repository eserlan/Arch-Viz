import { EdgeSingular, NodeSingular } from 'cytoscape';
import {
    getElements,
    currentSelectedNode,
    cyRef,
    originalData,
    TIER_LABELS
} from './state';
import { updateSaveButtonState } from './actions';

let listenersController = new AbortController();

// --- Template Helpers ---

const createTierSelect = (currentTier: number): string => {
    const options = Object.entries(TIER_LABELS)
        .map(([val, label]) => `<option value="${val}" ${parseInt(val) === currentTier ? 'selected' : ''}>${label}</option>`)
        .join('');
    return `<select data-key="tier" class="w-full bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-emerald-500">${options}</select>`;
};

const createVerifiedToggle = (isVerified: boolean): string => `
    <label class="inline-flex items-center cursor-pointer">
        <input type="checkbox" data-key="verified" ${isVerified ? 'checked' : ''} class="sr-only peer">
        <div class="relative w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
        <span class="ms-2 text-xs text-slate-400 peer-checked:text-emerald-400">Mark as verified</span>
    </label>`;

const createTextInput = (key: string, value: string): string => `
    <input type="text" data-key="${key}" value="${value}" class="w-full bg-slate-800 border-slate-700 rounded px-2 py-1 text-sm">`;

const createConnectionItem = (edge: EdgeSingular): string => `
    <div class="flex items-center justify-between mb-1 bg-slate-800/50 p-1 rounded group">
        <span class="text-xs truncate mr-2">${edge.target().data('label') || edge.target().id()}</span>
        <button class="remove-connection btn-icon text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${edge.id()}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    </div>`;

const createAddConnection = (options: string): string => `
    <div class="mt-2 flex gap-1">
        <select id="newConnectionId" class="flex-1 bg-slate-800 border-slate-700 rounded px-1 py-1 text-xs text-slate-300">
            <option value="">Add dependency...</option>
            ${options}
        </select>
        <button id="addConnectionBtn" class="bg-blue-600 hover:bg-blue-500 p-1 rounded text-white disabled:opacity-50" disabled>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
    </div>`;

// --- Event Listener Management ---

const attachEditModeListeners = (): void => {
    const { panelContent } = getElements();
    if (!panelContent || !cyRef) return;
    const signal = listenersController.signal;

    panelContent.querySelectorAll('input[data-key], select[data-key]').forEach(input => {
        input.addEventListener('input', updateSaveButtonState, { signal });
        input.addEventListener('change', updateSaveButtonState, { signal });
    });

    panelContent.querySelector('.connections-list')?.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.remove-connection')) {
            const id = target.closest<HTMLElement>('[data-id]')?.dataset.id;
            if (id) {
                cyRef.getElementById(id).remove();
                refreshConnectionsList();
            }
        } else if (target.closest('#addConnectionBtn')) {
            const select = panelContent.querySelector<HTMLSelectElement>('#newConnectionId');
            if (select?.value && currentSelectedNode) {
                const edgeId = `${currentSelectedNode.id()}-${select.value}`;
                cyRef.add({ group: 'edges', data: { id: edgeId, source: currentSelectedNode.id(), target: select.value } });
                refreshConnectionsList();
            }
        }
    }, { signal });

    panelContent.querySelector('#newConnectionId')?.addEventListener('change', (e) => {
        const select = e.target as HTMLSelectElement;
        const addBtn = panelContent.querySelector<HTMLButtonElement>('#addConnectionBtn');
        if (addBtn) addBtn.disabled = !select.value;
    }, { signal });
};

const removeEditModeListeners = (): void => {
    listenersController.abort();
    listenersController = new AbortController();
};

// --- DOM Rendering ---

const refreshConnectionsList = (): void => {
    const { panelContent } = getElements();
    if (!panelContent || !currentSelectedNode || !cyRef) return;

    const connectionsList = panelContent.querySelector('.connections-list');
    if (!connectionsList) return;

    const outgoingEdges = currentSelectedNode.outgoers('edge');
    const existingTargets = new Set(outgoingEdges.targets().map(n => n.id()));
    const connectionsHtml = outgoingEdges.map(createConnectionItem).join('');

    const optionsHtml = cyRef.nodes()
        .filter(n => n.id() !== currentSelectedNode!.id() && !existingTargets.has(n.id()))
        .map(n => `<option value="${n.id()}">${n.data('label') || n.id()}</option>`)
        .sort()
        .join('');

    connectionsList.innerHTML = `
        <div id="editConnectionsList">${connectionsHtml}</div>
        ${createAddConnection(optionsHtml)}
    `;
};

const renderEditableFields = (): void => {
    const { panelContent } = getElements();
    if (!panelContent) return;

    panelContent.querySelectorAll<HTMLElement>('.info-value[data-key]').forEach(el => {
        const key = el.dataset.key!;
        const currentVal = originalData[key] || el.textContent || '';
        switch (key) {
            case 'tier':
                el.innerHTML = createTierSelect(parseInt(currentVal, 10) || 4);
                break;
            case 'verified':
                el.innerHTML = createVerifiedToggle(currentVal === 'true');
                break;
            default:
                el.innerHTML = createTextInput(key, currentVal);
        }
    });
};

const renderReadOnlyFields = (): void => {
    const { panelContent } = getElements();
    if (!panelContent) return;

    panelContent.querySelectorAll<HTMLElement>('.info-value[data-key]').forEach(el => {
        const key = el.dataset.key;
        const input = el.querySelector<HTMLInputElement | HTMLSelectElement>('input, select');
        if (!input) return;

        if (key === 'tier' && 'value' in input) {
            const tierVal = parseInt(input.value, 10);
            el.textContent = TIER_LABELS[tierVal] || String(tierVal);
        } else if (key === 'verified' && 'checked' in input) {
            // Re-rendering is handled by showPanel on save, so no need to update the badge here
        } else if ('value' in input) {
            el.textContent = input.value;
        }
    });
};

// --- Main Toggle Function ---

export const toggleEdit = (editing: boolean): void => {
    removeEditModeListeners();
    const { panelContent, editBtn, editActions, saveBtn } = getElements();
    if (!panelContent || !currentSelectedNode) return;

    if (editing) {
        renderEditableFields();
        refreshConnectionsList();
        attachEditModeListeners();
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } else {
        renderReadOnlyFields();
    }

    editBtn?.classList.toggle('hidden', editing);
    editActions?.classList.toggle('hidden', !editing);
};
