import { NodeSingular, EventObject } from 'cytoscape';
import { showPanel, hidePanel } from '../ui/panel';
import { getNodesAtDepth } from './graphUtils';
import { CyInstance } from '../../types';

interface CytoscapeEventWithOriginal extends EventObject {
    originalEvent?: MouseEvent;
}

/**
 * Graph interaction events and UI feedback
 */
export const initGraphEvents = (cy: CyInstance): void => {
    if (!cy) return;

    let lastFocusedNode: NodeSingular | null = null;

    const highlightConnections = (node: NodeSingular) => {
        const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement | null;
        const depthVal = depthSelect?.value || '1';
        const highlightCollection = getNodesAtDepth(node, depthVal, cy);

        cy.elements().addClass('dimmed');
        highlightCollection.removeClass('dimmed');

        cy.elements().removeClass('edge-inbound edge-outbound');
        node.outgoers('edge').addClass('edge-outbound');
        node.incomers('edge').addClass('edge-inbound');
    };

    const getHighlightTarget = (): NodeSingular | null => {
        const selected = cy.nodes(':selected');
        if (selected.length > 0) {
            return selected[0];
        }
        return lastFocusedNode;
    };

    cy.on('tap', 'node', (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        const eventWithOriginal = evt as CytoscapeEventWithOriginal;
        
        // Multi-select with Ctrl/Cmd key, otherwise single select
        if (!eventWithOriginal.originalEvent?.ctrlKey && !eventWithOriginal.originalEvent?.metaKey) {
            cy.nodes().unselect();
        }
        
        node.select();
        lastFocusedNode = node;
        showPanel(node);
        highlightConnections(node);
    });

    cy.on('tap', (evt: EventObject) => {
        if (evt.target === cy) {
            hidePanel();
            cy.nodes().unselect();
            cy.elements().removeClass('dimmed edge-inbound edge-outbound');
            lastFocusedNode = null;
        }
    });

    // Depth select interaction
    const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement | null;
    if (depthSelect && depthSelect.parentNode) {
        // Simple way to ensure only one listener
        const newSelect = depthSelect.cloneNode(true) as HTMLSelectElement;
        depthSelect.parentNode.replaceChild(newSelect, depthSelect);

        newSelect.addEventListener('change', () => {
            const highlightTarget = getHighlightTarget();
            if (highlightTarget) {
                highlightConnections(highlightTarget);
            }
        });
    }

    // Tooltip Logic
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
