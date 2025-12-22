import { HELP_CONTENT_HTML } from './constants';
import { ICONS } from './icons';
import { ToastType, PanelConfig } from '../types';

/**
 * UI Utilities and Shared Components
 */

export const showToast = (message: string, type: ToastType = 'info'): void => {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const colors: Record<ToastType, string> = {
        info: 'bg-slate-800 border-slate-600 text-slate-200',
        success: 'bg-emerald-900/90 border-emerald-500 text-emerald-200',
        warning: 'bg-amber-900/90 border-amber-500 text-amber-200',
        error: 'bg-red-900/90 border-red-500 text-red-200'
    };

    const toast = document.createElement('div');
    toast.className = `${colors[type] || colors.info} px-4 py-2 rounded-lg border backdrop-blur-sm shadow-lg text-sm font-medium transform transition-all duration-300 opacity-0 translate-y-2`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
        toast.classList.add('opacity-100', 'translate-y-0');
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

export const updateStatus = (message: string): void => {
    showToast(message, 'info');
};

/**
 * Initialize a floating panel with drag and persistence logic
 */
export function initFloatingPanel(config: PanelConfig): void {
    const {
        panelId,
        title,
        iconKey,
        menuBtnId,
        menuId,
        moveBtnId,
        containerId,
        storageKey,
        defaultClasses = []
    } = config;

    const panel = document.getElementById(panelId) as HTMLElement | null;
    if (!panel) return;

    // Inject Structure
    panel.innerHTML = `
        <div class="flex justify-between items-center mb-3 select-none">
          <div class="flex items-center gap-2">
            ${ICONS[iconKey] || ''}
            <label class="text-[11px] uppercase tracking-widest text-slate-300 font-bold">${title}</label>
          </div>
          <div class="relative">
            <button id="${menuBtnId}" class="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-colors focus:outline-none">
              ${ICONS.MENU}
            </button>
            <div id="${menuId}" class="hidden absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 overflow-hidden">
              <button id="${moveBtnId}" class="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors">
                ${ICONS.MOVE}
                Move
              </button>
            </div>
          </div>
        </div>
        <div id="${containerId}" class="flex flex-col gap-2 px-1">
          <!-- Populated by JS -->
        </div>
    `;

    const menuBtn = document.getElementById(menuBtnId);
    const menu = document.getElementById(menuId);
    const moveBtn = document.getElementById(moveBtnId);

    // Restore panel position and size
    const savedPos = localStorage.getItem(storageKey);
    if (savedPos) {
        try {
            const { left, top, width, height } = JSON.parse(savedPos);
            if (left) panel.style.left = left;
            if (top) panel.style.top = top;
            if (width) panel.style.width = width;
            if (height) panel.style.height = height;
            if (defaultClasses.length) {
                panel.classList.remove(...defaultClasses);
            }
            panel.style.transform = 'none';
        } catch (e) {
            console.error(`Error loading panel position for ${panelId}`, e);
        }
    }

    // Save size changes when panel is resized
    const resizeObserver = new ResizeObserver(() => {
        const current = localStorage.getItem(storageKey);
        const data = current ? JSON.parse(current) : {};
        data.width = panel.style.width || `${panel.offsetWidth}px`;
        data.height = panel.style.height || `${panel.offsetHeight}px`;
        localStorage.setItem(storageKey, JSON.stringify(data));
    });
    resizeObserver.observe(panel);

    // Reveal panel after potential position update to avoid jump
    requestAnimationFrame(() => {
        panel.classList.remove('opacity-0');
    });

    // Menu interactions
    if (menuBtn && menu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target as Node) && e.target !== menuBtn) {
                menu.classList.add('hidden');
            }
        });
    }

    if (moveBtn) {
        moveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menu) menu.classList.add('hidden');

            // Enter Move Mode
            panel.style.cursor = 'move';
            panel.classList.add('ring-2', 'ring-emerald-500', 'shadow-emerald-900/50');
            showToast('Click anywhere to place the panel', 'info');

            // Initial setup to absolute positioning if using responsive centering
            if (panel.classList.contains('-translate-x-1/2')) {
                const rect = panel.getBoundingClientRect();
                panel.style.left = rect.left + 'px';
                panel.style.top = rect.top + 'px';
                panel.classList.remove('-translate-x-1/2', 'left-1/2');
                panel.style.transform = 'none';
            }

            let rafId: number | null = null;
            const moveHandler = (evt: MouseEvent) => {
                const cx = evt.clientX;
                const cy = evt.clientY;

                if (rafId === null) {
                    rafId = requestAnimationFrame(() => {
                        const width = panel.offsetWidth;
                        const height = panel.offsetHeight;
                        let left = cx - (width / 2);
                        let top = cy - 20;

                        const maxW = window.innerWidth - width;
                        const maxH = window.innerHeight - height;

                        left = Math.max(0, Math.min(maxW, left));
                        top = Math.max(0, Math.min(maxH, top));

                        panel.style.left = `${left}px`;
                        panel.style.top = `${top}px`;
                        rafId = null;
                    });
                }
            };

            document.addEventListener('mousemove', moveHandler);

            // Click to drop
            const clickHandler = (evt: MouseEvent) => {
                evt.preventDefault();
                evt.stopPropagation();
                document.removeEventListener('mousemove', moveHandler);
                if (rafId !== null) cancelAnimationFrame(rafId);

                panel.style.cursor = '';
                panel.classList.remove('ring-2', 'ring-emerald-500', 'shadow-emerald-900/50');
                showToast('Panel placed', 'success');

                localStorage.setItem(storageKey, JSON.stringify({
                    left: panel.style.left,
                    top: panel.style.top
                }));
            };

            setTimeout(() => {
                document.addEventListener('click', clickHandler, { capture: true, once: true });
            }, 50);
        });
    }
}

/**
 * Initialize a simple modal (Help, etc.)
 */
export function initModal(modalId: string, openBtnId: string, closeBtnId: string, contentId: string | null = null): void {
    const modal = document.getElementById(modalId) as HTMLDialogElement | null;
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);

    if (!modal || !openBtn || !closeBtn) return;

    // Inject Help Content if applicable
    if (modalId === 'helpModal' && contentId) {
        const target = document.getElementById(contentId);
        if (target) target.innerHTML = HELP_CONTENT_HTML;
    }

    openBtn.addEventListener('click', () => modal.showModal());
    closeBtn.addEventListener('click', () => modal.close());

    modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right ||
            e.clientY < rect.top || e.clientY > rect.bottom) {
            modal.close();
        }
    });
}
