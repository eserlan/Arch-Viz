import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import { saveGraphData } from './storage';

cytoscape.use(edgehandles);

let eh = null;
let isEditMode = false;

const edgehandlesDefaults = {
    canConnect: (sourceNode, targetNode) => {
        // Don't allow self-loops
        return sourceNode.id() !== targetNode.id();
    },
    edgeParams: (sourceNode, targetNode) => {
        return {
            data: {
                id: `${sourceNode.id()}-${targetNode.id()}`,
                source: sourceNode.id(),
                target: targetNode.id()
            }
        };
    },
    hoverDelay: 150,
    snap: true,
    snapThreshold: 50,
    snapFrequency: 15,
    noEdgeEventsInDraw: true,
    disableBrowserGestures: true,
};

export const initEdgeEditor = (cy, updateStatus) => {
    eh = cy.edgehandles(edgehandlesDefaults);

    // Listen for new edge creation
    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
        saveGraphData(cy.elements().jsons());
        updateStatus(`Connected ${sourceNode.data('label') || sourceNode.id()} → ${targetNode.data('label') || targetNode.id()}`);
    });
};

export const enableEditMode = (updateStatus) => {
    if (!eh) return;
    eh.enableDrawMode();
    isEditMode = true;
    updateStatus('Edit Mode: Drag from a node to create a connection');
};

export const disableEditMode = (updateStatus) => {
    if (!eh) return;
    eh.disableDrawMode();
    isEditMode = false;
    updateStatus('Edit Mode disabled');
};

export const toggleEditMode = (updateStatus) => {
    if (isEditMode) {
        disableEditMode(updateStatus);
    } else {
        enableEditMode(updateStatus);
    }
    return isEditMode;
};

export const isInEditMode = () => isEditMode;
