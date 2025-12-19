export const layoutConfig = {
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

export const stylesheet = [
  {
    selector: 'core',
    style: {
      'selection-box-color': '#22c55e',
      'selection-box-border-color': '#22c55e',
      'selection-box-opacity': 0.15,
    },
  },
  {
    selector: 'node',
    style: {
      'background-color': '#2563eb',
      'border-color': '#93c5fd',
      'border-width': 2,
      'label': 'data(label)',
      'color': '#e2e8f0',
      'font-size': 12,
      'text-wrap': 'wrap',
      'text-max-width': 120,
      'text-valign': 'center',
      'text-halign': 'center',
      'padding': '8px',
      'shape': 'ellipse',
    },
  },
  {
    selector: '.is-database',
    style: {
      'shape': 'barrel',
      'border-style': 'solid',
      'border-width': 3,
      // Add two horizontal lines to simulate a stacked cylinder look
      'background-image': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><line x1="0" y1="33" x2="100" y2="33" stroke="rgba(255,255,255,0.3)" stroke-width="2"/><line x1="0" y1="66" x2="100" y2="66" stroke="rgba(255,255,255,0.3)" stroke-width="2"/></svg>',
      'background-fit': 'cover',
      'padding': '12px',
    },
  },
  {
    selector: '.tier-1',
    style: {
      'background-color': '#f97316',
      'border-color': '#fdba74',
      'font-weight': '700',
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
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-color': '#22c55e',
      'border-width': 4,
      'shadow-blur': 15,
      'shadow-color': '#22c55e',
      'shadow-opacity': 0.6,
      'shadow-offset-x': 0,
      'shadow-offset-y': 0,
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
];
