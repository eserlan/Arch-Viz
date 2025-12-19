// Cytoscape graph configuration

export const layoutConfig: any = {
    name: 'fcose',
    quality: 'default',
    randomize: false,
    animate: false,
    nodeDimensionsIncludeLabels: true,
    nodeRepulsion: 4500,
    idealEdgeLength: 100,
    edgeElasticity: 0.45,
    nestingFactor: 0.1,
    numIter: 2500,
    fit: true,
    padding: 100,
};

export const stylesheet: any[] = [
    {
        selector: 'core',
        style: {
            'selection-box-color': '#22c55e',
            'selection-box-border-color': '#22c55e',
            'selection-box-opacity': 0.15,
        } as any,
    },
    {
        selector: 'node',
        style: {
            'background-color': '#2563eb',
            'border-color': '#93c5fd',
            'border-width': 2,
            'color': '#e2e8f0',
            'font-size': 12,
            'text-wrap': 'wrap',
            'text-max-width': 120,
            'text-valign': 'center',
            'text-halign': 'center',
            'padding': '8px',
            'shape': 'ellipse',
            'transition-property': 'background-color, border-color, opacity',
            'transition-duration': '0.3s',
            'transition-timing-function': 'ease-in-out',
        },
    },
    {
        selector: 'node[label]',
        style: {
            'label': 'data(label)',
        },
    },
    {
        selector: '.is-database',
        style: {
            'shape': 'barrel',
            'border-style': 'solid',
            'border-width': 3,
            // Add two horizontal lines to simulate a stacked cylinder look
            'background-image': 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Cline%20x1%3D%220%22%20y1%3D%2233%22%20x2%3D%22100%22%20y2%3D%2233%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.3)%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%220%22%20y1%3D%2266%22%20x2%3D%22100%22%20y2%3D%2266%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.3)%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E',
            'background-fit': 'cover',
            'padding': '12px',
        } as any,
    },
    {
        selector: '.tier-1',
        style: {
            'background-color': '#f97316',
            'border-color': '#fdba74',
            'font-weight': 'bold',
        },
    },
    {
        selector: '.tier-2',
        style: {
            'background-color': '#0ea5e9',
            'border-color': '#7dd3fc',
        },
    },
    {
        selector: '.tier-3',
        style: {
            'background-color': '#10b981',
            'border-color': '#6ee7b7',
        },
    },
    {
        selector: 'edge',
        style: {
            'width': 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#cbd5e1',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.85,
            'transition-property': 'line-color, target-arrow-color, opacity, width',
            'transition-duration': '0.3s',
            'transition-timing-function': 'ease-in-out',
        } as any,
    },
    {
        selector: 'node:selected',
        style: {
            'border-color': '#22c55e',
            'border-width': 4,
        },
    },
    {
        selector: 'edge:selected',
        style: {
            'line-color': '#22c55e',
            'target-arrow-color': '#22c55e',
            'width': 4,
        },
    },
    {
        selector: '.dimmed, .filtered',
        style: {
            'opacity': 0.15,
            'text-opacity': 0,
        },
    },
    {
        selector: '.verified',
        style: {
            'border-width': 6,
            'border-color': '#334155',
            'border-style': 'solid',
        } as any,
    },
];
