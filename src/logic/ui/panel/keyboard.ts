import { getCurrentSelectedNode, getIsEditMode } from './state';
import { toggleEdit } from './edit';
import { showPanel } from './display';

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

const handleKeyPress = (event: KeyboardEvent): void => {
    // Don't trigger if user is typing in an input field
    if (isEditableTarget(event.target)) return;

    // Check if 'e' key was pressed (without modifier keys)
    if (event.key.toLowerCase() === 'e' && !hasModifierKeys(event)) {
        const currentNode = getCurrentSelectedNode();

        // Only toggle if a node is selected (panel is visible)
        if (currentNode) {
            event.preventDefault();
            const isEditing = getIsEditMode();

            if (isEditing) {
                // Cancel edit mode and refresh panel
                showPanel(currentNode);
            } else {
                // Enter edit mode
                toggleEdit(true);
            }
        }
    }
};

export const registerPanelKeyListener = (): void => {
    if (keyListenerRegistered) return;

    keyListener = handleKeyPress;
    window.addEventListener('keydown', keyListener);
    keyListenerRegistered = true;
};

export const cleanupPanelKeyListener = (): void => {
    if (keyListener) {
        window.removeEventListener('keydown', keyListener);
        keyListener = null;
    }
    keyListenerRegistered = false;
};
