import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showPanel, hidePanel } from './panel';

describe('Panel Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="servicePanel" class="">
        <div id="panelContent"></div>
        <button id="editBtn" class=""></button>
        <div id="editActions" class="hidden"></div>
      </div>
    `;
    });

    it('should update panel content with node data', () => {
        const mockNode = {
            data: () => ({
                id: 'test-id',
                label: 'Test Label',
                domain: 'Test Domain',
                tier: '1',
                owner: 'Test Owner',
                repoUrl: 'http://test.com'
            })
        };

        showPanel(mockNode);

        const content = document.getElementById('panelContent');
        const panel = document.getElementById('servicePanel');

        expect(content.innerHTML).toContain('test-id');
        expect(content.innerHTML).toContain('Test Label');
        expect(panel.classList.contains('active')).toBe(true);
    });

    it('should hide panel and clear state', () => {
        const panel = document.getElementById('servicePanel');
        panel.classList.add('active');

        hidePanel();

        expect(panel.classList.contains('active')).toBe(false);
    });
});
