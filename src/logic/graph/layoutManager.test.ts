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
        // Mock 120 nodes -> 120/60 = 2.0
        mockCollection.length = 120;
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
    it('configures concentric layout with tier sorting and handles selective/missing data', () => {
        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;

        const option = document.createElement('option');
        option.value = 'concentric';
        select.appendChild(option);
        select.value = 'concentric';

        // Mock nodes with different tiers
        const tier1Node = {
            id: () => 'srv-1',
            data: (key: string) => (key === 'tier' ? 1 : null),
            degree: () => 5,
        } as any;
        const tier4Node = {
            id: () => 'srv-4',
            data: (key: string) => (key === 'tier' ? 4 : null),
            degree: () => 0,
        } as any;
        const noTierNode = {
            id: () => 'srv-none',
            data: () => null,
            degree: () => 10,
        } as any;

        select.dispatchEvent(new Event('change'));

        const callArg = mockCy.layout.mock.calls.at(-1)[0];
        expect(callArg.name).toBe('concentric');
        expect(callArg.levelWidth()).toBe(3);

        // Tier 1: (5 - 1) * 10 + (5 / 20) = 40.25
        expect(callArg.concentric(tier1Node)).toBeCloseTo(40.25);
        // Tier 4: (5 - 4) * 10 + (0 / 20) = 10.0
        expect(callArg.concentric(tier4Node)).toBeCloseTo(10.0);
        // Default tier 4: (5 - 4) * 10 + (10 / 20) = 10.5
        expect(callArg.concentric(noTierNode)).toBeCloseTo(10.5);
    });

    it('places selected node at absolute center in concentric layout', () => {
        const selectedNodeId = 'srv-center';
        // Mock cy.nodes(':selected') to return the center node
        const centerNode = {
            id: () => selectedNodeId,
            data: vi.fn(),
            degree: vi.fn(),
        } as any;

        mockCy.nodes = vi.fn((selector) => {
            if (selector === ':selected') {
                return { length: 1, 0: centerNode };
            }
            return mockCollection;
        });

        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;
        const option = document.createElement('option');
        option.value = 'concentric';
        select.appendChild(option);
        select.value = 'concentric';

        select.dispatchEvent(new Event('change'));

        const callArg = mockCy.layout.mock.calls.at(-1)[0];
        expect(callArg.concentric(centerNode)).toBe(1000);
    });

    it('caps concentric spacingFactor at 1.5', () => {
        // Mock 120 nodes -> 120/60 = 2.0, but should be capped at 1.5 for concentric
        mockCollection.length = 120;
        mockCy.nodes.mockReturnValue(mockCollection);

        initLayoutManager(mockCy);
        const select = document.getElementById('layoutSelect') as HTMLSelectElement;
        const option = document.createElement('option');
        option.value = 'concentric';
        select.appendChild(option);
        select.value = 'concentric';

        select.dispatchEvent(new Event('change'));

        expect(mockCy.layout).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'concentric',
                spacingFactor: 1.5,
            })
        );
    });
});
