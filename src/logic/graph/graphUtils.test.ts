import { describe, it, expect, vi } from 'vitest';
import { getNodesAtDepth } from './graphUtils';
import { CyInstance } from '../../types';

describe('getNodesAtDepth', () => {
    it('should return node itself for depth 0', () => {
        const node = { neighborhood: vi.fn(), union: vi.fn() } as any;
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
        } as any;

        const res = getNodesAtDepth(node, 1);

        expect(neighborhoodMock).toHaveBeenCalledTimes(1);
        expect(unionMock).toHaveBeenCalledWith('neighbors');
        expect(res).toBe('unionResult');
    });

    it('should iterate for depth 2', () => {
        const node = {
            neighborhood: vi.fn().mockReturnValue('neighbors1'),
            union: vi.fn().mockReturnValue({
                neighborhood: vi.fn().mockReturnValue('neighbors2'),
                union: vi.fn().mockReturnValue('finalResult')
            })
        } as any;

        const res = getNodesAtDepth(node, 2);

        expect(res).toBe('finalResult');
    });

    it('should handle "all" depth using components', () => {
        const node = { id: () => 'target' } as any;

        const componentWithNode = { contains: (n: any) => n === node, type: 'component' };
        const componentWithoutNode = { contains: (_n: any) => false };

        const cyMock = {
            elements: () => ({
                components: () => [componentWithoutNode, componentWithNode]
            })
        } as unknown as CyInstance;

        const res = getNodesAtDepth(node, 'all', cyMock);

        expect(res).toBe(componentWithNode);
    });

    it('should fallback to passed node if "all" finds no component', () => {
        const node = { id: () => 'target' } as any;
        const cyMock = {
            elements: () => ({
                components: () => []
            })
        } as unknown as CyInstance;
        const res = getNodesAtDepth(node, 'all', cyMock);
        expect(res).toBe(node);
    });
});
