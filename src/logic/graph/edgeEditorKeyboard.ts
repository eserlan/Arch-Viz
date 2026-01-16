import { toggleEditMode } from './edgeEditor';

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
};

const hasModifierKeys = (event: KeyboardEvent): boolean => {
    return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
};

let keyListenerRegistered = false;
let keyListener: ((event: KeyboardEvent) => void) | null = null;
let updateStatusCallback: ((msg: string) => void) | null = null;

const handleKeyPress = (event: KeyboardEvent): void => {
    // Don't trigger if user is typing in an input field
    if (isEditableTarget(event.target)) return;

    // Check if 'm' key was pressed (without modifier keys)
    if (event.key.toLowerCase() === 'm' && !hasModifierKeys(event)) {
        event.preventDefault();
        if (updateStatusCallback) {
            toggleEditMode(updateStatusCallback);
        }
    }
};

/**
 * Registers a global keyboard listener for the M key to toggle edge editor mode.
 * This is registered once per page load and persists across graph reloads.
 * The guard (keyListenerRegistered) prevents duplicate registration if called multiple times.
 */
export const registerEdgeEditorKeyListener = (updateStatus: (msg: string) => void): void => {
    if (keyListenerRegistered) return;

    updateStatusCallback = updateStatus;
    keyListener = handleKeyPress;
    window.addEventListener('keydown', keyListener);
    keyListenerRegistered = true;
};

export const cleanupEdgeEditorKeyListener = (): void => {
    if (keyListener) {
        window.removeEventListener('keydown', keyListener);
        keyListener = null;
    }
    updateStatusCallback = null;
    keyListenerRegistered = false;
};
