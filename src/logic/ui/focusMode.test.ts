import { describe, it, expect, beforeEach } from 'vitest';
import { FocusModeManager } from './focusMode';

describe('FocusModeManager', () => {
    let manager: FocusModeManager;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();

        // Mock document methods
        document.body.innerHTML = `
            <button id="focusModeToggle"></button>
            <aside id="appSidebar" class="hidden md:flex w-64"></aside>
            <div id="floatingFilterPanel" class="hidden md:block"></div>
            <div id="floatingTeamPanel" class="hidden md:block"></div>
            <div id="selectionInfoPanel"></div>
            <div id="minimap" class="hidden md:flex flex-col"></div>
            <div id="servicePanel" class="opacity-0"></div>
            <button id="focusModeCopyBtn" class="hidden"></button>
        `;

        manager = new FocusModeManager();
    });

    it('initializes with default state', () => {
        manager.init();
        expect(document.getElementById('focusModeToggle')).toBeDefined();
    });

    it('toggles focus mode on', () => {
        manager.init();
        manager.toggle();

        expect(localStorage.getItem('settings-focus-mode')).toBe('true');

        const sidebar = document.getElementById('appSidebar');
        expect(sidebar?.classList.contains('focus-mode-hidden')).toBe(true);

        const copyBtn = document.getElementById('focusModeCopyBtn');
        expect(copyBtn?.classList.contains('hidden')).toBe(false);

        // Other classes should be preserved
        expect(sidebar?.classList.contains('md:flex')).toBe(true);
        expect(sidebar?.classList.contains('w-64')).toBe(true);
    });

    it('toggles focus mode off and preserves all state', () => {
        manager.init();
        manager.toggle(); // On
        manager.toggle(); // Off

        expect(localStorage.getItem('settings-focus-mode')).toBe('false');

        const minimap = document.getElementById('minimap');
        expect(minimap?.classList.contains('focus-mode-hidden')).toBe(false);

        const copyBtn = document.getElementById('focusModeCopyBtn');
        expect(copyBtn?.classList.contains('hidden')).toBe(true);

        // Original classes intact
        expect(minimap?.className).toBe('hidden md:flex flex-col');
    });

    it('loads state from localStorage', () => {
        localStorage.setItem('settings-focus-mode', 'true');
        const newManager = new FocusModeManager();
        newManager.init();

        const sidebar = document.getElementById('appSidebar');
        expect(sidebar?.classList.contains('focus-mode-hidden')).toBe(true);
    });
});
