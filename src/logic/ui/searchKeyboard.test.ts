import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerSearchKeyListener, cleanupSearchKeyListener } from './searchKeyboard';

describe('Search Input Keyboard Shortcuts', () => {
    let searchInput: HTMLInputElement;

    beforeEach(() => {
        // Setup DOM with search input
        document.body.innerHTML = `
            <input type="text" id="searchInput" placeholder="Search by name..." />
        `;

        searchInput = document.getElementById('searchInput') as HTMLInputElement;

        // Register the keyboard listener
        registerSearchKeyListener();
    });

    afterEach(() => {
        cleanupSearchKeyListener();
        vi.clearAllTimers();
    });

    it('should focus search input when F key is pressed', () => {
        expect(document.activeElement).not.toBe(searchInput);

        const event = new KeyboardEvent('keydown', { key: 'f' });
        window.dispatchEvent(event);

        expect(document.activeElement).toBe(searchInput);
    });

    it('should handle uppercase F key', () => {
        expect(document.activeElement).not.toBe(searchInput);

        const event = new KeyboardEvent('keydown', { key: 'F' });
        window.dispatchEvent(event);

        expect(document.activeElement).toBe(searchInput);
    });

    it('should clear text and blur when F is pressed twice quickly while focused', () => {
        searchInput.value = 'test search';
        searchInput.focus();
        expect(document.activeElement).toBe(searchInput);

        // First F press
        const event1 = new KeyboardEvent('keydown', { key: 'f' });
        window.dispatchEvent(event1);

        expect(document.activeElement).toBe(searchInput);
        expect(searchInput.value).toBe('test search');

        // Second F press within threshold
        const event2 = new KeyboardEvent('keydown', { key: 'f' });
        window.dispatchEvent(event2);

        expect(searchInput.value).toBe('');
        expect(document.activeElement).not.toBe(searchInput);
    });

    it('should not clear and blur if second F press is too slow', async () => {
        searchInput.value = 'test search';
        searchInput.focus();

        // First F press
        const event1 = new KeyboardEvent('keydown', { key: 'f' });
        window.dispatchEvent(event1);

        // Wait longer than threshold (300ms)
        await new Promise((resolve) => setTimeout(resolve, 350));

        // Second F press after threshold
        const event2 = new KeyboardEvent('keydown', { key: 'f' });
        window.dispatchEvent(event2);

        // Should still be focused with text intact
        expect(document.activeElement).toBe(searchInput);
        expect(searchInput.value).toBe('test search');
    });

    it('should not trigger when F is pressed in another input field', () => {
        const otherInput = document.createElement('input');
        otherInput.type = 'text';
        document.body.appendChild(otherInput);
        otherInput.focus();

        const event = new KeyboardEvent('keydown', {
            key: 'f',
            bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: otherInput, enumerable: true });

        window.dispatchEvent(event);

        // Search input should not be focused
        expect(document.activeElement).toBe(otherInput);
        expect(document.activeElement).not.toBe(searchInput);
    });

    it('should not trigger when F is pressed in a textarea', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.focus();

        const event = new KeyboardEvent('keydown', {
            key: 'f',
            bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: textarea, enumerable: true });

        window.dispatchEvent(event);

        // Search input should not be focused
        expect(document.activeElement).toBe(textarea);
        expect(document.activeElement).not.toBe(searchInput);
    });

    it('should not trigger when Ctrl+F is pressed', () => {
        const event = new KeyboardEvent('keydown', {
            key: 'f',
            ctrlKey: true,
        });
        window.dispatchEvent(event);

        // Should not focus search input (browser default Ctrl+F)
        expect(document.activeElement).not.toBe(searchInput);
    });

    it('should not trigger when Alt+F is pressed', () => {
        const event = new KeyboardEvent('keydown', {
            key: 'f',
            altKey: true,
        });
        window.dispatchEvent(event);

        expect(document.activeElement).not.toBe(searchInput);
    });

    it('should not trigger when Meta+F (Cmd+F) is pressed', () => {
        const event = new KeyboardEvent('keydown', {
            key: 'f',
            metaKey: true,
        });
        window.dispatchEvent(event);

        expect(document.activeElement).not.toBe(searchInput);
    });

    it('should trigger input event when clearing text on double-tap', () => {
        const inputEventSpy = vi.fn();
        searchInput.addEventListener('input', inputEventSpy);

        searchInput.value = 'test search';
        searchInput.focus();

        // Double tap F
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));

        // Input event should be triggered (for filter updates)
        expect(inputEventSpy).toHaveBeenCalled();
        expect(searchInput.value).toBe('');
    });

    it('should cleanup keyboard listener properly', () => {
        cleanupSearchKeyListener();

        const event = new KeyboardEvent('keydown', { key: 'f' });
        window.dispatchEvent(event);

        // Should not trigger after cleanup
        expect(document.activeElement).not.toBe(searchInput);
    });

    it('should not register listener multiple times', () => {
        // Register again (already registered in beforeEach)
        registerSearchKeyListener();
        registerSearchKeyListener();

        const focusSpy = vi.spyOn(searchInput, 'focus');

        const event = new KeyboardEvent('keydown', { key: 'f' });
        window.dispatchEvent(event);

        // Should only be called once
        expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle case where search input does not exist', () => {
        // Remove search input
        searchInput.remove();

        // Should not throw error
        const event = new KeyboardEvent('keydown', { key: 'f' });
        expect(() => window.dispatchEvent(event)).not.toThrow();
    });

    it('should reset double-tap timer after successful double-tap', () => {
        searchInput.value = 'test';
        searchInput.focus();

        // First double-tap
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));

        expect(searchInput.value).toBe('');
        expect(document.activeElement).not.toBe(searchInput);

        // Try another F press immediately - should focus, not try to double-tap
        searchInput.value = 'new text';
        const event = new KeyboardEvent('keydown', { key: 'f' });
        window.dispatchEvent(event);

        expect(document.activeElement).toBe(searchInput);
        expect(searchInput.value).toBe('new text'); // Should not clear
    });
});
