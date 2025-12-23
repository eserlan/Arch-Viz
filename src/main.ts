import './styles/main.css';
import { initAccordion } from './logic/accordion';
import { clearGraphData } from './logic/storage';
import { initUploader } from './logic/uploader';
import { showToast, updateStatus } from './logic/ui';
import { CyInstance } from './types';
import { createGraphRenderer } from './logic/appGraph';
import { loadGraphElements } from './logic/appData';
import { initDirtyStateIndicator, initPanelsAndModals, initSidebarActions } from './logic/appUi';

const cyContainer = document.getElementById('cy') as HTMLElement | null;
const csvUrl = `${(import.meta as any).env.BASE_URL}data/services.csv`;

let cy: CyInstance | undefined;

const updateDirtyUI = initDirtyStateIndicator();
const renderGraph = createGraphRenderer({
    container: cyContainer,
    onStatus: updateStatus,
    onDirtyStateChange: updateDirtyUI
});

initSidebarActions(
    () => cy,
    updateStatus,
    () => {
        clearGraphData();
        window.location.reload();
    }
);

initPanelsAndModals();

const loadData = async (): Promise<void> => {
    try {
        cyContainer?.classList.add('cy-loading');
        const { elements, skipped } = await loadGraphElements(csvUrl);
        cy = renderGraph(elements, skipped);
        cyContainer?.classList.remove('cy-loading');
    } catch (error: any) {
        console.error(error);
        updateStatus(error.message || 'Failed to load graph');
        cyContainer?.classList.remove('cy-loading');
    }
};

// Bootstrap
initAccordion();
initUploader(renderGraph, updateStatus, () => cy, showToast);
loadData();
