import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showToast, initFloatingPanel, initModal } from './ui';

describe('UI Logic', () => {
    const panelConfig = {
        panelId: 'testPanel',
        title: 'Test Panel',
        iconKey: 'LABEL' as any,
        menuBtnId: 'testMenuBtn',
        menuId: 'testMenu',
        moveBtnId: 'testMoveBtn',
        containerId: 'testContainer',
        storageKey: 'test-pos',
        minimizeBtnId: 'testMinimizeBtn',
        minimizedStorageKey: 'test-minimized',
    };

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="toastContainer"></div>
            <div id="testPanel" class="opacity-0"></div>
            <div id="testContainer"></div>
            
            <dialog id="testModal">
                <div id="testModalContent"></div>
                <button id="openModalBtn"></button>
                <button id="closeModalBtn"></button>
            </dialog>
        `;
        // Mock requestAnimationFrame
        vi.stubGlobal('requestAnimationFrame', (cb: any) => cb());

        // Mock ResizeObserver (not available in jsdom)
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe = vi.fn();
                unobserve = vi.fn();
                disconnect = vi.fn();
            }
        );

        // Mock showModal/close for dialog
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();

        localStorage.clear();
    });

    describe('showToast', () => {
        it('should create a toast element in the container', () => {
            showToast('Test Message', 'success');
            const container = document.getElementById('toastContainer')!;
            expect(container.children.length).toBe(1);
            expect(container.firstChild!.textContent).toBe('Test Message');
        });
    });

    describe('initFloatingPanel', () => {
        it('should inject structure into the panel', () => {
            initFloatingPanel(panelConfig);
            const panel = document.getElementById('testPanel')!;
            expect(panel.innerHTML).toContain('Test Panel');
        });

        it('should toggle menu visibility when menu button is clicked', () => {
            initFloatingPanel(panelConfig);
            const menuBtn = document.getElementById('testMenuBtn')!;
            const menu = document.getElementById('testMenu')!;

            expect(menu.classList.contains('hidden')).toBe(true);
            menuBtn.click();
            expect(menu.classList.contains('hidden')).toBe(false);
        });

        it('should restore position from localStorage', () => {
            localStorage.setItem('test-pos', JSON.stringify({ left: '111px', top: '222px' }));
            initFloatingPanel(panelConfig);
            const panel = document.getElementById('testPanel')!;
            expect(panel.style.left).toBe('111px');
            expect(panel.style.top).toBe('222px');
        });

        it.skip('should enter move mode and update position on mousemove', () => {
            vi.useFakeTimers();
            const moveConfig = { ...panelConfig, storageKey: 'move-test-pos' };
            initFloatingPanel(moveConfig);
            const panel = document.getElementById('testPanel')!;
            const moveBtn = document.getElementById('testMoveBtn')!;

            vi.spyOn(panel, 'offsetWidth', 'get').mockReturnValue(200);
            vi.spyOn(panel, 'offsetHeight', 'get').mockReturnValue(100);
            vi.stubGlobal('innerWidth', 1000);
            vi.stubGlobal('innerHeight', 800);

            moveBtn.click();
            expect(panel.style.cursor).toBe('move');

            const moveEvent = new MouseEvent('mousemove', { clientX: 500, clientY: 400 });
            document.dispatchEvent(moveEvent);

            expect(panel.style.left).toBe('400px');
            expect(panel.style.top).toBe('380px');

            // Drop the panel
            vi.advanceTimersByTime(100);
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
            document.body.dispatchEvent(clickEvent);

            expect(panel.style.cursor).toBe('');
            expect(localStorage.getItem('move-test-pos')).toContain('400px');
            vi.useRealTimers();
        });

        it('should toggle minimized class when minimize button is clicked', () => {
            initFloatingPanel(panelConfig);
            const panel = document.getElementById('testPanel')!;
            const minimizeBtn = document.getElementById('testMinimizeBtn')!;

            expect(panel.classList.contains('minimized')).toBe(false);
            minimizeBtn.click();
            expect(panel.classList.contains('minimized')).toBe(true);
            minimizeBtn.click();
            expect(panel.classList.contains('minimized')).toBe(false);
        });

        it('should update minimize button icon when clicked', () => {
            initFloatingPanel(panelConfig);
            const minimizeBtn = document.getElementById('testMinimizeBtn')!;

            // Initial state: MINIMIZE icon
            expect(minimizeBtn.innerHTML).toContain('M18 12H6'); // From ICONS.MINIMIZE

            minimizeBtn.click();
            // Minimized state: RESTORE icon
            expect(minimizeBtn.innerHTML).toContain('M5 15l7-7 7 7'); // From ICONS.RESTORE
        });

        it('should save minimized state to localStorage', () => {
            initFloatingPanel(panelConfig);
            const minimizeBtn = document.getElementById('testMinimizeBtn')!;

            minimizeBtn.click();
            expect(localStorage.getItem('test-minimized')).toBe('true');

            minimizeBtn.click();
            expect(localStorage.getItem('test-minimized')).toBe('false');
        });

        it('should restore minimized state from localStorage on init', () => {
            localStorage.setItem('test-minimized', 'true');
            initFloatingPanel(panelConfig);
            const panel = document.getElementById('testPanel')!;
            const minimizeBtn = document.getElementById('testMinimizeBtn')!;

            expect(panel.classList.contains('minimized')).toBe(true);
            expect(minimizeBtn.innerHTML).toContain('M5 15l7-7 7 7');
        });
    });

    describe('initModal', () => {
        it('should call showModal when open button is clicked', () => {
            initModal('testModal', 'openModalBtn', 'closeModalBtn');
            const openBtn = document.getElementById('openModalBtn')!;
            const modal = document.getElementById('testModal') as HTMLDialogElement;
            openBtn.click();
            expect(modal.showModal).toHaveBeenCalled();
        });
    });
});
