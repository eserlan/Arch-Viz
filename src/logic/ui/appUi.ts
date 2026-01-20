import { CyInstance } from '../../types';
import { downloadCSV } from '../core/storage';
import { copyImageToClipboard, saveImageAsPng } from '../utils/exports';
import { focusModeManager } from './focusMode';
import { initFloatingPanel, initModal } from './ui';

type StatusHandler = (message: string) => void;

export const initDirtyStateIndicator = (
    containerId = 'dirtyStateContainer'
): ((isDirty: boolean) => void) => {
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

    document
        .getElementById('copyImageBtn')
        ?.addEventListener('click', () => copyImageToClipboard(getCy() || null));
    document
        .getElementById('focusModeCopyBtn')
        ?.addEventListener('click', () => copyImageToClipboard(getCy() || null));
    document
        .getElementById('saveImageBtn')
        ?.addEventListener('click', () => saveImageAsPng(getCy() || null));

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
        minimizeBtnId: 'minimizeLabelsBtn',
        minimizedStorageKey: 'panel-labels-minimized',
        defaultClasses: ['-translate-x-1/2', 'left-1/2', 'top-6'],
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
        minimizeBtnId: 'minimizeTeamsBtn',
        minimizedStorageKey: 'panel-teams-minimized',
        defaultClasses: ['right-72', 'top-6'],
    });

    initFloatingPanel({
        panelId: 'floatingAppCodePanel',
        title: 'App Code',
        iconKey: 'APP_CODE',
        menuBtnId: 'appCodePanelMenuBtn',
        menuId: 'appCodePanelMenu',
        moveBtnId: 'moveAppCodePanelBtn',
        containerId: 'appCodeFilterContainer',
        storageKey: 'app-code-panel-pos',
        minimizeBtnId: 'minimizeAppCodeBtn',
        minimizedStorageKey: 'panel-app-code-minimized',
        defaultClasses: ['right-72', 'top-24'],
    });

    // Initialize panel toggle buttons (minimize/restore from sidebar)
    const setupSidebarToggle = (btnId: string, panelId: string) => {
        const btn = document.getElementById(btnId);
        const panel = document.getElementById(panelId) as any;
        if (!btn || !panel) return;

        const updateBtnState = (minimized: boolean) => {
            btn.classList.toggle('bg-slate-800/50', minimized);
            btn.classList.toggle('text-slate-400', minimized);
            btn.classList.toggle(
                'text-emerald-400',
                !minimized && panelId === 'floatingFilterPanel'
            );
            btn.classList.toggle('text-blue-400', !minimized && panelId === 'floatingTeamPanel');
            btn.classList.toggle(
                'text-amber-400',
                !minimized && panelId === 'floatingAppCodePanel'
            );
        };

        // Initial state
        if (panel.minimizeManager) {
            updateBtnState(panel.minimizeManager.isMinimized());
        }

        btn.addEventListener('click', () => {
            if (panel.minimizeManager) {
                panel.minimizeManager.toggle();
            }
        });

        panel.addEventListener('panel-state-change', (e: any) => {
            updateBtnState(e.detail.minimized);
        });
    };

    setupSidebarToggle('highlightLabelsPanel', 'floatingFilterPanel');
    setupSidebarToggle('highlightTeamsPanel', 'floatingTeamPanel');
    setupSidebarToggle('highlightAppCodePanel', 'floatingAppCodePanel');

    focusModeManager.init();
};

export const initSettings = (getCy: () => CyInstance | undefined): void => {
    const showVerifiedToggle = document.getElementById(
        'showVerifiedToggle'
    ) as HTMLInputElement | null;
    if (!showVerifiedToggle) return;

    // Load saved state
    const savedState = localStorage.getItem('settings-show-verified');
    const showVerified = savedState === null ? true : savedState === 'true';
    showVerifiedToggle.checked = showVerified;

    const updateVerifiedVisibility = (visible: boolean) => {
        const cy = getCy();
        if (!cy) return;

        cy.batch(() => {
            cy.nodes().forEach((node) => {
                if (node.data('verified')) {
                    node.toggleClass('is-verified', visible);
                }
            });
        });
    };

    showVerifiedToggle.addEventListener('change', () => {
        const isChecked = showVerifiedToggle.checked;
        localStorage.setItem('settings-show-verified', isChecked.toString());
        updateVerifiedVisibility(isChecked);
    });
};
