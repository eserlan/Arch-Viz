import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadGraphElements } from './appData';
import { loadGraphData } from './storage';
import { parseCSV } from './parser';

vi.mock('./storage', () => ({
    loadGraphData: vi.fn(),
}));

vi.mock('./parser', () => ({
    parseCSV: vi.fn(),
}));

describe('loadGraphElements', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns saved data when available', async () => {
        const saved = [{ data: { id: 'a' } }] as any;
        vi.mocked(loadGraphData).mockReturnValue(saved);

        const fetchImpl = vi.fn();
        const result = await loadGraphElements('/data.csv', fetchImpl as any);

        expect(result).toEqual({ elements: saved, skipped: 0, fromStorage: true });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('fetches and parses csv when no saved data exists', async () => {
        vi.mocked(loadGraphData).mockReturnValue(null);
        vi.mocked(parseCSV).mockReturnValue({
            elements: [{ data: { id: 'b' } }],
            skipped: 2,
        } as any);

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue('id,name'),
        });

        const result = await loadGraphElements('/data.csv', fetchImpl as any);

        expect(fetchImpl).toHaveBeenCalledWith('/data.csv');
        expect(parseCSV).toHaveBeenCalledWith('id,name');
        expect(result).toEqual({
            elements: [{ data: { id: 'b' } }],
            skipped: 2,
            fromStorage: false,
        });
    });
});
