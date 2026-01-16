import { describe, it, expect } from 'vitest';
import { stylesheet } from './graphConfig';

describe('Graph Configuration', () => {
    it('should have transition properties defined for nodes', () => {
        const nodeStyleResult = stylesheet.find((s) => s.selector === 'node');
        expect(nodeStyleResult).toBeDefined();

        const style = nodeStyleResult!.style as any;
        expect(style['transition-property']).toBeDefined();
        expect(style['transition-duration']).toBe('0.3s');
        expect(style['transition-property']).toContain('opacity');
    });

    it('should have transition properties defined for edges', () => {
        const edgeStyleResult = stylesheet.find((s) => s.selector === 'edge');
        expect(edgeStyleResult).toBeDefined();

        const style = edgeStyleResult!.style as any;
        expect(style['transition-property']).toBeDefined();
        expect(style['transition-duration']).toBe('0.3s');
        expect(style['transition-property']).toContain('opacity');
        expect(style['transition-property']).toContain('width');
    });

    it('should define dimmed class style', () => {
        const dims = stylesheet.find((s) => s.selector.includes('.dimmed'));
        expect(dims).toBeDefined();
        expect((dims!.style as any).opacity).toBeLessThan(1);
    });
});
