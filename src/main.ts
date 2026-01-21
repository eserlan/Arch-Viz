import './styles/main.css';
import { initAccordion } from './logic/ui/accordion';
import { clearGraphData } from './logic/core/storage';
import { initUploader } from './logic/utils/uploader';
import { showToast, updateStatus } from './logic/ui/ui';
import { CyInstance } from './types';
import { createGraphRenderer } from './logic/graph/appGraph';
import { loadGraphElements } from './logic/core/appData';
import {
    initDirtyStateIndicator,
    initPanelsAndModals,
    initSidebarActions,
    initSettings,
} from './logic/ui/appUi';

const cyContainer = document.getElementById('cy') as HTMLElement | null;
const csvUrl = `${(import.meta as any).env.BASE_URL}data/services.csv`;

let cy: CyInstance | undefined;

const updateDirtyUI = initDirtyStateIndicator();
const renderGraph = createGraphRenderer({
    container: cyContainer,
    onStatus: updateStatus,
    onDirtyStateChange: updateDirtyUI,
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
initSettings(() => cy);

const loadData = async (): Promise<void> => {
    try {
        cyContainer?.classList.add('cy-loading');
        const { elements, skipped } = await loadGraphElements(csvUrl);
        cy = renderGraph(elements, skipped);
        cyContainer?.classList.remove('cy-loading');
    } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Failed to load graph';
        updateStatus(message);
        cyContainer?.classList.remove('cy-loading');
    }
};

// Bootstrap
initAccordion();
initUploader(
    (elements, skipped) => {
        cy = renderGraph(elements, skipped);
    },
    updateStatus,
    () => cy,
    showToast
);
loadData();
