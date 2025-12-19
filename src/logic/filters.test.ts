import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyFilters, initFilters } from './filters';

describe('filters logic', () => {
    let mockCy: any;
    let mockNodes: any[];

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="searchInput" />
            <div id="labelFilterContainer"></div>
            <div id="teamFilterContainer"></div>
        `;

        mockNodes = [
            {
                id: () => 's1',
                data: (key?: string) => {
                    const d: any = { id: 's1', name: 'Service One', labels: ['label1'], owner: 'teamA' };
                    return key ? d[key] : d;
                },
                removeClass: vi.fn(),
                addClass: vi.fn(),
                hasClass: vi.fn().mockReturnValue(false)
            },
            {
                id: () => 's2',
                data: (key?: string) => {
                    const d: any = { id: 's2', name: 'Service Two', labels: ['label2'], owner: 'teamB' };
                    return key ? d[key] : d;
                },
                removeClass: vi.fn(),
                addClass: vi.fn(),
                hasClass: vi.fn().mockReturnValue(false)
            }
        ];

        mockCy = {
            nodes: vi.fn().mockReturnValue(mockNodes),
            edges: vi.fn().mockReturnValue([]),
            batch: (cb: any) => cb()
        };

        // Reset module state
        initFilters(null);
    });

    it('filters by search term', () => {
        const input = document.getElementById('searchInput') as HTMLInputElement;
        input.value = 'one';

        applyFilters(mockCy);

        expect(mockNodes[0].removeClass).toHaveBeenCalledWith('filtered');
        expect(mockNodes[1].addClass).toHaveBeenCalledWith('filtered');
    });

    it('filters by labels', () => {
        const container = document.getElementById('labelFilterContainer')!;
        container.innerHTML = '<button data-value="label1" data-selected="true"></button>';

        applyFilters(mockCy);

        expect(mockNodes[0].removeClass).toHaveBeenCalledWith('filtered');
        expect(mockNodes[1].addClass).toHaveBeenCalledWith('filtered');
    });
});
