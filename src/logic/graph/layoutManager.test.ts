import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initLayoutManager } from './layoutManager';

describe('layoutManager logic', () => {
    let mockCy: Record<string, any>;
    let mockLayout: Record<string, any>;
    let mockCollection: Record<string, any>;

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="layoutSelect">
                <option value="fcose">fCoSE</option>
                <option value="dagre-horizontal">Dagre Horizontal</option>
            </select>
            <select id="groupingSelect">
                <option value="none" selected>None</option>
            </select>
        `;

        mockLayout = {
            one: vi.fn(),
            run: vi.fn(),
        };

        mockCollection = {
            length: 0,
            forEach: vi.fn(),
            remove: vi.fn(),
            move: vi.fn(),
            data: vi.fn().mockReturnValue(false),
            toggleClass: vi.fn(),
            toArray: vi.fn().mockReturnValue([]),
        };

        mockCy = {
            layout: vi.fn().mockReturnValue(mockLayout),
            animate: vi.fn(),
            nodes: vi.fn().mockReturnValue(mockCollection),
            elements: vi.fn().mockReturnValue(mockCollection),
        };
    });

    it('triggers layout change on select change', () => {
        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;
        select.value = 'dagre-horizontal';
        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'dagre',
                rankDir: 'LR',
            })
        );
        expect(mockLayout.run).toHaveBeenCalled();
    });

    it('handles fcose specifically', () => {
        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;
        select.value = 'fcose';
        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'fcose',
            })
        );
    });

    it('calculates dynamic spacingFactor for circle layout', () => {
        // Mock 100 nodes -> 100/50 = 2.0
        mockCollection.length = 100;
        mockCy.nodes.mockReturnValue(mockCollection);

        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;

        // Add circle option to the select mock
        const option = document.createElement('option');
        option.value = 'circle';
        select.appendChild(option);
        select.value = 'circle';

        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'circle',
                spacingFactor: 2.0,
            })
        );
    });

    it('caps dynamic spacingFactor at 2.5', () => {
        // Mock 200 nodes -> 200/50 = 4.0, but should be capped at 2.5
        mockCollection.length = 200;
        mockCy.nodes.mockReturnValue(mockCollection);

        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;

        const option = document.createElement('option');
        option.value = 'circle';
        select.appendChild(option);
        select.value = 'circle';

        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(
            expect.objectContaining({
                spacingFactor: 2.5,
            })
        );
    });
});
