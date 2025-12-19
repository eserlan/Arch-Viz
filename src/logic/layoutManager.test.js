import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initLayoutManager } from './layoutManager';
import * as ui from './ui';

vi.mock('./ui', () => ({
    updateStatus: vi.fn()
}));

describe('Layout Manager Logic', () => {
    let mockCy;
    let mockLayout;

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="layoutSelect">
                <option value="fcose">fCoSE</option>
                <option value="dagre-horizontal">Horizontal</option>
            </select>
        `;

        mockLayout = {
            one: vi.fn(),
            run: vi.fn()
        };

        mockCy = {
            layout: vi.fn(() => mockLayout),
            animate: vi.fn()
        };

        vi.clearAllMocks();
    });

    it('should trigger layout change when select value changes', () => {
        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect');

        select.value = 'dagre-horizontal';
        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(expect.objectContaining({
            name: 'dagre',
            rankDir: 'LR'
        }));
        expect(mockLayout.run).toHaveBeenCalled();
        expect(ui.updateStatus).toHaveBeenCalledWith(expect.stringContaining('dagre'));
    });

    it('should use custom fcose config when selected', () => {
        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect');

        select.value = 'fcose';
        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(expect.objectContaining({
            name: 'fcose'
        }));
    });
});
