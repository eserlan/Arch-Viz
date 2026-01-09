import { CyInstance, ServiceData } from '../../types';
import { saveGraphData } from '../core/storage';
import { getShapeClass } from './shapeUtils';
import { getNodeLabelDisplay } from './labelDisplay';

export const addNode = (cy: CyInstance, data: ServiceData): void => {
    if (cy.getElementById(data.id).nonempty()) {
        throw new Error(`Node with ID "${data.id}" already exists.`);
    }

    // Default position: Center of viewport
    const pan = cy.pan();
    const zoom = cy.zoom();
    const width = cy.width() || 0;
    const height = cy.height() || 0;
    const pos = { x: (width / 2 - pan.x) / zoom, y: (height / 2 - pan.y) / zoom };

    // Ensure numeric tier if provided
    const tier = data.tier ? parseInt(data.tier.toString(), 10) : undefined;

    cy.add({
        group: 'nodes',
        data: {
            id: data.id,
            name: data.name,
            tier: tier,
            owner: data.owner,
            label: data.name, // Fallback for display
            labelDisplay: getNodeLabelDisplay(data.name, Boolean(data.verified)),
        },
        classes: `${tier ? `tier-${tier}` : ''} ${getShapeClass(data.id, data.name)}`.trim(),
        position: pos
    });

    saveGraphData(cy.elements().jsons() as any);
};

export const deleteNode = (cy: CyInstance, nodeId: string): boolean => {
    const node = cy.getElementById(nodeId);
    if (node.nonempty()) {
        cy.remove(node);
        saveGraphData(cy.elements().jsons() as any);
        return true;
    }
    return false;
};
