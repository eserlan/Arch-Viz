import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusModeManager } from './focusMode';

describe('FocusModeManager', () => {
    let manager: FocusModeManager;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();

        // Mock document methods
        document.body.innerHTML = `
            <button id="focusModeToggle"></button>
            <aside id="appSidebar" class="md:flex w-64"></aside>
            <div id="floatingFilterPanel"></div>
            <div id="floatingTeamPanel"></div>
            <div id="selectionInfoPanel"></div>
            <div id="minimap" class="md:block"></div>
            <div id="servicePanel"></div>
        `;

        manager = new FocusModeManager();
    });

    it('initializes with default state (off)', () => {
        manager.init();
        expect(localStorage.getItem('settings-focus-mode')).toBeNull();
        const sidebar = document.querySelector('aside');
        expect(sidebar?.classList.contains('hidden')).toBe(false);
    });

    it('toggles focus mode on', () => {
        manager.init();
        manager.toggle();

        expect(localStorage.getItem('settings-focus-mode')).toBe('true');

        const sidebar = document.querySelector('aside');
        expect(sidebar?.classList.contains('hidden')).toBe(true);
        expect(sidebar?.classList.contains('md:flex')).toBe(false);

        const minimap = document.getElementById('minimap');
        expect(minimap?.classList.contains('hidden')).toBe(true);
    });

    it('toggles focus mode off', () => {
        manager.init();
        manager.toggle(); // On
        manager.toggle(); // Off

        expect(localStorage.getItem('settings-focus-mode')).toBe('false');

        const minimap = document.getElementById('minimap');
        expect(minimap?.classList.contains('hidden')).toBe(false);
        expect(minimap?.classList.contains('md:block')).toBe(true);
    });

    it('loads state from localStorage', () => {
        localStorage.setItem('settings-focus-mode', 'true');
        const newManager = new FocusModeManager();
        newManager.init();

        const sidebar = document.querySelector('aside');
        expect(sidebar?.classList.contains('hidden')).toBe(true);
    });
});
