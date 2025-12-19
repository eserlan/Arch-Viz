import './styles/main.css';
import cytoscape, { ElementsDefinition, ElementDefinition } from 'cytoscape';
// @ts-ignore
import fcose from 'cytoscape-fcose';
// @ts-ignore
import dagre from 'cytoscape-dagre';
import { parseCSV } from './logic/parser';
import { layoutConfig, stylesheet } from './logic/graphConfig';
import { initAccordion } from './logic/accordion';
import { loadGraphData, getDirtyState, clearGraphData, downloadCSV } from './logic/storage';
import { initFilters, populateLabelFilter, populateTeamFilter } from './logic/filters';
import { initUploader } from './logic/uploader';
import { initEdgeEditor } from './logic/edgeEditor';
import { calculateDynamicZoom } from './logic/zoom';
import { showToast, updateStatus, initFloatingPanel, initModal } from './logic/ui';
import { copyImageToClipboard, saveImageAsPng } from './logic/exports';
import { initLayoutManager } from './logic/layoutManager';
import { initGraphEvents } from './logic/graphEvents';
import { initServiceForm } from './logic/serviceForm';
import { CyInstance } from './types';

cytoscape.use(fcose);
cytoscape.use(dagre);

const cyContainer = document.getElementById('cy') as HTMLElement | null;
const csvUrl = `${(import.meta as any).env.BASE_URL}data/services.csv`;

let cy: CyInstance | undefined;

// Dirty state UI management
const dirtyStateContainer = document.getElementById('dirtyStateContainer');
const updateDirtyUI = (isDirty: boolean): void => {
    if (dirtyStateContainer) {
        dirtyStateContainer.classList.toggle('hidden', !isDirty);
    }
};

window.addEventListener('dirty-state-change', (e: Event) => {
    const customEvent = e as CustomEvent;
    updateDirtyUI(customEvent.detail.isDirty);
});

// Sidebar Actions logic
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
downloadCsvBtn?.addEventListener('click', () => {
    if (cy) {
        downloadCSV(cy);
        updateStatus(`Downloaded updated CSV`);
    }
});

document.getElementById('copyImageBtn')?.addEventListener('click', () => copyImageToClipboard(cy || null));
document.getElementById('saveImageBtn')?.addEventListener('click', () => saveImageAsPng(cy || null));

const renderGraph = (elements: ElementsDefinition | ElementDefinition[], skipped: number): void => {
    if (!cyContainer) return;

    updateStatus('Rendering graph…');

    cy = cytoscape({
        container: cyContainer,
        elements,
        layout: layoutConfig,
        style: stylesheet,
        userZoomingEnabled: false,
        selectionType: 'single',
        minZoom: 0.1,
        maxZoom: 2.5,
    }) as CyInstance;

    // Zoom management
    cyContainer.addEventListener('wheel', (e: WheelEvent) => {
        if (!cy) return;
        e.preventDefault();
        const currentZoom = cy.zoom();
        const newZoom = calculateDynamicZoom(currentZoom, e.deltaY, cy.minZoom(), cy.maxZoom());
        const rect = cyContainer.getBoundingClientRect();
        cy.zoom({ level: newZoom, renderedPosition: { x: e.clientX - rect.left, y: e.clientY - rect.top } });
    }, { passive: false });

    (window as any).cy = cy;

    cy.ready(() => {
        if (!cy) return;
        cy.fit(undefined, 100);
        updateStatus(`Loaded ${cy.nodes().length} nodes and ${cy.edges().length} edges` + (skipped ? ` (skipped ${skipped} invalid rows)` : ''));
        updateDirtyUI(getDirtyState());
    });

    // Initialize modular controllers
    initFilters(cy);
    initEdgeEditor(cy, updateStatus);
    initLayoutManager(cy);
    initGraphEvents(cy);
    initServiceForm(cy, () => updateDirtyUI(true));

    populateLabelFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);
    populateTeamFilter(elements as (cytoscape.NodeDefinition | cytoscape.EdgeDefinition)[]);
};

const loadData = async (): Promise<void> => {
    try {
        const savedData = loadGraphData();
        if (savedData) {
            renderGraph(savedData as any, 0);
            return;
        }

        cyContainer?.classList.add('cy-loading');
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error(`Unable to load services.csv`);
        const csvText = await response.text();
        const { elements, skipped } = parseCSV(csvText);
        renderGraph(elements, skipped);
        cyContainer?.classList.remove('cy-loading');
    } catch (error: any) {
        console.error(error);
        updateStatus(error.message || 'Failed to load graph');
        cyContainer?.classList.remove('cy-loading');
    }
};

document.getElementById('resetDataBtn')?.addEventListener('click', () => {
    if (confirm('Clear all local edits and reset to the default services.csv?')) {
        clearGraphData();
        window.location.reload();
    }
});

// Setup Modals
initModal('helpModal', 'openHelpBtn', 'closeHelpBtn', 'helpContent');

// Initialize Floating Panels
initFloatingPanel({
    panelId: 'floatingFilterPanel',
    title: 'Labels',
    iconKey: 'LABEL',
    menuBtnId: 'panelMenuBtn',
    menuId: 'panelMenu',
    moveBtnId: 'movePanelBtn',
    containerId: 'labelFilterContainer',
    storageKey: 'panel-pos',
    defaultClasses: ['-translate-x-1/2', 'left-1/2', 'top-6']
});

initFloatingPanel({
    panelId: 'floatingTeamPanel',
    title: 'Teams',
    iconKey: 'TEAM',
    menuBtnId: 'teamPanelMenuBtn',
    menuId: 'teamPanelMenu',
    moveBtnId: 'moveTeamPanelBtn',
    containerId: 'teamFilterContainer',
    storageKey: 'team-panel-pos',
    defaultClasses: ['right-6', 'top-6']
});

// Bootstrap
initAccordion();
initUploader(renderGraph, updateStatus, () => cy, showToast);
loadData();
