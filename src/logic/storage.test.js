import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGraphData, loadGraphData, clearGraphData } from './storage';

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
});
