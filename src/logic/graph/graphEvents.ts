import { NodeSingular, EventObject } from 'cytoscape';
import { showPanel, hidePanel } from '../ui/panel';
import { getNodesAtDepth } from './graphUtils';
import { CyInstance } from '../../types';
import { saveGraphData } from '../core/storage';
import { showToast } from '../ui/ui';

interface CytoscapeEventWithOriginal extends EventObject {
    originalEvent?: MouseEvent;
}

/**
 * Graph interaction events and UI feedback
 */
export const initGraphEvents = (cy: CyInstance): void => {
    if (!cy) return;

    let lastFocusedNode: NodeSingular | null = null;
    let contextMenuNode: NodeSingular | null = null;
    const contextMenuId = 'nodeContextMenu';
    const toggleVerifiedId = 'toggleVerifiedBtn';
    const CONTEXT_MENU_VIEWPORT_PADDING = 8;
    let globalClickListenerAdded = false;

    const ensureContextMenu = (): HTMLElement => {
        let menu = document.getElementById(contextMenuId) as HTMLElement | null;
        if (menu) return menu;

        menu = document.createElement('div');
        menu.id = contextMenuId;
        menu.className = 'hidden absolute z-50 min-w-[160px] bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-200';
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
                saveGraphData(cy.elements().jsons() as any);
                showToast(`${contextMenuNode.data('name') || contextMenuNode.id()} ${newState ? 'marked' : 'unmarked'} as verified`, 'success');
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
        closeContextMenu();
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
            closeContextMenu();
            hidePanel();
            cy.nodes().unselect();
            cy.elements().removeClass('dimmed edge-inbound edge-outbound');
            lastFocusedNode = null;
        }
    });

    cy.on('cxttap', 'node', (evt: EventObject) => {
        const node = evt.target as NodeSingular;
        const eventWithOriginal = evt as CytoscapeEventWithOriginal;
        eventWithOriginal.originalEvent?.preventDefault();
        contextMenuNode = node;

        const menu = ensureContextMenu();
        const toggleBtn = menu.querySelector(`#${toggleVerifiedId} [data-role="toggle-verified-text"]`) as HTMLElement | null;
        if (toggleBtn) {
            toggleBtn.textContent = node.data('verified') ? 'Unmark verified' : 'Mark verified';
        }

        menu.classList.remove('hidden');

        const { clientX, clientY } = eventWithOriginal.originalEvent || { clientX: 0, clientY: 0 };
        let left = clientX;
        let top = clientY;

        if (!eventWithOriginal.originalEvent && node.renderedPosition) {
            const rendered = node.renderedPosition();
            const container = cy.container?.() || document.body;
            const rect = container.getBoundingClientRect();
            left = rect.left + rendered.x;
            top = rect.top + rendered.y;
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        const menuRect = menu.getBoundingClientRect();
        const maxLeft = window.innerWidth - menuRect.width - CONTEXT_MENU_VIEWPORT_PADDING;
        const maxTop = window.innerHeight - menuRect.height - CONTEXT_MENU_VIEWPORT_PADDING;
        if (left > maxLeft) menu.style.left = `${Math.max(CONTEXT_MENU_VIEWPORT_PADDING, maxLeft)}px`;
        if (top > maxTop) menu.style.top = `${Math.max(CONTEXT_MENU_VIEWPORT_PADDING, maxTop)}px`;
    });

    cy.on('cxttap', (evt: EventObject) => {
        if (evt.target === cy) {
            closeContextMenu();
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

    if (!globalClickListenerAdded) {
        document.addEventListener('click', () => {
            closeContextMenu();
        });
        globalClickListenerAdded = true;
    }
};
