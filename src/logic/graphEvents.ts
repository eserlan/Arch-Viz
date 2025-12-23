import { NodeSingular, EventObject } from 'cytoscape';
import { showPanel, hidePanel } from './panel';
import { getNodesAtDepth } from './graphUtils';
import { saveGraphData } from './storage';
import { showToast } from './ui';
import { populateLabelFilter, populateTeamFilter } from './filters';
import { CyInstance } from '../types';

export const toggleVerifiedState = (node: NodeSingular, cy: CyInstance) => {
    const isVerified = node.hasClass('verified');
    const nodeName = node.data('name') || node.data('label') || node.id();

    let labels: string[] = node.data('labels') || [];
    labels = Array.isArray(labels) ? [...labels] : [];

    if (isVerified) {
        node.removeClass('verified');
        node.data('verified', false);
        labels = labels.filter(l => l !== 'Verified');
        showToast(`Unverified: ${nodeName}`, 'info');
    } else {
        node.addClass('verified');
        node.data('verified', true);
        if (!labels.includes('Verified')) {
            labels.push('Verified');
        }
        showToast(`Verified: ${nodeName}`, 'success');
    }

    node.data('labels', labels);
    node.data('labelsDisplay', labels.join(', '));

    const elements = cy.elements().jsons();
    saveGraphData(elements as any);

    populateLabelFilter(cy.nodes().toArray());
    populateTeamFilter(cy.nodes().toArray());

    showPanel(node);
};

export const initGraphEvents = (cy: CyInstance): void => {
    if (!cy) return;

    const contextMenu = document.getElementById('contextMenu');
    const verifiedToggleBtn = document.getElementById('context-menu-verified-toggle');
    let activeNode: NodeSingular | null = null;

    const hideContextMenu = () => {
        if (contextMenu) contextMenu.classList.add('hidden');
        activeNode = null;
    };

    const highlightConnections = (node: NodeSingular) => {
        const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement | null;
        const depthVal = depthSelect?.value || '1';
        const highlightCollection = getNodesAtDepth(node, depthVal, cy);
        cy.elements().addClass('dimmed');
        highlightCollection.removeClass('dimmed');
    };

    cy.on('tap', 'node', (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        cy.nodes().unselect();
        node.select();
        showPanel(node);
        highlightConnections(node);
        hideContextMenu();
    });

    cy.on('tap', (evt: EventObject) => {
        if (evt.target === cy) {
            hidePanel();
            cy.nodes().unselect();
            cy.elements().removeClass('dimmed');
            hideContextMenu();
        }
    });

    cy.on('cxttap', 'node', (evt: EventObject) => {
        evt.preventDefault();
        activeNode = evt.target as NodeSingular;

        if (contextMenu) {
            contextMenu.style.left = `${evt.renderedPosition.x}px`;
            contextMenu.style.top = `${evt.renderedPosition.y}px`;
            contextMenu.classList.remove('hidden');
        }
    });

    if (verifiedToggleBtn) {
        verifiedToggleBtn.addEventListener('click', () => {
            if (activeNode) {
                toggleVerifiedState(activeNode, cy);
            }
            hideContextMenu();
        });
    }

    const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement | null;
    if (depthSelect && depthSelect.parentNode) {
        const newSelect = depthSelect.cloneNode(true) as HTMLSelectElement;
        depthSelect.parentNode.replaceChild(newSelect, depthSelect);
        newSelect.addEventListener('change', () => {
            const selected = cy.nodes(':selected');
            if (selected.length > 0) {
                highlightConnections(selected[0]);
            }
        });
    }

    const tooltip = document.getElementById('graphTooltip');
    if (tooltip) {
        cy.on('mouseover', 'node', (evt: EventObject) => {
            const node = evt.target as NodeSingular;
            const name = node.data('name') || node.data('label') || node.id();
            const labels = node.data('labels') || [];
            const labelsText = Array.isArray(labels) && labels.length > 0 ? labels.join(', ') : '';

            tooltip.innerHTML = labelsText
                ? `<strong>${name}</strong><br><span class="text-slate-400 text-[10px]">${labelsText}</span>`
                : `<strong>${name}</strong>`;

            const pos = node.renderedPosition();
            tooltip.style.left = `${pos.x}px`;
            tooltip.style.top = `${pos.y - 20}px`;
            tooltip.style.transform = 'translate(-50%, -100%)';
            tooltip.style.opacity = '1';
        });

        cy.on('mouseout', 'node', () => {
            tooltip.style.opacity = '0';
        });

        cy.on('viewport', () => {
            tooltip.style.opacity = '0';
        });
    }
};
