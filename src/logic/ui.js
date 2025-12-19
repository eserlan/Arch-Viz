/**
 * UI Utilities and Shared Components
 */

const toastContainer = document.getElementById('toastContainer');

export const showToast = (message, type = 'info') => {
    if (!toastContainer) return;

    const colors = {
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

export const updateStatus = (message) => {
    showToast(message, 'info');
};

/**
 * Initialize a floating panel with drag and persistence logic
 */
export function initFloatingPanel(config) {
    const {
        panelId,
        menuBtnId,
        menuId,
        moveBtnId,
        storageKey,
        defaultClasses = []
    } = config;

    const panel = document.getElementById(panelId);
    const menuBtn = document.getElementById(menuBtnId);
    const menu = document.getElementById(menuId);
    const moveBtn = document.getElementById(moveBtnId);

    if (!panel) return;

    // Restore panel position
    const savedPos = localStorage.getItem(storageKey);
    if (savedPos) {
        try {
            const { left, top } = JSON.parse(savedPos);
            panel.style.left = left;
            panel.style.top = top;
            if (defaultClasses.length) {
                panel.classList.remove(...defaultClasses);
            }
            panel.style.transform = 'none';
        } catch (e) {
            console.error(`Error loading panel position for ${panelId}`, e);
        }
    }

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
            if (!menu.contains(e.target) && e.target !== menuBtn) {
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

            let rafId = null;
            const moveHandler = (evt) => {
                const cx = evt.clientX;
                const cy = evt.clientY;

                if (!rafId) {
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
            const clickHandler = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                document.removeEventListener('mousemove', moveHandler);
                if (rafId) cancelAnimationFrame(rafId);

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
export function initModal(modalId, openBtnId, closeBtnId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);

    if (!modal || !openBtn || !closeBtn) return;

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
