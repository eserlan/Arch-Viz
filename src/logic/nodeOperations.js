import { saveGraphData } from './storage';

export const addNode = (cy, data) => {
    if (cy.getElementById(data.id).nonempty()) {
        throw new Error(`Node with ID "${data.id}" already exists.`);
    }

    // Default position: Center of viewport
    const pan = cy.pan();
    const zoom = cy.zoom();
    const width = cy.width();
    const height = cy.height();
    const pos = { x: (width / 2 - pan.x) / zoom, y: (height / 2 - pan.y) / zoom };

    // Ensure numeric tier if provided
    const tier = data.tier ? parseInt(data.tier, 10) : undefined;

    cy.add({
        group: 'nodes',
        data: {
            id: data.id,
            name: data.name,
            tier: tier,
            owner: data.owner,
            label: data.name // Fallback for display
        },
        position: pos
    });

    saveGraphData(cy.elements().jsons());
};

export const deleteNode = (cy, nodeId) => {
    const node = cy.getElementById(nodeId);
    if (node.nonempty()) {
        cy.remove(node);
        saveGraphData(cy.elements().jsons());
        return true;
    }
    return false;
};
