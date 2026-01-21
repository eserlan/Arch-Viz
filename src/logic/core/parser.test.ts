import { describe, it, expect } from 'vitest';
import { parseCSV } from './parser';

describe('CSV Parser', () => {
    it('should parse a basic CSV with all required fields', async () => {
        const csv = `id,name,labels,tier,depends_on,owner,repo_url
service-a,Service A,Label A,1,service-b,Owner A,http://repo-a`;

        const { elements, skipped, error } = await parseCSV(csv);

        expect(error).toBeUndefined();
        expect(skipped).toBe(0);
        expect(elements).toHaveLength(2); // 1 node, 1 edge

        const node = (elements as any[]).find((el) => el.group === 'nodes');
        expect(node.data.id).toBe('service-a');
        expect(node.data.name).toBe('Service A');
        expect(node.data.labels).toEqual(['Label A']);
        expect(node.classes).toContain('tier-1');
        expect(node.classes).toContain('label-label-a');
    });

    it('should handle multi-label services', async () => {
        const csv = `id,name,labels,tier,depends_on
auth,Auth Service,Security;Identity,1,`;

        const { elements } = await parseCSV(csv);
        const node = (elements as any[])[0];

        expect(node.data.labels).toEqual(['Security', 'Identity']);
        expect(node.classes).toContain('label-security');
        expect(node.classes).toContain('label-identity');
    });

    it('should detect database nodes', async () => {
        const csv = `id,name,labels,tier
user-db,User Storage,Database,1
payment-proxy,Payments,Payment,2`;

        const { elements } = await parseCSV(csv);

        const dbNode = (elements as any[]).find((n) => n.data.id === 'user-db');
        const normalNode = (elements as any[]).find((n) => n.data.id === 'payment-proxy');

        expect(dbNode.classes).toContain('is-database');
        expect(normalNode.classes).not.toContain('is-database');
    });

    it('should skip invalid rows missing required fields', async () => {
        const csv = `id,name,labels,tier
service-valid,Label,Tags,1
,,Missing,3`;

        const { elements, skipped } = await parseCSV(csv);

        expect(elements).toHaveLength(1);
        expect(skipped).toBe(1);
    });

    it('should handle multiple dependencies', async () => {
        const csv = `id,name,labels,tier,depends_on
service-a,A,D,1,service-b;service-c`;

        const { elements } = await parseCSV(csv);
        const edges = (elements as any[]).filter((el) => el.group === 'edges');

        expect(edges).toHaveLength(2);
        expect(edges[0].data.target).toBe('service-b');
        expect(edges[1].data.target).toBe('service-c');
    });

    it('should support legacy column names (label, domain)', async () => {
        const csv = `id,label,domain,tier,depends_on
legacy-srv,Legacy Service,OldDomain,2,`;

        const { elements, skipped, error } = await parseCSV(csv);

        expect(error).toBeUndefined();
        expect(skipped).toBe(0);
        const node = (elements as any[])[0];
        expect(node.data.name).toBe('Legacy Service');
        expect(node.data.labels).toEqual(['OldDomain']);
    });

    it('should return error for empty CSV', async () => {
        const { error, hints } = await parseCSV('');

        expect(error).toBe('Empty or invalid file');
        expect(hints as string[]).toContain('The file appears to be empty.');
    });

    it('should return error for missing required columns', async () => {
        const csv = `foo,bar,baz
1,2,3`;

        const { error, hints, elements } = await parseCSV(csv);

        expect(error).toBe('Missing required columns');
        expect(hints as string[]).toContain(
            "Missing 'id' column - each service needs a unique identifier."
        );
        expect(hints as string[]).toContain(
            "Missing 'name' (or 'label') column - each service needs a display name."
        );
        expect(elements).toHaveLength(0);
    });

    it('should return error when all rows are skipped', async () => {
        const csv = `id,name,labels,tier
,,NoId,1
,NoName,,2`;

        const { error, hints, skipped } = await parseCSV(csv);

        expect(error).toBe('No valid services found');
        expect(skipped).toBe(2);
        expect(hints as string[]).toContain("Each row needs at least 'id' and 'name' values.");
    });

    it('should parse comments correctly', async () => {
        const csv = `id,name,comment
service-a,Service A,"This is a comment"
service-b,Service B,"Multiline
comment"`;
        const { elements } = await parseCSV(csv);

        expect(elements).toHaveLength(2);
        const nodeA = (elements as any[]).find((n) => n.data.id === 'service-a');
        const nodeB = (elements as any[]).find((n) => n.data.id === 'service-b');

        expect(nodeA.data.comment).toBe('This is a comment');
        expect(nodeB.data.comment).toContain('Multiline\ncomment');
    });
});
