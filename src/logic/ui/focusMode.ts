export class FocusModeManager {
    private isFocusMode = false;
    private readonly STORAGE_KEY = 'settings-focus-mode';
    private readonly elementsToToggle = [
        '#appSidebar',
        '#floatingFilterPanel',
        '#floatingTeamPanel',
        '#selectionInfoPanel',
        '#minimap',
        '#servicePanel',
    ];

    constructor() {
        this.loadState();
    }

    public init(): void {
        const toggleBtn = document.getElementById('focusModeToggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => this.toggle());
        this.applyState();
    }

    public toggle(): void {
        this.isFocusMode = !this.isFocusMode;
        this.saveState();
        this.applyState();

        // Dispatch event for other components if needed
        window.dispatchEvent(
            new CustomEvent('focus-mode-change', {
                detail: { isFocusMode: this.isFocusMode },
            } as CustomEventInit<{ isFocusMode: boolean }>)
        );
    }

    private applyState(): void {
        const toggleBtn = document.getElementById('focusModeToggle');
        if (toggleBtn) {
            toggleBtn.classList.toggle('text-emerald-400', this.isFocusMode);
            toggleBtn.classList.toggle('text-slate-400', !this.isFocusMode);
            toggleBtn.setAttribute('aria-pressed', this.isFocusMode.toString());
        }

        this.elementsToToggle.forEach((selector) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
                const element = el as HTMLElement;
                if (this.isFocusMode) {
                    element.classList.add('hidden');
                    // Remove common Tailwind display classes that might override 'hidden'
                    element.classList.remove('flex', 'md:flex', 'block', 'md:block', 'grid');
                } else {
                    element.classList.remove('hidden');
                    // Restore original display intent
                    if (selector === '#appSidebar') {
                        element.classList.add('md:flex');
                    } else if (
                        selector.startsWith('#floating') ||
                        selector === '#servicePanel' ||
                        selector === '#selectionInfoPanel'
                    ) {
                        element.classList.add('flex');
                    } else if (selector === '#minimap') {
                        element.classList.add('md:block');
                    }
                }
            });
        });

        // Trigger resize on window to let Cytoscape adjust
        window.dispatchEvent(new Event('resize'));
    }

    private saveState(): void {
        localStorage.setItem(this.STORAGE_KEY, this.isFocusMode.toString());
    }

    private loadState(): void {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        this.isFocusMode = saved === 'true';
    }
}

export const focusModeManager = new FocusModeManager();
