import { CyInstance } from '../../../types';
import { saveGraphData } from '../../core/storage';
import { deleteNode } from '../../graph/nodeOperations';
import { populateLabelFilter, populateTeamFilter } from '../../graph/filters';
import {
    getElements,
    currentSelectedNode,
    cyRef,
    updateStatusRef,
    originalData,
    setCyRef,
    setUpdateStatusRef
} from './state';
import { showPanel, hidePanel } from './display';
import { toggleEdit } from './edit';

const parseLabelsFromString = (labelsStr: string | undefined): string[] => {
    if (typeof labelsStr !== 'string' || !labelsStr) return [];
    return labelsStr.split(/[;,]/).map(d => d.trim()).filter(Boolean);
};

interface NodeUpdateData {
    [key: string]: any;
    name?: string;
    label?: string;
    owner?: string;
    tier?: number;
    labels?: string[];
    labelsDisplay?: string;
    repoUrl?: string;
    verified?: boolean;
}

export const updateSaveButtonState = (): void => {
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

export const handleSave = (): void => {
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
    const formData: { [key: string]: string | boolean } = {};
    inputs.forEach(input => {
        const el = input as HTMLInputElement | HTMLSelectElement;
        const key = el.dataset.key;
        if (key) {
            formData[key] = el.type === 'checkbox' ? (el as HTMLInputElement).checked : el.value;
        }
    });

    const nodeUpdateData: NodeUpdateData = { ...formData };

    let labels = parseLabelsFromString(formData.labels as string | undefined);

    if (typeof formData.verified === 'boolean') {
        const isVerified = formData.verified;
        currentSelectedNode.toggleClass('verified', isVerified);
        const hasVerifiedLabel = labels.includes('Verified');
        if (isVerified && !hasVerifiedLabel) {
            labels.push('Verified');
        } else if (!isVerified && hasVerifiedLabel) {
            labels = labels.filter(l => l !== 'Verified');
        }
    }
    nodeUpdateData.labels = labels;
    nodeUpdateData.labelsDisplay = labels.join(', ');

    if (formData.tier) {
        const tier = parseInt(String(formData.tier), 10);
        nodeUpdateData.tier = tier;
        [1, 2, 3, 4].forEach(t => currentSelectedNode.removeClass(`tier-${t}`));
        currentSelectedNode.addClass(`tier-${tier}`);
    }

    if (formData.name) {
        nodeUpdateData.label = String(formData.name);
    }

    const currentClasses = (currentSelectedNode.classes() as string[]) || [];
    const nonLabelClasses = currentClasses.filter(c => !c.startsWith('label-'));
    const newLabelClasses = labels.map(l => `label-${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    currentSelectedNode.classes([...nonLabelClasses, ...newLabelClasses]);

    currentSelectedNode.data(nodeUpdateData);

    const elements = cyRef.elements().jsons();
    saveGraphData(elements as any);

    populateLabelFilter(cyRef.nodes().toArray());
    populateTeamFilter(cyRef.nodes().toArray());

    if (updateStatusRef) {
        updateStatusRef(`Saved changes to ${nodeUpdateData.name || nodeUpdateData.label || currentSelectedNode.id()}`);
    }

    showPanel(currentSelectedNode);
};

export const initPanel = (cy: CyInstance, updateStatus: (msg: string) => void): void => {
    // Update module-level references every time
    setCyRef(cy);
    setUpdateStatusRef(updateStatus);

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
