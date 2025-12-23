import { CyInstance } from '../../types';
import { downloadCSV } from '../core/storage';
import { copyImageToClipboard, saveImageAsPng } from '../utils/exports';
import { initFloatingPanel, initModal } from './ui';

type StatusHandler = (message: string) => void;

export const initDirtyStateIndicator = (containerId = 'dirtyStateContainer'): ((isDirty: boolean) => void) => {
    const dirtyStateContainer = document.getElementById(containerId);
    const updateDirtyUI = (isDirty: boolean): void => {
        if (dirtyStateContainer) {
            dirtyStateContainer.classList.toggle('hidden', !isDirty);
        }
    };

    window.addEventListener('dirty-state-change', (e: Event) => {
        const customEvent = e as CustomEvent;
        updateDirtyUI(customEvent.detail.isDirty);
    });

    return updateDirtyUI;
};

export const initSidebarActions = (
    getCy: () => CyInstance | undefined,
    onStatus: StatusHandler,
    onReset: () => void
): void => {
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    downloadCsvBtn?.addEventListener('click', () => {
        const cy = getCy();
        if (cy) {
            downloadCSV(cy);
            onStatus('Downloaded updated CSV');
        }
    });

    document.getElementById('copyImageBtn')?.addEventListener('click', () => copyImageToClipboard(getCy() || null));
    document.getElementById('saveImageBtn')?.addEventListener('click', () => saveImageAsPng(getCy() || null));

    document.getElementById('resetDataBtn')?.addEventListener('click', () => {
        if (confirm('Clear all local edits and reset to the default services.csv?')) {
            onReset();
        }
    });
};

export const initPanelsAndModals = (): void => {
    initModal('helpModal', 'openHelpBtn', 'closeHelpBtn', 'helpContent');

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
        defaultClasses: ['right-72', 'top-6']
    });

    initMobileSidebar();
};

export const initMobileSidebar = (): void => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (!mobileMenuBtn || !sidebar || !backdrop || !closeSidebarBtn) return;

    const toggleSidebar = () => {
        const isClosed = sidebar.classList.contains('-translate-x-full');
        if (isClosed) {
            sidebar.classList.remove('-translate-x-full');
            backdrop.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            backdrop.classList.add('hidden');
        }
    };

    mobileMenuBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    backdrop.addEventListener('click', toggleSidebar);
};
