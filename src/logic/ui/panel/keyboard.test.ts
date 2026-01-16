import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerPanelKeyListener, cleanupPanelKeyListener } from './keyboard';
import { toggleEdit } from './edit';
import { showPanel } from './display';
import { setSelectedNode, setIsEditMode } from './state';

// Mock the dependencies
vi.mock('./edit', () => ({
    toggleEdit: vi.fn(),
}));

vi.mock('./display', () => ({
    showPanel: vi.fn(),
}));

describe('Panel Keyboard Shortcuts', () => {
    let mockNode: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup DOM
        document.body.innerHTML = `
            <div id="servicePanel" class="">
                <div id="panelContent"></div>
                <button id="editBtn"></button>
                <div id="editActions" class="hidden"></div>
            </div>
        `;

        // Create a mock node
        mockNode = {
            data: () => ({ id: 'test-id', name: 'Test Service' }),
            id: () => 'test-id',
        };

        // Register the keyboard listener
        registerPanelKeyListener();
    });

    afterEach(() => {
        cleanupPanelKeyListener();
    });

    it('should toggle edit mode when E key is pressed with a selected node', () => {
        setSelectedNode(mockNode);
        setIsEditMode(false);

        const event = new KeyboardEvent('keydown', { key: 'e' });
        window.dispatchEvent(event);

        expect(toggleEdit).toHaveBeenCalledWith(true);
    });

    it('should exit edit mode when E key is pressed while in edit mode', () => {
        setSelectedNode(mockNode);
        setIsEditMode(true);

        const event = new KeyboardEvent('keydown', { key: 'e' });
        window.dispatchEvent(event);

        expect(showPanel).toHaveBeenCalledWith(mockNode);
    });

    it('should not toggle edit mode when no node is selected', () => {
        setSelectedNode(null);

        const event = new KeyboardEvent('keydown', { key: 'e' });
        window.dispatchEvent(event);

        expect(toggleEdit).not.toHaveBeenCalled();
        expect(showPanel).not.toHaveBeenCalled();
    });

    it('should not trigger when typing in an input field', () => {
        setSelectedNode(mockNode);
        setIsEditMode(false);

        const input = document.createElement('input');
        document.body.appendChild(input);

        const event = new KeyboardEvent('keydown', {
            key: 'e',
            bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: input, enumerable: true });

        window.dispatchEvent(event);

        expect(toggleEdit).not.toHaveBeenCalled();
    });

    it('should not trigger when typing in a textarea', () => {
        setSelectedNode(mockNode);
        setIsEditMode(false);

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        const event = new KeyboardEvent('keydown', {
            key: 'e',
            bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: textarea, enumerable: true });

        window.dispatchEvent(event);

        expect(toggleEdit).not.toHaveBeenCalled();
    });

    it('should not trigger when Ctrl+E is pressed', () => {
        setSelectedNode(mockNode);
        setIsEditMode(false);

        const event = new KeyboardEvent('keydown', {
            key: 'e',
            ctrlKey: true,
        });
        window.dispatchEvent(event);

        expect(toggleEdit).not.toHaveBeenCalled();
    });

    it('should not trigger when Alt+E is pressed', () => {
        setSelectedNode(mockNode);
        setIsEditMode(false);

        const event = new KeyboardEvent('keydown', {
            key: 'e',
            altKey: true,
        });
        window.dispatchEvent(event);

        expect(toggleEdit).not.toHaveBeenCalled();
    });

    it('should handle uppercase E key', () => {
        setSelectedNode(mockNode);
        setIsEditMode(false);

        const event = new KeyboardEvent('keydown', { key: 'E' });
        window.dispatchEvent(event);

        expect(toggleEdit).toHaveBeenCalledWith(true);
    });

    it('should cleanup keyboard listener properly', () => {
        setSelectedNode(mockNode);
        setIsEditMode(false);

        cleanupPanelKeyListener();

        const event = new KeyboardEvent('keydown', { key: 'e' });
        window.dispatchEvent(event);

        // Should not trigger after cleanup
        expect(toggleEdit).not.toHaveBeenCalled();
    });

    it('should not register listener multiple times', () => {
        // Register again (already registered in beforeEach)
        registerPanelKeyListener();
        registerPanelKeyListener();

        setSelectedNode(mockNode);
        setIsEditMode(false);

        const event = new KeyboardEvent('keydown', { key: 'e' });
        window.dispatchEvent(event);

        // Should only be called once
        expect(toggleEdit).toHaveBeenCalledTimes(1);
    });
});
