/**
 * Returns a collection of nodes and edges within the specified depth from the source node.
 * 
 * @param {object} sourceNode - The starting Cytoscape node
 * @param {string|number} depth - 'all' or a number representing depth
 * @param {object} cy - Cytoscape instance (needed for 'all' mode context if node is isolated, though node.cy() usually works)
 * @returns {object} Cytoscape collection of highlighted elements
 */
export const getNodesAtDepth = (sourceNode, depth, cy) => {
    if (!sourceNode) return null; // or empty collection?

    // Safety check if sourceNode is a collection or single element
    let highlightCollection = sourceNode;

    if (depth === 'all') {
        if (!cy && typeof sourceNode.cy === 'function') {
            cy = sourceNode.cy();
        }
        if (cy) {
            const components = cy.elements().components();
            const component = components.find(c => c.contains(sourceNode));
            if (component) highlightCollection = component;
        }
    } else {
        const depthNum = parseInt(depth, 10);
        // We iterate N times extending the neighborhood
        for (let i = 0; i < depthNum; i++) {
            highlightCollection = highlightCollection.union(highlightCollection.neighborhood());
        }
    }

    return highlightCollection;
};
