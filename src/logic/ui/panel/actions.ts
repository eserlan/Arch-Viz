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

export const updateSaveButtonState = (): void => {
    const { saveBtn, panelContent } = getElements();
    if (!saveBtn || !panelContent) return;

    const inputs = panelContent.querySelectorAll('input[data-key], select[data-key]');
    let isDirty = false;

    inputs.forEach(input => {
        const el = input as HTMLInputElement | HTMLSelectElement;
        const key = el.dataset.key;
        if (key && getOriginalData()[key] !== el.value) {
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
            if (el.type === 'checkbox') {
                newData[key] = (el as HTMLInputElement).checked;
            } else {
                newData[key] = el.value;
            }
        }
    });

    // Handle verified toggle - update class and add/remove Verified label
    if (typeof newData.verified === 'boolean') {
        // Get current labels or parse from form input
        let labels: string[] = [];
        if (newData.labels && Array.isArray(newData.labels)) {
            labels = [...newData.labels];
        } else if (newData.labels && typeof newData.labels === 'string') {
            labels = newData.labels.split(/[;,]/).map((d: string) => d.trim()).filter(Boolean);
        } else {
            labels = currentSelectedNode.data('labels') || [];
            labels = Array.isArray(labels) ? [...labels] : [];
        }

        if (newData.verified) {
            currentSelectedNode.addClass('verified');
            if (!labels.includes('Verified')) {
                labels.push('Verified');
            }
        } else {
            currentSelectedNode.removeClass('verified');
            labels = labels.filter(l => l !== 'Verified');
        }

        newData.labels = labels;
        newData.labelsDisplay = labels.join(', ');
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

    // Handle 'labels' field - parse semicolon or comma separated values and update classes
    if (newData.labels && Array.isArray(newData.labels)) {
        const labels = newData.labels;
        const newLabelClasses = labels.map((d: string) => `label-${d.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
        // Get current classes as array, filter out old label classes, add new ones
        const currentClasses = currentSelectedNode.classes();
        const classArray = Array.isArray(currentClasses) ? currentClasses : [];
        const filteredClasses = classArray.filter(c => !c.startsWith('label-'));
        currentSelectedNode.classes([...filteredClasses, ...newLabelClasses]);
    } else if (newData.labels && typeof newData.labels === 'string') {
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
