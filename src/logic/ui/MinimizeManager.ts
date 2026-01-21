import { ICONS } from '../graph/icons';

/**
 * Configuration for MinimizeManager
 */
export interface MinimizeConfig {
    /** The panel element to add/remove the 'minimized' class from */
    panel: HTMLElement;
    /** The button element that toggles the minimized state */
    button: HTMLElement;
    /** The localStorage key to persist the state */
    storageKey: string;
}

/**
 * A reusable utility for managing the minimize/restore state of UI panels.
 * Handles:
 * - Toggling the 'minimized' class on the panel
 * - Updating the button icon (MINIMIZE <-> RESTORE)
 * - Persisting state to localStorage
 */
export class MinimizeManager {
    private panel: HTMLElement;
    private button: HTMLElement;
    private storageKey: string;
    private minimized: boolean = false;

    constructor(config: MinimizeConfig) {
        this.panel = config.panel;
        this.button = config.button;
        this.storageKey = config.storageKey;
    }

    init(): void {
        this.minimized = localStorage.getItem(this.storageKey) === 'true';
        this.updateUI();
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        // Attach manager to panel for external access
        (this.panel as HTMLElement & { minimizeManager?: MinimizeManager }).minimizeManager = this;
    }

    /**
     * Toggle the minimized state.
     */
    toggle(): void {
        this.setMinimized(!this.minimized);
    }

    /**
     * Set the minimized state explicitly.
     */
    setMinimized(value: boolean): void {
        if (this.minimized === value) return;
        this.minimized = value;
        localStorage.setItem(this.storageKey, this.minimized.toString());
        this.updateUI();
    }

    /**
     * Get the current minimized state.
     */
    isMinimized(): boolean {
        return this.minimized;
    }

    /**
     * Update the panel class and button icon based on the current state.
     */
    private updateUI(): void {
        this.panel.classList.toggle('minimized', this.minimized);
        this.button.innerHTML = this.minimized ? ICONS.RESTORE : ICONS.MINIMIZE;

        // Dispatch event for external sync
        this.panel.dispatchEvent(
            new CustomEvent('panel-state-change', {
                detail: { minimized: this.minimized, panelId: this.panel.id },
                bubbles: true,
            })
        );
    }
}
