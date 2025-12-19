import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGraphData, loadGraphData, clearGraphData, getDirtyState, setDirty, exportToCSV } from './storage';

describe('Storage Module', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should save data to localStorage', () => {
        const data = [{ data: { id: 'test' } }];
        saveGraphData(data);

        expect(localStorage.getItem('arch-viz-elements')).toBe(JSON.stringify(data));
    });

    it('should load data from localStorage', () => {
        const data = [{ data: { id: 'test-load' } }];
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
        const data = [{ data: { id: 'test' } }];
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
                    data: () => ({ id: 'svc-a', label: 'Service A', domain: 'Core', tier: '1', owner: 'Team A', repoUrl: 'http://example.com' }),
                    id: () => 'svc-a'
                },
                {
                    data: () => ({ id: 'svc-b', label: 'Service B', domain: 'Auth', tier: '2', owner: 'Team B', repoUrl: '' }),
                    id: () => 'svc-b'
                }
            ],
            edges: () => [
                {
                    source: () => ({ id: () => 'svc-a' }),
                    target: () => ({ id: () => 'svc-b' })
                }
            ]
        };

        const csv = exportToCSV(mockCy);
        const lines = csv.split('\n');

        expect(lines[0]).toBe('id,label,domain,tier,depends_on,owner,repo_url');
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
            if (tag === 'a') return mockLink;
            return originalCreateElement(tag);
        });
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { });

        const mockCy = {
            nodes: () => [],
            edges: () => []
        };

        // Import and call downloadCSV
        const { downloadCSV } = require('./storage');
        downloadCSV(mockCy);

        // Verify filename format: services-YYYY-MM-DD-HHmmss.csv
        expect(mockLink.download).toMatch(/^services-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/);
        expect(mockLink.click).toHaveBeenCalled();

        // Cleanup
        vi.restoreAllMocks();
    });
});
