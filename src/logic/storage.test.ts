import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGraphData, loadGraphData, exportToCSV } from './storage';

describe('storage logic', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('saves and loads graph data', () => {
        const data: any[] = [{ group: 'nodes', data: { id: 'n1' } }];
        saveGraphData(data);

        const loaded = loadGraphData();
        expect(loaded).toEqual(data);
    });

    it('exports to CSV correctly', () => {
        const mockCy: any = {
            nodes: () => [
                { id: () => 'n1', data: () => ({ id: 'n1', name: 'N1', tier: '1' }) }
            ],
            edges: () => []
        };

        const csv = exportToCSV(mockCy);
        expect(csv).toContain('id,name,labels,tier,depends_on,owner,repo_url');
        expect(csv).toContain('n1,N1,,1,,,');
    });
});
