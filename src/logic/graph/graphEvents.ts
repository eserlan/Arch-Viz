import { NodeSingular, EventObject } from 'cytoscape';
import { showPanel, hidePanel } from '../ui/panel';
import { getNodesAtDepth } from './graphUtils';
import { CyInstance } from '../../types';
import { saveGraphData } from '../core/storage';
import { showToast } from '../ui/ui';
import { updateSelectionInfo } from '../ui/selectionInfo';
import { populateLabelFilter } from './filters';
import { runLayout } from './layoutManager';

interface CytoscapeEventWithOriginal extends EventObject {
    originalEvent?: MouseEvent;
}

/**
 * Graph interaction events and UI feedback
 */
export const initGraphEvents = (cy: CyInstance): (() => void) => {
    if (!cy) return () => {};

    let lastFocusedNode: NodeSingular | null = null;
    let contextMenuNode: NodeSingular | null = null;
    const contextMenuId = 'nodeContextMenu';
    const toggleVerifiedId = 'toggleVerifiedBtn';
    const CONTEXT_MENU_VIEWPORT_PADDING = 8;

    const ensureContextMenu = (): HTMLElement => {
        let menu = document.getElementById(contextMenuId) as HTMLElement | null;
        if (menu) return menu;

        menu = document.createElement('div');
        menu.id = contextMenuId;
        menu.className =
            'hidden absolute z-50 min-w-[160px] bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-200';
        menu.innerHTML = `
            <button id="${toggleVerifiedId}" class="w-full px-3 py-2 text-left hover:bg-slate-800 transition-colors flex items-center gap-2">
                <span data-role="toggle-verified-text">Mark verified</span>
            </button>
        `;
        document.body.appendChild(menu);

        menu.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        menu.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        const toggleBtn = menu.querySelector(`#${toggleVerifiedId}`) as HTMLButtonElement | null;
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (!contextMenuNode) return;
                const newState = !contextMenuNode.data('verified');
                contextMenuNode.data('verified', newState);
                contextMenuNode.toggleClass('is-verified', newState);

                let labels = contextMenuNode.data('labels');
                if (!Array.isArray(labels)) {
                    labels = [];
                }
                labels = [...labels];

                if (newState) {
                    if (!labels.includes('Verified')) {
                        labels.push('Verified');
                    }
                } else {
                    labels = labels.filter((l: string) => l !== 'Verified');
                }
                contextMenuNode.data('labels', labels);
                contextMenuNode.data('labelsDisplay', labels.join(', '));

                const labelClasses = labels.map(
                    (d: string) => `label-${d.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                );
                const currentClasses = contextMenuNode.classes();
                const classArray = Array.isArray(currentClasses)
                    ? currentClasses
                    : currentClasses.split(/\s+/).filter(Boolean);
                const filteredClasses = classArray.filter((c) => !c.startsWith('label-'));
                contextMenuNode.classes([...filteredClasses, ...labelClasses]);

                saveGraphData(cy.elements().jsons() as any);
                populateLabelFilter(cy.nodes().toArray());
                showToast(
                    `${contextMenuNode.data('name') || contextMenuNode.id()} ${newState ? 'marked' : 'unmarked'} as verified`,
                    'success'
                );
                closeContextMenu();
            });
        }

        return menu;
    };

    const closeContextMenu = (): void => {
        const menu = document.getElementById(contextMenuId);
        if (menu) {
            menu.classList.add('hidden');
        }
        contextMenuNode = null;
    };

    const highlightConnections = (nodes: NodeSingular | NodeSingular[]) => {
        const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement | null;
        const depthVal = depthSelect?.value || '1';

        // Normalize to array
        const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
        if (nodeArray.length === 0) return;

        // First dim everything
        cy.elements().addClass('dimmed');
        cy.elements().removeClass('edge-inbound edge-outbound');

        // Accumulate highlights from all nodes
        nodeArray.forEach((node) => {
            const highlightCollection = getNodesAtDepth(node, depthVal, cy);
            highlightCollection.removeClass('dimmed');

            // Add edge styling for this node's connections
            node.outgoers('edge').addClass('edge-outbound');
            node.incomers('edge').addClass('edge-inbound');
        });
    };

    const getHighlightTarget = (): NodeSingular | null => {
        const selected = cy.nodes(':selected');
        if (selected.length > 0) {
            return selected[0];
        }
        return lastFocusedNode;
    };

    let nodeWasSelectedOnTapStart = false;

    const handleTapStart = (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        nodeWasSelectedOnTapStart = node.selected();
    };

    const handleTapNode = (evt: EventObject, extraData?: any) => {
        const node = evt.target as NodeSingular;
        closeContextMenu();
        const originalEvent = extraData?.originalEvent || evt.originalEvent;
        const isMultiSelect = Boolean(originalEvent?.ctrlKey || originalEvent?.metaKey);

        setTimeout(() => {
            if (isMultiSelect) {
                if (nodeWasSelectedOnTapStart) {
                    node.unselect();
                } else {
                    node.select();
                }
            } else {
                cy.nodes().unselect();
                node.select();
            }

            updateSelectionInfo(cy);

            const selectedNodes = cy.nodes(':selected');
            if (selectedNodes.length > 0) {
                const targetNode = node.selected() ? node : selectedNodes[0];
                lastFocusedNode = targetNode;
                showPanel(targetNode);
                highlightConnections(selectedNodes.toArray());

                // If in concentric layout, re-run layout to center on the new selection
                const layoutSelect = document.getElementById(
                    'layoutSelect'
                ) as HTMLSelectElement | null;
                if (layoutSelect && layoutSelect.value === 'concentric') {
                    runLayout(cy, 'concentric');
                }
            } else {
                lastFocusedNode = null;
                hidePanel();
                cy.elements().removeClass('dimmed edge-inbound edge-outbound');
            }
        }, 0);
    };

    const handleTapCy = (evt: EventObject) => {
        if (evt.target === cy) {
            closeContextMenu();
            hidePanel();
            cy.nodes().unselect();
            updateSelectionInfo(cy);
            cy.elements().removeClass('dimmed edge-inbound edge-outbound');
            lastFocusedNode = null;
        }
    };

    const handleCxtTapNode = (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        const eventWithOriginal = evt as CytoscapeEventWithOriginal;
        eventWithOriginal.originalEvent?.preventDefault();
        contextMenuNode = node;

        const menu = ensureContextMenu();
        const toggleBtn = menu.querySelector(
            `#${toggleVerifiedId} [data-role="toggle-verified-text"]`
        ) as HTMLElement | null;
        if (toggleBtn) {
            toggleBtn.textContent = node.data('verified') ? 'Unmark verified' : 'Mark verified';
        }

        menu.classList.remove('hidden');

        const rendered = node.renderedPosition();
        const container = cy.container?.() || document.body;
        const rect = container.getBoundingClientRect();
        let left = rect.left + rendered.x;
        let top = rect.top + rendered.y;

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        const menuRect = menu.getBoundingClientRect();
        left -= menuRect.width / 2;
        top -= menuRect.height / 2;

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        const maxLeft = window.innerWidth - menuRect.width - CONTEXT_MENU_VIEWPORT_PADDING;
        const maxTop = window.innerHeight - menuRect.height - CONTEXT_MENU_VIEWPORT_PADDING;
        if (left > maxLeft)
            menu.style.left = `${Math.max(CONTEXT_MENU_VIEWPORT_PADDING, maxLeft)}px`;
        if (top > maxTop) menu.style.top = `${Math.max(CONTEXT_MENU_VIEWPORT_PADDING, maxTop)}px`;
        if (left < CONTEXT_MENU_VIEWPORT_PADDING)
            menu.style.left = `${CONTEXT_MENU_VIEWPORT_PADDING}px`;
        if (top < CONTEXT_MENU_VIEWPORT_PADDING)
            menu.style.top = `${CONTEXT_MENU_VIEWPORT_PADDING}px`;
    };

    const handleCxtTapCy = (evt: EventObject) => {
        if (evt.target === cy) {
            closeContextMenu();
        }
    };

    cy.on('tapstart', 'node', handleTapStart);
    cy.on('tap', 'node', handleTapNode);
    cy.on('tap', handleTapCy);
    cy.on('cxttap', 'node', handleCxtTapNode);
    cy.on('cxttap', handleCxtTapCy);

    // Depth select interaction
    const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement | null;
    let actualSelectForCleanup: HTMLSelectElement | null = null;
    let depthChangeListener: (() => void) | undefined;
    if (depthSelect && depthSelect.parentNode) {
        const newSelect = depthSelect.cloneNode(true) as HTMLSelectElement;
        depthSelect.parentNode.replaceChild(newSelect, depthSelect);
        actualSelectForCleanup = newSelect;

        depthChangeListener = () => {
            const highlightTarget = getHighlightTarget();
            if (highlightTarget) {
                highlightConnections(highlightTarget);
            }
        };
        newSelect.addEventListener('change', depthChangeListener);
    }

    // Tooltip Logic
    const tooltip = document.getElementById('graphTooltip');
    const handleMouseOver = (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        const name = node.data('name') || node.data('label') || node.id();
        const labels = node.data('labels') || [];
        const labelsText = Array.isArray(labels) && labels.length > 0 ? labels.join(', ') : '';

        if (tooltip) {
            tooltip.innerHTML = labelsText
                ? `<strong>${name}</strong><br><span class="text-slate-400 text-[10px]">${labelsText}</span>`
                : `<strong>${name}</strong>`;

            const pos = node.renderedPosition();
            tooltip.style.left = `${pos.x}px`;
            tooltip.style.top = `${pos.y - 20}px`;
            tooltip.style.transform = 'translate(-50%, -100%)';
            tooltip.style.opacity = '1';
        }
    };

    const handleMouseOut = () => {
        if (tooltip) tooltip.style.opacity = '0';
    };

    const handleViewport = () => {
        if (tooltip) tooltip.style.opacity = '0';
    };

    cy.on('mouseover', 'node', handleMouseOver);
    cy.on('mouseout', 'node', handleMouseOut);
    cy.on('viewport', handleViewport);

    const handleGlobalClick = () => {
        closeContextMenu();
    };
    document.addEventListener('click', handleGlobalClick);

    return () => {
        document.removeEventListener('click', handleGlobalClick);
        if (actualSelectForCleanup && depthChangeListener) {
            actualSelectForCleanup.removeEventListener('change', depthChangeListener);
        }
        cy.off('tapstart', 'node', handleTapStart);
        cy.off('tap', 'node', handleTapNode);
        cy.off('tap', handleTapCy);
        cy.off('cxttap', 'node', handleCxtTapNode);
        cy.off('cxttap', handleCxtTapCy);
        cy.off('mouseover', 'node', handleMouseOver);
        cy.off('mouseout', 'node', handleMouseOut);
        cy.off('viewport', handleViewport);
    };
};
