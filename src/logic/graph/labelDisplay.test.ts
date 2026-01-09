import { describe, it, expect } from 'vitest';
import { getNodeLabelDisplay } from './labelDisplay';

describe('getNodeLabelDisplay', () => {
    it('returns the base label when provided', () => {
        expect(getNodeLabelDisplay('Billing API')).toBe('Billing API');
    });

    it('returns an empty string for blank labels', () => {
        expect(getNodeLabelDisplay('')).toBe('');
    });
});
