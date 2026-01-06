/**
 * Keyboard handler for search input focus with 'f' key
 * - Single press: Focus search input
 * - Double press (when already focused): Clear text and blur input
 */

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
let lastFKeyPress = 0;
const DOUBLE_TAP_THRESHOLD = 300; // milliseconds

const handleKeyPress = (event: KeyboardEvent): void => {
    // Check if 'f' key was pressed (without modifier keys)
    if (event.key.toLowerCase() === 'f' && !hasModifierKeys(event)) {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
        if (!searchInput) return;

        const now = Date.now();
        const timeSinceLastPress = now - lastFKeyPress;
        
        // Check if we're already focused on the search input
        const isFocusedOnSearch = document.activeElement === searchInput;
        
        if (isFocusedOnSearch && timeSinceLastPress < DOUBLE_TAP_THRESHOLD) {
            // Double tap detected while focused - clear and blur
            event.preventDefault();
            searchInput.value = '';
            // Trigger input event to update any listeners (like filter updates)
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.blur();
            lastFKeyPress = 0; // Reset to prevent triple-tap behavior
        } else if (!isEditableTarget(event.target)) {
            // Single tap from outside any input - focus search
            event.preventDefault();
            searchInput.focus();
            lastFKeyPress = now;
        }
        // If focused on search input (but not double-tap), just update timestamp
        else if (isFocusedOnSearch) {
            lastFKeyPress = now;
        }
    }
};

export const registerSearchKeyListener = (): void => {
    if (keyListenerRegistered) return;
    
    keyListener = handleKeyPress;
    window.addEventListener('keydown', keyListener);
    keyListenerRegistered = true;
};

export const cleanupSearchKeyListener = (): void => {
    if (keyListener) {
        window.removeEventListener('keydown', keyListener);
        keyListener = null;
    }
    keyListenerRegistered = false;
    lastFKeyPress = 0;
};
