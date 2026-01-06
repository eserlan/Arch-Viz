import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initDirtyStateIndicator, initPanelsAndModals, initSidebarActions } from './appUi';
import { downloadCSV } from '../core/storage';
import { copyImageToClipboard, saveImageAsPng } from '../utils/exports';
import { initFloatingPanel, initModal } from './ui';

vi.mock('../core/storage', () => ({
    downloadCSV: vi.fn()
}));

vi.mock('../utils/exports', () => ({
    copyImageToClipboard: vi.fn(),
    saveImageAsPng: vi.fn()
}));

vi.mock('./ui', () => ({
    initFloatingPanel: vi.fn(),
    initModal: vi.fn()
}));

describe('appUi helpers', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('updates dirty state indicator and reacts to dirty-state-change events', () => {
        document.body.innerHTML = `<div id="dirtyStateContainer" class="hidden"></div>`;

        const updateDirtyUI = initDirtyStateIndicator();
        updateDirtyUI(true);

        const container = document.getElementById('dirtyStateContainer');
        expect(container?.classList.contains('hidden')).toBe(false);

        window.dispatchEvent(new CustomEvent('dirty-state-change', { detail: { isDirty: false } }));
        expect(container?.classList.contains('hidden')).toBe(true);
    });

    it('wires sidebar actions to download, export, and reset actions', () => {
        document.body.innerHTML = `
            <button id="downloadCsvBtn"></button>
            <button id="copyImageBtn"></button>
            <button id="saveImageBtn"></button>
            <button id="resetDataBtn"></button>
        `;

        const cy = {} as any;
        const onStatus = vi.fn();
        const onReset = vi.fn();
        vi.stubGlobal('confirm', vi.fn(() => true));

        initSidebarActions(() => cy, onStatus, onReset);

        document.getElementById('downloadCsvBtn')?.click();
        expect(downloadCSV).toHaveBeenCalledWith(cy);
        expect(onStatus).toHaveBeenCalledWith('Downloaded updated CSV');

        document.getElementById('copyImageBtn')?.click();
        expect(copyImageToClipboard).toHaveBeenCalledWith(cy);

        document.getElementById('saveImageBtn')?.click();
        expect(saveImageAsPng).toHaveBeenCalledWith(cy);

        document.getElementById('resetDataBtn')?.click();
        expect(onReset).toHaveBeenCalled();
    });

    it('initializes panels and modals', () => {
        initPanelsAndModals();

        expect(initModal).toHaveBeenCalledWith('helpModal', 'openHelpBtn', 'closeHelpBtn', 'helpContent');
        expect(initFloatingPanel).toHaveBeenCalledTimes(2);
    });

    it('initializes panel highlight buttons', () => {
        document.body.innerHTML = `
            <button id="highlightLabelsPanel"></button>
            <button id="highlightTeamsPanel"></button>
            <div id="floatingFilterPanel"></div>
            <div id="floatingTeamPanel"></div>
        `;

        initPanelsAndModals();

        const labelsBtn = document.getElementById('highlightLabelsPanel');
        const teamsBtn = document.getElementById('highlightTeamsPanel');
        const labelsPanel = document.getElementById('floatingFilterPanel');
        const teamsPanel = document.getElementById('floatingTeamPanel');

        // Click labels button
        labelsBtn?.click();
        expect(labelsPanel?.classList.contains('ring-4')).toBe(true);
        expect(labelsPanel?.classList.contains('ring-emerald-400')).toBe(true);

        // Click teams button
        teamsBtn?.click();
        expect(teamsPanel?.classList.contains('ring-4')).toBe(true);
        expect(teamsPanel?.classList.contains('ring-emerald-400')).toBe(true);
    });
});
