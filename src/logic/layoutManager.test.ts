import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initLayoutManager } from './layoutManager';

describe('layoutManager logic', () => {
    let mockCy: any;
    let mockLayout: any;

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="layoutSelect">
                <option value="fcose">fCoSE</option>
                <option value="dagre-horizontal">Dagre Horizontal</option>
            </select>
        `;
        mockLayout = {
            one: vi.fn(),
            run: vi.fn()
        };
        mockCy = {
            layout: vi.fn().mockReturnValue(mockLayout),
            animate: vi.fn(),
            nodes: vi.fn().mockReturnValue({ length: 0 })
        };
    });

    it('triggers layout change on select change', () => {
        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;
        select.value = 'dagre-horizontal';
        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(expect.objectContaining({
            name: 'dagre',
            rankDir: 'LR'
        }));
        expect(mockLayout.run).toHaveBeenCalled();
    });

    it('handles fcose specifically', () => {
        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;
        select.value = 'fcose';
        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(expect.objectContaining({
            name: 'fcose'
        }));
    });
});
