import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showToast, initFloatingPanel, initModal } from './ui';

describe('UI Logic', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="toastContainer"></div>
            <div id="testPanel" class="opacity-0"></div>
            <button id="testMenuBtn"></button>
            <div id="testMenu" class="hidden"></div>
            <button id="testMoveBtn"></button>
            
            <dialog id="testModal">
                <div id="testModalContent"></div>
                <button id="openModalBtn"></button>
                <button id="closeModalBtn"></button>
            </dialog>
        `;
        // Mock requestAnimationFrame
        vi.stubGlobal('requestAnimationFrame', (cb) => cb());
        // Mock localStorage
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: (key) => store[key] || null,
                setItem: (key, value) => { store[key] = value.toString(); },
                clear: () => { store = {}; }
            };
        })();
        vi.stubGlobal('localStorage', localStorageMock);

        // Mock showModal/close for dialog
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();
    });

    describe('showToast', () => {
        it('should create a toast element in the container', () => {
            showToast('Test Message', 'success');
            const container = document.getElementById('toastContainer');
            expect(container.children.length).toBe(1);
            expect(container.firstChild.textContent).toBe('Test Message');
        });

        it('should apply correct color classes based on type', () => {
            showToast('Warning', 'warning');
            const toast = document.getElementById('toastContainer').firstChild;
            expect(toast.className).toContain('bg-amber-900');
        });
    });

    describe('initFloatingPanel', () => {
        it('should inject structure into the panel', () => {
            initFloatingPanel({
                panelId: 'testPanel',
                title: 'Test Panel',
                iconKey: 'LABEL',
                menuBtnId: 'testMenuBtn',
                menuId: 'testMenu',
                moveBtnId: 'testMoveBtn',
                containerId: 'testContainer',
                storageKey: 'test-pos'
            });

            const panel = document.getElementById('testPanel');
            expect(panel.innerHTML).toContain('Test Panel');
            expect(document.getElementById('testContainer')).not.toBeNull();
        });

        it('should toggle menu visibility when menu button is clicked', () => {
            initFloatingPanel({
                panelId: 'testPanel',
                title: 'Test Panel',
                iconKey: 'LABEL',
                menuBtnId: 'testMenuBtn',
                menuId: 'testMenu',
                moveBtnId: 'testMoveBtn',
                containerId: 'testContainer',
                storageKey: 'test-pos'
            });

            const menuBtn = document.getElementById('testMenuBtn');
            const menu = document.getElementById('testMenu');

            expect(menu.classList.contains('hidden')).toBe(true);
            menuBtn.click();
            expect(menu.classList.contains('hidden')).toBe(false);
        });

        it('should restore position from localStorage', () => {
            localStorage.setItem('test-pos', JSON.stringify({ left: '100px', top: '200px' }));

            initFloatingPanel({
                panelId: 'testPanel',
                title: 'Test Panel',
                iconKey: 'LABEL',
                menuBtnId: 'testMenuBtn',
                menuId: 'testMenu',
                moveBtnId: 'testMoveBtn',
                containerId: 'testContainer',
                storageKey: 'test-pos'
            });

            const panel = document.getElementById('testPanel');
            expect(panel.style.left).toBe('100px');
            expect(panel.style.top).toBe('200px');
        });
    });

    describe('initModal', () => {
        it('should call showModal when open button is clicked', () => {
            initModal('testModal', 'openModalBtn', 'closeModalBtn');

            const openBtn = document.getElementById('openModalBtn');
            const modal = document.getElementById('testModal');

            openBtn.click();
            expect(modal.showModal).toHaveBeenCalled();
        });

        it('should inject content if specified for helpModal', () => {
            document.body.innerHTML += '<dialog id="helpModal"><div id="helpContent"></div><button id="openH"></button><button id="closeH"></button></dialog>';
            const modal = document.getElementById('helpModal');
            HTMLDialogElement.prototype.showModal = vi.fn();
            HTMLDialogElement.prototype.close = vi.fn();

            initModal('helpModal', 'openH', 'closeH', 'helpContent');

            const content = document.getElementById('helpContent');
            expect(content.innerHTML).not.toBe('');
            expect(content.innerHTML).toContain('How it Works');
        });
    });
});
