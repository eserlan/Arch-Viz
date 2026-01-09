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

    it('handles null label gracefully', () => {
        expect(getNodeLabelDisplay(null as any, false)).toBe('');
        expect(getNodeLabelDisplay(null as any, true)).toBe('✓ Verified');
    });

    it('handles undefined label gracefully', () => {
        expect(getNodeLabelDisplay(undefined as any, false)).toBe('');
        expect(getNodeLabelDisplay(undefined as any, true)).toBe('✓ Verified');
    });

    it('handles whitespace-only labels', () => {
        expect(getNodeLabelDisplay('   ', false)).toBe('');
        expect(getNodeLabelDisplay('   ', true)).toBe('✓ Verified');
        expect(getNodeLabelDisplay('\t\n  ', false)).toBe('');
    });

    it('preserves existing newlines in labels', () => {
        expect(getNodeLabelDisplay('Multi\nLine\nLabel', false)).toBe('Multi\nLine\nLabel');
        expect(getNodeLabelDisplay('Multi\nLine\nLabel', true)).toBe('Multi\nLine\nLabel\n✓ Verified');
    });

    it('uses default parameter when verified is omitted', () => {
        expect(getNodeLabelDisplay('Test Label')).toBe('Test Label');
    });
});
