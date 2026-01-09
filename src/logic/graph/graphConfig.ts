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
            'label': 'data(labelDisplay)',
        },
    },
    {
        selector: '.is-database',
        style: {
            'shape': 'barrel',
            'border-style': 'double',
            'border-width': 4,
            // Ellipse lines to simulate a stacked cylinder (DB) look
            'background-image': 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Cellipse%20cx%3D%2250%22%20cy%3D%2215%22%20rx%3D%2245%22%20ry%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.4)%22%20stroke-width%3D%222%22%2F%3E%3Cellipse%20cx%3D%2250%22%20cy%3D%2250%22%20rx%3D%2245%22%20ry%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.25)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E',
            'background-fit': 'cover',
        } as any,
    },
    {
        selector: '.is-queue',
        style: {
            'shape': 'barrel',
            'border-style': 'dashed',
            'border-width': 3,
            // Horizontal lines for queue/stream effect
            'background-image': 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Cpath%20d%3D%22M15%2040%20L85%2040%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.4)%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%225%2C3%22%2F%3E%3Cpath%20d%3D%22M15%2060%20L85%2060%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.4)%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%225%2C3%22%2F%3E%3Cpath%20d%3D%22M70%2030%20L85%2050%20L70%2070%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.5)%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E',
            'background-fit': 'cover',
            'background-color': '#7c3aed',
            'border-color': '#a78bfa',
        } as any,
    },
    {
        selector: '.tier-1',
        style: {
            'background-color': '#CB854D',
            'border-color': '#E2B186',
            'font-weight': 'bold',
        },
    },
    {
        selector: '.tier-2',
        style: {
            'background-color': '#607D8B',
            'border-color': '#9FB0B8',
        },
    },
    {
        selector: '.tier-3',
        style: {
            'background-color': '#8A9A5B',
            'border-color': '#C0CBA0',
        },
    },
    {
        selector: '.tier-4',
        style: {
            'background-color': '#DBC6A4',
            'border-color': '#E8D9C2',
        },
    },
    {
        selector: '.is-verified',
        style: {
            'border-color': '#94a3b8',
            'border-width': 4,
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
        selector: 'edge.edge-outbound',
        style: {
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
        } as any,
    },
    {
        selector: 'edge.edge-inbound',
        style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
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
        selector: ':parent',
        style: {
            'shape': 'roundrectangle',
            'background-color': '#1e293b',
            'background-opacity': 0.7,
            'border-color': '#475569',
            'border-width': 2,
            'border-style': 'dashed',
            'padding': '30px',
            'text-valign': 'top',
            'text-halign': 'center',
            'font-size': 14,
            'font-weight': 'bold',
            'color': '#94a3b8',
            'text-margin-y': 10,
        } as any,
    },
    {
        selector: '.team-group',
        style: {
            'label': 'data(label)',
        } as any,
    },
];
