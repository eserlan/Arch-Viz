import cytoscape, { ElementsDefinition, ElementDefinition } from 'cytoscape';
// @ts-expect-error - cytoscape-fcose lacks type definitions
import fcose from 'cytoscape-fcose';
// @ts-expect-error - cytoscape-dagre lacks type definitions
import dagre from 'cytoscape-dagre';
import { layoutConfig, stylesheet } from './graphConfig';
import { initFilters, populateLabelFilter, populateTeamFilter } from './filters';
import { initEdgeEditor } from './edgeEditor';
import { registerEdgeEditorKeyListener } from './edgeEditorKeyboard';
import { registerSearchKeyListener } from '../ui/searchKeyboard';
import { calculateDynamicZoom } from '../ui/zoom';
import { initLayoutManager } from './layoutManager';
import { initGraphEvents } from './graphEvents';
import { initServiceForm } from '../ui/serviceForm';
import { initGrouping } from './grouping';
import { initHistory } from '../core/history';
import { initMiniMap } from '../ui/minimap';
import { getDirtyState, saveGraphData } from '../core/storage';
import { CyInstance } from '../../types';

cytoscape.use(fcose);
cytoscape.use(dagre);

type StatusHandler = (message: string) => void;
type DirtyStateHandler = (isDirty: boolean) => void;

type GraphRendererOptions = {
    container: HTMLElement | null;
    onStatus: StatusHandler;
    onDirtyStateChange: DirtyStateHandler;
};

export const createGraphRenderer = ({ container, onStatus, onDirtyStateChange }: GraphRendererOptions) => {
    return (elements: ElementsDefinition | ElementDefinition[], skipped: number): CyInstance | undefined => {
        if (!container) return undefined;

        onStatus('Rendering graph…');

        const cy = cytoscape({
            container,
            elements,
            layout: layoutConfig,
            style: stylesheet,
            userZoomingEnabled: true,
            wheelSensitivity: 0,
            selectionType: 'single',
            minZoom: 0.1,
            maxZoom: 2.5,
        }) as CyInstance;

        container.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            const currentZoom = cy.zoom();
            const newZoom = calculateDynamicZoom(currentZoom, e.deltaY, cy.minZoom(), cy.maxZoom());
            const rect = container.getBoundingClientRect();
            cy.zoom({ level: newZoom, renderedPosition: { x: e.clientX - rect.left, y: e.clientY - rect.top } });
        }, { passive: false });

        (window as any).cy = cy;

        initHistory(cy, cy.elements().jsons() as ElementDefinition[], {
            onStatus,
            onPersist: (graphElements) => saveGraphData(graphElements, { skipHistory: true })
        });

        cy.ready(() => {
            cy.fit(undefined, 100);
            cy.nodes().unselect();
            onStatus(`Loaded ${cy.nodes().length} nodes and ${cy.edges().length} edges` + (skipped ? ` (skipped ${skipped} invalid rows)` : ''));
            onDirtyStateChange(getDirtyState());
        });

        initFilters(cy);
        initEdgeEditor(cy, onStatus);
        registerEdgeEditorKeyListener(onStatus);
        registerSearchKeyListener();
        initLayoutManager(cy);
        initGraphEvents(cy);
        initServiceForm(cy, () => onDirtyStateChange(true));
        initGrouping(cy);
        initMiniMap(cy);

        populateLabelFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);
        populateTeamFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);

        return cy;
    };
};
