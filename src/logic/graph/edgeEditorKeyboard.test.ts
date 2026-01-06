import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerEdgeEditorKeyListener, cleanupEdgeEditorKeyListener } from './edgeEditorKeyboard';
import { toggleEditMode } from './edgeEditor';

// Mock the dependencies
vi.mock('./edgeEditor', () => ({
    toggleEditMode: vi.fn()
}));

describe('Edge Editor Keyboard Shortcuts', () => {
    let updateStatus: any;

    beforeEach(() => {
        vi.clearAllMocks();
        updateStatus = vi.fn();
        
        // Setup DOM
        document.body.innerHTML = `
            <div id="cy"></div>
        `;

        // Register the keyboard listener
        registerEdgeEditorKeyListener(updateStatus);
    });

    afterEach(() => {
        cleanupEdgeEditorKeyListener();
    });

    it('should toggle edit mode when M key is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'm' });
        window.dispatchEvent(event);

        expect(toggleEditMode).toHaveBeenCalledWith(updateStatus);
    });

    it('should toggle edit mode when M key is pressed (uppercase)', () => {
        const event = new KeyboardEvent('keydown', { key: 'M' });
        window.dispatchEvent(event);

        expect(toggleEditMode).toHaveBeenCalledWith(updateStatus);
    });

    it('should not trigger when typing in an input field', () => {
        const input = document.createElement('input');
        document.body.appendChild(input);

        const event = new KeyboardEvent('keydown', { 
            key: 'm',
            bubbles: true 
        });
        Object.defineProperty(event, 'target', { value: input, enumerable: true });
        
        window.dispatchEvent(event);

        expect(toggleEditMode).not.toHaveBeenCalled();
    });

    it('should not trigger when typing in a textarea', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        const event = new KeyboardEvent('keydown', { 
            key: 'm',
            bubbles: true 
        });
        Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
        
        window.dispatchEvent(event);

        expect(toggleEditMode).not.toHaveBeenCalled();
    });

    it('should not trigger when Ctrl+M is pressed', () => {
        const event = new KeyboardEvent('keydown', { 
            key: 'm', 
            ctrlKey: true 
        });
        window.dispatchEvent(event);

        expect(toggleEditMode).not.toHaveBeenCalled();
    });

    it('should not trigger when Alt+M is pressed', () => {
        const event = new KeyboardEvent('keydown', { 
            key: 'm', 
            altKey: true 
        });
        window.dispatchEvent(event);

        expect(toggleEditMode).not.toHaveBeenCalled();
    });

    it('should not trigger when Meta+M is pressed', () => {
        const event = new KeyboardEvent('keydown', { 
            key: 'm', 
            metaKey: true 
        });
        window.dispatchEvent(event);

        expect(toggleEditMode).not.toHaveBeenCalled();
    });

    it('should not trigger when Shift+M is pressed', () => {
        const event = new KeyboardEvent('keydown', { 
            key: 'm', 
            shiftKey: true 
        });
        window.dispatchEvent(event);

        expect(toggleEditMode).not.toHaveBeenCalled();
    });

    it('should cleanup keyboard listener properly', () => {
        cleanupEdgeEditorKeyListener();

        const event = new KeyboardEvent('keydown', { key: 'm' });
        window.dispatchEvent(event);

        // Should not trigger after cleanup
        expect(toggleEditMode).not.toHaveBeenCalled();
    });

    it('should not register listener multiple times', () => {
        // Register again (already registered in beforeEach)
        registerEdgeEditorKeyListener(updateStatus);
        registerEdgeEditorKeyListener(updateStatus);

        const event = new KeyboardEvent('keydown', { key: 'm' });
        window.dispatchEvent(event);

        // Should only be called once
        expect(toggleEditMode).toHaveBeenCalledTimes(1);
    });
});
