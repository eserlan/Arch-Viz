import { CyInstance } from '../../types';

/**
 * Updates the selection info panel with the current selection count
 */
export const updateSelectionInfo = (cy: CyInstance): void => {
    const countElement = document.getElementById('selectedServicesCount');
    if (!countElement) return;

    const selectedNodes = cy.nodes(':selected');
    const count = selectedNodes.length;

    countElement.textContent = count.toString();
};

/**
 * Initializes the selection info panel listeners
 */
export const initSelectionInfo = (cy: CyInstance): void => {
    if (!cy || cy === null) return;

    // Update on selection/unselection
    cy.on('select unselect', 'node', () => {
        updateSelectionInfo(cy);
    });

    // Initialize with current state
    updateSelectionInfo(cy);
};
