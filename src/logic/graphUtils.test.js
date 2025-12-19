import { describe, it, expect, vi } from 'vitest';
import { getNodesAtDepth } from './graphUtils';

// Mock helper to create a mock collection
const createMockCollection = (id, neighbors = []) => {
    return {
        id: () => id,
        neighborhood: () => {
            // Return mock collection of neighbors
            // For simplicity, we just return a collection with an 'union' method
            const neighborCollection = {
                ids: neighbors.map(n => n.id()),
                isCollection: true
            };
            return neighborCollection;
        },
        union: (other) => {
            // Merge logic would go here, but for unit detection we can just verify calls?
            // Since the function relies on the return value of union being used in the next loop,
            // we need slightly better mocks.
            return createMockCollection(id + '+union');
        },
        contains: (node) => node.id() === id
    };
};

describe('getNodesAtDepth', () => {
    it('should return node itself for depth 0 (or handled logic)', () => {
        // Our logic starts with node.
        const node = { neighborhood: vi.fn(), union: vi.fn() };
        // getNodesAtDepth implementation loop: for(i=0; i<depth; i++)
        // If depth is 0 (not likely from UI '1'), loop doesn't run.
        // It returns highlightCollection which init as node.

        const res = getNodesAtDepth(node, 0);
        expect(res).toBe(node);
        expect(node.neighborhood).not.toHaveBeenCalled();
    });

    it('should call neighborhood once for depth 1', () => {
        const unionMock = vi.fn().mockReturnValue('unionResult');
        const neighborhoodMock = vi.fn().mockReturnValue('neighbors');

        const node = {
            neighborhood: neighborhoodMock,
            union: unionMock
        };

        const res = getNodesAtDepth(node, 1);

        expect(neighborhoodMock).toHaveBeenCalledTimes(1);
        expect(unionMock).toHaveBeenCalledWith('neighbors');
        expect(res).toBe('unionResult');
    });

    it('should iterate for depth 2', () => {
        // Mock chain
        // Iteration 1: col = col.union(col.neighborhood())
        // Iteration 2: col = col.union(col.neighborhood())

        const node = {
            neighborhood: vi.fn().mockReturnValue('neighbors1'),
            union: vi.fn().mockReturnValue({
                neighborhood: vi.fn().mockReturnValue('neighbors2'),
                union: vi.fn().mockReturnValue('finalResult')
            })
        };

        const res = getNodesAtDepth(node, 2);

        expect(res).toBe('finalResult');
    });

    it('should handle "all" depth using components', () => {
        const node = { id: () => 'target' };

        const componentWithNode = { contains: (n) => n === node, type: 'component' };
        const componentWithoutNode = { contains: (n) => false };

        const cyMock = {
            elements: () => ({
                components: () => [componentWithoutNode, componentWithNode]
            })
        };

        const res = getNodesAtDepth(node, 'all', cyMock);

        expect(res).toBe(componentWithNode);
    });

    it('should fallback to passed node if "all" finds no component (edge case)', () => {
        const node = { id: () => 'target' };
        const cyMock = {
            elements: () => ({
                components: () => []
            })
        };
        const res = getNodesAtDepth(node, 'all', cyMock);
        expect(res).toBe(node);
    });
});
