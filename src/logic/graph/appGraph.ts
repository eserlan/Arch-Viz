import cytoscape, { ElementsDefinition, ElementDefinition } from 'cytoscape';
// @ts-expect-error - cytoscape-fcose lacks type definitions
import fcose from 'cytoscape-fcose';
// @ts-expect-error - cytoscape-dagre lacks type definitions
import dagre from 'cytoscape-dagre';
import { layoutConfig, stylesheet } from './graphConfig';
import {
    initFilters,
    populateLabelFilter,
    populateTeamFilter,
    populateAppCodeFilter,
} from './filters';
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
import { initSelectionInfo } from '../ui/selectionInfo';
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

export const createGraphRenderer = ({
    container,
    onStatus,
    onDirtyStateChange,
}: GraphRendererOptions) => {
    let currentCleanup: (() => void) | undefined;

    return (
        elements: ElementsDefinition | ElementDefinition[],
        skipped: number
    ): CyInstance | undefined => {
        if (!container) return undefined;

        // Cleanup previous instance if exists
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = undefined;
        }

        onStatus('Rendering graph…');

        const cy = cytoscape({
            container,
            elements,
            layout: layoutConfig,
            style: stylesheet,
            userZoomingEnabled: true,
            wheelSensitivity: 0,
            selectionType: 'additive',
            minZoom: 0.02,
            maxZoom: 2.5,
        }) as CyInstance;

        // Apply the 'is-verified' class in small asynchronous batches to avoid
        // blocking initial render for very large graphs.
        const verifiedNodes = cy.nodes().toArray();
        const BATCH_SIZE = 500;
        let verifiedIndex = 0;
        const showVerifiedSettings = localStorage.getItem('settings-show-verified') !== 'false';

        const processVerifiedBatch = () => {
            const end = Math.min(verifiedIndex + BATCH_SIZE, verifiedNodes.length);

            cy.batch(() => {
                for (let i = verifiedIndex; i < end; i++) {
                    const node = verifiedNodes[i];
                    const isVerified = Boolean(node.data('verified'));
                    node.toggleClass('is-verified', isVerified && showVerifiedSettings);
                }
            });
            verifiedIndex = end;

            if (verifiedIndex < verifiedNodes.length) {
                const schedule =
                    typeof (window as any).requestIdleCallback === 'function'
                        ? ((window as any).requestIdleCallback as (cb: () => void) => void)
                        : (cb: () => void) => setTimeout(cb, 0);
                schedule(processVerifiedBatch);
            }
        };

        processVerifiedBatch();

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const currentZoom = cy.zoom();
            const newZoom = calculateDynamicZoom(currentZoom, e.deltaY, cy.minZoom(), cy.maxZoom());
            const rect = container.getBoundingClientRect();
            cy.zoom({
                level: newZoom,
                renderedPosition: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        (window as any).cy = cy;

        const historyCleanup = initHistory(cy, cy.elements().jsons() as ElementDefinition[], {
            onStatus,
            onPersist: (graphElements) => saveGraphData(graphElements, { skipHistory: true }),
        });

        cy.ready(() => {
            cy.fit(undefined, 100);
            cy.nodes().unselect();
            onStatus(
                `Loaded ${cy.nodes().length} nodes and ${cy.edges().length} edges` +
                    (skipped ? ` (skipped ${skipped} invalid rows)` : '')
            );
            onDirtyStateChange(getDirtyState());
        });

        initFilters(cy);
        initEdgeEditor(cy, onStatus);
        registerEdgeEditorKeyListener(onStatus);
        registerSearchKeyListener();
        initLayoutManager(cy);
        const eventsCleanup = initGraphEvents(cy);
        initServiceForm(cy, () => onDirtyStateChange(true));
        initGrouping(cy);
        initMiniMap(cy);
        initSelectionInfo(cy);

        populateLabelFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);
        populateTeamFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);
        populateAppCodeFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);

        currentCleanup = () => {
            container.removeEventListener('wheel', handleWheel);
            if (typeof historyCleanup === 'function') (historyCleanup as any)();
            if (typeof eventsCleanup === 'function') (eventsCleanup as any)();
            cy.destroy();
        };

        return cy;
    };
};
