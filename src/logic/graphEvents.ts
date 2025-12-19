import { NodeSingular, EventObject } from 'cytoscape';
import { showPanel, hidePanel } from './panel';
import { getNodesAtDepth } from './graphUtils';
import { saveGraphData } from './storage';
import { showToast } from './ui';
import { populateLabelFilter, populateTeamFilter } from './filters';
import { CyInstance } from '../types';

/**
 * Graph interaction events and UI feedback
 */
export const initGraphEvents = (cy: CyInstance): void => {
    if (!cy) return;

    const highlightConnections = (node: NodeSingular) => {
        const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement | null;
        const depthVal = depthSelect?.value || '1';
        const highlightCollection = getNodesAtDepth(node, depthVal, cy);

        cy.elements().addClass('dimmed');
        highlightCollection.removeClass('dimmed');
    };

    cy.on('tap', 'node', (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        showPanel(node);
        highlightConnections(node);
    });

    cy.on('tap', (evt: EventObject) => {
        if (evt.target === cy) {
            hidePanel();
            cy.elements().removeClass('dimmed');
        }
    });

    // Right-click to toggle verified state
    cy.on('cxttap', 'node', (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        const isVerified = node.hasClass('verified');
        const nodeName = node.data('name') || node.data('label') || node.id();

        // Get current labels array
        let labels: string[] = node.data('labels') || [];
        labels = Array.isArray(labels) ? [...labels] : [];

        if (isVerified) {
            node.removeClass('verified');
            node.data('verified', false);
            // Remove 'Verified' from labels
            labels = labels.filter(l => l !== 'Verified');
            showToast(`Unverified: ${nodeName}`, 'info');
        } else {
            node.addClass('verified');
            node.data('verified', true);
            // Add 'Verified' to labels if not present
            if (!labels.includes('Verified')) {
                labels.push('Verified');
            }
            showToast(`Verified: ${nodeName}`, 'success');
        }

        // Update labels data
        node.data('labels', labels);
        node.data('labelsDisplay', labels.join(', '));

        // Save the change
        const elements = cy.elements().jsons();
        saveGraphData(elements as any);

        // Refresh filter panels
        populateLabelFilter(cy.nodes().toArray());
        populateTeamFilter(cy.nodes().toArray());

        // Refresh panel if this node is selected
        showPanel(node);
    });

    // Depth select interaction
    const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement | null;
    if (depthSelect && depthSelect.parentNode) {
        // Simple way to ensure only one listener
        const newSelect = depthSelect.cloneNode(true) as HTMLSelectElement;
        depthSelect.parentNode.replaceChild(newSelect, depthSelect);

        newSelect.addEventListener('change', () => {
            const selected = cy.nodes(':selected');
            if (selected.length > 0) {
                highlightConnections(selected[0]);
            }
        });
    }

    // Tooltip Logic
    const tooltip = document.getElementById('graphTooltip');
    if (tooltip) {
        cy.on('mouseover', 'node', (evt: EventObject) => {
            const node = evt.target as NodeSingular;
            const label = node.data('name') || node.data('label') || node.id();
            tooltip.textContent = label;

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
