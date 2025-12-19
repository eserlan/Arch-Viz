import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showToast } from './ui';

describe('UI utilities', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="toastContainer"></div>';
        vi.useFakeTimers();
    });

    it('shows a toast message', () => {
        showToast('Hello world', 'success');
        const container = document.getElementById('toastContainer')!;
        expect(container.textContent).toContain('Hello world');
        expect(container.firstChild).toBeDefined();
    });

    it('removes toast after timeout', () => {
        showToast('Goodbye', 'info');
        const container = document.getElementById('toastContainer')!;

        vi.advanceTimersByTime(3500);
        // Toast is removed after 3s + 300ms animation
        expect(container.children.length).toBe(0);
    });
});
