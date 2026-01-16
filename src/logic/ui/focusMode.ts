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
            const elementId = selector.startsWith('#') ? selector.slice(1) : selector;
            const element = document.getElementById(elementId) as HTMLElement | null;

            if (!element) return;

            element.classList.toggle('focus-mode-hidden', this.isFocusMode);
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
