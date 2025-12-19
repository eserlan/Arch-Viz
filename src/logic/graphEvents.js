/**
 * Graph interaction events and UI feedback
 */
import { showPanel, hidePanel } from './panel';
import { getNodesAtDepth } from './graphUtils';

export const initGraphEvents = (cy) => {
    if (!cy) return;

    const highlightConnections = (node) => {
        const depthVal = document.getElementById('depthSelect')?.value || '1';
        const highlightCollection = getNodesAtDepth(node, depthVal, cy);

        cy.elements().addClass('dimmed');
        highlightCollection.removeClass('dimmed');
    };

    cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        showPanel(node);
        highlightConnections(node);
    });

    cy.on('tap', (evt) => {
        if (evt.target === cy) {
            hidePanel();
            cy.elements().removeClass('dimmed');
        }
    });

    // Depth select interaction
    const depthSelect = document.getElementById('depthSelect');
    if (depthSelect) {
        // Simple way to ensure only one listener
        const newSelect = depthSelect.cloneNode(true);
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
        cy.on('mouseover', 'node', (evt) => {
            const node = evt.target;
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
