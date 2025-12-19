import { describe, it, expect } from 'vitest';
import { parseCSV } from './parser';

describe('CSV Parser', () => {
    it('parses basic CSV correctly', () => {
        const csv = 'id,name,tier,owner\ns1,Service 1,1,Team A';
        const result = parseCSV(csv);

        expect(result.elements).toHaveLength(1);
        const node = (result.elements as any[])[0];
        expect(node.data.id).toBe('s1');
        expect(node.data.name).toBe('Service 1');
        expect(node.data.tier).toBe('1');
    });

    it('handles dependencies', () => {
        const csv = 'id,name,depends_on\ns1,S1,s2\ns2,S2,';
        const result = parseCSV(csv);

        // 2 nodes + 1 edge
        expect(result.elements).toHaveLength(3);
        const edge = (result.elements as any[]).find(e => e.group === 'edges');
        expect(edge.data.source).toBe('s1');
        expect(edge.data.target).toBe('s2');
    });

    it('returns error for invalid CSV', () => {
        const result = parseCSV('');
        expect(result.error).toBeDefined();
    });
});
