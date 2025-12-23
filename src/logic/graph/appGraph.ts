import cytoscape, { ElementsDefinition, ElementDefinition } from 'cytoscape';
// @ts-ignore
import fcose from 'cytoscape-fcose';
// @ts-ignore
import dagre from 'cytoscape-dagre';
import { layoutConfig, stylesheet } from './graphConfig';
import { initFilters, populateLabelFilter, populateTeamFilter } from './filters';
import { initEdgeEditor } from './edgeEditor';
import { calculateDynamicZoom } from '../ui/zoom';
import { initLayoutManager } from './layoutManager';
import { initGraphEvents } from './graphEvents';
import { initPanel } from '../ui/panel/actions';
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
            userZoomingEnabled: false,
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

        initHistory(cy, cy.elements().jsons(), {
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
        initLayoutManager(cy);
        initGraphEvents(cy);
        initPanel(cy, onStatus);
        initServiceForm(cy, () => onDirtyStateChange(true));
        initGrouping(cy);
        initMiniMap(cy);

        populateLabelFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);
        populateTeamFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);

        return cy;
    };
};
