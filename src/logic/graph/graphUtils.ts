import { NodeSingular, Collection, Core } from 'cytoscape';

/**
 * Returns a collection of nodes and edges within the specified depth from the source node.
 *
 * @param sourceNode - The starting Cytoscape node
 * @param depth - 'all' or a number representing depth
 * @param cy - Cytoscape instance
 * @returns Cytoscape collection of highlighted elements
 */
export const getNodesAtDepth = (
    sourceNode: NodeSingular,
    depth: string | number,
    cy: Core
): Collection => {
    if (!sourceNode) return cy.collection();

    // Safety check if sourceNode is a collection or single element
    let highlightCollection: Collection = sourceNode;

    if (depth === 'all') {
        const components = cy.elements().components();
        const component = components.find((c) => c.contains(sourceNode));
        if (component) highlightCollection = component;
    } else {
        const depthNum = typeof depth === 'string' ? parseInt(depth, 10) : depth;
        // We iterate N times extending the neighborhood
        for (let i = 0; i < depthNum; i++) {
            highlightCollection = highlightCollection.union(highlightCollection.neighborhood());
        }
    }

    return highlightCollection;
};
