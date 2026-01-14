import { CyInstance } from '../../../types';
import { saveGraphData } from '../../core/storage';
import { deleteNode } from '../../graph/nodeOperations';
import { populateLabelFilter, populateTeamFilter } from '../../graph/filters';
import {
    getElements,
    getCurrentSelectedNode,
    getCyRef,
    getUpdateStatusRef,
    getOriginalData,
    setCyRef,
    setUpdateStatusRef
} from './state';
import { showPanel, hidePanel } from './display';
import { toggleEdit } from './edit';
import { registerPanelKeyListener } from './keyboard';
import { getNodeLabelDisplay } from '../../graph/labelDisplay';

const normalizeClassList = (classes: string | string[]): string[] => {
    if (Array.isArray(classes)) {
        return classes;
    }
    return classes.split(/\s+/).filter(Boolean);
};

const syncVerifiedLabel = (labels: string[], isVerified: boolean): string[] => {
    const nextLabels = [...labels];
    const hasVerified = nextLabels.includes('Verified');
    if (isVerified && !hasVerified) {
        nextLabels.push('Verified');
    }
    if (!isVerified && hasVerified) {
        return nextLabels.filter(label => label !== 'Verified');
    }
    return nextLabels;
};

const applyLabelClasses = (labels: string[], currentSelectedNode: ReturnType<typeof getCurrentSelectedNode>): void => {
    if (!currentSelectedNode) return;
    const newLabelClasses = labels.map((d: string) => `label-${d.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    const currentClasses = currentSelectedNode.classes();
    const classArray = normalizeClassList(currentClasses);
    const filteredClasses = classArray.filter(c => !c.startsWith('label-'));
    currentSelectedNode.classes([...filteredClasses, ...newLabelClasses]);
};

export const updateSaveButtonState = (): void => {
    const { saveBtn, panelContent } = getElements();
    if (!saveBtn || !panelContent) return;

    const inputs = panelContent.querySelectorAll('input[data-key], select[data-key]');
    let isDirty = false;

    inputs.forEach(input => {
        const el = input as HTMLInputElement | HTMLSelectElement;
        const key = el.dataset.key;
        const currentValue = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
        if (key && getOriginalData()[key] !== currentValue) {
            isDirty = true;
        }
    });

    saveBtn.disabled = !isDirty;
    saveBtn.classList.toggle('opacity-50', !isDirty);
    saveBtn.classList.toggle('cursor-not-allowed', !isDirty);
};

export const handleSave = (): void => {
    const currentSelectedNode = getCurrentSelectedNode();
    const cyRef = getCyRef();
    const updateStatusRef = getUpdateStatusRef();
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
            newData[key] = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
        }
    });

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

    const displayName = newData.name || currentSelectedNode.data('name') || currentSelectedNode.data('label') || currentSelectedNode.id();
    newData.labelDisplay = getNodeLabelDisplay(displayName);

    let labelsList: string[] | undefined;

    // Handle 'labels' field - parse semicolon or comma separated values and update classes
    if (Array.isArray(newData.labels)) {
        labelsList = newData.labels;
        newData.labelsDisplay = labelsList.join(', ');
    } else if (typeof newData.labels === 'string') {
        labelsList = newData.labels.split(/[;,]/).map((d: string) => d.trim()).filter(Boolean);
        newData.labelsDisplay = labelsList.join(', ');
        newData.labels = labelsList;
    }

    if (typeof newData.verified === 'boolean') {
        currentSelectedNode.toggleClass('is-verified', newData.verified);
        const baseLabels = labelsList ?? (currentSelectedNode.data('labels') || []);
        labelsList = syncVerifiedLabel(baseLabels, newData.verified);
        newData.labels = labelsList;
        newData.labelsDisplay = labelsList.join(', ');
    }

    if (labelsList !== undefined) {
        applyLabelClasses(labelsList, currentSelectedNode);
    }

    // Update node data
    currentSelectedNode.data(newData);

    // Save to localStorage
    const elements = cyRef.elements().jsons();
    saveGraphData(elements as any);

    // Refresh filter panels with new labels/teams
    populateLabelFilter(cyRef.nodes().toArray());
    populateTeamFilter(cyRef.nodes().toArray());

    if (updateStatusRef) {
        updateStatusRef(`Saved changes to ${newData.name || newData.label || currentSelectedNode.id()}`);
    }

    // Refresh panel to show saved state
    showPanel(currentSelectedNode);
};

export const initPanel = (cy: CyInstance, updateStatus: (msg: string) => void): void => {
    // Update module-level references every time
    setCyRef(cy);
    setUpdateStatusRef(updateStatus);

    // Register keyboard listener once
    registerPanelKeyListener();

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
            const currentSelectedNode = getCurrentSelectedNode();
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
            const currentSelectedNode = getCurrentSelectedNode();
            const updateStatusRef = getUpdateStatusRef();
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
