import cytoscape from 'cytoscape';
// @ts-ignore
import edgehandles from 'cytoscape-edgehandles';
import { saveGraphData } from '../core/storage';
import { CyInstance } from '../../types';
import { NodeSingular, EdgeSingular, EventObject } from 'cytoscape';

cytoscape.use(edgehandles);

let eh: any = null;
let isEditMode = false;

const edgehandlesDefaults = {
    canConnect: (sourceNode: NodeSingular, targetNode: NodeSingular) => {
        // Don't allow self-loops
        return sourceNode.id() !== targetNode.id();
    },
    edgeParams: (sourceNode: NodeSingular, targetNode: NodeSingular) => {
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

export const initEdgeEditor = (cy: CyInstance, updateStatus: (msg: string) => void): void => {
    eh = (cy as any).edgehandles(edgehandlesDefaults);

    // Listen for new edge creation
    cy.on('ehcomplete', (_event: EventObject, sourceNode: NodeSingular, targetNode: NodeSingular, _addedEdge: EdgeSingular) => {
        saveGraphData(cy.elements().jsons() as any);
        updateStatus(`Connected ${sourceNode.data('label') || sourceNode.id()} → ${targetNode.data('label') || targetNode.id()}`);
    });

    // Listen for edge clicks to delete in edit mode
    cy.on('tap', 'edge', (evt: EventObject) => {
        if (!isEditMode) return;
        const edge = evt.target as EdgeSingular;
        const sourceName = edge.source().data('label') || edge.source().id();
        const targetName = edge.target().data('label') || edge.target().id();

        if (confirm(`Remove connection: ${sourceName} → ${targetName}?`)) {
            edge.remove();
            saveGraphData(cy.elements().jsons() as any);
            updateStatus(`Removed connection: ${sourceName} → ${targetName}`);
        }
    });
};

export const enableEditMode = (updateStatus: (msg: string) => void): void => {
    if (!eh) return;
    eh.enableDrawMode();
    isEditMode = true;
    updateStatus('Edit Mode: Drag to connect, click edge to remove');
};

export const disableEditMode = (updateStatus: (msg: string) => void): void => {
    if (!eh) return;
    eh.disableDrawMode();
    isEditMode = false;
    updateStatus('Edit Mode disabled');
};

export const toggleEditMode = (updateStatus: (msg: string) => void): boolean => {
    if (isEditMode) {
        disableEditMode(updateStatus);
    } else {
        enableEditMode(updateStatus);
    }
    return isEditMode;
};

export const isInEditMode = (): boolean => isEditMode;
