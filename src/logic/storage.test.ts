import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGraphData, loadGraphData, clearGraphData, getDirtyState, setDirty, exportToCSV, downloadCSV } from './storage';
import { CyInstance } from '../types';

describe('Storage Module', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should save data to localStorage', () => {
        const data: any[] = [{ data: { id: 'test' } }];
        saveGraphData(data);

        expect(localStorage.getItem('arch-viz-elements')).toBe(JSON.stringify(data));
    });

    it('should load data from localStorage', () => {
        const data: any[] = [{ data: { id: 'test-load' } }];
        localStorage.setItem('arch-viz-elements', JSON.stringify(data));

        const loaded = loadGraphData();
        expect(loaded).toEqual(data);
    });

    it('should return null if no data exists', () => {
        const loaded = loadGraphData();
        expect(loaded).toBeNull();
    });

    it('should clear data from localStorage', () => {
        localStorage.setItem('arch-viz-elements', 'some-data');
        clearGraphData();

        expect(localStorage.getItem('arch-viz-elements')).toBeNull();
    });

    it('should set dirty state to true when saving data', () => {
        const data: any[] = [{ data: { id: 'test' } }];
        saveGraphData(data);

        expect(getDirtyState()).toBe(true);
        expect(localStorage.getItem('arch-viz-dirty')).toBe('true');
    });

    it('should clear dirty state when clearing data', () => {
        setDirty(true);
        expect(getDirtyState()).toBe(true);

        clearGraphData();
        expect(getDirtyState()).toBe(false);
        expect(localStorage.getItem('arch-viz-dirty')).toBeNull();
    });

    it('should toggle dirty state manually via setDirty', () => {
        expect(getDirtyState()).toBe(false);

        setDirty(true);
        expect(getDirtyState()).toBe(true);

        setDirty(false);
        expect(getDirtyState()).toBe(false);
    });

    it('should dispatch dirty-state-change event when setDirty is called', () => {
        const handler = vi.fn();
        window.addEventListener('dirty-state-change', handler);

        setDirty(true);

        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: { isDirty: true }
            })
        );

        window.removeEventListener('dirty-state-change', handler);
    });

    it('should export graph to CSV format', () => {
        // Mock Cytoscape instance
        const mockCy = {
            nodes: () => [
                {
                    data: (key?: string) => {
                        const d: any = { id: 'svc-a', name: 'Service A', labels: ['Core'], tier: '1', owner: 'Team A', repoUrl: 'http://example.com' };
                        return key ? d[key] : d;
                    },
                    id: () => 'svc-a'
                },
                {
                    data: (key?: string) => {
                        const d: any = { id: 'svc-b', name: 'Service B', labels: ['Auth'], tier: '2', owner: 'Team B', repoUrl: '' };
                        return key ? d[key] : d;
                    },
                    id: () => 'svc-b'
                }
            ],
            edges: () => [
                {
                    source: () => ({ id: () => 'svc-a' }),
                    target: () => ({ id: () => 'svc-b' })
                }
            ]
        } as unknown as CyInstance;

        const csv = exportToCSV(mockCy);
        const lines = csv.split('\n');

        expect(lines[0]).toBe('id,name,labels,tier,depends_on,owner,repo_url,verified');
        expect(lines[1]).toContain('svc-a');
        expect(lines[1]).toContain('Service A');
        expect(lines[1]).toContain('svc-b'); // depends_on
    });

    it('should generate timestamped filename in downloadCSV', () => {
        // Mock document.createElement and URL methods
        const mockLink = {
            href: '',
            download: '',
            click: vi.fn()
        };
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tag) => {
            if (tag === 'a') return mockLink as any;
            return originalCreateElement(tag);
        });
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { });

        const mockCy = {
            nodes: () => [],
            edges: () => []
        } as unknown as CyInstance;

        downloadCSV(mockCy);

        // Verify filename format: services-YYYY-MM-DD-HHmmss.csv
        expect(mockLink.download).toMatch(/^services-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/);
        expect(mockLink.click).toHaveBeenCalled();

        // Cleanup
        vi.restoreAllMocks();
    });

    it('should reset dirty state after downloading CSV', () => {
        const mockLink = { href: '', download: '', click: vi.fn() };
        vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { });

        const mockCy = { nodes: () => [], edges: () => [] } as unknown as CyInstance;

        setDirty(true);
        expect(getDirtyState()).toBe(true);

        downloadCSV(mockCy);

        expect(getDirtyState()).toBe(false);
        vi.restoreAllMocks();
    });
});
