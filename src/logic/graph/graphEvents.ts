import { NodeSingular, EventObject } from 'cytoscape';
import { showPanel, hidePanel } from '../ui/panel';
import { getNodesAtDepth } from './graphUtils';
import { saveGraphData } from '../core/storage';
import { showToast } from '../ui/ui';
import { populateLabelFilter, populateTeamFilter } from './filters';
import { getNodeLabelDisplay } from './labelDisplay';
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

    // Right-click context menu
    cy.on('cxttap', 'node', (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        const contextMenu = document.getElementById('contextMenu');
        const checkIcon = document.getElementById('ctxVerifiedCheck');
        const verifiedBtn = document.getElementById('ctxVerifiedBtn');

        if (!contextMenu || !checkIcon || !verifiedBtn) return;

        // Position menu
        const eventWithOriginal = evt as CytoscapeEventWithOriginal;
        const x = eventWithOriginal.originalEvent?.clientX ?? 0;
        const y = eventWithOriginal.originalEvent?.clientY ?? 0;

        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');

        // Update verified status in menu
        const isVerified = node.hasClass('verified');
        if (isVerified) {
            checkIcon.classList.remove('opacity-0');
        } else {
            checkIcon.classList.add('opacity-0');
        }

        // Handle click on verified button
        const handleVerifyClick = (e: Event) => {
            e.stopPropagation();

            const nodeName = node.data('name') || node.data('label') || node.id();
            let labels: string[] = node.data('labels') || [];
            labels = Array.isArray(labels) ? [...labels] : [];
            const nextVerified = !isVerified;

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

            // Update labels data
            node.data('labels', labels);
            node.data('labelsDisplay', labels.join(', '));
            node.data('labelDisplay', getNodeLabelDisplay(nodeName, nextVerified));

            // Save the change
            const elements = cy.elements().jsons();
            saveGraphData(elements as any);

            // Refresh filter panels
            populateLabelFilter(cy.nodes().toArray());
            populateTeamFilter(cy.nodes().toArray());

            // Refresh panel if this node is selected
            showPanel(node);

            // Hide menu and clean up
            contextMenu.classList.add('hidden');
            verifiedBtn.removeEventListener('click', handleVerifyClick);
        };

        // One-time listener for this menu opening
        // We clone the button to remove old listeners effectively
        const newVerifiedBtn = verifiedBtn.cloneNode(true);
        verifiedBtn.parentNode?.replaceChild(newVerifiedBtn, verifiedBtn);
        newVerifiedBtn.addEventListener('click', handleVerifyClick);
    });

    // Close context menu on any tap or viewport interaction
    cy.on('tap', () => {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) contextMenu.classList.add('hidden');
    });

    cy.on('viewport', () => {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) contextMenu.classList.add('hidden');
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
