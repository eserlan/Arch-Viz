import { describe, it, expect } from 'vitest';
import { parseCSV } from './parser';

describe('CSV Parser', () => {
    it('should parse a basic CSV with all required fields', () => {
        const csv = `id,label,domain,tier,depends_on,owner,repo_url
service-a,Service A,Domain A,1,service-b,Owner A,http://repo-a`;

        const { elements, skipped } = parseCSV(csv);

        expect(skipped).toBe(0);
        expect(elements).toHaveLength(2); // 1 node, 1 edge

        const node = elements.find(el => el.group === 'nodes');
        expect(node.data.id).toBe('service-a');
        expect(node.data.domains).toEqual(['Domain A']);
        expect(node.classes).toContain('tier-1');
        expect(node.classes).toContain('domain-domain-a');
    });

    it('should handle multi-domain services', () => {
        const csv = `id,label,domain,tier,depends_on
auth,Auth Service,Security;Identity,1,`;

        const { elements } = parseCSV(csv);
        const node = elements[0];

        expect(node.data.domains).toEqual(['Security', 'Identity']);
        expect(node.classes).toContain('domain-security');
        expect(node.classes).toContain('domain-identity');
    });

    it('should detect database nodes', () => {
        const csv = `id,label,domain,tier
user-db,User Storage,Database,1
payment-proxy,Payments,Payment,2`;

        const { elements } = parseCSV(csv);

        const dbNode = elements.find(n => n.data.id === 'user-db');
        const normalNode = elements.find(n => n.data.id === 'payment-proxy');

        expect(dbNode.classes).toContain('is-database');
        expect(normalNode.classes).not.toContain('is-database');
    });

    it('should skip invalid rows', () => {
        const csv = `id,label,domain,tier
service-valid,Label,Domain,1
,,Missing,3`;

        const { elements, skipped } = parseCSV(csv);

        expect(elements).toHaveLength(1);
        expect(skipped).toBe(1);
    });

    it('should handle multiple dependencies', () => {
        const csv = `id,label,domain,tier,depends_on
service-a,A,D,1,service-b;service-c`;

        const { elements } = parseCSV(csv);
        const edges = elements.filter(el => el.group === 'edges');

        expect(edges).toHaveLength(2);
        expect(edges[0].data.target).toBe('service-b');
        expect(edges[1].data.target).toBe('service-c');
    });
});
