import { describe, it, expect } from 'vitest';
import { getNodeLabelDisplay } from './labelDisplay';

describe('getNodeLabelDisplay', () => {
    it('returns the base label when not verified', () => {
        expect(getNodeLabelDisplay('Billing API', false)).toBe('Billing API');
    });

    it('appends a verified line when verified', () => {
        expect(getNodeLabelDisplay('Billing API', true)).toBe('Billing API\n✓ Verified');
    });

    it('returns only the verified tag when label is empty', () => {
        expect(getNodeLabelDisplay('', true)).toBe('✓ Verified');
    });
});
